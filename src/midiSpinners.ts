import { Player } from 'midi-player-js';
import { CreateSprite } from './renderer';
import { SpriteExtended, SpriteRenderer } from './spriteRenderer';

interface Spinner {
    entity: SpriteExtended;
    x: number;
    y: number;
    deg: number;
    rot: number;
}

export class MidiSpinners {
    private spinners: Spinner[] = [];
    private now = 0;
    private frame: number;

    constructor(private spriteRenderer: SpriteRenderer,private player: Player, private circeEntity: CreateSprite, private rotatorEntity: CreateSprite) {
        const y = 250;
        this.createSpinner(125, y);
        this.createSpinner(875, y);
    }

    start() {
        if (!this.frame) {
            this.now = performance.now();
            this.frame = requestAnimationFrame(this.draw);
        }
    }
    stop() {
        if (this.frame) {
            cancelAnimationFrame(this.frame);
            this.frame = undefined;
        }
    }
    private draw = () => {
        const now = performance.now();
        const delta = now - this.now;
        this.now = now;
        if (this.player.isPlaying()) {
            const multiplayer = this.player.tempo * delta * 0.001;

            for (let i = 0; i < this.spinners.length; i++) {
                const entity = this.spinners[i].entity;
                const x = this.spinners[i].x;
                const y = this.spinners[i].y;
                const deg = this.spinners[i].deg;


                const rot = (this.spinners[i].rot + multiplayer) % 360;
                this.rotateEntity(entity, x, y, rot, deg);
                this.spinners[i].rot = rot;
            }
        }

        this. frame = requestAnimationFrame(this.draw);
    };

    private rotateEntity(sprite: SpriteExtended, x: number, y: number, rad: number, deg: number) {
        const result = this.callPos(rad, deg);
        sprite.x = x + result.x;
        sprite.y = y + result.y;
    }

    private callPos(degrees: number, radius: number) {
        const radians = degrees * (Math.PI / 180);
        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;
        return { x, y };
    }
    private createSpinner(x: number, y: number) {
        const rad = 80;
        for (let i = 0; i < 360; i += 20) {
            const l = this.circeEntity(x, y);
            this.rotateEntity(this.spriteRenderer.addSprite(l), x, y, i, rad);
        }
        const r1 = this.spriteRenderer.addSprite(this.rotatorEntity(x, y));
        const r2 = this.spriteRenderer.addSprite(this.rotatorEntity(x, y));
        const rockRad = rad + 20;
        this.rotateEntity(r1, x, y, 0, rockRad);
        this.rotateEntity(r2, x, y, 180, rockRad);

        const obj: Spinner = { deg: rockRad, entity: r1, x, y, rot: 0 };
        const obj2: Spinner = { deg: rockRad, entity: r2, x, y, rot: 180 };
        this.spinners.push(obj);
        this.spinners.push(obj2);
    }
}
