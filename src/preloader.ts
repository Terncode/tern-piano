import { Asset } from './assets';

export class Preloader {
    private cache = new Map<string, any>();

    private getInternalAssetName(name: string) {
        return `_${name}`;
    }

    loadAsset(asset: Asset) {
        if (this.cache.has(this.getInternalAssetName(asset.text))) {
            return this.cache.get(this.getInternalAssetName(asset.text));
        }
        switch (asset.ex) {
            case 'png':
            case 'jpeg':
                return this.loadImage(asset, true);
            case 'mp3':
            case 'wav':
            case 'flac':
                return this.loadAudio(asset, true);
            default: {
                return this.loadUnknown(asset, true);
            }
        }
    }

    private loadUnknown(asset: Asset, internal: boolean): Blob {
        const cacheName = internal ? this.getInternalAssetName(asset.text) : asset.text;
        if(this.cache.has(cacheName)) {
            return this.cache.get(cacheName);
        }

        const blob = new Blob([asset.text], {type: 'text/plain;charset=utf-8;'});
        this.cache.set(cacheName, blob);
        return blob;
    }

    private loadImage(asset: Asset, internal: boolean):Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image;
            const cacheName = internal ? this.getInternalAssetName(asset.text) : asset.text;
            this.cache.set(cacheName, image);
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (err) => {
                this.cache.delete(cacheName);
                reject(err);
            });
            image.src = `data:image/${asset.ex};base64,${asset.data}`;
        });
    }
    private loadAudio(asset: Asset, internal: boolean):Promise<HTMLAudioElement> {
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
}
