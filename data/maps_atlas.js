/* maps_atlas.js
 * Surfaces where the player can place furniture.
 * origin_px / cell measured in editor = KEEP.
 * Everything else: size from MOD_save (5) groupNums + informe SLocation.
 * TODO: align origin_px in grid editor (farm 1–5, home 4–5, walls g2, Chi/Moca/Pier/TH).
 *
 * SLocation: 0 Home level2 | 2 Chi | 3 Moca | 4 Pier | 6 Farm level4 | 8 TownHall
 * Home group 2 = Homecoming floor. Home 4–5 = exterior (tree/yard), floor only.
 * Farm walls ONLY groupNum 3 (shed). Do not put walls on farm group 0.
 */
window.atlasConfig = { bgScale: 0.75 };

const CELL_FLOOR = { w: 56, h: 28 };
const CELL_WALL  = { w: 64, h: 32 };
const TODO = { x: 500, y: 300 };

function F(mapId, groupNum, rows, cols, origin, extra) {
  return Object.assign({
    mapId, kind: "floor", groupNum, flipped: false,
    rows, cols, origin_px: origin || Object.assign({}, TODO), cell: CELL_FLOOR
  }, extra || {});
}
function W(mapId, groupNum, flipped, rows, cols, origin, extra) {
  return Object.assign({
    mapId, kind: "wall", groupNum, flipped,
    rows, cols, origin_px: origin || Object.assign({}, TODO), cell: CELL_WALL
  }, extra || {});
}

window.mapsAtlas = [
  // ── 0 HOME  Exportado_level2  lighting interior ──
  // origins medidos (no tocar)
  F(0, 0, 16, 16, { x: 1241.8627766640973, y: 1976.5599626258365 }, { exportDir: 2, assembled: "level2_Ensamblado.png" }),
  F(0, 1, 14, 14, { x: 1241.3778650761362, y: 1377.8195246607497 }, { exportDir: 2, assembled: "level2_Ensamblado.png" }),
  F(0, 2, 14, 14, { x: 329, y: 86 }, { cell: { w: 64, h: 32 }, homecoming_only: true }),
  // exterior árbol / jardín (save tenía items en g4 y g5)
  F(0, 4, 16, 16, { x: 900, y: 2200 }, { outdoor: true, comment: "TODO alinear exterior g4" }),
  F(0, 5, 12, 12, { x: 1600, y: 2200 }, { outdoor: true, comment: "TODO alinear exterior g5" }),

  W(0, 0, true,  16, 16, { x: 517.586070316604,  y: 1736.7251352113876 }, { exportDir: 2, assembled: "level2_Ensamblado.png" }),
  W(0, 0, false, 16, 16, { x: 1900.8886116872663, y: 1709.2945966576285 }, { exportDir: 2, assembled: "level2_Ensamblado.png" }),
  W(0, 1, true,  14, 16, { x: 695.5865991721795, y: 1121.399760052171 }, { exportDir: 2, assembled: "level2_Ensamblado.png" }),
  W(0, 1, false, 14, 16, { x: 1878.8955153318568, y: 1174.4446804489417 }, { exportDir: 2, assembled: "level2_Ensamblado.png" }),
  W(0, 2, true,  14, 14, { x: 80, y: 40 }, { homecoming_only: true, comment: "TODO pared HC izq" }),
  W(0, 2, false, 14, 14, { x: 580, y: 40 }, { homecoming_only: true, comment: "TODO pared HC der" }),

  // ── 6 FARM  Exportado_level4  lighting exterior ──
  F(6, 0, 26, 26, { x: 500, y: 300 }, { lighting: "exterior" }),
  F(6, 1, 12, 12, { x: 200, y: 800 }, { lighting: "exterior", comment: "TODO zona farm g1" }),
  F(6, 2, 12, 12, { x: 900, y: 800 }, { lighting: "exterior", comment: "TODO zona farm g2" }),
  F(6, 3, 8, 8,   { x: 200, y: -150 }, { lighting: "exterior", comment: "cobertizo" }),
  F(6, 4, 12, 12, { x: 900, y: -100 }, { lighting: "exterior", comment: "TODO zona farm g4" }),
  F(6, 5, 8, 8,   { x: 50, y: 50 }, { lighting: "exterior", comment: "TODO zona farm g5" }),
  W(6, 3, true,  12, 8, { x: 150, y: -80 }, { lighting: "exterior" }),
  W(6, 3, false, 12, 8, { x: 380, y: -80 }, { lighting: "exterior" }),

  // ── 2 CHI ──
  F(2, 0, 16, 16, null, { comment: "TODO Chi Piso0" }),
  F(2, 1, 14, 14, null, { comment: "TODO Chi Piso1" }),
  F(2, 2, 14, 14, null, { comment: "TODO Chi Piso2" }),
  W(2, 0, true,  12, 16, null),
  W(2, 0, false, 12, 16, null),
  W(2, 1, true,  12, 14, null),
  W(2, 1, false, 12, 14, null),

  // ── 3 MOCA ──
  F(3, 0, 16, 16, null, { comment: "TODO Moca Piso0" }),
  F(3, 1, 14, 14, null, { comment: "TODO Moca Piso1" }),
  F(3, 2, 14, 14, null, { comment: "TODO Moca Piso2" }),
  F(3, 3, 10, 10, null, { comment: "TODO Moca g3" }),
  F(3, 4, 10, 10, null, { comment: "TODO Moca g4" }),
  W(3, 0, true,  12, 16, null),
  W(3, 0, false, 12, 16, null),
  W(3, 1, true,  12, 14, null),
  W(3, 1, false, 12, 14, null),

  // ── 4 PIER  (solo suelo en el save) ──
  F(4, 1, 16, 16, null, { lighting: "exterior", comment: "TODO Pier g1" }),
  F(4, 2, 12, 12, null, { lighting: "exterior", comment: "TODO Pier g2" }),

  // ── 8 TOWN HALL ──
  F(8, 0, 16, 16, null, { comment: "TODO TH Piso0" }),
  F(8, 1, 12, 12, null, { comment: "TODO TH Piso1" }),
  W(8, 0, true,  12, 16, null),
  W(8, 0, false, 12, 16, null)
];

