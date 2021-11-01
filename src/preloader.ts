import { Asset } from './assets';

export class Preloader {
    private cache = new Map<string, any>();

    private getInternalAssetName(name: string) {
        return `_${name}`;
    }

    loadAsset(asset: Asset, internal = false) {
        if (this.cache.has(this.getInternalAssetName(asset.text))) {
            return this.cache.get(this.getInternalAssetName(asset.text));
        }
        switch (asset.ex) {
            case 'png':
            case 'jpeg':
                return this.loadImageAsset(asset, internal);
            case 'mp3':
            case 'wav':
            case 'flac':
                return this.loadAudioAsset(asset, internal);
            default: {
                return this.loadUnknownAsset(asset, internal);
            }
        }
    }

    loadImage(base64: string, name: string): Promise<HTMLImageElement> {
        const asset= this.createAsset(base64, name);
        return this.loadAsset(asset);
    }

    private createAsset(data:string, title: string): Asset {
        const {ex, text} = this.ex(title);
        return { data, ex, text };
    }

    private loadUnknownAsset(asset: Asset, internal: boolean): Blob {
        const cacheName = internal ? this.getInternalAssetName(asset.text) : asset.text;
        if(this.cache.has(cacheName)) {
            return this.cache.get(cacheName);
        }

        const blob = new Blob([asset.text], {type: 'text/plain;charset=utf-8;'});
        this.cache.set(cacheName, blob);
        return blob;
    }

    private loadImageAsset(asset: Asset, internal: boolean):Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image;
            const cacheName = internal ? this.getInternalAssetName(asset.text) : asset.text;
            this.cache.set(cacheName, image);
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (err) => {
                this.cache.delete(cacheName);
                reject(err);
            });
            if(asset.data.startsWith('data:image')) {
                image.src = asset.data;
            } else {
                image.src = `data:image/${asset.ex};base64,${asset.data}`;

            }
        });
    }
    private loadAudioAsset(asset: Asset, internal: boolean):Promise<HTMLAudioElement> {
        return new Promise<HTMLAudioElement>((resolve, reject) => {
            const audio = new Audio;
            const cacheName = internal ? this.getInternalAssetName(asset.text) : asset.text;
            this.cache.set(cacheName, audio);
            audio.addEventListener('load', () => resolve(audio));
            audio.addEventListener('error', (err) => {
                this.cache.delete(cacheName);
                reject(err);
            });
            audio.src = `data:audio/${asset.ex};base64,${asset.data}`;
        });
    }
    private ex(text: string) {
        const index = text.lastIndexOf('.');
        return (index === -1) ? {text, ex: ''} : {text: text.slice(0, index), ex: text.slice(index + 1)};
    }
}
