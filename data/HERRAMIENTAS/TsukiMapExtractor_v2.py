import os
import math
import glob
import argparse
import json
import PIL.ImageOps
import PIL.ImageTransform
import PIL.ImageDraw
import PIL.ImageChops
from PIL import Image
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.0f1'
UnityPy.config.FALLBACK_ASSEMBLY_FOLDER = r"C:\Users\Andres\Desktop\Tsuki_Odyssey\TSUKI MOVIL\Dumper\DummyDll"

# --- FUNCIONES AUXILIARES PARA METADATA PROFUNDA ---
def get_obj_map(env): return {o.path_id: o for o in env.objects}

def resolve_pptr(obj_map, pptr):
    if not isinstance(pptr, dict) or "m_PathID" not in pptr: return pptr
    pid = pptr["m_PathID"]
    if pid == 0 or pid not in obj_map: return pptr
    try:
        ref_obj = obj_map[pid]
        o_type = ref_obj.type.name
        if o_type == "Sprite": return f"Sprite: {ref_obj.read().m_Name}"
        elif o_type == "Texture2D": return f"Texture2D: {ref_obj.read().m_Name}"
        elif o_type == "MonoScript": return f"MonoScript: {ref_obj.read().m_ClassName}"
        elif o_type == "GameObject": return f"GameObject: {ref_obj.read().m_Name}"
    except: pass
    return pptr

def deep_resolve(obj_map, data):
    if isinstance(data, dict):
        if "m_PathID" in data and "m_FileID" in data:
            resolved = resolve_pptr(obj_map, data)
            if isinstance(resolved, str): return resolved
        return {k: deep_resolve(obj_map, v) for k, v in data.items()}
    elif isinstance(data, list): return [deep_resolve(obj_map, v) for v in data]
    return data

def safe_serialize(obj_map, obj):
    resolved = deep_resolve(obj_map, obj)
    def _serialize(o):
        if isinstance(o, dict): return {str(k): _serialize(v) for k, v in o.items()}
        elif isinstance(o, list): return [_serialize(v) for v in o]
        elif isinstance(o, (int, float, str, bool, type(None))): return o
        return str(o)
    return _serialize(resolved)
# ---------------------------------------------------


def get_world_matrix(tr_path_id, transforms):
    if tr_path_id not in transforms:
        return 0, 0, 0, 1, 1
        
    tr = transforms[tr_path_id]
    lx, ly = tr.m_LocalPosition.x, tr.m_LocalPosition.y
    lz, lw = tr.m_LocalRotation.z, tr.m_LocalRotation.w
    lsx, lsy = tr.m_LocalScale.x, tr.m_LocalScale.y
    l_angle = math.atan2(2 * lw * lz, 1 - 2 * lz * lz)
    
    father_ptr = getattr(tr, 'm_Father', None)
    if father_ptr and getattr(father_ptr, 'path_id', 0) != 0 and father_ptr.path_id in transforms:
        fx, fy, f_angle, fsx, fsy = get_world_matrix(father_ptr.path_id, transforms)
        scaled_x = lx * fsx
        scaled_y = ly * fsy
        cos_a = math.cos(f_angle)
        sin_a = math.sin(f_angle)
        rot_x = scaled_x * cos_a - scaled_y * sin_a
        rot_y = scaled_x * sin_a + scaled_y * cos_a
        return fx + rot_x, fy + rot_y, f_angle + l_angle, fsx * lsx, fsy * lsy
    return lx, ly, l_angle, lsx, lsy

def is_active_in_hierarchy(tr_path_id, transforms, gameobjects):
    tr = transforms.get(tr_path_id)
    if not tr: return True
    go = gameobjects.get(tr.m_GameObject.path_id)
    if go and not getattr(go, 'm_IsActive', True):
        return False
    father_ptr = getattr(tr, 'm_Father', None)
    if father_ptr and getattr(father_ptr, 'path_id', 0) != 0:
        return is_active_in_hierarchy(father_ptr.path_id, transforms, gameobjects)
    return True

