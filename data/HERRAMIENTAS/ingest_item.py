#!/usr/bin/env python3
"""
ingest_item.py — U4 wrapper sobre tsuki_export_by_id.py
Genera FURN_{id}_ON.png si hay capas glow/pointlight/conelight y parchea item_behaviors.js aditivo.
"""
import argparse, subprocess, sys, json, re
from pathlib import Path

HERE = Path(__file__).parent
EXPORTER = HERE / "tsuki_export_by_id.py"
BEHAVIORS = Path(__file__).parent.parent / "item_behaviors.js"

def call_exporter(ids, with_activity=False):
    cmd = [sys.executable, str(EXPORTER)] + [str(i) for i in ids]
    if with_activity: cmd.append("--with-activity")
    print(">>", " ".join(cmd))
    subprocess.check_call(cmd)

def patch_behaviors(ids, mark_lamp=False):
    if not BEHAVIORS.exists():
        print(f"BEHAVIORS no existe: {BEHAVIORS}", file=sys.stderr)
        return
    text = BEHAVIORS.read_text(encoding="utf-8")
    # extraer window.BEHAVIORS = {...}
    m = re.search(r"window\.BEHAVIORS\s*=\s*(\{.*\});", text, re.S)
    if not m:
        print("No se encontró window.BEHAVIORS", file=sys.stderr)
        return
    data = json.loads(re.sub(r"//.*", "", m.group(1)))  # strip no necesario pero simple
    # naive json? file is JS with quotes — try json load via eval style: replace single quotes? It is JSON-like double quotes
    try:
        obj = json.loads(m.group(1))
    except Exception:
        # fallback: exec
        import ast
        obj = {}
        exec(f"obj={m.group(1)}", {}, {"obj": None})
        obj = eval(m.group(1))  # type: ignore

    for id_ in ids:
        sid = str(id_)
        on_path = Path(f"images/items/FURN_{sid}_ON.png")
        has_on = on_path.exists()
        if not has_on and not mark_lamp:
            continue
        entry = obj.get(sid, {})
        if not entry.get("kind"): entry["kind"] = "lamp"
        entry["interact"] = "light_toggle"
        entry.setdefault("render", {})
        entry["render"]["off"] = f"FURN_{sid}_0"
        if has_on or mark_lamp:
            entry["render"]["on"] = f"FURN_{sid}_ON"
        if "light" not in entry:
            entry["light"] = {"modes":["auto","on","off"],"auto_on":"19:30","auto_off":"07:30","radius":72,"color":"#ffcc88"}
        obj[sid] = entry
        print(f"patched {sid} -> light_toggle {entry['render']}")

    # reescribir archivo preservando header
    header = text[:m.start()]
    footer = text[m.end():]
    new_text = header + f"window.BEHAVIORS = {json.dumps(obj, indent=2, ensure_ascii=False)};" + footer
    BEHAVIORS.write_text(new_text, encoding="utf-8")
    print(f"BEHAVIORS actualizado: {BEHAVIORS}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="+", type=int)
    ap.add_argument("--with-activity", action="store_true")
    ap.add_argument("--mark-lamp", action="store_true")
    args = ap.parse_args()
    call_exporter(args.ids, with_activity=args.with_activity)
    # intentar detectar _ON si exporter ya lo genera; si no, buscar glow capas y componer sería en exporter futuro
    patch_behaviors(args.ids, mark_lamp=args.mark_lamp)

if __name__ == "__main__":
    main()
