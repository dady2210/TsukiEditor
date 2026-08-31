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
  F(0, 0, 16, 16, { x: 1241.8627766640973, y: 1976.5599626258365 }, { mask: "mask_floor_0.png", exportDir: 2, assembled: "level2_Ensamblado.png" }),
  F(0, 1, 14, 14, { x: 1241.3778650761362, y: 1377.8195246607497 }, { mask: "mask_floor_1.png", exportDir: 2, assembled: "level2_Ensamblado.png" }),
  F(0, 2, 14, 14, { x: 329, y: 86 }, { cell: { w: 64, h: 32 }, homecoming_only: true }),
  // exterior árbol / jardín (save tenía items en g4 y g5)
  F(0, 4, 16, 16, { x: 900, y: 2200 }, { outdoor: true, comment: "TODO alinear exterior g4" }),
  F(0, 5, 12, 12, { x: 1600, y: 2200 }, { outdoor: true, comment: "TODO alinear exterior g5" }),

  W(0, 0, true,  16, 16, { x: 517.586070316604,  y: 1736.7251352113876 }, { mask: "mask_wallL_0.png", exportDir: 2, assembled: "level2_Ensamblado.png" }),
  W(0, 0, false, 16, 16, { x: 1900.8886116872663, y: 1709.2945966576285 }, { mask: "mask_wallR_0.png", exportDir: 2, assembled: "level2_Ensamblado.png" }),
  W(0, 1, true,  14, 16, { x: 695.5865991721795, y: 1121.399760052171 }, { mask: "mask_wallL_1.png", exportDir: 2, assembled: "level2_Ensamblado.png" }),
  W(0, 1, false, 14, 16, { x: 1878.8955153318568, y: 1174.4446804489417 }, { mask: "mask_wallR_1.png", exportDir: 2, assembled: "level2_Ensamblado.png" }),
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
  0: { name: "Home", exportDir: 2, export: "Exportado_level2", assembled: "level2_Ensamblado.png", lighting: "interior" },
  2: { name: "ChisHouse", exportDir: null, assembled: null, lighting: "interior", comment: "humano completa exportDir+assembled tras ingest_map" },
  3: { name: "MocasHouse", exportDir: null, assembled: null, lighting: "interior", comment: "humano completa exportDir+assembled tras ingest_map" },
  4: { name: "Pier", exportDir: null, assembled: null, lighting: "exterior", comment: "humano completa exportDir+assembled tras ingest_map" },
  6: { name: "Farm", exportDir: 4, export: "Exportado_level4", assembled: "level4_Ensamblado.png", lighting: "exterior" },
  8: { name: "TownHall", exportDir: null, assembled: null, lighting: "interior", comment: "humano completa exportDir+assembled tras ingest_map" }
};
