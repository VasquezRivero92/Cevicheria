import fs from 'fs';
import path from 'path';
export class LocalJsonDb {
    static instance;
    filePath;
    data = {
        branches: {},
        users: {},
        categories: {},
        products: {},
        branch_configs: {},
        orders: {}
    };
    isLoaded = false;
    writeQueue = Promise.resolve();
    constructor() {
        const dataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.filePath = path.join(dataDir, 'cevicheria_db.json');
        this.load();
    }
    static getInstance() {
        if (!LocalJsonDb.instance) {
            LocalJsonDb.instance = new LocalJsonDb();
        }
        return LocalJsonDb.instance;
    }
    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, 'utf-8');
                this.data = JSON.parse(raw);
            }
            else {
                this.persistSync();
            }
            this.isLoaded = true;
        }
        catch (err) {
            console.error('Error cargando base de datos local:', err);
            this.persistSync();
        }
    }
    persistSync() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    }
    async persist() {
        this.writeQueue = this.writeQueue.then(async () => {
            await fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        });
        return this.writeQueue;
    }
    // Colecciones equivalentes a Firestore
    async getCollection(collectionName) {
        const coll = this.data[collectionName] || {};
        return Object.values(coll);
    }
    async getDocument(collectionName, id) {
        const coll = this.data[collectionName] || {};
        return coll[id] ? { ...coll[id] } : null;
    }
    async setDocument(collectionName, doc) {
        if (!this.data[collectionName]) {
            this.data[collectionName] = {};
        }
        this.data[collectionName][doc.id] = { ...doc };
        await this.persist();
        return { ...doc };
    }
    async updateDocument(collectionName, id, updates) {
        const coll = this.data[collectionName];
        if (!coll || !coll[id])
            return null;
        coll[id] = { ...coll[id], ...updates, updatedAt: new Date().toISOString() };
        await this.persist();
        return { ...coll[id] };
    }
    async deleteDocument(collectionName, id) {
        const coll = this.data[collectionName];
        if (!coll || !coll[id])
            return false;
        delete coll[id];
        await this.persist();
        return true;
    }
    async queryCollection(collectionName, predicate) {
        const all = await this.getCollection(collectionName);
        return all.filter(predicate);
    }
    isInitialized() {
        return Object.keys(this.data.branches).length > 0;
    }
}
