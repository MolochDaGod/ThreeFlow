/**
 * IndexedDB helper
 */
export default class IndexDBUtil {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null;

  constructor(dbName: string, version: number = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  /**
   * open database
   * @param stores - object store
   * @returns whether init succeeded
   */
  async initDB(stores: { name: string; keyPath: string }[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store
        stores.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            console.log('Create object store', store.name, store.keyPath);
            db.createObjectStore(store.name, { keyPath: store.keyPath });
          }
        });
      };
    });
  }

  /**
   * add row
   * @param storeName - store name
   * @param data - data
   * @returns inserted row
   */
  async add<T>(storeName: string, data: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database is not initialized'));
        return;
      }
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => {
        reject(new Error('Failed to add data'));
      };
    });
  }

  /**
   * update row
   * @param storeName - store name
   * @param data - data
   * @returns updated row
   */
  async update<T>(storeName: string, data: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database is not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(new Error('Failed to update data'));
    });
  }

  /**
   * delete row
   * @param storeName - store name
   * @param key - key
   * @returns whether delete succeeded
   */
  async delete(storeName: string, key: string | number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database is not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to delete data'));
    });
  }

  /**
   * get one row
   * @param storeName - store name
   * @param key - key
   * @returns queried row
   */
  async get<T>(storeName: string, key: string | number): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database is not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(new Error('Failed to query data'));
    });
  }

  /**
   * list all rows
   * @param storeName - store name
   * @returns all rows
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database is not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to list all rows'));
    });
  }

  /**
   * clear object store
   * @param storeName - store name
   * @returns whether clear succeeded
   */
  async clear(storeName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database is not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to clear store'));
    });
  }
}