def extract_map(level_path, load_addressables=False, addressables_dir=""):
    base_name = os.path.basename(level_path).replace('.split0', '')
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(level_path)), f"Exportado_{base_name}")
    if not os.path.exists(output_dir):
        output_dir = f"Exportado_{base_name}"
        
    json_path = os.path.join(output_dir, 'layout.json')
    meta_path = os.path.join(output_dir, 'map_metadata.json')
    
    # Se modificó para que reconstruya si falta el map_metadata.json
    if os.path.exists(json_path) and os.path.exists(meta_path):
        print(f"[!] Ya se encontraron los recursos extraídos en '{output_dir}'. Saltando al ensamblaje...")
        with open(json_path, 'r') as f:
            layout_data = json.load(f)
        assemble_map(layout_data, output_dir, base_name)
        return

    print(f"[1] Cargando entorno para {os.path.basename(level_path)}...")
    env = UnityPy.Environment()
    env.load_file(level_path)
    
    dir_name = os.path.dirname(level_path)
    print(f"    Cargando dependencias compartidas...")
    for f in glob.glob(os.path.join(dir_name, "sharedassets*")):
        env.load_file(f)
        
    if load_addressables and os.path.exists(addressables_dir):
        print("[*] Cargando Addressables (Esto puede tardar unos minutos y consumir RAM)...")
        for root, dirs, files in os.walk(addressables_dir):
            for f in files:
                if f.endswith('.bundle'):
                    env.load_file(os.path.join(root, f))
    
    print("[2] Mapeando jerarquía y componentes...")
    transforms = {}
    gameobjects = {}
    sprite_renderers = []
    
    obj_map = get_obj_map(env) # Diccionario de resolución para la metadata
    
    for obj in env.objects:
        if obj.type.name == 'Transform':
            transforms[obj.path_id] = obj.read()
        elif obj.type.name == 'GameObject':
            gameobjects[obj.path_id] = obj.read()
        elif obj.type.name == 'SpriteRenderer':
            sprite_renderers.append(obj.read())

    print("[3] Extrayendo y calculando Layout Visual...")
    layout_data = []
    os.makedirs(output_dir, exist_ok=True)
    
    for sr in sprite_renderers:
        if not getattr(sr, 'm_GameObject', None) or sr.m_GameObject.path_id == 0: continue
        
        c_path_id = next((c.path_id for c in gameobjects[sr.m_GameObject.path_id].m_Components if c.type.name == 'Transform'), None)
        if not c_path_id: continue
        
        if not is_active_in_hierarchy(c_path_id, transforms, gameobjects):
            continue
            
        if not getattr(sr, 'm_Sprite', None) or sr.m_Sprite.path_id == 0: continue
        
        try: sp = sr.m_Sprite.read()
        except: continue
            
        wx, wy, w_angle, wsx, wsy = get_world_matrix(c_path_id, transforms)
        
        if getattr(sr, 'm_FlipX', False): wsx *= -1.0
        if getattr(sr, 'm_FlipY', False): wsy *= -1.0
            
        ppu = getattr(sp, 'm_PixelsToUnits', 100.0)
        pivot = getattr(sp, 'm_Pivot', None)
        px, py = (pivot.x, pivot.y) if pivot else (0.5, 0.5)
        rect = getattr(sp, 'm_Rect', None)
        rw, rh = (rect.width, rect.height) if rect else (0, 0)
        
        draw_mode = getattr(sr, 'm_DrawMode', 0)
        size = getattr(sr, 'm_Size', None)
        size_x = size.x if size else 0.0
        size_y = size.y if size else 0.0
        
        poly_paths = []
        for comp_ptr in gameobjects[sr.m_GameObject.path_id].m_Components:
            if comp_ptr.type.name == 'PolygonCollider2D':
                try:
                    c_obj = env.objects[comp_ptr.path_id]
                    poly_tree = c_obj.read_typetree()
                    paths = poly_tree.get('m_Points', {}).get('m_Paths', [])
                    offset = poly_tree.get('m_Offset', {})
                    off_x, off_y = offset.get('x', 0.0), offset.get('y', 0.0)
                    for path in paths:
                        poly_paths.append([{'x': pt['x'] + off_x, 'y': pt['y'] + off_y} for pt in path])
                except: pass
        
        rd = getattr(sp, 'm_RD', None)
        ox = rd.textureRectOffset.x if hasattr(rd, 'textureRectOffset') else 0.0
        oy = rd.textureRectOffset.y if hasattr(rd, 'textureRectOffset') else 0.0
        
        png_path = os.path.join(output_dir, f"{sp.m_Name}.png")
        if not os.path.exists(png_path):
            try: sp.image.save(png_path)
            except Exception as e: pass
                
        # FASE 1.A — extra: color, materials, flip, active, path, border/tiling
        col = getattr(sr, 'm_Color', None)
        color = {"r": col.r, "g": col.g, "b": col.b, "a": col.a} if col and hasattr(col, 'r') else {"r":1,"g":1,"b":1,"a":1}
        mats = []
        try:
            for mptr in getattr(sr, 'm_Materials', []) or []:
                mats.append(resolve_pptr(obj_map, mptr) if isinstance(mptr, dict) else str(mptr))
        except: pass
        flipX = bool(getattr(sr, 'm_FlipX', False)); flipY = bool(getattr(sr, 'm_FlipY', False))
        active = is_active_in_hierarchy(c_path_id, transforms, gameobjects)
        # path jerarquía
        def build_path(pid):
            parts=[]
            cur=pid
            for _ in range(12):
                if cur not in transforms: break
                go_id = next((gid for gid,g in gameobjects.items() if any(c.path_id==cur for c in g.m_Components)), None)
                if go_id: parts.append(gameobjects[go_id].m_Name)
                tr=transforms[cur]
                father=getattr(tr,'m_Father',None)
                if not father or father.path_id==0 or father.path_id not in transforms: break
                cur=father.path_id
            return "/".join(reversed(parts))
        go_path = build_path(c_path_id)
        border = None
        try:
            border = {"x": sp.m_Border.x, "y": sp.m_Border.y, "z": sp.m_Border.z, "w": sp.m_Border.w} if hasattr(sp,'m_Border') else None
        except: pass
        tiling = None
        try:
            if poly_paths: tiling = {"sz_x": size_x, "sz_y": size_y}
        except: pass
        sorting_group = None
        try:
            for comp_ptr in gameobjects[sr.m_GameObject.path_id].m_Components:
                if env.objects[comp_ptr.path_id].type.name=='SortingGroup':
                    sg=env.objects[comp_ptr.path_id].read_typetree()
                    sorting_group = sg.get('m_SortingOrder',0)
        except: pass

        layout_data.append({
            "sp": sp.m_Name, "go": gameobjects[sr.m_GameObject.path_id].m_Name,
            "x": wx, "y": wy, "angle": math.degrees(w_angle),
            "sx": wsx, "sy": wsy, "o": sr.m_SortingOrder,
            "px": px, "py": py, "rw": rw, "rh": rh,
            "ox": ox, "oy": oy, "ppu": ppu,
            "sl": getattr(sr, 'm_SortingLayer', 0),
            "draw_mode": draw_mode, "sz_x": size_x, "sz_y": size_y,
            "poly": poly_paths,
            "color": color, "materials": mats, "flipX": flipX, "flipY": flipY,
            "active": active, "path": go_path, "go_path_id": sr.m_GameObject.path_id, "tr_path_id": c_path_id,
            "border": border, "tiling": tiling, "sorting_group": sorting_group
        })

    for go_id, go in gameobjects.items():
        if 'Wallpaper' in go.m_Name:
            has_sr = any(env.objects[c.path_id].type.name == 'SpriteRenderer' for c in go.m_Components)
            if not has_sr:
                c_path_id = next((c.path_id for c in go.m_Components if env.objects[c.path_id].type.name == 'Transform'), None)
                if not c_path_id: continue
                wx, wy, w_angle, wsx, wsy = get_world_matrix(c_path_id, transforms)
                poly_paths = []
                size_x, size_y = 0.0, 0.0
                for comp_ptr in go.m_Components:
                    if env.objects[comp_ptr.path_id].type.name == 'PolygonCollider2D':
                        try:
                            poly_tree = env.objects[comp_ptr.path_id].read_typetree()
                            paths = poly_tree.get('m_Points', {}).get('m_Paths', [])
                            offset = poly_tree.get('m_Offset', {})
                            off_x, off_y = offset.get('x', 0.0), offset.get('y', 0.0)
                            for path in paths:
                                poly_paths.append([{'x': pt['x'] + off_x, 'y': pt['y'] + off_y} for pt in path])
                            tiling_prop = poly_tree.get('m_SpriteTilingProperty', {})
                            new_size = tiling_prop.get('newSize', {})
                            size_x = new_size.get('x', 0.0)
                            size_y = new_size.get('y', 0.0)
                        except: pass
                
                if size_x > 0:
                    layout_data.append({
                        "sp": "WoodBark", "go": go.m_Name,
                        "x": wx, "y": wy, "angle": math.degrees(w_angle),
                        "sx": wsx, "sy": wsy, "o": 1,
                        "px": 0.5, "py": 0.5, "rw": 512, "rh": 512,
                        "ox": 0, "oy": 0, "ppu": 150.0,
                        "sl": -8, "draw_mode": 2, "sz_x": size_x, "sz_y": size_y,
                        "poly": poly_paths
                    })

    with open(json_path, 'w') as f:
        json.dump(layout_data, f, indent=2)

    # --- INICIO DE EXTRACCIÓN DE METADATA (NODOS, NAVMESH, GRIDS, LUCES) ---
    print("[3.5] Extrayendo Lógica Profunda del Mapa (Nodos, NavMesh, Luces)...")
    map_metadata = {
        "grid_system": [],
        "interaction_nodes": [],
        "walkable_bounds": [],
        "camera_confines": [],
        "lighting_volumes": [],
        "special_scripts": []
    }

    for go_id, go in gameobjects.items():
        go_name = go.m_Name
        c_path_id = next((c.path_id for c in go.m_Components if env.objects[c.path_id].type.name == 'Transform'), None)
        if not c_path_id: continue
        
        wx, wy, w_angle, wsx, wsy = get_world_matrix(c_path_id, transforms)
        
        # Bandera para saber si el objeto es puramente lógico (sin gráficos)
        has_sr = any(env.objects[c.path_id].type.name == 'SpriteRenderer' for c in go.m_Components)
        
        for comp_ptr in go.m_Components:
            try:
                c_obj = env.objects[comp_ptr.path_id]
                c_type = c_obj.type.name
                
                # 1 & 2. Walkable Bounds y Camera Confines (Colliders invisibles)
                if c_type in ['PolygonCollider2D', 'EdgeCollider2D', 'BoxCollider2D']:
                    col_tree = c_obj.read_typetree()
                    col_data = {
                        "go": go_name, "type": c_type, "x": wx, "y": wy, 
                        "sx": wsx, "sy": wsy, "angle": math.degrees(w_angle),
                        "properties": safe_serialize(obj_map, col_tree)
                    }
                    if "Camera" in go_name or "Confine" in go_name:
                        map_metadata["camera_confines"].append(col_data)
                    else:
                        map_metadata["walkable_bounds"].append(col_data)
                        
                # 3. Componentes de Grid nativos
                elif c_type == 'Grid':
                    grid_tree = c_obj.read_typetree()
                    map_metadata["grid_system"].append({
                        "go": go_name, "type": "Grid", "x": wx, "y": wy,
                        "properties": safe_serialize(obj_map, grid_tree)
                    })
                    
                # 4 & 5. Scripts de Interacción, Luces y Custom Grids
                elif c_type == 'MonoBehaviour':
                    mb = c_obj.read()
                    script_name = "UnknownScript"
                    if hasattr(mb, 'm_Script') and mb.m_Script and mb.m_Script.path_id in obj_map:
                        script_name = obj_map[mb.m_Script.path_id].read().m_ClassName
                    
                    tree = c_obj.read_typetree()
                    tree.pop("m_GameObject", None)
                    tree.pop("m_Script", None)
                    prop_data = safe_serialize(obj_map, tree)
                    
                    node_info = {
                        "go": go_name, "script": script_name, "x": wx, "y": wy,
                        "properties": prop_data
                    }
                    
                    if script_name in ['ActionNode', 'TsukiInteraction', 'ItemSocket', 'SpawnPoint', 'SeatNode', 'FishingNode']:
                        map_metadata["interaction_nodes"].append(node_info)
                    elif 'Light' in script_name or 'DayNight' in script_name or 'Volume' in script_name or 'Color' in script_name:
                        map_metadata["lighting_volumes"].append(node_info)
                    elif 'Grid' in script_name or 'Placement' in script_name:
                        map_metadata["grid_system"].append(node_info)
                    elif not has_sr:
                        # Scripts generales que regulan el entorno
                        map_metadata["special_scripts"].append(node_info)
            except Exception as e:
                pass

    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(map_metadata, f, indent=2, ensure_ascii=False)
    print(f"    [+] map_metadata.json generado exitosamente.")
    # --- FIN EXTRACCIÓN DE METADATA ---

    assemble_map(layout_data, output_dir, base_name)

