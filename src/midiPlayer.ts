
import MidiPlayer from 'midi-player-js';
import { MIDI_MAP } from '../Tern-blaster/src/midiConstants';
import { Piano } from './piano';

export class MidiPlayerEx extends MidiPlayer.Player {

    constructor(piano: Piano, callback?: Function) {
        super(callback);

        this.on('midiEvent', (event: any) => {
            try {
                if (event.name === 'Note on') {
                    if (event.velocity === 0) {
                        this.debug(false, event.tick, event.noteNumber);
                        piano.keyUp(event.noteNumber, event.velocity);
                    } else {
                        this.debug(true, event.tick, event.noteNumber);
                        piano.keyDown(event.noteNumber, event.velocity);
                    }
                } else if (event.name === 'Note off') {
                    this.debug(false, event.tick, event.noteNumber);
                    piano.keyUp(event.noteNumber, event.velocity);
                }
            } catch (error) {
            }
        });
    }

    private debug(on: boolean, tick: number, noteName: number) {
        const text = `[${on ? '+' : '-'}] Time: ${tick} Note: ${MIDI_MAP[noteName].noteName}`;
        return text;
    }
}
