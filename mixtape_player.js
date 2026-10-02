// mixtape_player.js — el reproductor de casetes, como funciona en el juego.
//
// QUÉ ES
// ------
// `MusicPlayer : GridFurnitureObject` es un MUEBLE, el objeto 406 ("Cassette Player").
// No es parte de la interfaz: está puesto en la sala como cualquier silla, y se toca.
//
// Al tocarlo, `AddExtraBubbles` le cuelga sus dos burbujas (`MusicPlayer.MusicBubble`):
//
//     PlayMusic    clave de icono "mixtape"   abre la selección de casetes
//     EjectMusic   clave de icono "eject"     saca el que haya puesto; sólo si hay uno
//
// `PlayMusic.Action` abre un `SingleSelection` sobre el inventario filtrado por
// `MixtapeFilter : TypeFilter<Mixtape>`, y lo que elijas va a `LoadMusic(slot, mp)` y de
// ahí a `mp.Play(ID)`, que escribe `MusicPlayerSave.musicID`.
//
// POR QUÉ EL FILTRO NO ES POR TIPO
// --------------------------------
// `Item.ItemType` es una MÁSCARA DE BITS —KeyItem, Hidden, Recyclable, Food, Fish, Toy,
// Tool, Book, Crop— y no tiene valor para casete. El juego filtra por CLASE. Como los
// `Item` no se pueden leer de los assets (no existen como ScriptableObjects sueltos), la
// lista equivalente se saca en `tools/extract_mixtapes.py` y vive en `data/mixtapes.json`.
//
// LOS ICONOS
// ----------
// Son los de verdad, exportados a `images/icons/bubbles/`. Son siluetas BLANCAS con
// alfa: el color se lo pone el juego en `SimpleIcon.color`, así que aquí se tiñen con un
// filtro CSS en vez de pintarlos tal cual, que se verían invisibles sobre el fondo claro
// de la burbuja.
//
// `PlayMusic` es seguro: su `IconKey` es `const string Key = "mixtape"`, escrito en la
// propia clase, y el sprite `mixtape` existe.
//
// `EjectMusic` NO. Su `get_IconKey` devuelve un literal del binario, y siguiendo la
// tabla de literales sale `"eject"` —cae justo en la ventana que dan las direcciones de
// los `get_IconKey` vecinos, y es lo que dice el nombre de la clase—. Pero NO HAY ningún
// sprite llamado `eject`: ni entre los 197 de las burbujas, ni entre los 3362 del bundle
// de iconos de objeto, ni entre las 207 claves del diccionario. Así que aquí se pone
// `delete`, que es un sustituto: hace de "quitar lo que hay puesto", que es lo que la
// acción hace, pero no es el icono del juego.
//
// QUÉ PASA CON LOS CASETES QUE NO TIENES
// --------------------------------------
// El juego sólo te deja elegir entre los que llevas encima. Aquí igual: se mira el
// inventario. Si no hay ninguno, la burbuja lo dice en vez de abrir una lista vacía.

