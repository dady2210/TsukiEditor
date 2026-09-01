"""
tsuki_export_by_id.py  v20.0 (Data Miner Definitivo + Shaders Layout)
Inyecta Colors (RGBA) y Materiales en el layout para que el Editor Web 
pueda recrear las luces y transparencias de Unity nativamente.
"""

import argparse
import sys
import json
import math
from pathlib import Path

try:
    import UnityPy
    import PIL.ImageOps
    from PIL import Image
except ImportError as e:
    print(f"[ERROR] Falta dependencia: {e}")
    sys.exit(1)

UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.0f1"

def load_env(bundles_dir, assemblies_dir=None):
    if assemblies_dir and assemblies_dir.exists():
        UnityPy.config.FALLBACK_ASSEMBLY_FOLDER = str(assemblies_dir)
        if hasattr(UnityPy.config, 'ASSEMBLY_FOLDER'):
            UnityPy.config.ASSEMBLY_FOLDER = str(assemblies_dir)
    env = UnityPy.Environment()
    p = Path(bundles_dir)
    patterns = ["*furniture*.bundle", "*duplicateassetisolation*.bundle", "*icons*.bundle", "*monoscripts*", "*activities*", "sharedassets*", "globalgamemanagers*"]
    loaded_any = False
    for pat in patterns:
        for f in p.glob(pat):
            if f.is_file():
                if ".split" in f.name and not f.name.endswith(".split0"): continue
                if f.name.endswith(".resS"): continue
                try:
                    env.load_file(str(f))
                    loaded_any = True
                except Exception: pass
    if not loaded_any: sys.exit(1)
    if assemblies_dir and assemblies_dir.exists() and hasattr(env, "register_assembly_folder"):
        env.register_assembly_folder(str(assemblies_dir))
    return env

def get_obj_map(env): return {o.path_id: o for o in env.objects}
def safe_name(s): return "".join(c if c.isalnum() or c in "-_." else "_" for c in s)

def resolve_pptr(obj_map, pptr, extra_sprites_pids=None):
    if not isinstance(pptr, dict) or "m_PathID" not in pptr: return pptr
    pid = pptr["m_PathID"]
    if pid == 0 or pid not in obj_map: return pptr
    try:
        ref_obj = obj_map[pid]
        o_type = ref_obj.type.name
        if o_type == "Sprite":
            if extra_sprites_pids is not None: extra_sprites_pids.add(pid)
            return f"Sprite: {ref_obj.read().m_Name}"
        elif o_type == "Texture2D": return f"Texture2D: {ref_obj.read().m_Name}"
        elif o_type == "AudioClip": return f"AudioClip: {ref_obj.read().m_Name}"
        elif o_type == "AnimationClip": return f"AnimationClip: {ref_obj.read().m_Name}"
        elif o_type == "AnimatorController": return f"AnimatorController: {ref_obj.read().m_Name}"
        elif o_type == "Material": return f"Material: {ref_obj.read().m_Name}"
        elif o_type == "MonoScript": return f"MonoScript: {ref_obj.read().m_ClassName}"
        elif o_type == "MonoBehaviour":
            mb = ref_obj.read()
            name = getattr(mb, 'm_Name', '')
            if not name and hasattr(mb, 'm_Script') and mb.m_Script:
                script_obj = obj_map.get(mb.m_Script.path_id)
                if script_obj: name = script_obj.read().m_ClassName
            return f"ScriptableObject: {name}" if name else f"MonoBehaviour: ID {pid}"
        elif o_type == "GameObject": return f"GameObject: {ref_obj.read().m_Name}"
    except: pass
    return pptr

def deep_resolve(obj_map, data, extra_sprites_pids=None):
    if isinstance(data, dict):
        if "m_PathID" in data and "m_FileID" in data:
            resolved = resolve_pptr(obj_map, data, extra_sprites_pids)
            if isinstance(resolved, str): return resolved
        return {k: deep_resolve(obj_map, v, extra_sprites_pids) for k, v in data.items()}
    elif isinstance(data, list): return [deep_resolve(obj_map, v, extra_sprites_pids) for v in data]
    return data

