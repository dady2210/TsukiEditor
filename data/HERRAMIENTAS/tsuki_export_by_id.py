"""
tsuki_export_by_id.py  v2.0
Extrae las vistas delantera y trasera de un mueble de Tsuki Odyssey por su ID.

Uso:
    python tsuki_export_by_id.py <ID> [ID2 ID3 ...]
    python tsuki_export_by_id.py 171 646
    python tsuki_export_by_id.py 171 --with-activity
    python tsuki_export_by_id.py 171 --out C:\\MisExports
"""

import argparse
import sys
from pathlib import Path

try:
    import UnityPy
    from PIL import Image
except ImportError as e:
    print(f"[ERROR] Falta dependencia: {e}")
    sys.exit(1)

UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.0f1"


def find_bundle(folder, pattern):
    matches = sorted(folder.glob(pattern))
    return matches[0] if matches else None


def load_env(bundles_dir):
    furn   = find_bundle(bundles_dir, "furniture_assets_all_*.bundle")
    dupiso = find_bundle(bundles_dir, "duplicateassetisolation_assets_all_*.bundle")
    icons  = find_bundle(bundles_dir, "icons_assets_all_*.bundle")
    if not furn:
        print(f"[ERROR] No furniture bundle en {bundles_dir}"); sys.exit(1)
    if not dupiso:
        print(f"[ERROR] No duplicateassetisolation bundle en {bundles_dir}"); sys.exit(1)
    print(f"[OK] Furniture   : {furn.name}")
    print(f"[OK] DuplicateIso: {dupiso.name}")
    env = UnityPy.load(str(furn))
    env.load_file(str(dupiso))
    if icons:
        print(f"[OK] Icons       : {icons.name}")
        env.load_file(str(icons))
    else:
        print("[WARN] No se encontró icons bundle, se omitirán los iconos.")
    return env


def get_obj_map(env):
    return {o.path_id: o for o in env.objects}


def safe_name(s):
    return "".join(c if c.isalnum() or c in "-_." else "_" for c in s)


def get_world_pos(obj_map, sr_pid):
    sr_obj = obj_map.get(sr_pid)
    if not sr_obj: return 0.0, 0.0
    try:
        sr = sr_obj.read()
        go = sr.m_GameObject.read()
        tr = next((c.read() for c in go.m_Components if c.type.name == "Transform"), None)
        if not tr: return 0.0, 0.0
        wx, wy = tr.m_LocalPosition.x, tr.m_LocalPosition.y
        cur = tr
        for _ in range(10):
            if not cur.m_Father or not cur.m_Father.path_id: break
            parent = cur.m_Father.read()
            wx += parent.m_LocalPosition.x
            wy += parent.m_LocalPosition.y
            cur = parent
        return wx, wy
    except:
        return 0.0, 0.0


def crop_sprite_pid(obj_map, sprite_pid, wx, wy):
    sprite_obj = obj_map.get(sprite_pid)
    if not sprite_obj: return None, 0, 0, 0, 0, "NOT_FOUND"
    sprite = sprite_obj.read()
    rect = sprite.m_Rect
    piv  = sprite.m_Pivot
    ppu  = sprite.m_PixelsToUnits
    try:
        part = sprite.image.convert("RGBA")
    except:
        return None, 0, 0, 0, 0, sprite.m_Name
    dx = int(wx * ppu - piv.x * rect.width)
    dy = int(-wy * ppu - (rect.height - piv.y * rect.height))
    return part, dx, dy, int(rect.width), int(rect.height), sprite.m_Name


def compose(canvas_parts):
    if not canvas_parts: return None
    canvas_parts = sorted(canvas_parts, key=lambda x: x["order"])
    mx = min(c["x"] for c in canvas_parts); my = min(c["y"] for c in canvas_parts)
    Mx = max(c["x"]+c["w"] for c in canvas_parts); My = max(c["y"]+c["h"] for c in canvas_parts)
    final = Image.new("RGBA", (Mx-mx, My-my), (0,0,0,0))
    for p in canvas_parts:
        final.paste(p["img"], (p["x"]-mx, p["y"]-my), p["img"])
    return final


