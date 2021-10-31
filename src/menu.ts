import { InjectableStyle } from './injectableStyle';

type Tab = 'load-midi' | 'audio-settings' | 'texture-editor' | 'save-options';
type ClickFn = (event: MouseEvent) => void;

export class Menu {
    private menu = document.createElement('div');
    private listeners = new Map<Tab, ClickFn[]>();
    private injectable = new InjectableStyle(`\
    .menu-item {
        border-left: 1px solid black;
        border-right: 1px solid black;
        border-bottom: 1px solid black;
        border-bottom-right-radius: 4px;
        border-bottom-left-radius: 4px;
        margin-left: 2px;
    }
    
    .menu-button {
        background: transparent;
        padding: 5px;
        outline: 0px;
        border: 0px;
    }
    `);

    constructor() {
        this.menu.style.position = 'fixed';
        this.menu.style.display = 'flex';
        this.menu.style.top = '0';
        this.menu.style.left = '0';
        this.menu.style.zIndex = '100';

        this.createTab('Add midi', 'load-midi');
        this.createTab('Audio options', 'audio-settings');
        this.createTab('Texture editor', 'texture-editor');
        this.createTab('Save html copy', 'save-options');
    }

    on(tab: Tab, fn: ClickFn ) {
        const functions = this.listeners.get(tab) || [];
        if (functions.indexOf(fn) === -1) {
            functions.push(fn);
            this.listeners.set(tab, functions);
        }
    }
    off(tab: Tab, fn: ClickFn ) {
        const functions = this.listeners.get(tab) || [];
        const index = functions.indexOf(fn);
        if (index !== -1) {
            functions.splice(index, 1);
            this.listeners.set(tab, functions);
        }
    }

    create() {
        if (!document.body.contains(this.menu)) {
            document.body.appendChild(this.menu);
        }
        this.injectable.use();

    }
    destroy() {
        if (document.body.contains(this.menu)) {
            document.body.removeChild(this.menu);
        }

        this.injectable.unUse();
    }

    private emit (tab:Tab, event:MouseEvent) {
        const fns = this.listeners.get(tab) || [];
        for (const fn of fns) {
            fn(event);
        }
    }

    private createTab(name: string, tab: Tab) {
        const div = document.createElement('div')
        const button = document.createElement('button');
        button.textContent = name;
        div.appendChild(button);
        div.classList.add('menu-item');
        button.classList.add('menu-button');
        button.addEventListener('click', e => this.emit(tab, e));
        this.menu.appendChild(div);
    }
}