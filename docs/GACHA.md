# La máquina de gacha

Es el mueble **id 344, "GachaBoy"**, y en el Ayuntamiento la coloca el juego, no el
jugador: está en el layout fijo de la sublocation 8, celda (12,12) del piso g0, con
`canOverride: false`. Ver [MUEBLES_QUE_PONE_EL_JUEGO.md](MUEBLES_QUE_PONE_EL_JUEGO.md).

Hay una segunda versión, **id 1932 "Gachaboy SP"**, morada, que el jugador sí compra.

## Los sprites

Un solo atlas, `Gachaboy`, con 23 recortes. El reparto no se adivina: sale del propio
prefab, leyendo qué sprite referencia cada objeto.

| recorte | qué es | tamaño |
|---|---|---|
| `Gachaboy_0` | cuerpo de la máquina | 103×90, pivote (0.5, 0.292) |
| `Gachaboy_1` | tapa de cristal (va delante de las bolas) | 86×96, pivote (0.516, −0.206) |
| `Gachaboy_2` … `_11` | **10 fotogramas de bola normal** | ~27×27, pivote centrado |
| `Gachaboy_12` … `_21` | **10 fotogramas de bola dorada** | ~27×27 |
| `Gachaboy_22` | máquina rota | 38×33 |

Todos a 150 ppu, igual que el resto del mobiliario.

La SP usa `Gachagirl_0` (cuerpo), `Gachagirl_1` (tapa) y `GachaboySP_0` (rota).

```
python tools/extract_gacha.py    → images/gacha/*.png + data/gacha.json
```

## La animación: no hay AnimationClip

La máquina **no se anima con clips**. Es un sprite quieto; lo que se mueve son las
bolas, y se mueven **con física de verdad**:

- El prefab tiene **10 hijos `Ball`**, cada uno con `Rigidbody2D` + `CircleCollider2D`.
- El `PolygonCollider2D` de la raíz y el `boundingCollider` hacen de urna.
- `Gachapon.force = 10` es el impulso que se les aplica.
- `GachaBallObject.UpdateSprite(time)` va recorriendo `sprites[]` (o `goldenSprites[]`
  si la bola es dorada) según la velocidad: **el fotograma es la rotación de la bola**,
  no un ciclo por tiempo. Por eso son 10 recortes de la misma bola girada.

Los clips que sí existen —`GachaIn`, `GachaOpen`, `GachaOut`, `GachaIdle`,
`GachaBounce`, `GachaBounce2`, con el controlador `GachaBall`— están en
`sharedassets14.assets` y son de la **pantalla de premio**, no de la máquina del
Ayuntamiento. Esa pantalla es el nivel 14 (`GachaViewer`, `GachaBG`, `GachaSprite`,
`gachaLine` ×15).

## La lógica

Clase `Gachapon : GridFurnitureObject<GachaponItem, GachaponSave>`.

**Dos formas de tocarla**, como burbujas de interacción:

| burbuja | qué hace |
|---|---|
| `Gachapon.UseTicket` | gastar un Ticket de Gacha (item id 1) y sacar premio |
| `Gachapon.HitMachine` | **golpear la máquina** |

Golpearla lleva cuenta (`reactionCounter`, y `hits` en el save) y dispara
`bennyReaction`, un `DialogueGraph`: Benny te riñe. De ahí sale la actividad de NPC
**"Benny Gachaboy Abuse"** que está en los assets.

**El sorteo:**

```
Pull()
  └ RollGacha(bskin)
      ├ GetRarity()                     → Common / Rare / Epic / Legendary
      ├ GachaWithRarity(rarity, noDuplicates)
      └ GetBSkin(noDuplicates)          → variante de color
```

Los premios salen de `GachaData` (un ScriptableObject con `GachaSet[] gachaSets`). Cada
`Gacha` lleva `setID`, `ID`, `furnitureID`, `bSkinID`, `rarity` y sus dos sprites. Un
`GachaSet` puede tener `forcedDraw` y `forcedFirstGacha` — o sea, el primer tiro de una
colección está trucado para que te toque algo concreto.

**Otros métodos:**

- `RollBalls(legitDay, cts)` — reposición diaria de bolas. `legitDay` es para que
  cambiar la hora del móvil no dé tiros gratis.
- `GoldenAvailable()` — si queda bola dorada.
- `ThrowBalls()` / `CheckForEscapedBall()` — recolocan una bola que se escape de la urna.
- `BagFull(slot, token)` — qué pasa si el inventario está lleno al recoger.
- `SaveBalls()` — guarda la posición de cada bola.

**Lo que se guarda** (`GachaponSave : FurnitureSave`):

```
int  lastRolledDay
int  hits                       ← cuántas veces la has golpeado
GachaBall[] balls
   bool golden, bool used, Vector3 position
```

O sea: **la posición exacta de cada bola persiste en el csave**. Si dejas la partida a
medias, las bolas siguen donde estaban.

## El huevo que cae

Aparte de la máquina hay un `GachaponEgg`, y en el `level8` hay uno colocado en
(−27.39, 15.71). Es `SceneObject` con `Rigidbody2D`: cae, rueda, y `QuickTap()` →
`Collect()` lo recoge. Campos `eggID`, `active`, `fetchedGachapon`.

## Sonidos

`gachaRoll`, `gachaTap1`, `gachaTap2`, `gachaReveal`, `gachaRevealRare`,
`gachaBoyImpact` (al golpearla), `gachaBoyBreak` (al romperla). Todos en
`sharedassets1.assets`.

## Si se quiere portar al editor

Lo mínimo para que se vea: pintar `Gachaboy_0` en la celda (12,12) — o directamente
`images/items/FURN_344_0.png`, que ya estaba. Para que además se mueva harían falta
bolas con física 2D dentro del polígono, que es bastante más trabajo y solo se aprecia
de cerca.

## Ficheros

- `tools/extract_gacha.py`
- `images/gacha/` — 26 PNG
- `data/gacha.json` — reparto del atlas, datos de las dos máquinas, sonidos
