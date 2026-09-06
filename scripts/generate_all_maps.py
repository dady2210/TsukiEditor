# -*- coding: utf-8 -*-
"""
generate_all_maps.py
Genera todos los archivos JSON canónicos estandarizados (map_X.json)
para Tsuky WebEditor en la carpeta Tsuky_WebEditor/data/maps/
"""

import os
import sys
import json
from pathlib import Path

# Configurar salida UTF-8 en Windows
sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(r"c:\Users\Andres\Desktop\Tsuki_Odyssey")
WEB_EDITOR = ROOT / "Tsuky_WebEditor"
OUT_DIR = WEB_EDITOR / "data" / "maps"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Cargar maps_unified.json si existe para obtener superficies ya medidas
unified_atlas = []
unified_meta = {}
unified_path = WEB_EDITOR / "data" / "maps_unified.json"
if unified_path.exists():
    with open(unified_path, "r", encoding="utf-8") as f:
        u_data = json.load(f)
        unified_atlas = u_data.get("atlas", [])
        unified_meta = u_data.get("meta", {})

# Metadata de nivel 2 (Home) si existe
meta_level2_path = WEB_EDITOR / "images" / "maps" / "Exportado_level2" / "map_metadata.json"
meta_level2 = {}
if meta_level2_path.exists():
    with open(meta_level2_path, "r", encoding="utf-8") as f:
        meta_level2 = json.load(f)

unity_bounds_level2 = {}
for wb in meta_level2.get("walkable_bounds", []):
    name = wb.get("go", "")
    props = wb.get("properties", {})
    paths = props.get("m_Points", {}).get("m_Paths", [])
    pts = paths[0] if paths else []
    unity_bounds_level2[name] = {
        "x": wb.get("x", 0.0),
        "y": wb.get("y", 0.0),
        "poly": [{"x": round(p["x"], 4), "y": round(p["y"], 4)} for p in pts]
    }