def safe_serialize(obj_map, obj, extra_sprites_pids=None):
    resolved = deep_resolve(obj_map, obj, extra_sprites_pids)
    def _serialize(o):
        if isinstance(o, dict): return {str(k): _serialize(v) for k, v in o.items()}
        elif isinstance(o, list): return [_serialize(v) for v in o]
        elif isinstance(o, (int, float, str, bool, type(None))): return o
        return str(o)
    return _serialize(resolved)

def find_dict_with_id(data, target_id, target_name):
    target_str = str(target_id)
    if isinstance(data, dict):
        for key in ["id", "ID", "itemId", "itemID", "item_id", "Id", "furnitureID", "furnID", "guid", "uid"]:
            val = data.get(key)
            if val is not None and str(val) == target_str: return data
        if target_name and data.get("name") == target_name: return data
        for k, v in data.items():
            res = find_dict_with_id(v, target_id, target_name)
            if res is not None: return res
    elif isinstance(data, list):
        for item in data:
            res = find_dict_with_id(item, target_id, target_name)
            if res is not None: return res
    return None

def get_world_matrix(obj_map, tr_pid):
    if not tr_pid or tr_pid not in obj_map: return 0.0, 0.0, 0.0, 1.0, 1.0
    tr_obj = obj_map[tr_pid]
    if tr_obj.type.name != "Transform": return 0.0, 0.0, 0.0, 1.0, 1.0
    tr = tr_obj.read()
    lx, ly = tr.m_LocalPosition.x, tr.m_LocalPosition.y
    lz, lw = tr.m_LocalRotation.z, tr.m_LocalRotation.w
    l_angle = math.atan2(2 * lw * lz, 1 - 2 * lz * lz)
    lsx, lsy = tr.m_LocalScale.x, tr.m_LocalScale.y
    father_ptr = getattr(tr, 'm_Father', None)
    if father_ptr and getattr(father_ptr, 'path_id', 0) and father_ptr.path_id in obj_map:
        fx, fy, f_angle, fsx, fsy = get_world_matrix(obj_map, father_ptr.path_id)
        scaled_x = lx * fsx; scaled_y = ly * fsy
        cos_a = math.cos(f_angle); sin_a = math.sin(f_angle)
        rot_x = scaled_x * cos_a - scaled_y * sin_a
        rot_y = scaled_x * sin_a + scaled_y * cos_a
        return fx + rot_x, fy + rot_y, f_angle + l_angle, fsx * lsx, fsy * lsy
    return lx, ly, l_angle, lsx, lsy

def get_sprite_data(obj_map, sprite_pid):
    sprite_obj = obj_map.get(sprite_pid)
    if not sprite_obj: return None, 0, 0, "NOT_FOUND", 0.5, 0.5, 150.0, 0.0, 0.0
    sprite = sprite_obj.read()
    rect = getattr(sprite, 'm_Rect', None)
    rw = int(rect.width) if rect else 100
    rh = int(rect.height) if rect else 100
    piv = getattr(sprite, 'm_Pivot', None)
    px = piv.x if piv else 0.5; py = piv.y if piv else 0.5
    ppu = getattr(sprite, 'm_PixelsToUnits', 150.0)
    rd = getattr(sprite, 'm_RD', None)
    ox = rd.textureRectOffset.x if hasattr(rd, 'textureRectOffset') else 0.0
    oy = rd.textureRectOffset.y if hasattr(rd, 'textureRectOffset') else 0.0
    try: part = sprite.image.convert("RGBA")
    except: return None, rw, rh, sprite.m_Name, px, py, ppu, ox, oy
    return part, rw, rh, sprite.m_Name, px, py, ppu, ox, oy