def export_id(env, obj_map, target_id, out_dir, with_activity=False):
    found = False
    for obj in env.objects:
        if obj.type.name != "MonoBehaviour": continue
        try:
            tree = obj.read_typetree()
            if not isinstance(tree, dict) or tree.get("ID") != target_id: continue
            d = obj.read()
            go_name = d.m_GameObject.read().m_Name
            print(f"\n{'='*60}")
            print(f"  ID={target_id}  |  {go_name}")
            print(f"{'='*60}")

            sprites = tree.get("sprites") or []

            # CLAVE: separar capas base (siempre visibles) de capas de actividad
            # onlyVisibleWithActivity=0 â†’ base (el mueble solo)
            # onlyVisibleWithActivity=1 â†’ actividad (Tsuki interactuando)
            base_layers     = [(i, s) for i, s in enumerate(sprites) if s.get("onlyVisibleWithActivity") == 0]
            activity_layers = [(i, s) for i, s in enumerate(sprites) if s.get("onlyVisibleWithActivity") == 1]
            print(f"  Capas base: {len(base_layers)} | Capas actividad: {len(activity_layers)}")

            safe = safe_name(go_name)

            for view in ("front", "back"):
                sprite_key = "normal" if view == "front" else "flipped"

                # QuÃ© capas usar para este render
                layers_to_use = [(i, s) for i, s in enumerate(sprites)] if with_activity else base_layers

                canvas_parts = []
                for i, s in layers_to_use:
                    rend_pid  = (s.get("renderer") or {}).get("m_PathID")
                    flip_obj  = obj_map.get(rend_pid)
                    if not flip_obj: continue
                    flip_tree = flip_obj.read_typetree()
                    sr_pid    = (flip_tree.get("sr") or {}).get("m_PathID")
                    wx, wy    = get_world_pos(obj_map, sr_pid)
                    flip_logic = flip_tree.get("flipLogic", 0)
                    # flipLogic == 1 -> Solo Front
                    # flipLogic == 2 -> Solo Back
                    if view == "front" and flip_logic == 2:
                        continue
                    if view == "back" and flip_logic == 1:
                        continue
                        
                    sprite_flip_logic = flip_tree.get("spriteFlipLogic", 0)
                    
                    sp_pid = 0
                    if sprite_flip_logic == 1:
                        sp_pid = (flip_tree.get(sprite_key) or {}).get("m_PathID")
                    
                    if not sp_pid or sprite_flip_logic == 0:
                        try:
                            sr_obj = obj_map.get(sr_pid)
                            if sr_obj:
                                sr_data = sr_obj.read()
                                if sr_data.m_Sprite:
                                    sp_pid = sr_data.m_Sprite.path_id
                        except: pass
                    part, dx, dy, w, h, sname = crop_sprite_pid(obj_map, sp_pid, wx, wy)
                    if part is None: continue
                    tag = "[actividad]" if s.get("onlyVisibleWithActivity") else "[base]"
                    print(f"    {view} layer {i}: {sname} {w}x{h} @ ({dx},{dy}) {tag}")
                    if sname.lower() in ['white', 'shadow', 'glow', 'conelightdown', 'conelightup', 'pointlight', 'mask', 'stronglight']: continue
                    draw_order = i
                    if target_id == 820 and i == 4:
                        draw_order = 99
                    canvas_parts.append({"img": part, "x": dx, "y": dy, "w": w, "h": h, "order": draw_order})

                img = compose(canvas_parts)
                if img is None:
                    print(f"    [WARN] No se pudo componer la vista {view}."); continue

                act_sfx = "_ACTIVITY" if (with_activity and activity_layers) else ""
                if view == "front":
                    fname = f"FURN_{target_id}_0{act_sfx}.png"
                else:
                    fname = f"FURN_{target_id}_BACK{act_sfx}.png"
                path  = out_dir / fname
                img.save(str(path))
                print(f"    -> {fname}  ({img.width}x{img.height})")

            # BUSCAR Y EXPORTAR ICONO
            import re
            icon_name = re.sub(r'[^a-zA-Z0-9]', '', go_name).lower()
            icon_found = False
            for io in env.objects:
                if io.type.name == "Sprite":
                    io_d = io.read()
                    if getattr(io_d, "m_Name", "").lower() == icon_name:
                        try:
                            icon_img = io_d.image.convert("RGBA")
                            if icon_img:
                                fname_icon = f"FURN_{target_id}.png"
                                icon_img.save(str(out_dir / fname_icon))
                                print(f"    -> {fname_icon}  (Icono)")
                                icon_found = True
                                break
                        except: pass
            if not icon_found:
                print(f"    [WARN] No se encontró el icono '{icon_name}'.")

            found = True
            break
        except Exception:
            import traceback; traceback.print_exc()

    if not found:
        print(f"\n[WARN] ID={target_id} no encontrado en el bundle.")


def main():
    ap = argparse.ArgumentParser(description="Tsuki Odyssey â€” exportar muebles por ID")
    ap.add_argument("ids", nargs="+", type=int)
    ap.add_argument("--out",     type=Path, default=Path(__file__).parent)
    ap.add_argument("--bundles", type=Path, default=Path(__file__).parent)
    ap.add_argument("--with-activity", action="store_true",
                    help="Incluir capas de actividad (Tsuki interactuando)")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    print(f"\n[Tsuki Export by ID  v2.0]")
    print(f"  IDs     : {args.ids}")
    print(f"  Salida  : {args.out}")
    print()

    env     = load_env(args.bundles)
    obj_map = get_obj_map(env)
    print(f"[OK] {len(obj_map)} objetos cargados.")

    for fid in args.ids:
        export_id(env, obj_map, fid, args.out, with_activity=args.with_activity)

    print("\n[Listo!]")


if __name__ == "__main__":
    main()










