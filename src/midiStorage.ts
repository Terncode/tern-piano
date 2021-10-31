import { Storage } from './storage';

export interface MIDI {
    name: string;
    data: ArrayBuffer;
    base64: string;
}

export class MidiStorage {
    private _midis: MIDI[] = [];
    private input = document.createElement('input');
    private resolve = (any: any) => any;
    private reject = (any: any) => any;

    constructor(private storage: Storage) {
        this.input.textContent = 'Add midi';
        this.input.type = 'file';
        this.input.accept = '.midi, .mid';
        this.input.addEventListener('change', () => this.open());
    }

    async load() {
        return new Promise<void>((resolve, reject) => {
            this.reject = reject;
            this.resolve = resolve;
            this.input.click();
        });
    }

    async loadRaw(midi: MIDI[]) {
        this._midis = midi;

        for (const midi of this._midis) {
            midi.data = await this.storage.serializer.deserialize(midi.base64) as any;
        }
    }

    private open() {
        return new Promise<MIDI>((resolve, reject) => {
            const file = this.input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.addEventListener('load', async (e) => {
                this.input.value = null;
                const midi: MIDI = {
                    name: file.name,
                    data: e.target.result as ArrayBuffer,
                    base64: await new Promise((resolve, reject) => {
                        this.storage.serializer.serialize(e.target.result as ArrayBuffer, (value, err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(value);
                            }
                        });
                    })
                };
                this._midis.push(midi);
                this.resolve && this.resolve(midi);
                resolve(midi);
            });
            reader.addEventListener('error', (err) => {
                this.reject && this.reject(err);
                reject(err);
            });
            reader.readAsArrayBuffer(file);
        });
    }
    get midis() {
        return this._midis;
    }
}