def compose_exact(json_layout, item_dir, out_path):
    if not json_layout: return
    render_jobs = []
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = float('-inf'), float('-inf')
    for d in sorted(json_layout, key=lambda x: (x.get('sl', 0), x.get('o', 0))):
        sp_path = item_dir / f"{d['sp']}.png"
        if not sp_path.exists(): continue
        img = Image.open(sp_path).convert("RGBA")
        sx, sy = d['sx'], d['sy']; px, py, ox, oy = d['px'], d['py'], d['ox'], d['oy']
        rw, rh, ppu, angle = d['rw'], d['rh'], d['ppu'], d['angle']
        bl_x = ox - px * rw; bl_y = oy - py * rh; br_x = ox + rw - px * rw; br_y = oy - py * rh
        tl_x = ox - px * rw; tl_y = oy + rh - py * rh; tr_x = ox + rw - px * rw; tr_y = oy + rh - py * rh
        corners = [(bl_x * sx / ppu, bl_y * sy / ppu), (br_x * sx / ppu, br_y * sy / ppu),
                   (tl_x * sx / ppu, tl_y * sy / ppu), (tr_x * sx / ppu, tr_y * sy / ppu)]
        a_rad = math.radians(angle)
        cos_a, sin_a = math.cos(a_rad), math.sin(a_rad)
        rot_corners = [(c[0]*cos_a - c[1]*sin_a, c[0]*sin_a + c[1]*cos_a) for c in corners]
        world_min_x = d['x'] + min(c[0] for c in rot_corners)
        world_max_y = d['y'] + max(c[1] for c in rot_corners)
        paste_x = int(world_min_x * 150.0); paste_y = -int(world_max_y * 150.0)
        
        if sx < 0: img = PIL.ImageOps.mirror(img)
        if sy < 0: img = PIL.ImageOps.flip(img)
        new_w = max(1, int(img.width * abs(sx))); new_h = max(1, int(img.height * abs(sy)))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        if abs(angle) > 1: img = img.rotate(angle, expand=True)
            
        render_jobs.append((img, paste_x, paste_y))
        min_x = min(min_x, paste_x); min_y = min(min_y, paste_y)
        max_x = max(max_x, paste_x + img.width); max_y = max(max_y, paste_y + img.height)
        
    if not render_jobs: return
    canvas_w = int(max_x - min_x); canvas_h = int(max_y - min_y)
    if canvas_w <= 0 or canvas_h <= 0: return
    final = Image.new('RGBA', (canvas_w, canvas_h), (0,0,0,0))
    for img, px_x, px_y in render_jobs: final.paste(img, (px_x - min_x, px_y - min_y), img)
    final.save(out_path)

def extract_metadata(obj_map, env, d, tree, target_id, go_name, extra_sprites_pids):
    metadata = {"id": target_id, "name": go_name, "raw_properties": {}, "layer_definitions": [], "store_data": {}, "nodes": [], "colliders": [], "audio": [], "animators": [], "special_scripts": []}
    for k, v in tree.items():
        if k not in ["sprites", "m_GameObject", "m_Script"]: metadata["raw_properties"][k] = safe_serialize(obj_map, v, extra_sprites_pids)
    if "sprites" in tree: metadata["layer_definitions"] = safe_serialize(obj_map, tree["sprites"], extra_sprites_pids)
    for o in env.objects:
        if o.type.name in ["MonoBehaviour", "ScriptableObject", "TextAsset"]:
            try:
                tree_so = o.read_typetree()
                if isinstance(tree_so, dict):
                    mb = o.read()
                    name = getattr(mb, 'm_Name', '')
                    found_dict = find_dict_with_id(tree_so, target_id, go_name)
                    if found_dict and o.path_id != d.path_id:
                        class_name = "CatalogItem"
                        if hasattr(mb, "m_Script") and getattr(mb, "m_Script", None): class_name = obj_map.get(mb.m_Script.path_id).read().m_ClassName if obj_map.get(mb.m_Script.path_id) else class_name
                        metadata["store_data"][class_name] = safe_serialize(obj_map, found_dict, extra_sprites_pids)
            except: pass

    def traverse_hierarchy(tr_pid, path=""):
        if not tr_pid or tr_pid not in obj_map: return
        tr = obj_map[tr_pid].read()
        go_pid = getattr(tr, 'm_GameObject', None)
        if not go_pid: return
        go = obj_map.get(go_pid.path_id).read()
        current_path = f"{path}/{go.m_Name}" if path else go.m_Name
        wx, wy, w_angle, wsx, wsy = get_world_matrix(obj_map, tr_pid)
        node_data = {"path": current_path, "name": go.m_Name, "layer": getattr(go, 'm_Layer', 0), "tag": getattr(go, 'm_Tag', 0), "local_pos": {"x": tr.m_LocalPosition.x, "y": tr.m_LocalPosition.y}, "world_pos": {"x": wx, "y": wy, "angle": math.degrees(w_angle)}, "scale": {"x": wsx, "y": wsy}, "components": []}
        
        for comp in go.m_Components:
            comp_obj = obj_map.get(comp.path_id)
            if not comp_obj: continue
            c_type = comp_obj.type.name
            
            if c_type == "SpriteRenderer":
                try:
                    sr = comp_obj.read()
                    sp_name = obj_map.get(sr.m_Sprite.path_id).read().m_Name if getattr(sr, "m_Sprite", None) and sr.m_Sprite.path_id else "None"
                    mat_names = [obj_map.get(m.path_id).read().m_Name for m in getattr(sr, 'm_Materials', []) if m.path_id and obj_map.get(m.path_id)]
                    color = getattr(sr, 'm_Color', None)
                    node_data["components"].append({"type": "SpriteRenderer", "sprite": sp_name, "color": {"r": color.r, "g": color.g, "b": color.b, "a": color.a} if color else {}, "sorting_layer": getattr(sr, 'm_SortingLayer', 0), "sorting_order": getattr(sr, 'm_SortingOrder', 0), "materials": mat_names})
                except: pass
            elif c_type == "MonoBehaviour":
                try:
                    mb = comp_obj.read()
                    s_name = obj_map.get(mb.m_Script.path_id).read().m_ClassName if hasattr(mb, 'm_Script') and mb.m_Script else "UnknownScript"
                    tree_script = comp_obj.read_typetree()
                    tree_script.pop("m_GameObject", None); tree_script.pop("m_Script", None)
                    node_data["components"].append({"type": s_name, "properties": safe_serialize(obj_map, tree_script, extra_sprites_pids)})
                except: pass
        metadata["nodes"].append(node_data)
        for child in getattr(tr, 'm_Children', []): traverse_hierarchy(child.path_id, current_path)

    go_obj = obj_map.get(d.m_GameObject.path_id)
    if go_obj:
        tr_comp = next((c for c in go_obj.read().m_Components if c.type.name == "Transform"), None)
        if tr_comp: traverse_hierarchy(tr_comp.path_id)

    return metadata

