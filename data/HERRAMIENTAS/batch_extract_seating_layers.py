"""
batch_extract_seating_layers.py
Automatización para extraer y normalizar las capas de muebles interactivos (bancas, sillas, sofás, camas)
detectando nativamente las capas de respaldo / frente (activitySorting >= 2) y base (activitySorting <= 1).
Actualiza items_db.json y activities_db.json con seating_profile.
"""

import sys
import json
import math
import traceback
from pathlib import Path

try:
    import UnityPy
    import PIL.ImageOps
    from PIL import Image
except ImportError as e:
    print(f"[ERROR] Falta dependencia: {e}")
    sys.exit(1)

UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.0f1'

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
    if not loaded_any:
        print(f"[ERROR] No se detectaron bundles válidos en {bundles_dir}.")
        sys.exit(1)
    return env

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

def extract_and_compose_layers(obj_map, tree, target_id, out_images_dir):
    fx_keywords = ['white', 'shadow', 'glow', 'conelightdown', 'conelightup', 'pointlight', 'mask', 'stronglight']
    sprites = tree.get("sprites") or []
    if not sprites: return None

    # Check if there is any activitySorting >= 2 and <= 1
    sortings = [s.get("activitySorting", 0) for s in sprites if isinstance(s, dict)]
    has_base = any(st <= 1 for st in sortings)
    has_foreground = any(st >= 2 for st in sortings)
    if not (has_base and has_foreground):
        return None

    # Process back view
    view = "back"
    sprite_key = "flipped"
    json_layout = []

    for i, s in enumerate(sprites):
        act_sort = s.get("activitySorting", 0)
        rend_pid = (s.get("renderer") or {}).get("m_PathID")
        if not rend_pid or rend_pid not in obj_map: continue
        flip_tree = obj_map[rend_pid].read_typetree()

        sr_pid = (flip_tree.get("sr") or {}).get("m_PathID")
        if not sr_pid or sr_pid not in obj_map: continue
        sr_data = obj_map[sr_pid].read()

        go_pid = getattr(sr_data, "m_GameObject", None)
        if not go_pid or getattr(go_pid, "path_id", 0) not in obj_map: continue
        go_data = obj_map[go_pid.path_id].read()

        tr_pid = next((c.path_id for c in go_data.m_Components if c.type.name == "Transform"), None)
        wx, wy, w_angle, wsx, wsy = get_world_matrix(obj_map, tr_pid)

        if getattr(sr_data, "m_FlipX", False): wsx *= -1.0
        if getattr(sr_data, "m_FlipY", False): wsy *= -1.0

        sl = getattr(sr_data, "m_SortingLayer", 0)
        order = getattr(sr_data, "m_SortingOrder", i)

        flip_logic = flip_tree.get("flipLogic", 0)
        if flip_logic == 1: continue # front only

        sprite_flip_logic = flip_tree.get("spriteFlipLogic", 0)
        sp_pid = (flip_tree.get(sprite_key) or {}).get("m_PathID") if sprite_flip_logic == 1 else 0
        if not sp_pid or sprite_flip_logic == 0:
            try: sp_pid = sr_data.m_Sprite.path_id if sr_data.m_Sprite else 0
            except: pass

        part, rw, rh, sname, px, py, ppu, ox, oy = get_sprite_data(obj_map, sp_pid)
        if part is None: continue
        if sname.lower() in fx_keywords: continue

        json_layout.append({
            "img": part, "sp": sname, "act_sort": act_sort,
            "x": wx, "y": wy, "angle": math.degrees(w_angle), "sx": wsx, "sy": wsy, "o": order,
            "px": px, "py": py, "rw": rw, "rh": rh, "ox": ox, "oy": oy, "ppu": ppu, "sl": sl
        })

    if not json_layout: return None

    # Verify that back view actually contains both base and backrest
    back_sortings = [d["act_sort"] for d in json_layout]
    if not (any(st <= 1 for st in back_sortings) and any(st >= 2 for st in back_sortings)):
        return None

    # Calculate exact composite bounding box
    render_jobs = []
    min_x, min_y = float("inf"), float("inf")
    max_x, max_y = float("-inf"), float("-inf")

    for d in sorted(json_layout, key=lambda x: (x.get("sl", 0), x.get("o", 0))):
        img = d["img"]
        sx, sy = d["sx"], d["sy"]; px, py, ox, oy = d["px"], d["py"], d["ox"], d["oy"]
        rw, rh, ppu, angle = d["rw"], d["rh"], d["ppu"], d["angle"]
        bl_x = ox - px * rw; bl_y = oy - py * rh; br_x = ox + rw - px * rw; br_y = oy - py * rh
        tl_x = ox - px * rw; tl_y = oy + rh - py * rh; tr_x = ox + rw - px * rw; tr_y = oy + rh - py * rh
        corners = [(bl_x * sx / ppu, bl_y * sy / ppu), (br_x * sx / ppu, br_y * sy / ppu),
                   (tl_x * sx / ppu, tl_y * sy / ppu), (tr_x * sx / ppu, tr_y * sy / ppu)]
        a_rad = math.radians(angle)
        cos_a, sin_a = math.cos(a_rad), math.sin(a_rad)
        rot_corners = [(c[0]*cos_a - c[1]*sin_a, c[0]*sin_a + c[1]*cos_a) for c in corners]
        world_min_x = d["x"] + min(c[0] for c in rot_corners)
        world_max_y = d["y"] + max(c[1] for c in rot_corners)
        paste_x = int(world_min_x * 150.0); paste_y = -int(world_max_y * 150.0)

        if sx < 0: img = PIL.ImageOps.mirror(img)
        if sy < 0: img = PIL.ImageOps.flip(img)
        new_w = max(1, int(img.width * abs(sx))); new_h = max(1, int(img.height * abs(sy)))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        if abs(angle) > 1: img = img.rotate(angle, expand=True)

        render_jobs.append((img, paste_x, paste_y, d["act_sort"]))
        min_x = min(min_x, paste_x); min_y = min(min_y, paste_y)
        max_x = max(max_x, paste_x + img.width); max_y = max(max_y, paste_y + img.height)

    canvas_w = int(max_x - min_x); canvas_h = int(max_y - min_y)
    if canvas_w <= 0 or canvas_h <= 0: return None

    # Base image (activitySorting <= 1)
    base_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    for img, px_x, px_y, act_s in render_jobs:
        if act_s <= 1:
            base_img.paste(img, (px_x - min_x, px_y - min_y), img)
    base_filename = f"FURN_{target_id}_BACK_BASE.png"
    base_img.save(out_images_dir / base_filename)

    # Backrest image (activitySorting >= 2)
    backrest_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    for img, px_x, px_y, act_s in render_jobs:
        if act_s >= 2:
            backrest_img.paste(img, (px_x - min_x, px_y - min_y), img)
    backrest_filename = f"FURN_{target_id}_BACKREST.png"
    backrest_img.save(out_images_dir / backrest_filename)

    return {
        "id": target_id,
        "canvas_size": [canvas_w, canvas_h],
        "has_backrest": True,
        "back_base_sprite": base_filename,
        "backrest_sprite": backrest_filename,
        "offsets": {
            "front": { "x": 0.0, "y": 0.22 },
            "back": { "x": 0.0, "y": 0.32 }
        }
    }

