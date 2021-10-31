import { InjectableStyle } from './injectableStyle';

export class Popup {
    private popup = document.createElement('div');
    private _open = false;
    private style = new InjectableStyle(`\
    .popup {
        position: fixed;
        margin: auto;
        z-index: 1000;
        min-width: 50px;
        min-height: 50px;
        max-width: 250;
        max-height: 250px;
        overflow: auto;
        border: 1px solid white;
        background: rgba(0, 0, 0, 0.25);
    }
    `);

    constructor(private div: HTMLElement) {
        this.popup.classList.add('popup');
    }
    show() {
        if (!this.popup.contains(this.div)) {
            this.popup.appendChild(this.div);
        }

        if (!document.body.contains(this.popup)) {
            document.body.appendChild(this.popup);
        }
        window.addEventListener('resize', this.updatePos);
        setTimeout(() => {
            window.addEventListener('click', this.onClick);
        });
        this.style.use();
        this.updatePos();
        this._open = true;
    }

    close() {
        this.style.unUse();

        if (this.popup.contains(this.div)) {
            this.popup.removeChild(this.div);
        }

        if (document.body.contains(this.popup)) {
            document.body.removeChild(this.popup);
        }
        window.removeEventListener('resize', this.updatePos);
        window.removeEventListener('click', this.onClick);
        this._open = false;
    }
    get isOpen() {
        return this._open;
    }

    private onClick = (event: MouseEvent) => {
        const {left, top, width, height } = this.popup.getBoundingClientRect();
        if(!(event.x > left && event.x < left + width && event.y > top && event.y < top + height)) {
            this.close();
        }

    };
    private updatePos = () => {
        const { width, height } = this.popup.getBoundingClientRect();
        this.popup.style.left = `${window.innerWidth * 0.5 - width * 0.5}px`;
        this.popup.style.top = `${window.innerHeight * 0.5 - height * 0.5}px`;
    };
}
