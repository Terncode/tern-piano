import { Sprite, Renderer } from './renderer';

function defaultEase(x: number) {
    return x;
}
const c1 = 1.70158;
const c3 = c1 + 1;
function easeOutBack(x: number) {
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const ease : { [key: string]: (v: number) => number } = {
    easeOutBack: easeOutBack,
    default: defaultEase
};

export interface SpriteExtended extends Sprite {
    z: number;
    name?: string;

    onClick?: () => void;

    posAnimator?: {
        x?: PosAnimator,
        y?: PosAnimator,
    };
}

interface PosAnimator {
    easeFn: string;
    startTime: number;
    duration: number;
    originalValue: number;
    value: number;
}

export class SpriteRenderer {
    private frame?: number;
    private lastCall = 0;
    private sprites: SpriteExtended[] = [];
    private entityWithName: SpriteExtended[] = [];
    private backGroundImage: Sprite;
    private backgroundCam = {x: 0, y: 0};
    sort = ((a: SpriteExtended, b: SpriteExtended) => (a.z - b.z || a.y - b.y || a.x - b.x));

    constructor(private renderer: Renderer) {}

    private canvasHover = (event: MouseEvent) => {
        const x = event.offsetX;
        const y = event.offsetY;
        this.entityWithName = this.getHoverOverItems(x, y);
    };

    private onClick = (event: MouseEvent) => {
        const x = event.offsetX;
        const y = event.offsetY;
        const items = this.getHoverOverItems(x, y).filter(e => e.onClick).sort(this.sort).reverse();
        if(items[0]) {
            items[0].onClick();
        }
    };

    private getHoverOverItems(x: number, y: number) {
        const hoverOver: SpriteExtended[] = [];
        const cam = this.renderer.camera;
        x -= cam.x;
        y -= cam.y;

        for (let i = 0; i < this.sprites.length; i++) {
            if (
                this.sprites[i].x < x && this.sprites[i].y < y &&
                this.sprites[i].x + this.sprites[i].image.width > x &&
                this.sprites[i].y + + this.sprites[i].image.height > y) {
                hoverOver.push(this.sprites[i]);
            }
        }
        return hoverOver;
    }

    start() {
        if (!this.frame) {
            this.lastCall = performance.now();
            this.frame = requestAnimationFrame(this.draw);
            this.renderer.getCanvas().addEventListener('mousemove', this.canvasHover);
            this.renderer.getCanvas().addEventListener('click', this.onClick);
        }
    }

    stop() {
        if (this.frame) {
            cancelAnimationFrame(this.frame);
            this.frame = undefined;
            this.renderer.getCanvas().removeEventListener('click', this.onClick);
        }
    }

    addSprite(sprite: Sprite) {
        const newSprite: SpriteExtended = {
            image: sprite.image, x: sprite.x, y: sprite.y, z: 0
        };
        this.sprites.push(newSprite);

        return newSprite;
    }

    removeSprite(sprite: SpriteExtended) {
        const index = this.sprites.indexOf(sprite);
        if (index !== -1) {
            this.sprites.splice(index, 1);
        }
    }


    draw = () => {
        const now = performance.now();
        const delta = now - this.lastCall;
        this.lastCall = now;

        delta;
        this.renderer.clear();
        if (this.backGroundImage) {
            const temp = this.renderer.camera;
            this.renderer.camera = this.backgroundCam;
            const c = this.renderer.getCanvas();
            let y = 0;
            for (let x = 0; x < c.width; ) {
                this.backGroundImage.x = x;
                this.backGroundImage.y = y;
                this.renderer.drawSprite(this.backGroundImage);
                x += this.backGroundImage.image.width;
                if(x > c.width) {
                    y += this.backGroundImage.image.height;
                    x = 0;
                    if (y > c.height) {
                        break;
                    }
                }
            }
            this.renderer.camera = temp;
        }


        this.sprites.sort(this.sort);

        for (let i = 0; i < this.sprites.length; i++) {
            this.updatePosAnimator(this.sprites[i], 'x');
            this.updatePosAnimator(this.sprites[i], 'y');
            this.renderer.drawSprite(this.sprites[i], this.sprites[i].posAnimator?.x?.value, this.sprites[i].posAnimator?.y?.value);
            if (this.sprites[i].name && this.entityWithName.indexOf(this.sprites[i]) !== -1) {
                this.renderer.drawText(this.sprites[i].name,
                    this.sprites[i].posAnimator?.x?.value ?? this.sprites[i].x,
                    this.sprites[i].posAnimator?.y?.value ?? this.sprites[i].y);
            }

        }

        this.frame = requestAnimationFrame(this.draw);
    };
    setBackgroundImage(backgroundSprite?: Sprite) {
        if (backgroundSprite) {
            this.backGroundImage = {
                image: backgroundSprite.image,
                x: 0,
                y: 0
            };
        } else {
            this.backGroundImage = undefined;
        }
    }

    private updatePosAnimator(sprite: SpriteExtended, update: 'x' | 'y') {
        if (!sprite.posAnimator || !sprite.posAnimator[update])
            return;

        const startTime = sprite.posAnimator[update]!.startTime;
        const duration = performance.now() - startTime;
        if (duration > sprite.posAnimator[update]!.duration) {
            delete sprite.posAnimator[update];
        } else {
            const percentage = duration / sprite.posAnimator[update]!.duration;
            const ov = sprite.posAnimator[update]!.originalValue;
            const n = ov > sprite[update];
            const value = n ? ov - sprite[update] : sprite[update] - ov;
            const an = ease[sprite.posAnimator[update]!.easeFn as any] || ease.default;
            const v = value * (1 - an(percentage));
            sprite.posAnimator[update]!.value = n ? sprite[update] + v : sprite[update] - v;

        }
    }
}
