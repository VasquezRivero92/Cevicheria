import fs from 'fs';
import path from 'path';

export interface LocalDbData {
  branches: Record<string, any>;
  users: Record<string, any>;
  categories: Record<string, any>;
  products: Record<string, any>;
  branch_configs: Record<string, any>;
  orders: Record<string, any>;
}

export class LocalJsonDb {
  private static instance: LocalJsonDb;
  private filePath: string;
  private data: LocalDbData = {
    branches: {},
    users: {},
    categories: {},
    products: {},
    branch_configs: {},
    orders: {}
  };
  private isLoaded = false;
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'cevicheria_db.json');
    this.load();
  }

  public static getInstance(): LocalJsonDb {
    if (!LocalJsonDb.instance) {
      LocalJsonDb.instance = new LocalJsonDb();
    }
    return LocalJsonDb.instance;
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.persistSync();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error cargando base de datos local:', err);
      this.persistSync();
    }
  }

  private persistSync(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  private async persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    });
    return this.writeQueue;
  }

  // Colecciones equivalentes a Firestore
  public async getCollection<T = any>(collectionName: keyof LocalDbData): Promise<T[]> {
    const coll = this.data[collectionName] || {};
    return Object.values(coll);
  }

  public async getDocument<T = any>(collectionName: keyof LocalDbData, id: string): Promise<T | null> {
    const coll = this.data[collectionName] || {};
    return coll[id] ? ({ ...coll[id] } as T) : null;
  }

  public async setDocument<T extends { id: string }>(collectionName: keyof LocalDbData, doc: T): Promise<T> {
    if (!this.data[collectionName]) {
      this.data[collectionName] = {};
    }
    this.data[collectionName][doc.id] = { ...doc };
    await this.persist();
    return { ...doc };
  }

  public async updateDocument<T = any>(collectionName: keyof LocalDbData, id: string, updates: Partial<T>): Promise<T | null> {
    const coll = this.data[collectionName];
    if (!coll || !coll[id]) return null;

    coll[id] = { ...coll[id], ...updates, updatedAt: new Date().toISOString() };
    await this.persist();
    return { ...coll[id] };
  }

  public async deleteDocument(collectionName: keyof LocalDbData, id: string): Promise<boolean> {
    const coll = this.data[collectionName];
    if (!coll || !coll[id]) return false;

    delete coll[id];
    await this.persist();
    return true;
  }

  public async queryCollection<T = any>(
    collectionName: keyof LocalDbData,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    const all = await this.getCollection<T>(collectionName);
    return all.filter(predicate);
  }

  public isInitialized(): boolean {
    return Object.keys(this.data.branches).length > 0;
  }
}
