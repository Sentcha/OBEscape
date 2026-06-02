#!/usr/bin/env node
// Generates 128x128 PNG sprite sheets for every item type.
// Run from the repo root: node tools/generate-item-sprites.js
// Writes to assets/items/<name>.png

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const ROOT      = path.resolve(__dirname, '..');
const OUT_DIR   = path.join(ROOT, 'assets', 'items');
const SPRITE_S  = 128;

const ITEMS = [
  ['bowieKnife',    'bowie-knife'],
  ['pickaxeHandle', 'pickaxe-handle'],
  ['revolver',      'revolver'],
  ['machete',       'machete'],
  ['alienRod',      'alien-rod'],
  ['bandages',      'bandages'],
  ['laudanum',      'laudanum'],
  ['leatherVest',   'leather-vest'],
  ['surveyCoat',    'survey-coat'],
  ['alienPlate',    'alien-plate'],
];

// Minimal static file server for the repo root.
function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const file = path.join(ROOT, req.url.split('?')[0]);
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        const ext = path.extname(file);
        const mime = { '.js': 'text/javascript', '.html': 'text/html' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  console.log(`Server on ${base}`);

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  // Load a minimal generator page.
  await page.goto(`${base}/tools/sprite-gen.html`);
  await page.waitForFunction(() => window.__ready === true);

  for (const [type, filename] of ITEMS) {
    const dataUrl = await page.evaluate(([t, S]) => {
      const canvas = document.getElementById('c');
      const ctx    = canvas.getContext('2d');
      ctx.clearRect(0, 0, S, S);
      _drawItemSprite(ctx, t, S);
      return canvas.toDataURL('image/png');
    }, [type, SPRITE_S]);

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(OUT_DIR, `${filename}.png`);
    fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
    console.log(`  ✓ ${filename}.png`);
  }

  await browser.close();
  server.close();
  console.log('Done.');
})();
