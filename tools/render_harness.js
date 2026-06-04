// Headless render harness: drives the REAL renderer.js (+ player.js, glyphs.js,
// mapgen.js) against node-canvas to produce a PNG of the first-person view.
// Sprite drawers (items/enemies/corpses) are stubbed since they load PNG assets.
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// Concatenate the real source files plus a driver into a single script so all
// top-level const/function share one scope, then eval it with ctx in scope.
const sources = ['mapgen.js', 'glyphs.js', 'player.js', 'renderer.js'].map(read).join('\n');

function render(map, facing, x, y, level, outPath) {
  const canvas = createCanvas(800, 960);
  const ctx = canvas.getContext('2d');

  // Stubs for things the renderer references but we don't exercise here.
  const debug = { enabled: false, noclip: false, godMode: false, showDpad: false, showEnemies: false };
  const drawItem = () => {};
  const drawEnemy = () => {};
  const drawCorpse = () => {};

  const driver = `
    player.x = ${x}; player.y = ${y}; player.facing = ${facing}; player.dungeonLevel = ${level};
    const __map = ${JSON.stringify(map)};
    const __scene = buildScene(__map, 5, [], [], []);
    renderView(ctx, __scene);
  `;

  // eval in this function scope: ctx/debug/drawItem/... resolve from here;
  // TILE/DIR/player/buildScene/renderView are declared inside the eval string.
  eval(sources + driver);

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log('wrote', outPath);
}

// Map 1: straight corridor running south from the player — side walls both sides,
// back wall at the end. W=1, floor=0.
const W = 1, F = 0;
const straight = [
  [W, W, W, W, W],
  [W, F, W, W, W],
  [W, F, W, W, W],
  [W, F, W, W, W],
  [W, F, W, W, W],
  [W, F, W, W, W],
  [W, W, W, W, W],
];
// Player at (1,1) facing South (2).
render(straight, 2, 1, 1, 1, path.join(root, 'tools/out_straight.png'));

// Map 2: corridor with a parallel opening on the left partway down (T to the side)
// to exercise the outer/parallel wall path.
const tjunc = [
  [W, W, W, W, W, W, W],
  [W, F, W, W, W, W, W],
  [W, F, W, W, W, W, W],
  [W, F, F, F, F, F, W],
  [W, F, W, W, W, W, W],
  [W, F, W, W, W, W, W],
  [W, W, W, W, W, W, W],
];
render(tjunc, 2, 1, 1, 1, path.join(root, 'tools/out_tjunc.png'));
