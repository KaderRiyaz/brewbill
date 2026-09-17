/* db.js — thin IndexedDB wrapper for BrewBill
 * Stores:
 *   products     { id, name, category, description, variants:[{name, price}], createdAt, updatedAt }
 *   orders       { id, items:[{productId, name, variant, price, qty}], subtotal, discount, discountType,
 *                  tax, taxRate, total, createdAt }
 *   transactions { id, type: 'income' | 'expense', category, amount, note, date, source: 'order' | 'manual', orderId? }
 *   settings     { id: 'app', taxRate, shopName, currency }
 */
const DB_NAME = "brewbill";
const DB_VERSION = 1;
let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("products")) {
        const s = db.createObjectStore("products", { keyPath: "id" });
        s.createIndex("category", "category", { unique: false });
        s.createIndex("name", "name", { unique: false });
      }
      if (!db.objectStoreNames.contains("orders")) {
        const s = db.createObjectStore("orders", { keyPath: "id" });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("transactions")) {
        const s = db.createObjectStore("transactions", { keyPath: "id" });
        s.createIndex("date", "date", { unique: false });
        s.createIndex("type", "type", { unique: false });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function tx(storeName, mode = "readonly") {
  return openDB().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DB = {
  uid,

  async put(storeName, record) {
    const store = await tx(storeName, "readwrite");
    return reqToPromise(store.put(record));
  },

  async get(storeName, id) {
    const store = await tx(storeName);
    return reqToPromise(store.get(id));
  },

  async getAll(storeName) {
    const store = await tx(storeName);
    return reqToPromise(store.getAll());
  },

  async delete(storeName, id) {
    const store = await tx(storeName, "readwrite");
    return reqToPromise(store.delete(id));
  },

  async clear(storeName) {
    const store = await tx(storeName, "readwrite");
    return reqToPromise(store.clear());
  },

  async bulkPut(storeName, records) {
    const store = await tx(storeName, "readwrite");
    return Promise.all(records.map((r) => reqToPromise(store.put(r))));
  },

  async getSettings() {
    const s = await DB.get("settings", "app");
    return s || { id: "app", taxRate: 5, shopName: "My Coffee Shop", currency: "₹" };
  },

  async saveSettings(settings) {
    return DB.put("settings", { id: "app", ...settings });
  },
};
