import * as localforage from 'localforage';

export class Storage {
    private storageKey = '_data';
    private data: {[key: string]: string} = {};
    private _serializer: LocalForageSerializer;
    async init() {
        (window as any).localforage = {
            clear: () => {
                localforage.clear();
            }
        };

        this._serializer = await localforage.getSerializer();
        try {
            const data = await localforage.getItem<string | undefined>(this.storageKey);
            this.data = data ? JSON.parse(data) : {};
        } catch (error) {
            console.error(error);
        }
    }
    async setItem(key: string, data: any) {
        return new Promise<void>((resolve, reject) => {
            this._serializer.serialize(data, (value, error) => {
                if (error) {
                    return reject(error);
                }
                resolve();
                this.data[key] = value;
                this.save();
            });
        });
    }
    getItem<T>(key: string) {
        if (this.data[key]) {
            return this._serializer.deserialize<T>(this.data[key]);
        }
        return undefined;
    }
    deleteItem(key: string) {
        delete this.data[key];
        this.save();
    }
    putRaw(data: any) {
        this.data = JSON.parse(data);
    }
    async getRaw() {
        return JSON.stringify(this.data);
    }
    get serializer() {
        return this._serializer;
    }
    private async save() {
        if (Object.keys(this.data).length) {
            await localforage.setItem(this.storageKey, JSON.stringify(this.data));
        } else {
            await localforage.removeItem(this.storageKey);
        }
    }
}
