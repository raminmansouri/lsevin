// Shared by the worker and the signed-in client. No session tokens are stored.
(() => {
  const DB = "lsevin-private-view-v1";
  const CACHE = "lsevin-pwa-private-view-v2";
  const ttl = 24 * 60 * 60 * 1000;
  async function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("keys");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function key(create = false, owner) {
    const candidate = create
      ? await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"]
        )
      : null;
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("keys", create ? "readwrite" : "readonly");
        const store = tx.objectStore("keys");
        let value;
        const get = store.get("device");
        get.onsuccess = () => {
          value =
            get.result || (candidate ? { cryptoKey: candidate, owner } : null);
          if (!get.result && value) store.put(value, "device");
        };
        tx.oncomplete = () => {
          if (value && value.owner !== owner)
            reject(new Error("AccountChanged"));
          else resolve(value?.cryptoKey || null);
        };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }
  async function clear() {
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction("keys", "readwrite");
        tx.objectStore("keys").clear();
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      await caches.delete(CACHE);
      if (typeof globalThis.clients?.matchAll === "function") {
        for (const client of await globalThis.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        }))
          client.postMessage({ type: "PRIVATE_VIEW_CLEARED" });
      } else
        globalThis.navigator?.serviceWorker?.controller?.postMessage({
          type: "PRIVATE_VIEW_CLEARED",
        });
    } finally {
      db.close();
    }
  }
  async function save(path, html, owner) {
    const deviceKey = await key(true, owner);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const savedAt = Date.now();
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: new TextEncoder().encode(
          JSON.stringify([owner, savedAt])
        ),
      },
      deviceKey,
      new TextEncoder().encode(html)
    );
    const record = {
      owner,
      savedAt,
      version: 2,
      iv: Array.from(iv),
      bytes: Array.from(new Uint8Array(ciphertext)),
    };
    await (
      await caches.open(CACHE)
    ).put(
      path,
      new Response(JSON.stringify(record), {
        headers: { "Content-Type": "application/json" },
      })
    );
  }
  async function read(path) {
    const response = await (await caches.open(CACHE)).match(path);
    if (!response) return null;
    const record = await response.json();
    if (Date.now() - record.savedAt > ttl) {
      await clear();
      return null;
    }
    const deviceKey = await key(false, record.owner);
    if (!deviceKey) return null;
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(record.iv),
        additionalData: new TextEncoder().encode(
          record.version === 2
            ? JSON.stringify([record.owner, record.savedAt])
            : record.owner
        ),
      },
      deviceKey,
      new Uint8Array(record.bytes)
    );
    let value = new TextDecoder().decode(plaintext);
    if (
      path.endsWith("/profile") &&
      !value.includes("data-lsevin-view-owner=")
    ) {
      const owner = record.owner.replace(
        /[&"<>]/g,
        (char) =>
          ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[char]
      );
      value = value.replace(
        /<html\b/,
        `<html data-lsevin-view-owner="${owner}" data-lsevin-view-until="${record.savedAt + ttl}"`
      );
    }
    return value;
  }
  async function checkOwner(owner) {
    try {
      await key(false, owner);
    } catch {
      await clear();
      return;
    }
    const cache = await caches.open(CACHE);
    for (const request of await cache.keys()) {
      const record = await (await cache.match(request)).json();
      if (record.owner !== owner) {
        await clear();
        return;
      }
    }
  }
  async function validOwner(path, owner) {
    const response = await (await caches.open(CACHE)).match(path);
    if (!response) return false;
    const record = await response.json();
    if (record.owner !== owner || Date.now() - record.savedAt > ttl)
      return false;
    try {
      return !!(await key(false, owner));
    } catch {
      return false;
    }
  }
  globalThis.LsevinViewStore = { save, read, clear, checkOwner, validOwner };
})();
