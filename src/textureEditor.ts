import { Popup } from './popup';

export class TextureEditor {
    private main = document.createElement('div');
    private canvas = document.createElement('canvas');
    private ctx: CanvasRenderingContext2D;
    private popup = new Popup(this.main);

    constructor(private width: number, private  height: number) {
        this.canvas.width = width * 0.5;
        this.canvas.height = height * 0.5;
        this.ctx = this.canvas.getContext('2d');
        this.main.appendChild(this.canvas);
    }

    show() {
        if(!this.popup.isOpen) {
            this.popup.show();
        }
    }
    close() {
        if(this.popup.isOpen) {
            this.popup.close();
        }
    }

}
