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
import { MidiSpinners } from './midiSpinners';
import { Signs } from './signs';

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
    constructor(
        private preloader: Preloader, 
        private storage: Storage, 
        private piano: Piano, 
        private spinner: MidiSpinners,
        private spriteRenderer: SpriteRenderer,
        private signs: Signs,
        ) {
        this.popup = new Popup(this.container);
        this.container.classList.add('piano-texturer');;
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
        this.container.appendChild(this.createButton('Change spinner', async() => {
            const image = await this.getImage();
            this.spinner.replaceTexture(false, image.sprite);
            this.storage.setItem('texture-spinner', image.base64 as string)
            this.storage.setItem('texture-spinner-title', image.title);
        }));
        this.container.appendChild(this.createButton('Change circle', async() => {
            const image = await this.getImage();
            this.spinner.replaceTexture(true, image.sprite);
            this.storage.setItem('texture-circle', image.base64 as string)
            this.storage.setItem('texture-circle-title', image.title);
        }));
        this.container.appendChild(this.createButton('Change background', async() => {
            const image = await this.getImage();
            this.spriteRenderer.setBackgroundImage(image.sprite(0, 0));
            this.storage.setItem('texture-background', image.base64 as string)
            this.storage.setItem('texture-background-title', image.title);
        }));
        this.container.appendChild(this.createButton('Change signs', async() => {
            const image = await this.getImage();
            this.signs.replaceTexture(image.sprite);
            this.storage.setItem('texture-sign', image.base64 as string)
            this.storage.setItem('texture-sign-title', image.title);
        }));
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

        const spinnerBase64 = await this.storage.getItem('texture-spinner') as string;
        const spinnerTitle = await this.storage.getItem('texture-spinner-title') as string;
        if (spinnerBase64 && spinnerTitle) {
            const img = await this.preloader.loadImage(spinnerBase64, spinnerTitle);
            this.spinner.replaceTexture(false, await this.renderer.createSprite(img));
        }

        const circleBase64 = await this.storage.getItem('texture-circle') as string;
        const circleTitle = await this.storage.getItem('texture-circle-title') as string;
        if (circleBase64 && circleTitle) {
            const img = await this.preloader.loadImage(circleBase64, circleTitle);
            this.spinner.replaceTexture(true, await this.renderer.createSprite(img));
        }
        
        const backgroundBase64 = await this.storage.getItem('texture-background') as string;
        const backgroundTitle = await this.storage.getItem('texture-background-title') as string;
        if (backgroundBase64 && backgroundTitle) {
            const img = await this.preloader.loadImage(backgroundBase64, backgroundTitle);
            const sprite = await this.renderer.createSprite(img);
            this.spriteRenderer.setBackgroundImage(sprite(0, 0));
        }

        const signBackgroundBase64= this.storage.getItem('texture-sign') as string;
        const signBackgroundTitle= this.storage.getItem('texture-sign-title') as string;
        if (signBackgroundBase64 && signBackgroundTitle) {
            const img = await this.preloader.loadImage(signBackgroundBase64, signBackgroundTitle);
            const sprite = await this.renderer.createSprite(img);
            this.signs.replaceTexture(sprite);
        }
    }
}
