const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'ui.html');
const dstDir = path.join(__dirname, '..', 'dist');
const dst = path.join(dstDir, 'ui.html');

fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);

console.log('[BCS] ui.html -> dist/ui.html');