def main():
    root = Path(__file__).resolve().parent.parent.parent.parent
    bundles_dir = root / "AssetPack" / "assets" / "aa" / "Android"
    items_images_dir = root / "Tsuky_WebEditor" / "images" / "items"
    items_db_path = root / "Tsuky_WebEditor" / "data" / "items_db.json"
    activities_db_path = root / "Tsuky_WebEditor" / "data" / "activities_db.json"

    print(f"Cargando bundles desde: {bundles_dir}")
    env = load_env(bundles_dir)
    obj_map = {o.path_id: o for o in env.objects}
    print(f"Objetos cargados en memoria: {len(obj_map)}")

    print(f"Cargando base de datos de items...")
    with open(items_db_path, "r", encoding="utf-8") as f:
        items_db = json.load(f)

    with open(activities_db_path, "r", encoding="utf-8") as f:
        activities_db = json.load(f)

    extracted_profiles = {}
    total_processed = 0

    print("Escaneando muebles para extracción automática de multicapa...")
    for obj in env.objects:
        if obj.type.name != "MonoBehaviour": continue
        try:
            tree = obj.read_typetree()
            if not isinstance(tree, dict): continue
            fid = tree.get("ID")
            if fid is None: continue
            
            # Check if this item is in items_db and has chair/bed or multi layers
            fid_int = int(fid)
            item_entry = items_db.get(str(fid_int))
            kind = (item_entry.get("behaviour", {}) if item_entry else {}).get("kind", "")
            
            sprites = tree.get("sprites") or []
            sortings = [s.get("activitySorting", 0) for s in sprites if isinstance(s, dict)]
            has_multi = any(st >= 2 for st in sortings) and any(st <= 1 for st in sortings)

            if has_multi:
                res = extract_and_compose_layers(obj_map, tree, fid_int, items_images_dir)
                if res:
                    extracted_profiles[str(fid_int)] = res
                    total_processed += 1
                    name = (item_entry.get("furn_name") if item_entry else tree.get("m_Name", ""))
                    print(f"  [+] ID {fid_int:4d} ({name}) -> Generadas capas ({res['canvas_size'][0]}x{res['canvas_size'][1]}px)")
        except Exception as e:
            pass

    print(f"\nProceso de extracción completado. Muebles multicapa generados: {total_processed}")

    # Update items_db.json
    updated_items_count = 0
    for fid_str, profile in extracted_profiles.items():
        if fid_str in items_db:
            items_db[fid_str]["seating_profile"] = {
                "has_backrest": profile["has_backrest"],
                "back_base_sprite": profile["back_base_sprite"],
                "backrest_sprite": profile["backrest_sprite"],
                "offsets": profile["offsets"]
            }
            updated_items_count += 1

    with open(items_db_path, "w", encoding="utf-8") as f:
        json.dump(items_db, f, indent=2, ensure_ascii=False)
    print(f"Actualizado items_db.json con {updated_items_count} seating_profiles.")

    # Update activities_db.json
    if "seating_profiles" not in activities_db:
        activities_db["seating_profiles"] = {}
    for fid_str, profile in extracted_profiles.items():
        activities_db["seating_profiles"][fid_str] = {
            "has_backrest": profile["has_backrest"],
            "back_base_sprite": profile["back_base_sprite"],
            "backrest_sprite": profile["backrest_sprite"],
            "offsets": profile["offsets"]
        }

    with open(activities_db_path, "w", encoding="utf-8") as f:
        json.dump(activities_db, f, indent=2, ensure_ascii=False)
    print(f"Actualizado activities_db.json con seating_profiles.")

if __name__ == "__main__":
    main()
