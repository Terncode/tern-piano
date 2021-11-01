import { Storage } from './storage';
import { DetailedFileReturn, FileInput } from './fileInput';

export interface MIDI {
    name: string;
    data: ArrayBuffer;
    base64: string;
}

export class MidiStorage {
    private _midis: MIDI[] = [];
    private fileInput = new FileInput();

    constructor(private storage: Storage) {
        this.fileInput.setAcceptType(['mini', 'mid']);
        this.fileInput.setReadType('readAsArrayBuffer');
        this.fileInput.setValidator(v => typeof v !== 'string');
    }
    async load() {
        const files = await this.fileInput.open();
        for (const file of files) {
            const midi: MIDI = {
                name: file.name,
                data: file.data as ArrayBuffer,
                base64: await new Promise((resolve, reject) => {
                    this.storage.serializer.serialize(file.data as ArrayBuffer, (value, err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(value);
                        }
                    });
                })
            };
            this._midis.push(midi);
        }
    }
    async loadRaw(midi: MIDI[]) {
        this._midis = midi;

        for (const midi of this._midis) {
            midi.data = await this.storage.serializer.deserialize(midi.base64) as any;
        }
    }
    get midis() {
        return this._midis;
    }
}
