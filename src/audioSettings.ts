import { Popup } from './popup';
import { TernBlaster } from '../Tern-blaster/src/audioEngine';
import { Piano } from './piano';
import { InjectableStyle } from './injectableStyle';
import {  MIDI_MAP } from '../Tern-blaster/src/midiConstants';
import { MidiObject } from '../Tern-blaster/src/interfaces';
import { Preloader } from './preloader';
import { assets } from './assets';
import { Storage } from './storage';

export class AudioSettings extends Popup {
    private container: HTMLDivElement;
    private injectable: InjectableStyle;
    private piano: Piano;

    constructor(ternBlaster: TernBlaster, piano: Piano, preloader: Preloader, storage: Storage) {
        const container = document.createElement('div');
        container.style.margin = '50px';
        //const input = document.createElement('input');
        const vh = ternBlaster.volumeHandler;

        super(container);
        this.injectable = new InjectableStyle(`\
        .audio-button {
            border: none;
            margin: 2px;
            padding: 2px;
        }
        `);
        (async () => {
            const waterMark = await preloader.loadAsset(assets.poweredBy) as HTMLImageElement;
            const div = document.createElement('div');
            div.appendChild(waterMark);
            waterMark.style.position = 'absolute';
            waterMark.style.right = '0';
            //waterMark.style.marginTop = '10px';
            waterMark.height = 50;
            container.appendChild(div);
            const synthData = await storage.getItem('synth');
            if (synthData) {
                this.piano.changeSynthType(synthData as any);
            }
            const pianoEnabled = await storage.getItem('piano');
            if (pianoEnabled) {
                this.piano.samplePiano(pianoEnabled === 'true');
            }

        })();

        this.container = container;
        this.piano = piano;
        this.bind('Master', () => vh.getMasterVolume(), n => vh.setMasterVolume(n));
        this.bind('Synth',  () => vh.getSynthVolume(), n => vh.setSynthVolume(n));
        this.bind('Piano',  () => vh.getPianoVolume(), n => vh.setPianoVolume(n));

        this.createButton('Synth: sawtooth', () => {
            this.reset();
            piano.samplePiano(false);
            piano.changeSynthType('sawtooth');
            storage.setItem('synth', 'sawtooth');
            storage.setItem('piano', 'false');
        });
        this.createButton('Synth: sine', () => {
            this.reset();
            piano.samplePiano(false);
            piano.changeSynthType('sine');
            storage.setItem('synth', 'sine');
            storage.setItem('piano', 'false');
        });
        this.createButton('Synth: square', () => {
            this.reset();
            piano.samplePiano(false);
            piano.changeSynthType('square');
            storage.setItem('synth', 'square');
            storage.setItem('piano', 'false');
        });
        this.createButton('Synth: triangle', () => {
            this.reset();
            piano.samplePiano(false);
            piano.changeSynthType('triangle');
            storage.setItem('synth', 'triangle');
            storage.setItem('piano', 'false');
        });
        this.createButton('Piano', () => {
            this.reset();
            piano.samplePiano(true);
            storage.setItem('piano', 'true');
        });
    }

    show() {
        this.injectable.use();
        super.show();
    }
    close() {
        this.injectable.unUse();
        super.close();
    }
    private reset() {
        const entries = Object.entries(MIDI_MAP) as [string, MidiObject][];
        entries.forEach((v,k) => {
            this.piano.keyUp(k, 0);
        });
    }
    private bind(name:string, getter: () => number, setter:(value: number) => void, max = '100') {
        const div = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = name;

        const input = document.createElement('input');
        input.type = 'range';
        input.max = max;
        input.min = '1';
        input.style.width = '250px';
        const update = () => {
            input.value = getter().toString();
        };

        input.addEventListener('mousemove', () => setter(parseInt(input.value, 10)));
        input.addEventListener('change', () => setter(parseInt(input.value, 10)));

        update();
        div.appendChild(label);
        div.appendChild(input);
        this.container.appendChild(div);
    }


    private createButton(name: string, onClick:(event: MouseEvent) => void) {
        const button = document.createElement('button');
        button.addEventListener('click', onClick);
        button.textContent = name;
        button.classList.add('audio-button');
        this.container.appendChild(button);
    }
}
