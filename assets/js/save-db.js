(() => {
  'use strict';

  const DB_NAME = 'otthos-life-world';
  const DB_VERSION = 2;
  const STORE = 'profiles';
  const MAIN = 'main';
  const BACKUP_1 = 'backup-1';
  const BACKUP_2 = 'backup-2';

  function cleanData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB indisponível'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'slot' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Falha ao abrir IndexedDB'));
    });
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Falha na operação IndexedDB'));
    });
  }

  async function readSlot(slot) {
    const db = await openDB();
    try {
      const tx = db.transaction(STORE, 'readonly');
      return await requestResult(tx.objectStore(STORE).get(slot));
    } finally {
      db.close();
    }
  }

  async function load() {
    for (const slot of [MAIN, BACKUP_1, BACKUP_2]) {
      try {
        const record = await readSlot(slot);
        if (record?.data?.profile) return cleanData(record.data);
      } catch (error) {
        console.warn(`Falha lendo ${slot}`, error);
      }
    }
    return null;
  }

  async function save(data) {
    const payload = cleanData(data);
    const previousMain = await readSlot(MAIN).catch(() => null);
    const previousBackup = await readSlot(BACKUP_1).catch(() => null);
    const db = await openDB();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        if (previousBackup?.data) store.put({ ...previousBackup, slot: BACKUP_2 });
        if (previousMain?.data) store.put({ ...previousMain, slot: BACKUP_1 });
        store.put({ slot: MAIN, data: payload, savedAt: Date.now(), schema: 610 });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Falha ao salvar progresso'));
        tx.onabort = () => reject(tx.error || new Error('Salvamento cancelado'));
      });
      return true;
    } finally {
      db.close();
    }
  }


  async function clear() {
    const db = await openDB();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        [MAIN, BACKUP_1, BACKUP_2].forEach(slot => store.delete(slot));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Falha ao limpar progresso'));
      });
      return true;
    } finally {
      db.close();
    }
  }

  async function exportFile(data) {
    const payload = {
      product: 'Otthos Life World',
      schema: 610,
      exportedAt: new Date().toISOString(),
      data: cleanData(data)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otthos-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function importFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || ''));
          const data = parsed?.data || parsed;
          if (!data || typeof data !== 'object' || !data.profile) throw new Error('Arquivo de progresso inválido');
          resolve(data);
        } catch (error) { reject(error); }
      };
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo'));
      reader.readAsText(file);
    });
  }

  async function requestPersistentStorage() {
    try {
      if (!navigator.storage?.persist) return false;
      return await navigator.storage.persist();
    } catch { return false; }
  }

  async function status() {
    let persisted = false;
    try { persisted = !!(await navigator.storage?.persisted?.()); } catch {}
    const main = await readSlot(MAIN).catch(() => null);
    return { database: DB_NAME, schema: 610, persisted, savedAt: main?.savedAt || 0, backups: 2 };
  }

  window.OTTHOS_DB = Object.freeze({
    name: DB_NAME,
    schema: 610,
    load,
    save,
    clear,
    exportFile,
    importFile,
    requestPersistentStorage,
    status
  });
})();
