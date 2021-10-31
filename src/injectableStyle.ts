import { clamp } from 'lodash';

export class InjectableStyle {
    private style = document.createElement('style');
    private usage = 0;

    constructor(style: string) {
        this.style.textContent = style;
    }
    use() {
        this.usage++;
        if (!document.head.contains(this.style)) {
            document.head.appendChild(this.style);
        }
    }
    unUse() {
        this.usage = clamp(this.usage - 1, 0, Number.MAX_SAFE_INTEGER);
        if (this.usage <= 0 && document.head.contains(this.style)) {
            document.head.removeChild(this.style);
        }
    }
}
