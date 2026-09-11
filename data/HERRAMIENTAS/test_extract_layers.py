import UnityPy, json, math, os
import PIL.ImageOps
from PIL import Image

UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.0f1'
bundle_path = r'AssetPack/assets/aa/Android/furniture_assets_all_22d367c8beca55276af4138414a20260.bundle'
env = UnityPy.load(bundle_path)
obj_map = {o.path_id: o for o in env.objects}

def get_world_matrix(tr_pid):
    if not tr_pid or tr_pid not in obj_map: return 0.0, 0.0, 0.0, 1.0, 1.0
    tr_obj = obj_map[tr_pid]
    if tr_obj.type.name != 'Transform': return 0.0, 0.0, 0.0, 1.0, 1.0
    tr = tr_obj.read()
    lx, ly = tr.m_LocalPosition.x, tr.m_LocalPosition.y
    lz, lw = tr.m_LocalRotation.z, tr.m_LocalRotation.w
    l_angle = math.atan2(2 * lw * lz, 1 - 2 * lz * lz)
    lsx, lsy = tr.m_LocalScale.x, tr.m_LocalScale.y
    father_ptr = getattr(tr, 'm_Father', None)
    if father_ptr and getattr(father_ptr, 'path_id', 0) and father_ptr.path_id in obj_map:
        fx, fy, f_angle, fsx, fsy = get_world_matrix(father_ptr.path_id)
        scaled_x = lx * fsx; scaled_y = ly * fsy
        cos_a = math.cos(f_angle); sin_a = math.sin(f_angle)
        rot_x = scaled_x * cos_a - scaled_y * sin_a
        rot_y = scaled_x * sin_a + scaled_y * cos_a
        return fx + rot_x, fy + rot_y, f_angle + l_angle, fsx * lsx, fsy * lsy
    return lx, ly, l_angle, lsx, lsy

def get_sprite_data(sprite_pid):
    sprite_obj = obj_map.get(sprite_pid)
    if not sprite_obj: return None, 0, 0, 'NOT_FOUND', 0.5, 0.5, 150.0, 0.0, 0.0
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
    try: part = sprite.image.convert('RGBA')
    except: return None, rw, rh, sprite.m_Name, px, py, ppu, ox, oy
    return part, rw, rh, sprite.m_Name, px, py, ppu, ox, oy

def process_item_layers(tree, target_id):
    sprites = tree.get('sprites', [])
    view = 'back'
    sprite_key = 'flipped'
    json_layout = []
    
    for i, s in enumerate(sprites):
        act_sort = s.get('activitySorting', 0)
        rend_pid = (s.get('renderer') or {}).get('m_PathID')
        if not rend_pid or rend_pid not in obj_map: continue
        flip_tree = obj_map[rend_pid].read_typetree()
        sr_pid = (flip_tree.get('sr') or {}).get('m_PathID')
        if not sr_pid or sr_pid not in obj_map: continue
        sr_data = obj_map[sr_pid].read()
        go_pid = getattr(sr_data, 'm_GameObject', None)
        if not go_pid or getattr(go_pid, 'path_id', 0) not in obj_map: continue
        go_data = obj_map[go_pid.path_id].read()
        tr_pid = next((c.path_id for c in go_data.m_Components if c.type.name == 'Transform'), None)
        wx, wy, w_angle, wsx, wsy = get_world_matrix(tr_pid)
        if getattr(sr_data, 'm_FlipX', False): wsx *= -1.0
        if getattr(sr_data, 'm_FlipY', False): wsy *= -1.0
        sl = getattr(sr_data, 'm_SortingLayer', 0)
        order = getattr(sr_data, 'm_SortingOrder', i)
        flip_logic = flip_tree.get('flipLogic', 0)
        if flip_logic == 1: continue # front only
        sprite_flip_logic = flip_tree.get('spriteFlipLogic', 0)
        sp_pid = (flip_tree.get(sprite_key) or {}).get('m_PathID') if sprite_flip_logic == 1 else 0
        if not sp_pid or sprite_flip_logic == 0:
            try: sp_pid = sr_data.m_Sprite.path_id if sr_data.m_Sprite else 0
            except: pass
        part, rw, rh, sname, px, py, ppu, ox, oy = get_sprite_data(sp_pid)
        if part is None: continue
        json_layout.append({
            'img': part, 'sp': sname, 'act_sort': act_sort, 'order': order, 'sl': sl,
            'x': wx, 'y': wy, 'angle': math.degrees(w_angle), 'sx': wsx, 'sy': wsy,
            'px': px, 'py': py, 'rw': rw, 'rh': rh, 'ox': ox, 'oy': oy, 'ppu': ppu
        })

    if not json_layout: return None
    
    # Calculate global bounding box exactly like compose_exact
    render_jobs = []
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = float('-inf'), float('-inf')
    
    for d in sorted(json_layout, key=lambda x: (x.get('sl', 0), x.get('order', 0))):
        img = d['img']
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
        
        render_jobs.append({'img': img, 'px': paste_x, 'py': paste_y, 'act_sort': d['act_sort'], 'sp': d['sp']})
        min_x = min(min_x, paste_x); min_y = min(min_y, paste_y)
        max_x = max(max_x, paste_x + img.width); max_y = max(max_y, paste_y + img.height)
        
    canvas_w = int(max_x - min_x); canvas_h = int(max_y - min_y)
    if canvas_w <= 0 or canvas_h <= 0: return None
    
    # 1. Full Image
    full_img = Image.new('RGBA', (canvas_w, canvas_h), (0,0,0,0))
    for job in render_jobs:
        full_img.paste(job['img'], (job['px'] - min_x, job['py'] - min_y), job['img'])
        
    # 2. Base Image (act_sort <= 1)
    base_img = Image.new('RGBA', (canvas_w, canvas_h), (0,0,0,0))
    base_count = 0
    for job in render_jobs:
        if job['act_sort'] <= 1:
            base_img.paste(job['img'], (job['px'] - min_x, job['py'] - min_y), job['img'])
            base_count += 1
            
    # 3. Backrest Image (act_sort >= 2)
    backrest_img = Image.new('RGBA', (canvas_w, canvas_h), (0,0,0,0))
    backrest_count = 0
    for job in render_jobs:
        if job['act_sort'] >= 2:
            backrest_img.paste(job['img'], (job['px'] - min_x, job['py'] - min_y), job['img'])
            backrest_count += 1
            
    return {
        'id': target_id,
        'canvas_size': (canvas_w, canvas_h),
        'base_count': base_count,
        'backrest_count': backrest_count,
        'full_img': full_img,
        'base_img': base_img,
        'backrest_img': backrest_img
    }

# Test on 115 and 697
import traceback
for obj in env.objects:
    if obj.type.name == 'MonoBehaviour':
        try:
            tree = obj.read_typetree()
            fid = tree.get('ID')
            if fid in [115, 697]:
                try:
                    res = process_item_layers(tree, fid)
                    if res:
                        print(f"Result for ID {fid}: size={res['canvas_size']}, base_layers={res['base_count']}, backrest_layers={res['backrest_count']}")
                    else:
                        print(f"ID {fid}: process_item_layers returned None")
                except Exception as ex:
                    print(f"Error processing {fid}:")
                    traceback.print_exc()
        except:
            pass