def assemble_map(layout_data, output_dir, base_name):
    print(f"[4] Ensamblando Mapa ({len(layout_data)} piezas)...")
    if not layout_data:
        print("No se encontraron sprites activos para ensamblar.")
        return

    layout_data.sort(key=lambda d: (d.get('sl', 0), d['o']))
    
    render_jobs = []
    global_min_x, global_min_y = float('inf'), float('inf')
    global_max_x, global_max_y = float('-inf'), float('-inf')
    center_x, center_y = 0, 0
    
    Image.MAX_IMAGE_PIXELS = None

    for d in layout_data:
        if d['sp'] == 'Square':
            continue
            
        png_path = os.path.join(output_dir, f"{d['sp']}.png")
        if not os.path.exists(png_path): continue
        
        img = Image.open(png_path).convert('RGBA')
        sx, sy, PPU = d['sx'], d['sy'], d['ppu']
        ox, oy, px, py = d['ox'], d['oy'], d['px'], d['py']
        rw, rh = d['rw'], d['rh']
        img_w, img_h = img.width, img.height
        
        draw_mode = d.get('draw_mode', 0)
        sz_x = d.get('sz_x', 0)
        sz_y = d.get('sz_y', 0)
        
        if draw_mode > 0 and sz_x > 0 and sz_y > 0:
            target_w_px = int(sz_x * PPU)
            target_h_px = int(sz_y * PPU)
            
            tile_scale = 8.0
            new_img_w = max(1, int(img_w / tile_scale))
            new_img_h = max(1, int(img_h / tile_scale))
            scaled_tile = img.resize((new_img_w, new_img_h), Image.Resampling.LANCZOS)
            
            if target_w_px > 0 and target_h_px > 0:
                buffer_w = target_w_px * 3
                buffer_h = target_h_px * 3
                tiled_img = Image.new('RGBA', (buffer_w, buffer_h), (0,0,0,0))
                
                for tx in range(0, buffer_w, new_img_w):
                    for ty in range(0, buffer_h, new_img_h):
                        tiled_img.paste(scaled_tile, (tx, buffer_h - ty - new_img_h))
                
                go_name = d['go']
                shear_slope = -0.5 if 'R' in go_name else 0.5
                matrix = (1, 0, 0, shear_slope, 1, -(buffer_w/2)*shear_slope)
                tiled_img = tiled_img.transform((buffer_w, buffer_h), Image.Transform.AFFINE, matrix, resample=Image.Resampling.BICUBIC)
                
                left = (buffer_w - target_w_px) // 2
                top = (buffer_h - target_h_px) // 2
                tiled_img = tiled_img.crop((left, top, left + target_w_px, top + target_h_px))
                        
                poly_paths = d.get('poly', [])
                if poly_paths:
                    mask = Image.new('L', (target_w_px, target_h_px), 0)
                    draw = PIL.ImageDraw.Draw(mask)
                    for path in poly_paths:
                        xy_seq = []
                        for pt in path:
                            px_pixel = (pt['x'] + px * sz_x) * PPU
                            py_pixel = target_h_px - (pt['y'] + py * sz_y) * PPU
                            xy_seq.append((px_pixel, py_pixel))
                        draw.polygon(xy_seq, fill=255)
                    try:
                        existing_alpha = tiled_img.split()[3]
                        final_alpha = PIL.ImageChops.multiply(existing_alpha, mask)
                        tiled_img.putalpha(final_alpha)
                    except:
                        tiled_img.putalpha(mask)

                img = tiled_img
                img_w, img_h = target_w_px, target_h_px
                rw, rh = target_w_px, target_h_px
                ox, oy = 0, 0
        
        bl_x, bl_y = ox - px * rw, oy - py * rh
        br_x, br_y = ox + img_w - px * rw, oy - py * rh
        tl_x, tl_y = ox - px * rw, oy + img_h - py * rh
        tr_x, tr_y = ox + img_w - px * rw, oy + img_h - py * rh
        
        corners = [
            (bl_x * sx / PPU, bl_y * sy / PPU),
            (br_x * sx / PPU, br_y * sy / PPU),
            (tl_x * sx / PPU, tl_y * sy / PPU),
            (tr_x * sx / PPU, tr_y * sy / PPU)
        ]
        
        angle_rad = math.radians(d['angle'])
        rot_corners = []
        cos_a, sin_a = math.cos(angle_rad), math.sin(angle_rad)
        for cx, cy in corners:
            nx = cx * cos_a - cy * sin_a
            ny = cx * sin_a + cy * cos_a
            rot_corners.append((nx, ny))
            
        local_min_x = min(c[0] for c in rot_corners)
        local_max_y = max(c[1] for c in rot_corners)
        world_min_x = d['x'] + local_min_x
        world_max_y = d['y'] + local_max_y
        
        paste_x = center_x + int(world_min_x * PPU)
        paste_y = center_y - int(world_max_y * PPU)
        
        if sx < 0: img = PIL.ImageOps.mirror(img)
        if sy < 0: img = PIL.ImageOps.flip(img)
        if abs(sx) != 1.0 or abs(sy) != 1.0:
            new_w = int(img_w * abs(sx))
            new_h = int(img_h * abs(sy))
            if new_w <= 0 or new_h <= 0:
                continue
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        if abs(d['angle']) > 1:
            img = img.rotate(d['angle'], expand=True)
        
        render_jobs.append((img, paste_x, paste_y))
        global_min_x = min(global_min_x, paste_x)
        global_min_y = min(global_min_y, paste_y)
        global_max_x = max(global_max_x, paste_x + img.width)
        global_max_y = max(global_max_y, paste_y + img.height)
        
    if not render_jobs: return
    
    canvas_w = int(global_max_x - global_min_x)
    canvas_h = int(global_max_y - global_min_y)
    canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    
    for img, px, py in render_jobs:
        canvas.paste(img, (int(px - global_min_x), int(py - global_min_y)), img)
        
    final_path = os.path.join(output_dir, f"{base_name}_Ensamblado.png")
    canvas.save(final_path)
    print(f"\n[!] MAPA COMPLETADO: {final_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tsuki Odyssey Map Extractor")
    parser.add_argument("level", help="Ruta al archivo levelXX de Unity")
    parser.add_argument("-a", "--addressables", help="Ruta a la carpeta aa/Android para buscar sprites faltantes", default="")
    args = parser.parse_args()
    
    extract_map(args.level, load_addressables=bool(args.addressables), addressables_dir=args.addressables)