(function (global) {
    'use strict';

    const ITEM_REPRODUCTOR = 406;

    let datos = null;            // data/mixtapes.json
    let cargando = null;

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (datos) return Promise.resolve(datos);
        if (cargando) return cargando;
        cargando = fetch(prefijo() + 'data/mixtapes.json')
            .then(r => (r.ok ? r.json() : { casetes: [] }))
            .then(j => {
                datos = { porItem: {}, lista: j.casetes || [] };
                for (const c of datos.lista) datos.porItem[String(c.itemId)] = c;
                return datos;
            })
            .catch(() => { datos = { porItem: {}, lista: [] }; return datos; });
        return cargando;
    }

    function parser() {
        return (global.app && global.app.parser) || global.currentSaveParser || global._currentParser;
    }

    /** ¿Ese mueble es un reproductor de casetes? */
    function esReproductor(p) {
        return !!p && Number(p.item_id) === ITEM_REPRODUCTOR;
    }

    /** El casete que tiene puesto ahora mismo, o null. */
    function caseteDe(placement) {
        if (!placement || !placement.furnNode) return null;
        const hijos = placement.furnNode.children || [];
        const fs = hijos.find(c => c.name === 'furnSave' || c.name === 'FurnSave');
        const nodo = (fs && fs.children) ? fs.children.find(c => c.name === 'musicID') : null;
        const id = nodo ? Number(nodo.value) : 0;
        if (!id) return null;
        return (datos && datos.porItem[String(id)]) || { itemId: id, nombre: 'Casete #' + id };
    }

    /**
     * Los casetes del catálogo, cada uno con si el jugador lo lleva encima o no.
     *
     * La LISTA QUE SE ENSEÑA sale de `enInventario`, y sólo de eso: el juego abre un
     * `SingleSelection` sobre el inventario filtrado por `MixtapeFilter`, así que lo que
     * no tienes no aparece. La primera versión los enseñaba todos, los que no tienes en
     * gris; era un catálogo, no un inventario.
     */
    function disponibles() {
        const p = parser();
        const tengo = new Set();
        if (p && Array.isArray(p.inventory)) {
            for (const s of p.inventory) {
                if (s && s.item_id > 0 && s.qty > 0) tengo.add(String(s.item_id));
            }
        }
        return (datos ? datos.lista : []).map(c => Object.assign({}, c, {
            enInventario: tengo.has(String(c.itemId)),
        }));
    }

    function icono(clave) {
        // Siluetas blancas: se invierten para que se vean sobre la burbuja clara.
        return '<img src="' + prefijo() + 'images/icons/bubbles/' + clave + '.png" alt="" '
             + 'style="width:22px;height:22px;object-fit:contain;'
             + 'filter:invert(22%) sepia(12%) saturate(600%) hue-rotate(185deg);">';
    }

    /** Pone o quita el casete y hace que suene el cambio. */
    function poner(placement, itemId) {
        const p = parser();
        if (p && typeof p.setMusicPlayerCassette === 'function') {
            p.setMusicPlayerCassette(placement.placementID, itemId || 0);
        }
        // Los efectos del juego: `cassetteLoad` al meterlo y `cassetteEject` al sacarlo.
        if (global.PlaySfx) global.PlaySfx.sonar(itemId ? 'cassetteLoad' : 'cassetteEject');
        if (global.MapMusic && typeof global.MapMusic.recargarSala === 'function') {
            global.MapMusic.recargarSala();
        }
        // La tapa del mueble cambia con el casete: cerrada con uno dentro, abierta y
        // vacía sin él. `getImage` cachea por clave, así que hay que tirar las suyas o
        // se seguiría viendo el estado anterior.
        const mapa = global.app && global.app.map;
        if (mapa && mapa._imgCache) {
            for (const k of Object.keys(mapa._imgCache)) {
                if (k.indexOf('CASETE_') === 0) delete mapa._imgCache[k];
            }
        }
        if (mapa && typeof mapa.draw === 'function') mapa.draw();
        const c = itemId ? (datos && datos.porItem[String(itemId)]) : null;
        if (global.showEditorNotification) {
            global.showEditorNotification(
                c ? ('♫ Suena "' + c.nombre + '"') : '⏏ Casete fuera',
                c ? '#7c3aed' : '#64748b');
        }
    }

    /** La lista de casetes, filtrada al inventario como hace el juego. */
    function abrirSeleccion(placement) {
        const previo = document.getElementById('tsuki-mixtape-modal');
        if (previo) previo.remove();

        // Sólo los que lleva encima. Es lo que hace el juego: `PlayMusic.Action` abre un
        // `SingleSelection` sobre el INVENTARIO filtrado, no sobre el catálogo.
        const lista = disponibles().filter(c => c.enInventario);
        const puesto = caseteDe(placement);
        const fondo = document.createElement('div');
        fondo.id = 'tsuki-mixtape-modal';
        fondo.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(15,23,42,.55);'
            + 'display:flex;align-items:center;justify-content:center;padding:20px;';

        const caja = document.createElement('div');
        caja.style.cssText = 'background:#fffdf7;border-radius:14px;max-width:460px;width:100%;'
            + 'max-height:78vh;display:flex;flex-direction:column;overflow:hidden;'
            + 'box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:inherit;';

        const cab = document.createElement('div');
        cab.style.cssText = 'padding:14px 16px;border-bottom:1px solid #e7e0d0;'
            + 'display:flex;align-items:center;gap:10px;';
        cab.innerHTML = icono('mixtape')
            + '<b style="font-size:15px;color:#3f3a2f;">Reproductor de Casetes</b>';
        const cerrar = document.createElement('button');
        cerrar.type = 'button';
        cerrar.textContent = '✕';
        cerrar.style.cssText = 'margin-left:auto;border:0;background:transparent;cursor:pointer;'
            + 'font-size:17px;color:#8a8170;';
        cerrar.onclick = () => {
            // `SFXClip.CassetteClose`.
            if (global.PlaySfx) global.PlaySfx.sonar('cassetteClose');
            fondo.remove();
        };
        cab.appendChild(cerrar);

        const cuerpo = document.createElement('div');
        cuerpo.style.cssText = 'overflow-y:auto;padding:8px;';

        if (lista.length === 0) {
            // Inventario vacío, sin más. Enseñar aquí el catálogo entero sería enseñar
            // algo que el juego no enseña.
            const aviso = document.createElement('div');
            aviso.style.cssText = 'padding:26px 16px;color:#8a8170;font-size:13px;'
                + 'line-height:1.6;text-align:center;';
            aviso.innerHTML = '<div style="font-size:26px;opacity:.5;">🎞️</div>'
                + 'No llevas ningún casete encima.';
            cuerpo.appendChild(aviso);
        }

        for (const c of lista) {
            const fila = document.createElement('button');
            fila.type = 'button';
            const activo = puesto && Number(puesto.itemId) === Number(c.itemId);
            fila.style.cssText = 'display:flex;width:100%;align-items:center;gap:10px;padding:9px 10px;'
                + 'border:0;border-radius:9px;margin-bottom:2px;text-align:left;cursor:pointer;'
                + 'background:' + (activo ? '#ede9fe' : 'transparent')
                + ';font-size:13px;color:#3f3a2f;';
            fila.onmouseenter = () => { if (!activo) fila.style.background = '#f4f1e6'; };
            fila.onmouseleave = () => { fila.style.background = activo ? '#ede9fe' : 'transparent'; };

            const img = document.createElement('img');
            img.src = prefijo() + 'images/items/ITEM_' + c.itemId + '.png';
            img.alt = '';
            img.style.cssText = 'width:30px;height:30px;object-fit:contain;flex:0 0 auto;';
            img.onerror = () => { img.style.visibility = 'hidden'; };

            const txt = document.createElement('div');
            txt.style.cssText = 'flex:1 1 auto;min-width:0;';
            const dur = c.segundos ? (Math.floor(c.segundos / 60) + ':'
                + String(Math.round(c.segundos % 60)).padStart(2, '0')) : '';
            txt.innerHTML = '<div style="font-weight:600;">'
                + (c.nombre_es || c.nombre) + (activo ? ' <span style="color:#7c3aed;">♫</span>' : '')
                + '</div><div style="font-size:11px;color:#8a8170;">'
                + (c.pista || '') + (dur ? ' · ' + dur : '') + '</div>';

            fila.appendChild(img);
            fila.appendChild(txt);
            fila.onclick = () => {
                poner(placement, c.itemId);
                fondo.remove();
            };
            cuerpo.appendChild(fila);
        }

        caja.appendChild(cab);
        caja.appendChild(cuerpo);
        fondo.appendChild(caja);
        fondo.onpointerdown = (e) => { if (e.target === fondo) fondo.remove(); };
        document.body.appendChild(fondo);
    }

    /**
     * Toque sobre un mueble. Devuelve true si era un reproductor y se ha atendido, para
     * que quien llame no siga con lo suyo.
     */
    function intentarToque(placement, screenX, screenY) {
        if (!esReproductor(placement)) return false;
        cargar().then(() => {
            const puesto = caseteDe(placement);
            const acciones = [{
                type: 'playMusic',
                icon: icono('mixtape'),
                label: puesto ? ('Cambiar casete (ahora: ' + puesto.nombre + ')') : 'Poner un casete',
                onClick: () => abrirSeleccion(placement),
            }];
            // `EjectMusic.Usable` sólo devuelve true si hay algo puesto.
            if (puesto) {
                acciones.push({
                    type: 'ejectMusic',
                    // Sustituto: no existe el sprite `eject`. Ver la cabecera.
                    icon: icono('delete'),
                    label: 'Sacar el casete',
                    onClick: () => poner(placement, 0),
                });
            }
            if (global.BubbleSystem) {
                global.BubbleSystem.showBubbles({
                    npcId: 'musicPlayer:' + placement.placementID,
                    npcName: 'Reproductor de Casetes',
                    screenX: screenX, screenY: screenY,
                    customActions: acciones,
                });
            } else {
                abrirSeleccion(placement);
            }
        });
        return true;
    }

    global.MixtapePlayer = {
        ITEM: ITEM_REPRODUCTOR,
        cargar: cargar,
        esReproductor: esReproductor,
        caseteDe: caseteDe,
        disponibles: disponibles,
        abrirSeleccion: abrirSeleccion,
        poner: poner,
        intentarToque: intentarToque,
    };

    document.addEventListener('DOMContentLoaded', () => { cargar(); });
})(window);