# Definición de todos los mapas del juego (SLocation enum)
MAPS_DEFINITIONS = [
    # --- ALDEA HONGO (MUSHROOM VILLAGE) ---
    {
        "mapId": 0,
        "name": "Casa del Árbol de Tsuki",
        "englishName": "Tsuki's Treehouse (Home)",
        "zone": "Aldea Hongo",
        "exportDir": "Exportado_level2",
        "assembled": "level2_Ensamblado.png",
        "lighting": "interior",
        "decoratable": True,
        "specialSurfaces": [
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
                "origin": {"x": unity_bounds_level2.get("WallpaperBL", {}).get("x", -2.226), "y": unity_bounds_level2.get("WallpaperBL", {}).get("y", -1.141)},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 16,
                "defaultCoverId": 755,
                "poly": unity_bounds_level2.get("WallpaperBL", {}).get("poly", [])
            },
            {
                "id": "wall_0_R",
                "kind": "wall",
                "groupNum": 0,
                "anchorID": 495018548,
                "flipped": False,
                "name": "Pared Der Piso 0 (WallpaperBR)",
                "origin": {"x": unity_bounds_level2.get("WallpaperBR", {}).get("x", 1.849), "y": unity_bounds_level2.get("WallpaperBR", {}).get("y", -1.118)},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 16,
                "defaultCoverId": 2127,
                "poly": unity_bounds_level2.get("WallpaperBR", {}).get("poly", [])
            },
            {
                "id": "floor_1",
                "kind": "floor",
                "groupNum": 1,
                "anchorID": 1518507412,
                "flipped": False,
                "name": "Primer Piso - Piso 1",
                "origin": {"x": unity_bounds_level2.get("FloorL2 (1)", {}).get("x", -0.306), "y": unity_bounds_level2.get("FloorL2 (1)", {}).get("y", 0.857)},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 14,
                "defaultCoverId": 750,
                "poly": unity_bounds_level2.get("FloorL2 (1)", {}).get("poly", [])
            },
            {
                "id": "wall_1_L",
                "kind": "wall",
                "groupNum": 1,
                "anchorID": 636683912,
                "flipped": True,
                "name": "Pared Izq Piso 1 (WallpaperTL)",
                "origin": {"x": unity_bounds_level2.get("WallpaperTL", {}).get("x", -2.114), "y": unity_bounds_level2.get("WallpaperTL", {}).get("y", 2.340)},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 16,
                "defaultCoverId": 752,
                "poly": unity_bounds_level2.get("WallpaperTL", {}).get("poly", [])
            },
            {
                "id": "wall_1_R",
                "kind": "wall",
                "groupNum": 1,
                "anchorID": 1355124652,
                "flipped": False,
                "name": "Pared Der Piso 1 (WallpaperTR)",
                "origin": {"x": unity_bounds_level2.get("WallpaperTR", {}).get("x", 1.686), "y": unity_bounds_level2.get("WallpaperTR", {}).get("y", 2.557)},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 16,
                "defaultCoverId": 418,
                "poly": unity_bounds_level2.get("WallpaperTR", {}).get("poly", [])
            },
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
    },
    {
        "mapId": 1,
        "name": "Tienda de Yori",
        "englishName": "Yori's General Store",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Tienda de Yori - Planta Baja",
                "origin": {"x": 0.0, "y": -1.5},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 14,
                "poly": []
            },
            {
                "id": "floor_1",
                "kind": "floor",
                "groupNum": 1,
                "flipped": False,
                "name": "Tienda de Yori - Piso Superior (Pipi)",
                "origin": {"x": 0.0, "y": 1.5},
                "cell": {"w": 58, "h": 28},
                "rows": 12,
                "cols": 12,
                "poly": []
            }
        ]
    },
    {
        "mapId": 2,
        "name": "Casa de Chi",
        "englishName": "Chi's House",
        "zone": "Aldea Hongo",
        "exportDir": "Exportado_level6",
        "assembled": "level6_Ensamblado.png",
        "lighting": "interior",
        "decoratable": True,
        "specialSurfaces": []
    },
    {
        "mapId": 3,
        "name": "Casa de Moca",
        "englishName": "Moca's House",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": True,
        "specialSurfaces": []
    },
    {
        "mapId": 4,
        "name": "Muelle de Yori / Costa",
        "englishName": "Pier (Yori's Dock / Coast)",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "exterior",
        "decoratable": True,
        "specialSurfaces": []
    },
    {
        "mapId": 5,
        "name": "Tienda de Plantas de Rosemary",
        "englishName": "Rosemary's Plant Shop",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "exterior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Vivero Principal",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 14,
                "poly": []
            }
        ]
    },
    {
        "mapId": 6,
        "name": "Granja de Tsuki",
        "englishName": "Tsuki's Farm",
        "zone": "Aldea Hongo",
        "exportDir": "Exportado_level4",
        "assembled": "level4_Ensamblado.png",
        "lighting": "exterior",
        "decoratable": True,
        "specialSurfaces": []
    },
    {
        "mapId": 7,
        "name": "Escena de Apertura (Tren)",
        "englishName": "Opening Scene (Train)",
        "zone": "Aldea Hongo / Prólogo",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Vagón Inicial",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 10,
                "cols": 10,
                "poly": []
            }
        ]
    },
    {
        "mapId": 8,
        "name": "Ayuntamiento de Aldea Hongo",
        "englishName": "Town Hall (Benny / Bobo's Ramen)",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": True,
        "specialSurfaces": []
    },
    {
        "mapId": 9,
        "name": "Casa de Té de Momo",
        "englishName": "Momo's Tea House",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "exterior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Terraza de Té",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 12,
                "cols": 12,
                "poly": []
            }
        ]
    },
    {
        "mapId": 10,
        "name": "Estación de Tren",
        "englishName": "Train Station (Mushroom Village)",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "exterior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Andén Principal",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 16,
                "cols": 16,
                "poly": []
            }
        ]
    },
    {
        "mapId": 11,
        "name": "Taller de Dawn",
        "englishName": "Dawn's Workshop",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "exterior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Área de Máquinas / Taller",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 14,
                "poly": []
            }
        ]
    },
    {
        "mapId": 12,
        "name": "Dojo de Ken",
        "englishName": "Ken's Dojo",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Tatami Principal",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 14,
                "poly": []
            }
        ]
    },
    {
        "mapId": 13,
        "name": "Salón de Scarlett",
        "englishName": "Scarlett's Lounge",
        "zone": "Aldea Hongo",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Escenario y Barra",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 14,
                "poly": []
            }
        ]
    },
    {
        "mapId": 14,
        "name": "En Tránsito / Viaje en Tren",
        "englishName": "Travelling (Train Journey)",
        "zone": "Tránsito",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False,
        "specialSurfaces": [
            {
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "flipped": False,
                "name": "Vagón de Pasajeros",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 12,
                "cols": 12,
                "poly": []
            }
        ]
    },

    # --- LA GRAN CIUDAD (GREAT CITY) ---
    {
        "mapId": 15,
        "name": "Estación de Subterráneo",
        "englishName": "Subway Station",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 16,
        "name": "Ayuntamiento de la Gran Ciudad",
        "englishName": "City Hall (Great City)",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 17,
        "name": "Salida de la Ciudad",
        "englishName": "City Exit",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "exterior",
        "decoratable": False
    },
    {
        "mapId": 18,
        "name": "Torre Celeste (Skytower)",
        "englishName": "Skytower",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "exterior",
        "decoratable": False
    },
    {
        "mapId": 19,
        "name": "Hotel Cápsula",
        "englishName": "Capsule Hotel",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 20,
        "name": "Lobby de Apartamentos",
        "englishName": "Apartment Lobby",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 21,
        "name": "El Agujero (The Hole)",
        "englishName": "The Hole (Bar)",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 22,
        "name": "Penthouse de la Ciudad",
        "englishName": "Penthouse",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 23,
        "name": "Centro Comercial",
        "englishName": "Shopping Mall",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 24,
        "name": "Entrada al Centro Comercial",
        "englishName": "Mall Entrance",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "exterior",
        "decoratable": False
    },
    {
        "mapId": 25,
        "name": "Tienda de Alfombras",
        "englishName": "Rug Shop",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 26,
        "name": "Vinatería",
        "englishName": "Winery",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 27,
        "name": "Heladería",
        "englishName": "Ice Cream Shop",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 28,
        "name": "Joyería",
        "englishName": "Jewelry Store",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 29,
        "name": "Oficina de Correos",
        "englishName": "Post Office",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 30,
        "name": "Tienda de Bubble Tea",
        "englishName": "Bubble Tea",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 31,
        "name": "Zapatería",
        "englishName": "Shoe Store",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 32,
        "name": "Estación de Policía",
        "englishName": "Police Station",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 33,
        "name": "Cafetería",
        "englishName": "Coffee Shop",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },
    {
        "mapId": 34,
        "name": "Apartamento de la Ciudad",
        "englishName": "City Apartment",
        "zone": "Gran Ciudad",
        "exportDir": None,
        "assembled": None,
        "lighting": "interior",
        "decoratable": False
    },

    # --- EXPANSIONES ESPECIALES ---
    {
        "mapId": 39,
        "name": "Ático de Ensueño (Homecoming 3er Piso)",
        "englishName": "Dreamhouse (Homecoming 3rd Floor)",
        "zone": "Expansión Casa del Árbol",
        "exportDir": "Exportado_level39",
        "assembled": "level39_Ensamblado.png",
        "lighting": "interior",
        "decoratable": True,
        "specialSurfaces": [
            {
                "id": "floor_dreamhouse",
                "kind": "floor",
                "groupNum": 2,
                "anchorID": None,
                "flipped": False,
                "name": "Ático Principal (Homecoming)",
                "origin": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 14,
                "cols": 14,
                "poly": []
            }
        ]
    }
]

