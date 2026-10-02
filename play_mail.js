// play_mail.js — el buzón: abrir las cartas y quedarse con lo que traen.
//
// QUÉ FALTABA, Y QUÉ NO
// ---------------------
// Los datos llevaban tiempo leídos. `parser.getLetters()` saca cada carta con lo que
// importa —si está abierta, si está leída, cuántas zanahorias trae y qué objetos— y
// `setLetterRead()` escribe. Lo que no había era el mueble: en el juego el correo no es
// una pantalla del menú, es un `MailboxFurniture` que se TOCA.
//
//     public class MailboxFurniture : GridFurnitureObject<...> {
//         public override void QuickTap() { }      // abre el sobre
//     }
//
// Y dentro, `Envelope : TsukiPopup` con su `LetterDisplay`: el sobre se abre, la carta
// sube y se lee. Aquí la animación del sobre no se reproduce —es una pantalla de UI de
// Unity, no un sprite de escena— pero sí todo lo que cambia la partida.
//
// LO QUE GUARDA UNA CARTA
// -----------------------
//     public class LetterSave { List<BaseLetter> letters; long uniqueOrders; int[] lastOrders; }
//     public class ScriptedLetter { CharEnum character; StringT letterText;
//                                   ItemInventorySlot[] slots; int carrots; int ID; }
//
// O sea: cada carta puede traer objetos (`slots`) y zanahorias (`carrotReward`). Recoger
// una carta es meter esos objetos en el inventario, sumar las zanahorias y VACIAR los
// huecos, para que no se pueda recoger dos veces.
//
// POR QUÉ SE VACÍAN LOS HUECOS Y NO SE MARCA UN BOOLEANO
// ------------------------------------------------------
// Porque es lo que mira el juego. `slotsToClaim` con cosas dentro es una carta con premio
// pendiente; sin nada dentro, ya está cobrada. No hay un `claimed` aparte que poner a
// true, así que inventarse uno sería escribir en el save un campo que el juego no lee.

