// patch_experimental.js
document.addEventListener("DOMContentLoaded", () => {
    let db = window.ITEMS_DB || {};
    let dbSize = Object.keys(db).length;
    
    if (dbSize > 0) {
        console.log(`[Experimental] Base de datos de items unificada cargada: ${dbSize} entradas.`);
    } else {
        console.warn("[Experimental] No se encontró ITEMS_DB. Asegúrate de incluir data/items_db.js en el HTML.");
    }

    const btnPreview = document.getElementById('btn-batch-preview');
    const btnInject = document.getElementById('btn-batch-inject');
    const container = document.getElementById('batch-preview-container');
    const countSpan = document.getElementById('batch-preview-count');
    
    let currentPreviewIds = [];

    if (btnPreview) {
        btnPreview.addEventListener('click', () => {
            const start = parseInt(document.getElementById('input-batch-start').value);
            const end = parseInt(document.getElementById('input-batch-end').value);
            
            if (isNaN(start) || isNaN(end) || start > end) {
                alert("Rango de IDs inválido.");
                return;
            }

            container.innerHTML = '';
            currentPreviewIds = [];

            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th style="width: 60px;">ID</th>
                        <th style="width: 80px;">Tipo</th>
                        <th>Nombre</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            let count = 0;
            for (let id = start; id <= end; id++) {
                count++;
                const itemEntry = db[id];
                let typeBadge = '';
                let name = '';

                if (itemEntry && (itemEntry.item_name || itemEntry.furn_name)) {
                    if (itemEntry.item_name && itemEntry.furn_name) {
                        typeBadge = `<span style="background:#9b59b6;color:white;padding:2px 6px;border-radius:4px;font-size:0.8em;">BOTH</span>`;
                        name = itemEntry.item_name; // Default to item name for BOTH display
                        currentPreviewIds.push({ id, type: 0 }); // ITEM
                        currentPreviewIds.push({ id, type: 1 }); // FURN
                    } else if (itemEntry.item_name) {
                        typeBadge = `<span style="background:#3498db;color:white;padding:2px 6px;border-radius:4px;font-size:0.8em;">ITEM</span>`;
                        name = itemEntry.item_name;
                        currentPreviewIds.push({ id, type: 0 }); // invType 0
                    } else if (itemEntry.furn_name) {
                        typeBadge = `<span style="background:#e67e22;color:white;padding:2px 6px;border-radius:4px;font-size:0.8em;">FURN</span>`;
                        name = itemEntry.furn_name;
                        currentPreviewIds.push({ id, type: 1 }); // invType 1
                    }
                } else {
                    const fallbackTypeEl = document.getElementById('input-batch-fallback-type');
                    const fallbackType = fallbackTypeEl ? parseInt(fallbackTypeEl.value) : 1;
                    const fallbackTypeBadge = fallbackType === 1 
                        ? `<span style="background:#e67e22;color:white;padding:2px 6px;border-radius:4px;font-size:0.8em;">FURN (Default)</span>`
                        : `<span style="background:#3498db;color:white;padding:2px 6px;border-radius:4px;font-size:0.8em;">ITEM (Default)</span>`;

                    typeBadge = fallbackTypeBadge;
                    name = 'Desconocido (No en BD)';
                    currentPreviewIds.push({ id, type: fallbackType });
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${id}</td>
                    <td>${typeBadge}</td>
                    <td>${name}</td>
                `;
                tbody.appendChild(tr);
            }

            container.appendChild(table);
            countSpan.textContent = `(${count} IDs, ${currentPreviewIds.length} slots)`;
        });
    }

    if (btnInject) {
        // Add Lost Items inject button
        const btnLost = document.createElement('button');
        btnLost.id = 'btn-batch-inject-lost';
        btnLost.className = 'btn-secondary';
        btnLost.style.flex = '1';
        btnLost.style.marginLeft = '10px';
        btnLost.style.backgroundColor = '#e74c3c';
        btnLost.style.color = 'white';
        btnLost.textContent = 'A Obj. Perdidos';
        btnInject.parentNode.appendChild(btnLost);

        btnLost.addEventListener('click', () => {
            if (!window.app || !window.app.parser) {
                alert("Por favor, carga un archivo .csave primero.");
                return;
            }
            if (currentPreviewIds.length === 0) {
                alert("Haz clic en Vista Previa primero para generar la lista de inyección.");
                return;
            }
            const qty = parseInt(document.getElementById('input-batch-qty').value) || 1;
            let injectedCount = 0;
            try {
                currentPreviewIds.forEach(entry => {
                    window.app.parser.injectLostItem(entry.id, qty, entry.type);
                    injectedCount++;
                });
                window.app.showToast(`📦 ${injectedCount} ítems enviados a Objetos Perdidos.`);
            } catch (e) {
                console.error(e);
                alert("Error al inyectar en Objetos Perdidos: " + e.message);
            }
        });

        btnInject.addEventListener('click', () => {
            if (!window.app || !window.app.parser) {
                alert("Por favor, carga un archivo .csave primero.");
                return;
            }

            if (currentPreviewIds.length === 0) {
                alert("Haz clic en Vista Previa primero para generar la lista de inyección.");
                return;
            }

            const qty = parseInt(document.getElementById('input-batch-qty').value) || 1;

            let injectedCount = 0;
            try {
                currentPreviewIds.forEach(entry => {
                    window.app.parser.injectInventoryItem(entry.id, qty, false, entry.type);
                    injectedCount++;
                });
                window.app.showToast(`✅ ${injectedCount} slots inyectados correctamente.`);
                if (window.app.renderInventory) {
                    window.app.renderInventory();
                }
            } catch (e) {
                console.error(e);
                alert("Error al inyectar: " + e.message);
            }
        });
    }
});
