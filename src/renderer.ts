export interface Sprite {
    image: HTMLImageElement,
    x: number,
    y: number,
}

export type CreateSprite = (x: number, y: number) => Sprite

export class Renderer {
    private canvas = document.createElement('canvas');
    private ctx: CanvasRenderingContext2D;
    private _camera = {
        x: 0,
        y: 0
    };

    constructor(customSize = false) {
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) throw new Error('Canvas render not supported!');
        document.body.appendChild(this.canvas);
        if (!customSize) {
            window.addEventListener('resize', this.resize);
            this.resize();
        }
        this.disableImageSmoothing(this.ctx);
    }
    destroy() {
        window.removeEventListener('resize', this.resize);
        if (document.body.contains(this.canvas)) {
            document.body.removeChild(this.canvas);
        }
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawSprite(sprite: Sprite, x?: number, y?: number) {
        this.ctx.drawImage(sprite.image, (x || sprite.x) + this._camera.x, (y || sprite.y) + this._camera.y);
    }
    drawText(text: string, x: number, y: number) {
        this.ctx.font = '10px injected-font';
        this.ctx.fillStyle = 'black';
        const border = 2;
        const fontWidth = 4;

        for (let i = 0; i < border; i++) {
            this.ctx.fillText(text, this._camera.x + x - (text.length * fontWidth) - border, this._camera.y + y - 5);
            this.ctx.fillText(text, this._camera.x + x - (text.length * fontWidth) + border, this._camera.y + y - 5);
            this.ctx.fillText(text, this._camera.x + x - (text.length * fontWidth), this._camera.y + y - 5 - border);
            this.ctx.fillText(text, this._camera.x + x - (text.length * fontWidth), this._camera.y + y - 5 + border);
        }

        this.ctx.fillStyle = 'white';
        this.ctx.fillText(text, this._camera.x + x - (text.length * fontWidth), y - 5 + this._camera.y);
    }

    createSprite(obj: string | HTMLImageElement,): Promise<CreateSprite> {
        return new Promise((resolve,reject) => {
            if (typeof obj === 'string') {
                const image = new Image();
                image.addEventListener('load', () => resolve((x: number, y: number) => {
                    return { image, x, y };
                }));
                image.addEventListener('error', (err) => reject(err));
                image.src = obj;
            } else {
                resolve((x: number, y: number) => ({ image: obj, x, y }));
            }
        });

    }

    private resize = () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    };
    getCanvas() {
        return this.canvas;
    }
    get camera() {
        return this._camera;
    }
    set camera(camera: {x: number, y: number}) {
        this._camera = camera;
    }

    private disableImageSmoothing(context: CanvasRenderingContext2D) {
        if ('imageSmoothingEnabled' in context) {
            context.imageSmoothingEnabled = false;
        } else {
            (context as any).webkitImageSmoothingEnabled = false;
            (context as any).mozImageSmoothingEnabled = false;
            (context as any).msImageSmoothingEnabled = false;
        }
    }
    
}
