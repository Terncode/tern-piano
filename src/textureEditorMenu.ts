import { Popup } from './popup';
import { TernBlaster } from '../Tern-blaster/src/audioEngine';
import { Piano } from './piano';
import { Preloader } from './preloader';
import { Renderer } from './renderer';
import { SpriteRenderer } from './spriteRenderer';
import { InjectableStyle } from './injectableStyle';
import { MIDI_MAP } from '../Tern-blaster/src/midiConstants';
import { MidiObject } from '../Tern-blaster/src/interfaces';
import { FileInput } from './fileInput';
import { Storage } from './storage';

export class TextureEditorMenu {
    private popup: Popup;
    private renderer = new Renderer(true);
    private injectable = new InjectableStyle(`\
    .piano-texturer {
        width: 300px;
        overflow: auto;
    }
    `);
    private container = document.createElement('div');
    constructor(private preloader: Preloader, private storage: Storage, private piano: Piano) {
        this.popup = new Popup(this.container);
        this.container.classList.add('piano-texturer');

        // this.preloader = preloader;

        // container.append(this.createButton('Edit piano key texture', () => {


        //     console.log('as');
        // }));
    }

    async init() {
        const ternBlaster = new TernBlaster({settings:{settings:{} as any,onUpdate: () => {} }});
        const spriteRenderer = new SpriteRenderer(this.renderer); 
        const piano = new Piano(this.preloader, this.renderer, spriteRenderer, ternBlaster, 0, 0);
        const c = this.renderer.getCanvas()
        c.width = 1010; 
        c.height = 80; 
        await piano.init();
        spriteRenderer.start();
        spriteRenderer.draw();
        this.container.append(this.renderer.getCanvas());

        this.forEachMidi(midi => {
            piano.overrideKey(midi, key => {
                key.onClick = async () => {
                   const newSprite = await this.getImage()
                   piano.replaceTexture(midi, newSprite.sprite);
                   this.piano.replaceTexture(midi, newSprite.sprite);
                   this.storage.setItem(this.getTextureName(midi), newSprite.base64 as string);
                   this.storage.setItem(this.getTextureName(midi, true), newSprite.title);
                }
            })
        })

        this.container.appendChild(this.createButton('Texture for white keys', async() => {
            const image = await this.getImage();
            this.forEachMidi(midi => {
                if (!MIDI_MAP[midi].noteName.includes('#')) {
                    this.storage.setItem(this.getTextureName(midi), image.base64 as string)
                    this.storage.setItem(this.getTextureName(midi, true), image.title);
                    piano.replaceTexture(midi, image.sprite);
                    this.piano.replaceTexture(midi, image.sprite);
                }
            })
        }))
        this.container.appendChild(this.createButton('Texture for black keys', async() => {
            const image = await this.getImage();
            this.forEachMidi(midi => {
                if (MIDI_MAP[midi].noteName.includes('#')) {
                    piano.replaceTexture(midi, image.sprite);
                    this.piano.replaceTexture(midi, image.sprite);
                    this.storage.setItem(this.getTextureName(midi), image.base64 as string)
                    this.storage.setItem(this.getTextureName(midi, true), image.title);
                }
            })
        }))
        await this.applyTexturesFromStorage();
    } 
    async getImage() {
        const input = new FileInput();
        input.setAcceptType(['png', 'jpg']);
        input.setReadType('readAsDataURL');
        const imageData = await input.open();
        const image = await this.preloader.loadImage(imageData[0].data as string, imageData[0].name) as HTMLImageElement;
        const newSprite = await this.renderer.createSprite(image);
        return {sprite: newSprite, base64: imageData[0].data, title: imageData[0].name };
    }

    show() {
        this.injectable.use();
        this.popup.show();
    }
    private forEachMidi(cb: (midi: number) => void) {
        const entires = Object.keys(MIDI_MAP); 
        for (const midi of entires) {
            const nMidi = parseInt(midi, 10);
            cb(nMidi);
        }
    }

    private generateMidiButtons() {
       
    };

    private createButton(name: string, fn: (event: MouseEvent) => void) {
        const button = document.createElement('button');
        button.textContent = name;
        button.addEventListener('click', fn);
        return button;
    }

    getTextureName(midi: number, title = false) {
        return `midi-texture-${midi}${title ? '-title' : ''}`;
    }

    async applyTexturesFromStorage() {
        const map = new Map<string, HTMLImageElement>();
        const entires = Object.keys(MIDI_MAP); 
        for (const midi of entires) {
            const nMidi = parseInt(midi, 10);
            const base = await this.storage.getItem(this.getTextureName(nMidi)) as string;
            const name = await this.storage.getItem(this.getTextureName(nMidi, true)) as string;
            if (base && name) {
                let image = map.get(base);
                if (!image) {
                    image = await this.preloader.loadImage(base, name);
                }
                map.set(base, image);
                this.piano.replaceTexture(nMidi, await this.renderer.createSprite(image));
            }
        }
    }
}