window.MAP_META = {
  "0": {
    "name": "Casa del Árbol de Tsuki",
    "exportDir": 2,
    "export": "Exportado_level2",
    "assembled": "level2_Ensamblado.png",
    "lighting": "interior"
  },
  "1": {
    "name": "Tienda de Yori",
    "exportDir": 3,
    "export": "Exportado_level3",
    "assembled": "level3_Ensamblado.png",
    "lighting": "interior"
  },
  "2": {
    "name": "Casa de Chi",
    "exportDir": 6,
    "export": "Exportado_level6",
    "assembled": "level6_Ensamblado.png",
    "lighting": "interior"
  },
  "3": {
    "name": "Casa de Moca",
    "exportDir": 7,
    "export": "Exportado_level7",
    "assembled": "level7_Ensamblado.png",
    "lighting": "interior"
  },
  "4": {
    "name": "Muelle de Yori / Costa",
    "exportDir": 5,
    "export": "Exportado_level5",
    "assembled": "level5_Ensamblado.png",
    "lighting": "exterior"
  },
  "5": {
    "name": "Tienda de Plantas de Rosemary",
    "exportDir": 11,
    "export": "Exportado_level11",
    "assembled": "level11_Ensamblado.png",
    "lighting": "exterior"
  },
  "6": {
    "name": "Granja de Tsuki",
    "exportDir": 4,
    "export": "Exportado_level4",
    "assembled": "level4_Ensamblado.png",
    "lighting": "exterior"
  },
  "7": {
    "name": "Escena de Apertura (Tren)",
    "exportDir": 15,
    "export": "Exportado_level15",
    "assembled": "level15_Ensamblado.png",
    "lighting": "interior"
  },
  "8": {
    "name": "Ayuntamiento de Aldea Hongo",
    "exportDir": 8,
    "export": "Exportado_level8",
    "assembled": "level8_Ensamblado.png",
    "lighting": "interior"
  },
  "9": {
    "name": "Casa de Té de Momo",
    "exportDir": 10,
    "export": "Exportado_level10",
    "assembled": "level10_Ensamblado.png",
    "lighting": "exterior"
  },
  "10": {
    "name": "Estación de Tren",
    "exportDir": 9,
    "export": "Exportado_level9",
    "assembled": "level9_Ensamblado.png",
    "lighting": "exterior"
  },
  "11": {
    "name": "Taller de Dawn",
    "exportDir": 12,
    "export": "Exportado_level12",
    "assembled": "level12_Ensamblado.png",
    "lighting": "exterior"
  },
  "12": {
    "name": "Dojo de Ken",
    "exportDir": 55,
    "export": "Exportado_level55",
    "assembled": "level55_Ensamblado.png",
    "lighting": "interior"
  },
  "13": {
    "name": "Salón de Scarlett",
    "exportDir": 13,
    "export": "Exportado_level13",
    "assembled": "level13_Ensamblado.png",
    "lighting": "interior"
  },
  "14": {
    "name": "En Tránsito / Viaje en Tren",
    "exportDir": 48,
    "export": "Exportado_level48",
    "assembled": "level48_Ensamblado.png",
    "lighting": "interior"
  },
  "15": {
    "name": "Estación de Subterráneo",
    "exportDir": 52,
    "export": "Exportado_level52",
    "assembled": "level52_Ensamblado.png",
    "lighting": "interior"
  },
  "16": {
    "name": "Ayuntamiento de la Gran Ciudad",
    "exportDir": 49,
    "export": "Exportado_level49",
    "assembled": "level49_Ensamblado.png",
    "lighting": "interior"
  },
  "17": {
    "name": "Salida de la Ciudad",
    "exportDir": 50,
    "export": "Exportado_level50",
    "assembled": "level50_Ensamblado.png",
    "lighting": "exterior"
  },
  "18": {
    "name": "El Agujero (The Hole)",
    "exportDir": 51,
    "export": "Exportado_level51",
    "assembled": "level51_Ensamblado.png",
    "lighting": "exterior"
  },
  "19": {
    "name": "Hotel Cápsula",
    "exportDir": 53,
    "export": "Exportado_level53",
    "assembled": "level53_Ensamblado.png",
    "lighting": "interior"
  },
  "20": {
    "name": "Lobby de Apartamentos",
    "exportDir": 54,
    "export": "Exportado_level54",
    "assembled": "level54_Ensamblado.png",
    "lighting": "interior"
  },
  "21": {
    "name": "Bar La Cuerva (The Raven)",
    "exportDir": 55,
    "export": "Exportado_level55",
    "assembled": "level55_Ensamblado.png",
    "lighting": "interior"
  },
  "22": {
    "name": "Penthouse de la Ciudad",
    "exportDir": 58,
    "export": "Exportado_level58",
    "assembled": "level58_Ensamblado.png",
    "lighting": "interior"
  },
  "23": {
    "name": "Centro Comercial",
    "exportDir": 59,
    "export": "Exportado_level59",
    "assembled": "level59_Ensamblado.png",
    "lighting": "interior"
  },
  "24": {
    "name": "Entrada al Centro Comercial",
    "exportDir": 60,
    "export": "Exportado_level60",
    "assembled": "level60_Ensamblado.png",
    "lighting": "exterior"
  },
  "25": {
    "name": "Tienda de Alfombras",
    "exportDir": 61,
    "export": "Exportado_level61",
    "assembled": "level61_Ensamblado.png",
    "lighting": "interior"
  },
  "26": {
    "name": "Vinatería",
    "exportDir": 62,
    "export": "Exportado_level62",
    "assembled": "level62_Ensamblado.png",
    "lighting": "interior"
  },
  "27": {
    "name": "Heladería",
    "exportDir": 63,
    "export": "Exportado_level63",
    "assembled": "level63_Ensamblado.png",
    "lighting": "interior"
  },
  "28": {
    "name": "Joyería",
    "exportDir": 64,
    "export": "Exportado_level64",
    "assembled": "level64_Ensamblado.png",
    "lighting": "interior"
  },
  "29": {
    "name": "Oficina de Correos",
    "exportDir": 69,
    "export": "Exportado_level69",
    "assembled": "level69_Ensamblado.png",
    "lighting": "interior"
  },
  "30": {
    "name": "Tienda de Bubble Tea",
    "exportDir": 65,
    "export": "Exportado_level65",
    "assembled": "level65_Ensamblado.png",
    "lighting": "interior"
  },
  "31": {
    "name": "Zapatería",
    "exportDir": 66,
    "export": "Exportado_level66",
    "assembled": "level66_Ensamblado.png",
    "lighting": "interior"
  },
  "32": {
    "name": "Estación de Policía",
    "exportDir": 67,
    "export": "Exportado_level67",
    "assembled": "level67_Ensamblado.png",
    "lighting": "interior"
  },
  "33": {
    "name": "Cafetería",
    "exportDir": 68,
    "export": "Exportado_level68",
    "assembled": "level68_Ensamblado.png",
    "lighting": "interior"
  },
  "34": {
    "name": "Apartamento de la Ciudad",
    "exportDir": 70,
    "export": "Exportado_level70",
    "assembled": "level70_Ensamblado.png",
    "lighting": "interior"
  },
  "39": {
    "name": "Ático de Ensueño (Homecoming 3er Piso)",
    "exportDir": 39,
    "export": "Exportado_level39",
    "assembled": "level39_Ensamblado.png",
    "lighting": "interior"
  }
};
