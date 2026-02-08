/**
 * 数据库工具类
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
   * 初始化数据库
   * @param stores - 对象仓库
   * @returns 是否初始化成功
   */
  async initDB(stores: { name: string; keyPath: string }[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('数据库打开失败'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象仓库
        stores.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
             console.log('创建对象仓库', store.name, store.keyPath);
            db.createObjectStore(store.name, { keyPath: store.keyPath });
          }
        });
      };
    });
  }

  /**
   * 添加数据
   * @param storeName - 对象仓库名称
   * @param data - 数据
   * @returns 添加的数据
   */
  async add<T>(storeName: string, data: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => {
        reject(new Error('添加数据失败'));
      };
    });
  }

  /**
   * 更新数据
   * @param storeName - 对象仓库名称
   * @param data - 数据
   * @returns 更新的数据
   */
  async update<T>(storeName: string, data: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(new Error('更新数据失败'));
    });
  }

  /**
   * 删除数据
   * @param storeName - 对象仓库名称
   * @param key - 数据键
   * @returns 是否删除成功
   */
  async delete(storeName: string, key: string | number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('删除数据失败'));
    });
  }

  /**
   * 查询单条数据
   * @param storeName - 对象仓库名称
   * @param key - 数据键
   * @returns 查询的数据
   */
  async get<T>(storeName: string, key: string | number): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(new Error('查询数据失败'));
    });
  }

  /**
   * 获取所有数据
   * @param storeName - 对象仓库名称
   * @returns 所有数据
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('获取所有数据失败'));
    });
  }

  /**
   * 清空对象仓库
   * @param storeName - 对象仓库名称
   * @returns 是否清空成功
   */
  async clear(storeName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('清空数据失败'));
    });
  }
}
