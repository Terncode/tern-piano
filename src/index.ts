import { TernBlaster,  } from '../Tern-blaster/src/audioEngine';
import { AudioSettings as TCAudioSettings } from '../Tern-blaster/src/volumeHandler';
import { Renderer } from './renderer';
import { SpriteExtended, SpriteRenderer } from './spriteRenderer';
import { Piano } from './piano';
import { MidiSpinners } from './midiSpinners';
import { MidiPlayerEx } from './midiPlayer';
import { PianoInput } from './input';
import { assets } from './assets';
import { Preloader } from './preloader';
import { Menu } from './menu';
import { Storage } from './storage';
import { AudioSettings } from './audioSettings';
import { MIDI, MidiStorage } from './midiStorage';
//import { TextureEditorMenu } from './textureEditorMenu';
import { saveAs } from 'file-saver';
import { InjectableStyle } from './injectableStyle';

(async () => {
    const preload = new Preloader();
    let init = false;
    const renderer = new Renderer();
    const spriteRenderer = new SpriteRenderer(renderer);
    const storage = new Storage();
    await storage.init();
    let audioSettingsSetting = await storage.getItem('tern-blaster') as TCAudioSettings;
    if (!audioSettingsSetting) {
        audioSettingsSetting = {
            ambient: 0,
            master: 100,
            music: 0,
            piano: 0,
            sprite: 0,
            synth: 5
        };
    }

    spriteRenderer.start();
    const ternBlaster = new TernBlaster({settings:{
        settings: audioSettingsSetting,
        onUpdate: () => {
            storage.setItem('tern-blaster', audioSettingsSetting);
        },
    }});

    const piano = new Piano(preload, renderer, spriteRenderer, ternBlaster);
    await piano.init();
    const audioSettings = new AudioSettings(ternBlaster, piano, preload, storage);

    const rock = await renderer.createSprite(await preload.loadAsset(assets.rock));
    const leaf = await renderer.createSprite(await preload.loadAsset(assets.leaf));
    const sign = await renderer.createSprite(await preload.loadAsset(assets.sign));
    const plank = await renderer.createSprite(await preload.loadAsset(assets.plank));

    const fontMod = new InjectableStyle(`\
    @font-face {
        font-family: "injected-font";
        src: url(data:font/truetype;charset=utf-8;base64,${assets.pixearg.data}) format('truetype');
        font-weight: normal;
        font-style: normal;
    }
    * {
        font-family: 'injected-font';
    }
    `);
    fontMod.use();

    spriteRenderer.setBackgroundImage(plank(0, 0));
    const signs: SpriteExtended[] = [];


    const player = new MidiPlayerEx(piano);
    const spinner = new MidiSpinners(spriteRenderer, player, leaf, rock);
    const input = new PianoInput(piano, renderer);
    const midiStorage = new MidiStorage(storage);

    const reload = spriteRenderer.addSprite(sign(700, 200));
    reload.name = 'reload';
    reload.onClick = () => {
        player.stop();
        piano.reset();
    };


    const obj = document.getElementById('serialized-data');
    if (obj) {
        storage.putRaw(obj.textContent);
    }

    const midisRead = await storage.getItem('midis') as MIDI[];
    if (midisRead) {
        await midiStorage.loadRaw(midisRead);
        createSynth();
    }

    function clearSigns() {
        for (const sign of signs) {
            spriteRenderer.removeSprite(sign);
        }
        signs.length = 0;
    }
    function createSynth() {
        clearSigns();
        const start = {
            x: 300,
            y: 200
        };
        const offset = 30;
        let x = start.x - offset;
        let y = start.y;

        const limit = 300;
        for (const midi of midiStorage.midis) {
            x += offset;
            if (start.x + limit < x) {
                x = start.x;
                y += offset;
            }
            const spriteEx = spriteRenderer.addSprite(sign(x, y));
            spriteEx.name = midi.name;
            spriteEx.onClick = () => {
                player.stop();
                piano.reset();
                player.loadArrayBuffer(midi.data);
                player.play();
            };
            signs.push(spriteEx);
        }
    }

    const midis = await storage.getItem('midis') as MIDI[];
    if (midis) {
        midiStorage.loadRaw(midis as any);
        createSynth();
    }

    input.enable();
    spinner.start();

    const menu = new Menu();
    menu.create();
    menu.on('load-midi', loadMidi);
    menu.on('audio-settings',() => audioSettings.show());
    menu.on('save-options', async () => {
        const obj = document.getElementById('serialized-data') as HTMLScriptElement || document.createElement('script');
        obj.id = 'serialized-data';
        obj.type = 'application/json';
        obj.textContent = await storage.getRaw();
        if (!document.body.contains(obj)) {
            document.body.appendChild(obj);
        }

        const blob = new Blob([document.getElementsByTagName('html')[0].innerHTML], {type: 'text/plain;charset=utf-8;'});
        saveAs(blob, `${document.title}.html`);
    });
    // menu.on('texture-editor', () =>{
    //     const textureEditor = new TextureEditorMenu();
    //     textureEditor.show();
    // });

    async function loadMidi() {
        if (!init) {
            return false;
        }

        await midiStorage.load();
        createSynth();
        piano.reset();
        storage.setItem('midis', midiStorage.midis);
        return true;
    }
    init = true;
})();
