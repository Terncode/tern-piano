type ReaderType = 'readAsText' | 'readAsDataURL' | 'readAsBinaryString' | 'readAsBinaryString' | 'readAsArrayBuffer'

export type FileReturnType = string | ArrayBuffer;
export type FileValidator = (result: FileReturnType) => boolean;

export interface DetailedFileReturn {
    name: string;
    data: FileReturnType
}

export class FileInput {
    private input = document.createElement('input');
    private readerType: ReaderType = 'readAsText';
    private resolve: (T: any[]) => void;
    private reject: (any: any) => void;
    private validator: FileValidator = () => true;
    constructor() {
        this.input.type = 'file';
        this.input.addEventListener('change', this.process);
    }
    setAcceptType(extensions: string[]) {
        this.input.accept = extensions.map(e => `.${e}`).join(', ');
    }
    setReadType(readerType: ReaderType) {
        this.readerType = readerType;
    }
    allowMultiple(value: boolean) {
        this.input.multiple = value;
    }
    open() {
        return new Promise<DetailedFileReturn[]>((resolve, reject) => {
            //window.addEventListener('mousemove', this.cancel);
            window.addEventListener('mousedown', this.cancel);
            window.addEventListener('touchend', this.cancel);
            this.reject = (err) => {
                this.reset();
                reject(err);
            } 
            this.resolve = (data) => {
                this.reset();
                resolve(data);
            };
            this.input.click();
        });
    }
    setValidator(fn: FileValidator) {
        this.validator = fn;
    }
    private cancel = () => {
        if (this.reject) {
            this.reject(new Error('No files selected'));
        }
        this.reset();
    }

    private process = async () => {
        const files = this.input.files;
        if (files.length) {
            const loadedFiles = await this.loadFiles(files);
            if (loadedFiles.length) {
                this.resolve(loadedFiles);
            } else {
                this.reject(new Error('No files selected'));
            }
        } else {
            this.reject('No files selected')
        }
    }

    private reset() {
        this.resolve = () => {};
        this.reject = () => {};

        //window.removeEventListener('mousemove', this.cancel);
        window.removeEventListener('mousedown', this.cancel);
        window.removeEventListener('touchend', this.cancel);
        const input = document.createElement('input');

        input.accept = this.input.accept;
        input.type = this.input.type;
        input.multiple = this.input.multiple;
        this.input = input;
        this.input.addEventListener('change', this.process);
    }

    private async loadFiles(files: FileList) {
        const loaded: DetailedFileReturn[] = []
        const a =files[1];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const data = await this.loadFile(file);
                loaded.push({
                    name: file.name,
                    data,
                });
            } catch (error) {
                console.error(error);
            }
        }
        return loaded;
    }

    private loadFile(file: File) {
        return new Promise<FileReturnType>((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', async () => {
                const result = reader.result;
                const validatedResult = this.validator(result);
                if (validatedResult) {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed by validator'));
                }
            });
            reader.addEventListener('error', (err) => {
                reject(err);
            });
            switch (this.readerType) {
                case 'readAsArrayBuffer':
                    reader.readAsArrayBuffer(file);
                    break;
                case 'readAsBinaryString':
                    reader.readAsBinaryString(file);
                    break;
                case 'readAsDataURL':
                    reader.readAsDataURL(file);
                    break;
                case 'readAsText':
                    reader.readAsText(file);
                    break;
                default:
                    reject(new Error(`Unknown type "${this.readerType}"`))
                    break;
            }
        });
    }
}