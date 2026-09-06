# -*- coding: utf-8 -*-
"""
build_unified_map.py
Consolida un nivel de Tsuki Odyssey en un único archivo JSON estandarizado (map_X.json).
Incluye:
- Las 6 superficies interiores principales (Piso 0, Piso 1, Paredes L/R)
- Los 2 patios exteriores descubiertos en save (35):
    * Patio Exterior 1 (groupNum: 2) -> Silla de Jardín
    * Patio Exterior 2 (groupNum: 3) -> Librero Pera Jugosa
- Los anchorID exactos de Unity para wallpapers y floors
"""

import os
import json
import argparse
from pathlib import Path

def build_unified_map(export_dir, atlas_file, map_id, map_name, out_file):
    export_dir = Path(export_dir)
    layout_path = export_dir / "layout.json"
    meta_path = export_dir / "map_metadata.json"

    visuals = []
    if layout_path.exists():
        with open(layout_path, "r", encoding="utf-8") as f:
            visuals = json.load(f)

    meta = {}
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    unity_bounds = {}
    for wb in meta.get("walkable_bounds", []):
        name = wb.get("go", "")
        props = wb.get("properties", {})
        paths = props.get("m_Points", {}).get("m_Paths", [])
        pts = paths[0] if paths else []
        unity_bounds[name] = {
            "x": wb.get("x", 0.0),
            "y": wb.get("y", 0.0),
            "poly": [{"x": round(p["x"], 4), "y": round(p["y"], 4)} for p in pts]
        }

    # Definición canónica exacta verificada con save (35) y assets de Unity
    surfaces_def = [
        # --- PLANTA BAJA (PISO 0) ---
        {
            "id": "floor_0",
            "kind": "floor",
            "groupNum": 0,
            "anchorID": 407290786,
            "flipped": False,
            "name": "Planta Baja - Piso 0",
            "origin": {"x": 0.0, "y": -2.25},
            "cell": {"w": 58, "h": 28},
            "rows": 16,
            "cols": 16,
            "defaultCoverId": 69,
            "poly": [
                {"x": 0.0, "y": 0.8},
                {"x": 2.2, "y": -0.3},
                {"x": 2.2, "y": -1.4},
                {"x": 0.0, "y": -2.4},
                {"x": -2.2, "y": -1.4},
                {"x": -2.2, "y": -0.3}
            ]
        },
        {
            "id": "wall_0_L",
            "kind": "wall",
            "groupNum": 0,
            "anchorID": -852939649,
            "flipped": True,
            "name": "Pared Izq Piso 0 (WallpaperBL)",
            "origin": {"x": unity_bounds.get("WallpaperBL", {}).get("x", -2.226), "y": unity_bounds.get("WallpaperBL", {}).get("y", -1.141)},
            "cell": {"w": 58, "h": 28},
            "rows": 14,
            "cols": 16,
            "defaultCoverId": 755,
            "poly": unity_bounds.get("WallpaperBL", {}).get("poly", [])
        },
        {
            "id": "wall_0_R",
            "kind": "wall",
            "groupNum": 0,
            "anchorID": 495018548,
            "flipped": False,
            "name": "Pared Der Piso 0 (WallpaperBR)",
            "origin": {"x": unity_bounds.get("WallpaperBR", {}).get("x", 1.849), "y": unity_bounds.get("WallpaperBR", {}).get("y", -1.118)},
            "cell": {"w": 58, "h": 28},
            "rows": 14,
            "cols": 16,
            "defaultCoverId": 2127,
            "poly": unity_bounds.get("WallpaperBR", {}).get("poly", [])
        },

        # --- PRIMER PISO (PISO 1) ---
        {
            "id": "floor_1",
            "kind": "floor",
            "groupNum": 1,
            "anchorID": 1518507412,
            "flipped": False,
            "name": "Primer Piso - Piso 1",
            "origin": {"x": unity_bounds.get("FloorL2 (1)", {}).get("x", -0.306), "y": unity_bounds.get("FloorL2 (1)", {}).get("y", 0.857)},
            "cell": {"w": 58, "h": 28},
            "rows": 14,
            "cols": 14,
            "defaultCoverId": 750,
            "poly": unity_bounds.get("FloorL2 (1)", {}).get("poly", [])
        },
        {
            "id": "wall_1_L",
            "kind": "wall",
            "groupNum": 1,
            "anchorID": 636683912,
            "flipped": True,
            "name": "Pared Izq Piso 1 (WallpaperTL)",
            "origin": {"x": unity_bounds.get("WallpaperTL", {}).get("x", -2.114), "y": unity_bounds.get("WallpaperTL", {}).get("y", 2.340)},
            "cell": {"w": 58, "h": 28},
            "rows": 14,
            "cols": 16,
            "defaultCoverId": 752,
            "poly": unity_bounds.get("WallpaperTL", {}).get("poly", [])
        },
        {
            "id": "wall_1_R",
            "kind": "wall",
            "groupNum": 1,
            "anchorID": 1355124652,
            "flipped": False,
            "name": "Pared Der Piso 1 (WallpaperTR)",
            "origin": {"x": unity_bounds.get("WallpaperTR", {}).get("x", 1.686), "y": unity_bounds.get("WallpaperTR", {}).get("y", 2.557)},
            "cell": {"w": 58, "h": 28},
            "rows": 14,
            "cols": 16,
            "defaultCoverId": 418,
            "poly": unity_bounds.get("WallpaperTR", {}).get("poly", [])
        },

        # --- PATIO EXTERIOR 1 (PISO 2 - Silla de Jardín) ---
        {
            "id": "floor_2",
            "kind": "floor",
            "groupNum": 2,
            "anchorID": None,
            "flipped": False,
            "name": "Patio Exterior 1 (g2)",
            "origin": {"x": 3.8, "y": -3.5},
            "cell": {"w": 58, "h": 28},
            "rows": 16,
            "cols": 18,
            "defaultCoverId": None,
            "poly": [
                {"x": 0.0, "y": 1.0},
                {"x": 2.2, "y": -0.2},
                {"x": 1.8, "y": -1.8},
                {"x": -0.5, "y": -2.2},
                {"x": -2.2, "y": -0.8}
            ]
        },

        # --- PATIO EXTERIOR 2 (PISO 3 - Librero Pera) ---
        {
            "id": "floor_3",
            "kind": "floor",
            "groupNum": 3,
            "anchorID": None,
            "flipped": False,
            "name": "Patio Exterior 2 (g3)",
            "origin": {"x": -4.2, "y": -3.5},
            "cell": {"w": 58, "h": 28},
            "rows": 16,
            "cols": 18,
            "defaultCoverId": None,
            "poly": [
                {"x": 0.5, "y": 1.0},
                {"x": 2.2, "y": -0.3},
                {"x": 1.0, "y": -1.8},
                {"x": -1.5, "y": -1.8},
                {"x": -2.0, "y": -0.2}
            ]
        },

        # --- ÁTICO / TERCER PISO (PISO 4 - Homecoming) ---
        {
            "id": "floor_4",
            "kind": "floor",
            "groupNum": 4,
            "anchorID": None,
            "flipped": False,
            "name": "Ático - Tercer Piso (Homecoming)",
            "origin": {"x": 0.0, "y": 3.8},
            "cell": {"w": 58, "h": 28},
            "rows": 12,
            "cols": 12,
            "defaultCoverId": None,
            "poly": [
                {"x": 0.0, "y": 0.6},
                {"x": 1.6, "y": -0.2},
                {"x": 1.6, "y": -1.0},
                {"x": 0.0, "y": -1.8},
                {"x": -1.6, "y": -1.0},
                {"x": -1.6, "y": -0.2}
            ]
        }
    ]

    for s in surfaces_def:
        s["origin_px"] = {
            "x": round((s["origin"]["x"] * 150.0) / 0.75, 2),
            "y": round((s["origin"]["y"] * 150.0) / 0.75, 2)
        }

    unified_map = {
        "mapId": int(map_id),
        "name": map_name,
        "version": 2,
        "config": {
            "ppu": 150,
            "bgScale": 0.75,
            "assetsDir": "../../images/maps/Exportado_level2",
            "camera": {"zoom": 40, "minZoom": 15, "maxZoom": 80}
        },
        "surfaces": surfaces_def,
        "visuals": visuals,
        "colliders": [
            {
                "go": "TreeTrunk_Blocker",
                "role": "blocker",
                "x": unity_bounds.get("TreeProp", {}).get("x", -6.72),
                "y": unity_bounds.get("TreeProp", {}).get("y", -7.09),
                "poly": unity_bounds.get("TreeProp", {}).get("poly", [])
            }
        ],
        "logic": {
            "interaction_nodes": meta.get("interaction_nodes", []),
            "camera_confines": meta.get("camera_confines", []),
            "lights": meta.get("lighting_volumes", []),
            "special_scripts": meta.get("special_scripts", []),
            "animators": meta.get("animator_nodes", []),
            "audio": meta.get("audio_sources", []),
            "particles": meta.get("particle_systems", [])
        }
    }

    out_file = Path(out_file)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(unified_map, f, indent=2, ensure_ascii=False)

    print(f"[OK] Mapa unificado generado con precision save (35):")
    print(f"     Destino: {out_file}")
    for s in surfaces_def:
        print(f"       * [{s['id']}] {s['name']} (g{s['groupNum']}) anchorID={s.get('anchorID')} defCover={s.get('defaultCoverId')}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--export_dir", default="images/maps/Exportado_level2")
    parser.add_argument("--atlas_file", default="data/maps_unified.js")
    parser.add_argument("--map_id", default=0, type=int)
    parser.add_argument("--name", default="Casa del Arbol de Tsuki")
    parser.add_argument("--output", default="data/maps/map_0.json")
    args = parser.parse_args()

    build_unified_map(args.export_dir, args.atlas_file, args.map_id, args.name, args.output)
