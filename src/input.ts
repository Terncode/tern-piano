import { Piano } from './piano';
import { MidiObject, MIDI_MAP, Note } from '../Tern-blaster/src/midiConstants';
import { Renderer } from './renderer';

export class PianoInput {
    private enabled = false;
    private map = new Map<string, number>();
    private mouseDown?: {x: number, y: number};
    private shift? = false;
    private readonly keyMap: {[key: string]: Note} = {
        'a': 'A0',
        'w': 'A#0',
        's': 'B0',
        'd': 'C1',
        'r': 'C#1',
        'f': 'D1',
        't': 'D#1',
        'g': 'E1',
        'h': 'F1',
        'u': 'F#1',
        'j': 'G1',
        'i': 'G#1',
        'k': 'A1',
        'o': 'A#1',
        'l': 'B1',
    };

    constructor(private piano: Piano, private renderer: Renderer) {
        const entries = Object.entries(MIDI_MAP) as [string, MidiObject][];
        for (const [key, value] of entries) {
            if (value.noteName) {
                const num = parseInt(key, 10);
                this.map.set(value.noteName, num);
            }
        }

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);

        renderer.getCanvas().addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
    }
    private onMouseDown = (event: MouseEvent) => {
        this.mouseDown = {
            x: event.x,
            y: event.y,
        };
    };
    private onMouseMove = (event: MouseEvent) => {
        if (this.mouseDown && this.enabled && this.shift) {
            const diffX = this.mouseDown.x - event.x;
            const diffY = this.mouseDown.y - event.y;
            this.mouseDown.x = event.x;
            this.mouseDown.y = event.y;
            const cam = this.renderer.camera;
            cam.x -= diffX;
            cam.y -= diffY;
        }
    };

    private onMouseUp = () => {
        this.mouseDown = undefined;
    };

    private onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Shift') {
            this.shift = true;
        }

        if (!this.enabled) return;


        if (this.keyMap[event.key]) {
            this.piano.keyDown(this.map.get(this.keyMap[event.key]), 100);
        }
    };
    private onKeyUp = (event: KeyboardEvent) => {
        if (event.key === 'Shift') {
            this.shift = false;
        }
        if (!this.enabled) return;
        if (this.keyMap[event.key]) {
            this.piano.keyUp(this.map.get(this.keyMap[event.key]), 100);
        }
    };
    destroy() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);

        this.renderer.getCanvas().removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
    }
    enable() {
        this.enabled = true;
    }
    disable() {
        this.enabled = false;
    }
}
