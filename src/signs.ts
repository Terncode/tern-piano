import { CreateSprite, Sprite } from './renderer';
import { SpriteExtended } from './spriteRenderer'
export class Signs {
    private signs: SpriteExtended[] = [];
    add(sign: SpriteExtended): SpriteExtended {
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
        const template = sprite(0, 0);
        for (const sign of this.signs) {
            sign.image = template.image;
        }
    }
}