(function (global) {
    'use strict';

    // El mueble, en el catálogo del port: `Buzón / Mailbox`.
    const MUEBLE_BUZON = 1622;

    function parser() {
        return (global.app && global.app.parser) || global.currentSaveParser || global._currentParser;
    }

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function esBuzon(placement) {
        if (!placement) return false;
        const id = Number(placement.item_id != null ? placement.item_id : placement.itemId);
        return id === MUEBLE_BUZON;
    }

    /** Las cartas del save, con lo que hace falta para enseñarlas. */
    function cartas() {
        const p = parser();
        if (!p || typeof p.getLetters !== 'function') return [];
        return p.getLetters().map(c => Object.assign({}, c, {
            pendiente: !c.read,
            conPremio: ((c.slots || []).length > 0) || (Number(c.carrotReward) > 0),
        }));
    }

    function sinLeer() { return cartas().filter(c => !c.read).length; }

    /**
     * `MailboxFurniture.QuickTap()`: abrir el sobre.
     *
     * Marca la carta como leída, que es lo que quita el aviso del buzón.
     */
    function abrir(indice) {
        const p = parser();
        if (!p || typeof p.setLetterRead !== 'function') return false;
        const ok = p.setLetterRead(indice, true);
        if (ok && global.PlaySfx) global.PlaySfx.sonar('mailboxOpen');
        return !!ok;
    }

    /**
     * Quedarse con lo que trae la carta.
     *
     * Los objetos van al inventario por el mismo camino que cualquier otro —
     * `parser.addItemToInventory`, que ya calcula el `verificationID`— y las zanahorias
     * se suman a `carrots`. Después se vacían los huecos: eso es lo que marca en el juego
     * que la carta ya está cobrada.
     *
     * Devuelve qué se ha recogido, para poder enseñarlo.
     */
    function recoger(indice) {
        const p = parser();
        const lista = cartas();
        const c = lista[indice];
        if (!p || !c) return { ok: false, motivo: 'esa carta no está' };
        if (!c.conPremio) return { ok: false, motivo: 'esa carta no trae nada' };

        const objetos = [];
        let fallos = 0;
        for (const s of (c.slots || [])) {
            const id = Number(s.id), qty = Number(s.qty) || 1;
            if (!(id > 0)) continue;
            // `injectInventoryItem(id, cantidad, oculto, invType)` es el camino que ya
            // usa el editor: apila si el objeto ya está y calcula el `verificationID`.
            let puesto = false;
            try {
                if (typeof p.injectInventoryItem === 'function') {
                    p.injectInventoryItem(id, qty, false,
                        Number(s.invType != null ? s.invType : 1));
                    puesto = true;
                }
            } catch (e) { puesto = false; }
            if (puesto) objetos.push({ id: id, qty: qty });
            else fallos++;
        }

        // Las zanahorias. `CarrotHandler.AddCarrots(int)` es una suma sin más: no hay
        // tope ni multiplicador.
        let zanahorias = 0;
        const premio = Number(c.carrotReward) || 0;
        if (premio > 0 && typeof p.writeGeneralVar === 'function') {
            const ahora = (p.generalVars && p.generalVars.carrots)
                ? Number(p.generalVars.carrots.value) : 0;
            if (p.writeGeneralVar('carrots', ahora + premio)) zanahorias = premio;
        }

        // Y se vacía lo cobrado, que es como el juego sabe que ya está.
        if (typeof p.vaciarHuecosDeCarta === 'function') {
            p.vaciarHuecosDeCarta(indice);
        } else {
            // Sin ayuda del parser se hace a mano sobre los nodos que ya trae cada hueco.
            for (const s of (c.slots || [])) {
                if (s.idNode) s.idNode.value = 0;
                if (s.qtyNode) s.qtyNode.value = 0;
            }
        }
        if (premio > 0 && c.carrotRewardNode) c.carrotRewardNode.value = 0;

        abrir(indice);
        if (global.PlaySfx) global.PlaySfx.sonar('bagReceiveItem');
        return { ok: true, objetos: objetos, zanahorias: zanahorias, fallos: fallos };
    }

    function icono(clave) {
        return '<img src="' + prefijo() + 'images/icons/bubbles/' + clave + '.png" alt="" '
             + 'style="width:22px;height:22px;object-fit:contain;'
             + 'filter:invert(22%) sepia(12%) saturate(600%) hue-rotate(185deg);">';
    }

    function nombreDe(id) {
        const db = global.ITEMS_DB || global.itemsDb;
        const it = db && (db[String(id)] || (Array.isArray(db) && db.find(x => x && x.id === id)));
        return (it && (it.item_name || it.name_es || it.name_en)) || ('objeto ' + id);
    }

    /**
     * Toque sobre el buzón. Devuelve true si se ha atendido.
     *
     * Mismo camino que el reproductor de casetes: el mueble lo encuentra `map.js` con
     * `_findPlacementAtScreen(..., true)` y aquí sólo se mira si es el buzón.
     */
    function intentarToque(placement, screenX, screenY) {
        if (!esBuzon(placement)) return false;
        const lista = cartas();
        const acciones = [];

        if (!lista.length) {
            acciones.push({
                type: 'mailEmpty',
                // No hay icono de sobre en el juego: los de burbuja son los que son.
                // `document` es el más cercano a una carta, y `items` a un paquete.
                icon: icono('document'),
                label: 'El buzón está vacío',
                onClick: () => {},
            });
        } else {
            lista.forEach((c, i) => {
                const marca = c.read ? '' : ' •';
                const premio = c.conPremio
                    ? (' — ' + [(c.slots || []).length ? (c.slots.length + ' objeto'
                        + (c.slots.length > 1 ? 's' : '')) : null,
                        Number(c.carrotReward) > 0 ? (c.carrotReward + ' zanahorias') : null]
                        .filter(Boolean).join(' y '))
                    : '';
                acciones.push({
                    type: 'mailLetter',
                    icon: icono(c.conPremio ? 'items' : 'document'),
                    label: 'Carta ' + (i + 1) + marca + premio,
                    onClick: () => {
                        if (c.conPremio) {
                            const r = recoger(i);
                            if (r.ok && global.app && global.app.showToast) {
                                const q = r.objetos.map(o => nombreDe(o.id)
                                    + (o.qty > 1 ? (' ×' + o.qty) : '')).join(', ');
                                global.app.showToast('Recogido: '
                                    + [q, r.zanahorias ? (r.zanahorias + ' zanahorias') : null]
                                        .filter(Boolean).join(' y '));
                            }
                        } else {
                            abrir(i);
                            if (global.app && global.app.showToast) {
                                global.app.showToast('Carta leída');
                            }
                        }
                        if (global.app && global.app.parseData) global.app.parseData();
                        if (global.app && global.app.map) global.app.map.draw();
                    },
                });
            });
        }

        // La ventana de verdad es `Mailbox`, no un menu de burbujas: si esta montada,
        // se abre esa. El menu se queda de respaldo por si `play_mail_ui.js` no carga.
        if (global.PlayMailUI && typeof global.PlayMailUI.abrirBuzon === 'function') {
            global.PlayMailUI.abrirBuzon();
            return true;
        }

        if (global.BubbleSystem) {
            global.BubbleSystem.showBubbles({
                npcId: 'mailbox',
                npcName: 'Buzón',
                screenX: screenX, screenY: screenY,
                customActions: acciones,
            });
            return true;
        }
        return false;
    }

    global.PlayMail = {
        MUEBLE_BUZON: MUEBLE_BUZON,
        esBuzon: esBuzon,
        cartas: cartas,
        sinLeer: sinLeer,
        abrir: abrir,
        recoger: recoger,
        intentarToque: intentarToque,
    };
})(typeof window !== 'undefined' ? window : globalThis);