generated_summary = []

for m_def in MAPS_DEFINITIONS:
    map_id = m_def["mapId"]
    name = m_def["name"]
    eng_name = m_def["englishName"]
    zone = m_def["zone"]
    export_dir_name = m_def.get("exportDir")
    assembled_name = m_def.get("assembled")
    lighting = m_def.get("lighting", "interior")
    decoratable = m_def.get("decoratable", False)

    visuals = []
    colliders = []
    logic = {}

    # Cargar layout visual si existe carpeta de exportación
    assets_dir = None
    if export_dir_name:
        exp_path = WEB_EDITOR / "images" / "maps" / export_dir_name
        if exp_path.exists():
            assets_dir = f"../../images/maps/{export_dir_name}"
            layout_file = exp_path / "layout.json"
            if layout_file.exists():
                with open(layout_file, "r", encoding="utf-8") as lf:
                    visuals = json.load(lf)
            
            meta_file = exp_path / "map_metadata.json"
            if meta_file.exists():
                with open(meta_file, "r", encoding="utf-8") as mf:
                    meta_data = json.load(mf)
                    logic = {
                        "interaction_nodes": meta_data.get("interaction_nodes", []),
                        "camera_confines": meta_data.get("camera_confines", []),
                        "lights": meta_data.get("lighting_volumes", []),
                        "special_scripts": meta_data.get("special_scripts", []),
                        "animators": meta_data.get("animator_nodes", []),
                        "audio": meta_data.get("audio_sources", []),
                        "particles": meta_data.get("particle_systems", [])
                    }

    # Recopilar superficies
    surfaces = []
    if m_def.get("specialSurfaces"):
        surfaces = m_def["specialSurfaces"]
    else:
        # Buscar en unified_atlas
        atlas_matches = [s for s in unified_atlas if str(s.get("mapId")) == str(map_id)]
        if atlas_matches:
            for idx, s in enumerate(atlas_matches):
                is_floor = s.get("kind") == "floor"
                gNum = s.get("groupNum", 0)
                flp = s.get("flipped", False)
                s_id = s.get("id") or (f"floor_{gNum}" if is_floor else f"wall_{gNum}_{'L' if flp else 'R'}")
                s_name = s.get("name") or (f"Piso g{gNum}" if is_floor else f"Pared g{gNum} {'Izq' if flp else 'Der'}")
                
                # Calcular origin (world) y origin_px
                orig_px = s.get("origin_px") or {"x": 500.0, "y": 300.0}
                orig_world = s.get("origin") or {
                    "x": round((orig_px["x"] * 0.75) / 150.0, 4),
                    "y": round((orig_px["y"] * 0.75) / 150.0, 4)
                }

                surfaces.append({
                    "id": s_id,
                    "kind": s.get("kind", "floor"),
                    "groupNum": gNum,
                    "anchorID": s.get("anchorID", None),
                    "flipped": flp,
                    "name": s_name,
                    "origin": orig_world,
                    "origin_px": orig_px,
                    "cell": s.get("cell") or ({"w": 56, "h": 28} if is_floor else {"w": 64, "h": 32}),
                    "rows": s.get("rows", 14),
                    "cols": s.get("cols", 14),
                    "defaultCoverId": s.get("defaultCoverId", None),
                    "poly": s.get("poly", [])
                })
        else:
            # Superficie por defecto para mapas sin atlas registrado aún
            surfaces.append({
                "id": "floor_0",
                "kind": "floor",
                "groupNum": 0,
                "anchorID": None,
                "flipped": False,
                "name": f"Piso Principal - {name}",
                "origin": {"x": 0.0, "y": 0.0},
                "origin_px": {"x": 0.0, "y": 0.0},
                "cell": {"w": 58, "h": 28},
                "rows": 16,
                "cols": 16,
                "defaultCoverId": None,
                "poly": []
            })

    # Asegurar origin y origin_px en todas las superficies
    for s in surfaces:
        if "origin_px" not in s or not s["origin_px"]:
            s["origin_px"] = {
                "x": round((s.get("origin", {}).get("x", 0.0) * 150.0) / 0.75, 2),
                "y": round((s.get("origin", {}).get("y", 0.0) * 150.0) / 0.75, 2)
            }
        if "origin" not in s or not s["origin"]:
            s["origin"] = {
                "x": round((s.get("origin_px", {}).get("x", 0.0) * 0.75) / 150.0, 4),
                "y": round((s.get("origin_px", {}).get("y", 0.0) * 0.75) / 150.0, 4)
            }

    # Estructura canónica del mapa
    map_json_obj = {
        "mapId": int(map_id),
        "name": name,
        "englishName": eng_name,
        "zone": zone,
        "version": 2,
        "config": {
            "ppu": 150,
            "bgScale": 0.75,
            "assetsDir": assets_dir,
            "assembled": assembled_name,
            "lighting": lighting,
            "camera": {"zoom": 40, "minZoom": 15, "maxZoom": 80}
        },
        "surfaces": surfaces,
        "visuals": visuals,
        "colliders": colliders,
        "logic": logic
    }

    out_file = OUT_DIR / f"map_{map_id}.json"
    with open(out_file, "w", encoding="utf-8") as of:
        json.dump(map_json_obj, of, indent=2, ensure_ascii=False)

    generated_summary.append({
        "mapId": map_id,
        "file": f"map_{map_id}.json",
        "name": name,
        "englishName": eng_name,
        "zone": zone,
        "decoratable": decoratable,
        "surfacesCount": len(surfaces),
        "visualsCount": len(visuals),
        "exportDir": export_dir_name or "N/A"
    })

print(f"\n[ÉXITO] Se generaron exitosamente {len(generated_summary)} archivos de mapa en {OUT_DIR}:")
print("-" * 90)
print(f"{'ID':<4} | {'Archivo':<13} | {'Superficies':<11} | {'Visuales':<9} | {'Ubicación y Nombre'}")
print("-" * 90)
for g in generated_summary:
    dec_mark = "🎨" if g["decoratable"] else "  "
    print(f"{g['mapId']:<4} | {g['file']:<13} | {g['surfacesCount']:<11} | {g['visualsCount']:<9} | {dec_mark} {g['name']} ({g['englishName']})")
print("-" * 90)
