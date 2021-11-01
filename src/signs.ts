import { CreateSprite, Sprite } from './renderer';
import { SpriteExtended } from './spriteRenderer'
export class Signs {
    private template: Sprite;
    private signs: SpriteExtended[] = [];
    add(sign: SpriteExtended): SpriteExtended {
        if (this.template) {
            sign.image = this.template.image;
        }
        this.signs.push(sign);
        return sign;
    }
    remove(sign: SpriteExtended) {
        const index = this.signs.indexOf(sign);
        if (index !== -1) {
            this.signs.splice(index, 1);
        }
    }
    replaceTexture(sprite: CreateSprite) {
        this.template = sprite(0, 0);
        for (const sign of this.signs) {
            sign.image = this.template.image;
        }
    }
}