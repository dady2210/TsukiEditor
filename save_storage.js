// save_storage.js — Almacenamiento local persistente (IndexedDB) y File System Access API
// Permite guardar automáticamente el .csave en la caché local del navegador de forma silenciosa,
// evitando descargas repetitivas y permitiendo reanudar partidas tras F5 o cerrar la pestaña.

(function(global) {
  'use strict';

  const DB_NAME = 'tsuki_odyssey_cache_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'saves';
  const ACTIVE_KEY = 'active_session';

  let dbPromise = null;
  let activeFileHandle = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!global.indexedDB) {
        reject(new Error('IndexedDB no está disponible en este navegador.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
    return dbPromise;
  }

  const SaveStorage = {
    get supportsFileSystemAccess() {
      return typeof global.showOpenFilePicker === 'function';
    },

    get fileHandle() {
      return activeFileHandle;
    },

    set fileHandle(handle) {
      activeFileHandle = handle;
    },

    async openDirectFile() {
      if (!this.supportsFileSystemAccess) {
        throw new Error('La File System Access API no está disponible en este navegador.');
      }
      const [handle] = await global.showOpenFilePicker({
        multiple: false,
        types: [{
          description: "Archivo de Guardado Tsuki's Odyssey (*.csave)",
          accept: {
            'application/octet-stream': ['.csave']
          }
        }]
      });
      if (!handle) return null;
      activeFileHandle = handle;
      const file = await handle.getFile();
      return { file, fileHandle: handle };
    },

    async writeDirectFile(buffer) {
      if (!activeFileHandle) return false;
      try {
        const writable = await activeFileHandle.createWritable();
        await writable.write(buffer);
        await writable.close();
        return true;
      } catch (err) {
        console.warn('[SaveStorage] No se pudo escribir en el archivo directo:', err);
        return false;
      }
    },

    async saveToCache(buffer, fileName = 'save.csave', meta = {}) {
      if (!buffer) return false;
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const rawBuf = buffer instanceof ArrayBuffer ? buffer : (buffer.buffer ? buffer.buffer : buffer);

        const record = {
          id: ACTIVE_KEY,
          buffer: rawBuf,
          fileName: fileName || 'save.csave',
          meta: meta || {},
          timestamp: Date.now()
        };

        await new Promise((resolve, reject) => {
          const req = store.put(record);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });

        try {
          localStorage.setItem('tsuki_has_cache', '1');
          localStorage.setItem('tsuki_cache_summary', JSON.stringify({
            fileName: record.fileName,
            timestamp: record.timestamp,
            version: meta.version || null,
            carrots: meta.carrots != null ? meta.carrots : null,
            size: rawBuf.byteLength
          }));
        } catch (e) {}

        return true;
      } catch (err) {
        console.error('[SaveStorage] Error guardando en IndexedDB:', err);
        return false;
      }
    },

    async loadFromCache() {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        const record = await new Promise((resolve, reject) => {
          const req = store.get(ACTIVE_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });

        return record;
      } catch (err) {
        console.error('[SaveStorage] Error cargando desde IndexedDB:', err);
        return null;
      }
    },

    async hasCachedSave() {
      if (localStorage.getItem('tsuki_has_cache') !== '1') {
        return false;
      }
      const data = await this.loadFromCache();
      return !!(data && data.buffer && data.buffer.byteLength > 0);
    },

    getCacheSummary() {
      try {
        const str = localStorage.getItem('tsuki_cache_summary');
        return str ? JSON.parse(str) : null;
      } catch (e) {
        return null;
      }
    },

    async clearCache() {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve) => {
          const req = store.delete(ACTIVE_KEY);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
        localStorage.removeItem('tsuki_has_cache');
        localStorage.removeItem('tsuki_cache_summary');
        activeFileHandle = null;
        return true;
      } catch (err) {
        console.warn('[SaveStorage] Error limpiando caché:', err);
        return false;
      }
    },

    formatRelativeTime(ts) {
      if (!ts) return '';
      const diffSec = Math.floor((Date.now() - ts) / 1000);
      if (diffSec < 10) return 'hace un momento';
      if (diffSec < 60) return `hace ${diffSec} segundos`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      const date = new Date(ts);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  global.SaveStorage = SaveStorage;
  if (global.Castle) {
    global.Castle.Storage = SaveStorage;
  }
})(typeof window !== 'undefined' ? window : global);