def export_id(env, obj_map, target_id, out_dir, with_activity=False, include_fx=False):
    fx_keywords = ['white', 'shadow', 'glow', 'conelightdown', 'conelightup', 'pointlight', 'mask', 'stronglight']
    found = False
    for obj in env.objects:
        if obj.type.name != "MonoBehaviour": continue
        try:
            tree = obj.read_typetree()
            if not isinstance(tree, dict) or str(tree.get("ID")) != str(target_id): continue
            
            d = obj.read()
            go_name = d.m_GameObject.read().m_Name
            print(f"\n{'='*60}\n  ID={target_id}  |  {go_name}\n{'='*60}")
            item_dir = out_dir / str(target_id)
            item_dir.mkdir(parents=True, exist_ok=True)

            extra_sprites_pids = set()
            metadata = extract_metadata(obj_map, env, d, tree, target_id, go_name, extra_sprites_pids)
            with open(item_dir / "metadata.json", "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)

            sprites = tree.get("sprites") or []
            base_layers = [(i, s) for i, s in enumerate(sprites) if s.get("onlyVisibleWithActivity") == 0]
            layers_to_use = [(i, s) for i, s in enumerate(sprites)] if with_activity else base_layers

            for view in ("front", "back"):
                sprite_key = "normal" if view == "front" else "flipped"
                json_layout = []

                for i, s in layers_to_use:
                    rend_pid = (s.get("renderer") or {}).get("m_PathID")
                    if not rend_pid or rend_pid not in obj_map: continue
                    flip_tree = obj_map[rend_pid].read_typetree()
                    
                    sr_pid = (flip_tree.get("sr") or {}).get("m_PathID")
                    if not sr_pid or sr_pid not in obj_map: continue
                    sr_data = obj_map[sr_pid].read()
                    
                    go_pid = getattr(sr_data, 'm_GameObject', None)
                    go_data = obj_map[go_pid.path_id].read()
                    
                    tr_pid = next((c.path_id for c in go_data.m_Components if c.type.name == "Transform"), None)
                    wx, wy, w_angle, wsx, wsy = get_world_matrix(obj_map, tr_pid)
                    
                    if getattr(sr_data, 'm_FlipX', False): wsx *= -1.0
                    if getattr(sr_data, 'm_FlipY', False): wsy *= -1.0
                    
                    sl = getattr(sr_data, 'm_SortingLayer', 0)
                    order = getattr(sr_data, 'm_SortingOrder', i)
                    draw_mode = getattr(sr_data, 'm_DrawMode', 0)
                    size = getattr(sr_data, 'm_Size', None)
                    sz_x = size.x if size else 0.0
                    sz_y = size.y if size else 0.0

                    flip_logic = flip_tree.get("flipLogic", 0)
                    if view == "front" and flip_logic == 2: continue
                    if view == "back" and flip_logic == 1: continue
                        
                    sprite_flip_logic = flip_tree.get("spriteFlipLogic", 0)
                    sp_pid = (flip_tree.get(sprite_key) or {}).get("m_PathID") if sprite_flip_logic == 1 else 0
                    if not sp_pid or sprite_flip_logic == 0:
                        try: sp_pid = sr_data.m_Sprite.path_id if sr_data.m_Sprite else 0
                        except: pass
                    
                    part, rw, rh, sname, px, py, ppu, ox, oy = get_sprite_data(obj_map, sp_pid)
                    if part is None: continue
                    
                    if not include_fx and sname.lower() in fx_keywords: continue
                    safe_sp_name = safe_name(sname)
                    part.save(item_dir / f"{safe_sp_name}.png")

                    # --- INYECCIÓN DE SHADERS Y COLORES PARA EL EDITOR WEB ---
                    mat_names = []
                    for m_ptr in getattr(sr_data, 'm_Materials', []):
                        if m_ptr.path_id and m_ptr.path_id in obj_map:
                            mat_names.append(obj_map[m_ptr.path_id].read().m_Name)
                    
                    color = getattr(sr_data, 'm_Color', None)
                    c_dict = {"r": color.r, "g": color.g, "b": color.b, "a": color.a} if color else {"r": 1.0, "g": 1.0, "b": 1.0, "a": 1.0}

                    json_layout.append({
                        "sp": safe_sp_name, "go": go_data.m_Name, "x": wx, "y": wy,
                        "angle": math.degrees(w_angle), "sx": wsx, "sy": wsy, "o": order,
                        "px": px, "py": py, "rw": rw, "rh": rh, "ox": ox, "oy": oy,
                        "ppu": ppu, "sl": sl, "draw_mode": draw_mode, "sz_x": sz_x, "sz_y": sz_y, "poly": [],
                        "color": c_dict, "materials": mat_names
                    })

                if json_layout:
                    with open(item_dir / f"layout_{view}.json", "w", encoding="utf-8") as f: json.dump(json_layout, f, indent=2)
                    act_sfx = "_ACTIVITY" if (with_activity and activity_layers) else ""
                    fname = f"FURN_{target_id}_0{act_sfx}.png" if view == "front" else f"FURN_{target_id}_BACK{act_sfx}.png"
                    composition_layout = [d for d in json_layout if d['sp'].lower() not in fx_keywords]
                    compose_exact(composition_layout, item_dir, item_dir / fname)

            for sp_pid in extra_sprites_pids:
                part, rw, rh, sname, px, py, ppu, ox, oy = get_sprite_data(obj_map, sp_pid)
                if part:
                    safe_sp_name = safe_name(sname)
                    out_png = item_dir / f"{safe_sp_name}.png"
                    if not out_png.exists(): part.save(out_png)

            found = True
            break
        except Exception: pass
    if not found: print(f"\n[WARN] ID={target_id} no encontrado.")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="+", type=int)
    ap.add_argument("--out", type=Path, default=Path(__file__).parent)
    ap.add_argument("--bundles", type=Path, default=Path(__file__).parent)
    ap.add_argument("--with-activity", action="store_true")
    ap.add_argument("--include-fx", action="store_true")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    local_dummy = Path(__file__).parent / "DummyDll"
    env = load_env(args.bundles, local_dummy if local_dummy.exists() else None)
    obj_map = get_obj_map(env)
    for fid in args.ids: export_id(env, obj_map, fid, args.out, with_activity=args.with_activity, include_fx=args.include_fx)

if __name__ == "__main__": main()