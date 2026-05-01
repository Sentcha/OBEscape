const ITEM_TYPE = {
  GOLD:    'gold',
  POTION:  'potion',
  KHOPESH: 'khopesh',
  SHIELD:  'shield',
};

const LEVEL_ITEMS = {
  1: ['gold', 'potion'],
  2: ['gold', 'potion', 'khopesh'],
  3: ['gold', 'potion', 'khopesh', 'shield'],
  4: ['gold', 'potion', 'khopesh', 'shield'],
  5: ['gold', 'potion', 'khopesh', 'shield'],
};

const ITEM_STATS = {
  gold:    { name: 'Gold',    value:   10, itemType: 'currency'   },
  potion:  { name: 'Potion',  heal:     8, itemType: 'consumable' },
  khopesh: { name: 'Khopesh', attack:   4, itemType: 'weapon'     },
  shield:  { name: 'Shield',  defense:  2, itemType: 'armor'      },
};

// Scan map for TILE.ITEM markers, build live item objects, replace tiles with TILE.FLOOR.
function loadItems(map, dungeonLevel) {
  const pool  = LEVEL_ITEMS[dungeonLevel] || ['gold', 'potion'];
  const items = [];
  for (let y = 0; y < map.length; y++)
    for (let x = 0; x < map[y].length; x++)
      if (map[y][x] === TILE.ITEM) {
        const type  = pool[Math.floor(Math.random() * pool.length)];
        const stats = ITEM_STATS[type];
        items.push({ x, y, type, ...stats });
        map[y][x] = TILE.FLOOR;
      }
  return items;
}

// Dispatch to the correct item sprite.
function drawItem(ctx, far, shade, type) {
  const cx = (far.l + far.r) / 2;
  const by = far.b;
  const pw = far.r - far.l;
  const ph = far.b - far.t;
  switch (type) {
    case ITEM_TYPE.GOLD:    drawGoldPile(ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.POTION:  drawPotion  (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.KHOPESH: drawKhopesh (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.SHIELD:  drawShield  (ctx, cx, by, pw, ph, shade); break;
  }
}

// ---------------------------------------------------------------------------
// Item sprites — all drawn relative to the far portal, sitting on the floor
// ---------------------------------------------------------------------------

function drawGoldPile(ctx, cx, by, pw, ph, shade) {
  const offsets = [[-0.06, 0], [0, -0.03], [0.06, 0]];
  const color   = shadeColor('#f5d485', shade);
  const hiColor = shadeColor('#fff8c0', shade);
  for (const [ox, oy] of offsets) {
    const ex = cx + pw * ox, ey = by - ph * (0.04 + oy);
    ctx.beginPath();
    ctx.ellipse(ex, ey, pw * 0.08, ph * 0.04, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ex - pw * 0.01, ey - ph * 0.01, pw * 0.03, ph * 0.015, 0, 0, Math.PI * 2);
    ctx.fillStyle = hiColor;
    ctx.fill();
  }
}

function drawPotion(ctx, cx, by, pw, ph, shade) {
  const bodyColor = shadeColor('#4fc3f7', shade);
  const hiColor   = shadeColor('#a0e8ff', shade);
  const capColor  = shadeColor('#b87a28', shade);

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, by - ph * 0.14, pw * 0.07, ph * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();

  // Highlight
  ctx.beginPath();
  ctx.ellipse(cx - pw * 0.02, by - ph * 0.17, pw * 0.03, ph * 0.05, 0, 0, Math.PI * 2);
  ctx.fillStyle = hiColor;
  ctx.fill();

  // Neck
  ctx.fillStyle = capColor;
  ctx.fillRect(cx - pw * 0.02, by - ph * 0.29, pw * 0.04, ph * 0.05);

  // Stopper
  ctx.fillRect(cx - pw * 0.03, by - ph * 0.34, pw * 0.06, ph * 0.03);
}

function drawKhopesh(ctx, cx, by, pw, ph, shade) {
  const bladeColor  = shadeColor('#c8c8c8', shade);
  const handleColor = shadeColor('#3a2010', shade);

  // Handle
  ctx.fillStyle = handleColor;
  ctx.fillRect(cx - pw * 0.015, by - ph * 0.20, pw * 0.03, ph * 0.18);

  // Blade — sickle shape
  fillPoly(ctx, [
    [cx,             by - ph * 0.20],
    [cx + pw * 0.18, by - ph * 0.22],
    [cx + pw * 0.22, by - ph * 0.30],
    [cx + pw * 0.10, by - ph * 0.38],
    [cx + pw * 0.02, by - ph * 0.30],
  ], bladeColor);
}

function drawShield(ctx, cx, by, pw, ph, shade) {
  const outerColor  = shadeColor('#b87a28', shade);
  const innerColor  = shadeColor('#8b5e1a', shade);
  const bossColor   = shadeColor('#f5d485', shade);
  const ey = by - ph * 0.17;

  ctx.beginPath();
  ctx.ellipse(cx, ey, pw * 0.12, ph * 0.15, 0, 0, Math.PI * 2);
  ctx.fillStyle = outerColor;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, ey, pw * 0.078, ph * 0.0975, 0, 0, Math.PI * 2);
  ctx.fillStyle = innerColor;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, ey, pw * 0.018, ph * 0.0225, 0, 0, Math.PI * 2);
  ctx.fillStyle = bossColor;
  ctx.fill();
}
