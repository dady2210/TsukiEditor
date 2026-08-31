#!/usr/bin/env python3
"""
ingest_map.py — U3 wrapper sobre TsukiMapExtractor.py
No reescribe el ensamblador; solo envuelve CLI.
"""
import argparse, subprocess, json, shutil, os, sys
from pathlib import Path

HERE = Path(__file__).parent
EXTRACTOR = HERE / "TsukiMapExtractor.py"

def default_export_dir(map_id):
    return {0:2, 6:4}.get(map_id, map_id)

def main():
    ap = argparse.ArgumentParser(description="Ingest level → images/maps/Exportado_levelD/")
    ap.add_argument("--level", required=True, help="path al level/asset Unity o carpeta")
    ap.add_argument("--map-id", type=int, required=True)
    ap.add_argument("--export-dir", type=int, default=None)
    ap.add_argument("--addressables", default=None)
    ap.add_argument("--out", default="images/maps")
    ap.add_argument("--force-masks", action="store_true")
    args = ap.parse_args()

    export_dir = args.export_dir if args.export_dir is not None else default_export_dir(args.map_id)
    cmd = [sys.executable, str(EXTRACTOR), "--level", args.level, "--map-id", str(args.map_id)]
    if args.addressables: cmd += ["--addressables", args.addressables]
    # TsukiMapExtractor genera Exportado_<basename>/
    print(">>", " ".join(cmd))
    subprocess.check_call(cmd)

    # localizar Exportado_* generado (basename del level)
    basename = Path(args.level).stem
    src = None
    for p in Path(".").glob("Exportado_*"):
        if basename.lower() in p.name.lower():
            src = p; break
    if not src:
        # fallback: cualquier Exportado_* reciente
        candidates = sorted(Path(".").glob("Exportado_*"), key=lambda p: p.stat().st_mtime, reverse=True)
        if candidates: src = candidates[0]
    if not src or not src.exists():
        print("No se encontró carpeta Exportado_* tras extracción", file=sys.stderr)
        sys.exit(1)

    out_base = Path(args.out)
    dst = out_base / f"Exportado_level{export_dir}"
    dst.mkdir(parents=True, exist_ok=True)
    # copiar sin pisar masks existentes salvo --force-masks
    for item in src.iterdir():
        target = dst / item.name
        if item.name.startswith("mask_") and target.exists() and not args.force_masks:
            continue
        if item.is_dir():
            if target.exists(): shutil.rmtree(target)
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)

    # project.json
    assembled = f"level{export_dir}_Ensamblado.png"
    # detectar ensamblado real
    for cand in dst.glob("*Ensamblado*.png"):
        assembled = cand.name; break
    proj = {"mapId": args.map_id, "exportDir": export_dir, "assembled": assembled, "level": str(args.level), "layout": "layout.json"}
    (dst / "project.json").write_text(json.dumps(proj, indent=2), encoding="utf-8")

    # suggested_surfaces.json heurística
    layout_path = dst / "layout.json"
    suggested = []
    if layout_path.exists():
        try:
            data = json.loads(layout_path.read_text(encoding="utf-8"))
            for entry in (data if isinstance(data, list) else data.get("objects", [])):
                name = (entry.get("name") or entry.get("go") or "").lower()
                kind = None
                if "wallpaper" in name or "wall" in name: kind = "wall"
                elif "floor" in name or "ground" in name or "flooring" in name: kind = "floor"
                if kind:
                    suggested.append({"name": entry.get("name"), "kind": kind, "groupNum": None, "poly": entry.get("poly")})
        except Exception as e:
            print(f"heurística layout falló: {e}", file=sys.stderr)

    (dst / "suggested_surfaces.json").write_text(json.dumps(suggested, indent=2), encoding="utf-8")
    print(f"Ingest OK → {dst}")
    print("Abrir data/HERRAMIENTAS/map_editor.html y cargar esta carpeta; luego Merge atlas")

if __name__ == "__main__":
    main()
