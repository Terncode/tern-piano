import { CreateSprite, Renderer } from './renderer';
import { SpriteRenderer, SpriteExtended } from './spriteRenderer';
import {  MIDI_MAP } from '../Tern-blaster/src/midiConstants';
import { MidiObject, Note } from '../Tern-blaster/src/interfaces';
import { TernBlaster } from '../Tern-blaster/src/audioEngine';
import { SynthEngineOscillator } from '../Tern-blaster/src/synthEngine';
import { Preloader } from './preloader';
import { assets } from './assets';

export interface PianoKey extends SpriteExtended {
    originalX: number;
    originalY: number;
    active: boolean;
}
export class Piano {
    private _spriteMap = new Map<number, PianoKey>();
    private piano = true;
    private pianoType = '';
    private _synthType: SynthEngineOscillator = 'square';

    constructor(private preloader: Preloader,
         private renderer: Renderer,
          private spriteRenderer: SpriteRenderer,
           private ternBlaster: TernBlaster,
           private startX = 10,
           private y = 20,
           ) {

        // (async () => {
        //     console.error('====', assets.harp);
        //     const mc = await preloader.loadAsset(assets.harp) as HTMLAudioElement;
        //     console.error(mc);
        //     //const blob = URL.createObjectURL(mc);
        //     // const blob = new Blob([`data:audio/${assets.harp.ex};base64,${assets.harp.data}`], {type: `audio/${assets.harp.ex}`});
        //     // console.error(URL.createObjectURL(blob));
        //     // ternBlaster.pianoSampler.addCustomPiano('mc', {
        //     //     'F#3': URL.createObjectURL(blob),
        //     // });
        //     console.error(URL.createObjectURL(mc));
        //     //const blob = new Blob([assets.harp.data], {type: `audio/${assets.harp.ex}`});
        //     ternBlaster.pianoSampler.addCustomPiano('mc', {
        //         'F#3': URL.createObjectURL(mc),
        //     });
        // })();

        if (this.pianoType) {
            ternBlaster.pianoSampler.pedalUp(this.pianoType);
        } else {
            ternBlaster.pianoSampler.pedalUp('');
        }
    }
    samplePiano(value: boolean) {
        this.piano = value;
    }
    get isPiano() {
        return  this.piano;
    }
    changeSynthType(value: SynthEngineOscillator) {
        this._synthType = value;
    }
    get synthType(){
        return this._synthType;
    }

    async init() {
        const pianoPlank = await this.renderer.createSprite(await this.preloader.loadAsset(assets.pianoPlank));
        const pianoPlankShort = await this.renderer.createSprite(await this.preloader.loadAsset(assets.pianoShort));
        const entries = Object.entries(MIDI_MAP) as [string, MidiObject][];

        for (const [key, obj] of entries) {
            const num = parseInt(key, 10);
            if (obj.noteName) {
                const space = 16;
                const isHash = obj.noteName.includes('#');
                const ancoredX = isHash ? this.startX - (space * 0.5) : this.startX;
                const ancoredY = isHash ? this.y - 2 : this.y;
                if (!isHash) {
                    this.startX += space;
                }
                const key = isHash ? pianoPlankShort : pianoPlank;
                const sprite = this.spriteRenderer.addSprite(key(ancoredX, ancoredY)) as PianoKey;
                sprite.onClick = () => {
                    this.keyDown(num, 10);
                    setTimeout(() => {
                        this.keyUp(num, 10);
                    }, 250);
                };
                sprite.name = obj.noteName;

                if(isHash) {
                    sprite.z = 1;
                }
                sprite.originalX = sprite.x = ancoredX;
                sprite.originalY = sprite.y = ancoredY + this.y;
                //document.body.appendChild(entity);
                this._spriteMap.set(num, sprite);
            }
        }
    }
    async keyDown(midi: number, velocity: number) {
        const sprite = this._spriteMap.get(midi);
        if (sprite) {
            this.animateEntity(sprite, true);
        }

        if (this.piano) {
            this.ternBlaster.pianoSampler.keyDown(this.pianoType, midi, velocity);
        } else {
            this.ternBlaster.synthEngine.keyDown(this._synthType, MIDI_MAP[midi].noteName);
        }
    }
    async  keyUp(midi: number, velocity: number) {
        const sprite = this._spriteMap.get(midi);
        if (sprite) {
            this.animateEntity(sprite, false);
        }

        if (this.piano) {
            this.ternBlaster.pianoSampler.keyUp(this.pianoType, midi, velocity);
        } else {
            this.ternBlaster.synthEngine.keyUp(this._synthType, MIDI_MAP[midi].noteName);
        }
    }
    animateEntity(sprite: PianoKey, value: boolean) {
        const duration = 200;

        const offset = 8;
        if (value) {
            if (!sprite.active) {
                sprite.active = true;
                sprite.posAnimator = {
                    y: {
                        value: sprite.y,
                        originalValue: sprite.y,
                        easeFn: 'easeOutBack',
                        startTime: performance.now(),
                        duration,
                    },
                };
                sprite.y += offset;
            }
        } else {
            if (sprite.active) {
                sprite.active = false;
                sprite.posAnimator = {
                    y: {
                        value: sprite.y,
                        originalValue: sprite.y,
                        easeFn: '',
                        startTime: performance.now(),
                        duration,
                    },
                },
                sprite.y -= offset;
            }
        }
    }
    reset() {
        const entries = Object.entries(MIDI_MAP) as [string, MidiObject][];
        entries.forEach((v,k) => {
            this.keyUp(k, 0);
        });
    }
    replaceTexture(midi: number, sprite: CreateSprite) {
        const target = this._spriteMap.get(midi);
        if (target) {
            const newSprite = sprite(target.x, target.y) as PianoKey;
            target.image = newSprite.image;
        }
    }
    overrideKey(note: number, cb: (key: PianoKey) => void) {
        const target = this._spriteMap.get(note);
        if(target) {
            cb(target);
        }
    }
}
