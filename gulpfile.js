const fs = require('fs');
const path = require('path');
const lodash = require('lodash');
const { exec } = require("child_process");

const distPath = path.join(process.cwd(), 'dist');
function clean(cb) {
    if (fs.existsSync(distPath)) {
        for (const file of fs.readdirSync(distPath)) {
            fs.unlinkSync(path.join(process.cwd(), 'dist', file));
        }
    }
    cb();
}

function compileHTML(cb) {
    const distPath = path.join(process.cwd(), 'dist');
    const templateHTML = `<!DOCTYPE html><html lang="en"><head> <meta charset="UTF-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <style>*{margin: 0; padding: 0; overflow: hidden;}body{background: #d8ad7e;}</style> <title>Tern piano</title></head><body> <noscript>Javascript is not enabled</noscript> <script type="application/javascript">#JS_INJECT_CODE</script></body></html>`;
    const jsFile = fs.readdirSync(distPath).find(f => f.endsWith('js'));
    if (!jsFile) throw new Error('Failed to compile. unable to find js script');
    const content = fs.readFileSync(path.join(process.cwd(), 'dist', jsFile), 'utf-8');
    const genTemplate = templateHTML.replace(/#JS_INJECT_CODE/g, content);
    clean(() => {});
    fs.writeFileSync(path.join(process.cwd(), 'dist', 'index.html'), genTemplate);
    cb();
}

function ex(string) {
    const index = string.lastIndexOf('.');
    if (index === -1) {
        return {text: string, ex: ''};
    } else {
        return {text: string.slice(0, index), ex: string.slice(index + 1)};
    }
}

const serializeAssets = cb => {
    const assetsPath = path.join(process.cwd(), 'assets');
    const assetsGenPath = path.join(process.cwd(), 'src', 'assets.ts');
    const assets = fs.readdirSync(assetsPath);
    const assetsBuilder = {};
    for (const asset of assets) {
        const readFile = fs.readFileSync( path.join(process.cwd(), 'assets', asset), 'base64');
        const data = ex(asset);
        assetsBuilder[lodash.camelCase(data.text)] = {
            ...data,
            data: readFile,
        };
    }
    const code = [
        `export interface Asset {`,
        `    ex: string;`,
        `    text: string;`,
        `    data: string;`,
        `}`,
        `export interface Assets {`,
        `${Object.keys(assetsBuilder).map(e => `    ${e}: Asset;`).join('\n')}`,
        `}`,
        `export const assets = JSON.parse(\`${JSON.stringify(assetsBuilder, undefined, 2)}\`) as Assets;`
    ].join('\n');


    fs.writeFileSync(assetsGenPath, code);
    cb();
};

function installSubmodule(cb) {
    exec(`cd ${path.join(process.cwd(), 'Tern-blaster')} && npm i`, (error, stdout, stderr) => {
        if (error) {
            cb();
            return;
        }
        if (stderr) {
            cb();
            return;
        }
    });
}

module.exports = {
    clean,
    postinstall: installSubmodule,
    default: serializeAssets,
    compileHTML,
};
