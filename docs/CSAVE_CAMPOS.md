# Diccionario de Campos del `.csave` (OdinSerializer AST)

Esta tabla documenta todos los campos o nodos detectados actualmente por `parser.js`, indicando si tienen soporte de escritura (writer) y si son estrictamente necesarios para la **Fase W0** (jugar en la casa de Tsuki).

**Aclaraciones (Casa Jugable):**
- La casa corresponde a `SLocation 0`.
- El tercer piso no es un `sublocation` distinto, sino que corresponde al `groupNum 2` dentro de `SLocation 0` y se habilita validando `homecomingUpdates` o `currSLocData`.
- Hueco conocido: `harvestTimeOA` (control del tiempo de cosecha en granja) no está mapeado actualmente como objeto modificable en el JSON; queda preservado tal cual. No bloquea W1 ya que la granja está excluida.

| Campo (Lógico) | Ruta Típica en AST / Tipo | Escritura Soportada | Requerido Casa (W1) | Notas / Funcionalidad |
| :--- | :--- | :---: | :---: | :--- |
| `carrots` | `generalVars` (NamedInt 0x17) | ✅ Sí | **Sí** | Esencial para comprar/comprobar economía en el UI. |
| `day`, `month`, `season`, `hour` | `generalVars` (NamedInt 0x17) | ✅ Sí | **Sí** | Controlan el reloj/apariencia global de la partida (roundtrip). |
| `inventory` | `inventory` (OdinList) | ✅ Sí | **Sí** | Atributos clave: id, qty, invType, verificationID. |
| `placements` | `sublocations[id=0].furniture` (OdinList) | ✅ Sí | **Sí** | Atributos clave: item id, x, y, rot, pared/flipped/groupNum, placement_id. |
| `wallpapers` | `sublocations[0].wallpapers` (OdinList)| ✅ Sí | **Sí** | IDs de texturas de pared aplicadas. |
| `floors` | `sublocations[0].floors` (OdinList) | ✅ Sí | **Sí** | IDs de texturas de piso aplicadas. |
| `currSLocData` | `sublocations[0].currSLocData` | ✅ Sí | **Sí** | Metadata / estado adicional atado a la casa en particular. |
| `homecomingUpdates` | `generalVars` (NamedInt 0x17) | ✅ Sí | **Sí** | Necesario para validar si el piso 3 está disponible. |
| `locationsOnPhone` | `locationsOnPhone` (Node) | ✅ Sí | No | Lugares desbloqueados en el mapa (Farm, Town, etc). |
| `startBedtime`, `endBedtime` | `generalVars` (NamedFloat 0x1f)| ✅ Sí | No | Horarios de sueño de Tsuki. |
| `tempTimers` | `tempTimers` (OdinList) | ✅ Sí | No | Minutos activos / StartTime de buffs o eventos temporales. |
| `liminalNPCSaves` | `liminalNPCSaves` (OdinList) | ✅ Sí | No | Nivel de amistad / estado de Chi, Moca, Benny, etc. |
| `villageEventSaves`| `villageEventSaves` (OdinList) | ✅ Sí | No | Progreso de las misiones (quests) diarias/globales. |
| `trainSave` | `trainSave` (Node) | ✅ Sí | No | Configuración del tren, NPCs a bordo y viaje a la ciudad. |
| `bountySave` | (Stubs en código) | ❌ Solo Lectura | No | Pesca especial diaria. |
| `parsnapSave` | (Stubs en código) | ❌ Solo Lectura | No | Fotos tomadas para la red social. |
| `cropBoxSave` | (Stubs en código) | ❌ Solo Lectura | No | Fertilizante / Estado de las cajas de cosecha. |
| `deliverySave` | (Stubs en código) | ❌ Solo Lectura | No | Entregas de muebles de Dawn/Yori. |
| `gachaRolled`, `fishCaught` | `generalVars` (NamedInt 0x17) | ✅ Sí | No | Estadísticas del jugador. |

*Nota: Cualquier nodo "desconocido" o no mapeado explícitamente se lee y se escribe exactamente como estaba sin corromperse, debido a la naturaleza de reensamblado íntegro del parser AST.*
