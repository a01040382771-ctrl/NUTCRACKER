// Builds the single-file game: index.html (standalone) and artifact.html (Claude Artifact page body).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => fs.readFileSync(path.join(dir, 'src', p), 'utf8');
const jsFiles = fs.readdirSync(path.join(dir, 'src', 'js')).filter((f) => f.endsWith('.js')).sort();
const js = jsFiles.map((f) => `/* ---- ${f} ---- */\n${src('js/' + f)}`).join('\n');
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js';
const FONTS = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@700;800&family=Pinyon+Script&display=swap';
const head = `<title>클라라의 마법 여행</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link href="${FONTS}" rel="stylesheet">
<style>
${src('style.css')}
</style>`;
const scripts = `<script src="${THREE_URL}"></script>
<script>
(function () {
'use strict';
${js}
})();
</script>`;
const body = src('body.html');
fs.writeFileSync(path.join(dir, 'artifact.html'), `${head}\n${body}\n${scripts}\n`);
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>
${body}
${scripts}
</body>
</html>
`);
const kb = (f) => (fs.statSync(path.join(dir, f)).size / 1024).toFixed(1);
console.log(`built index.html (${kb('index.html')} KB) and artifact.html (${kb('artifact.html')} KB) from ${jsFiles.length} scripts`);
