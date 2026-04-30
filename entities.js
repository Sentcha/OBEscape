const ENEMY_TYPE = {
  SCARAB:       'scarab',
  SNAKE:        'snake',
  HOLLOW:       'hollow',
  MUMMY:        'mummy',
  ANUBIS_GUARD: 'anubisGuard',
};

// Enemy types available on each dungeon level.
const LEVEL_ENEMIES = {
  1: ['scarab'],
  2: ['scarab', 'snake'],
  3: ['snake', 'hollow'],
  4: ['hollow', 'mummy', 'anubisGuard'],
  5: ['mummy', 'anubisGuard'],
};

const ENEMY_STATS = {
  scarab:      { hp: 6,  maxHp: 6,  attack: 4, defense: 1 },
  snake:       { hp: 5,  maxHp: 5,  attack: 5, defense: 0 },
  hollow:      { hp: 7,  maxHp: 7,  attack: 3, defense: 0 },
  mummy:       { hp: 12, maxHp: 12, attack: 4, defense: 3 },
  anubisGuard: { hp: 20, maxHp: 20, attack: 7, defense: 6 },
};

// Scan the map for TILE.ENEMY markers, convert each to a live enemy object,
// and replace the tile with TILE.FLOOR so the map stays walkable.
function loadEnemies(map, dungeonLevel) {
  const pool = LEVEL_ENEMIES[dungeonLevel] || ['scarab'];
  const enemies = [];
  for (let y = 0; y < map.length; y++)
    for (let x = 0; x < map[y].length; x++)
      if (map[y][x] === TILE.ENEMY) {
        const type  = pool[Math.floor(Math.random() * pool.length)];
        const stats = ENEMY_STATS[type];
        enemies.push({ x, y, type, hp: stats.hp, maxHp: stats.maxHp });
        map[y][x] = TILE.FLOOR;
      }
  return enemies;
}

// Dispatch to the correct sprite function.
// All sprites are drawn relative to the far portal rectangle.
function drawEnemy(ctx, far, shade, type) {
  const cx = (far.l + far.r) / 2;
  const by = far.b;
  const pw = far.r - far.l;
  const ph = far.b - far.t;
  switch (type) {
    case ENEMY_TYPE.SCARAB:       drawScarab     (ctx, cx, by, pw, ph, shade); break;
    case ENEMY_TYPE.SNAKE:        drawSnake      (ctx, cx, by, pw, ph, shade); break;
    case ENEMY_TYPE.HOLLOW:       drawHollow     (ctx, cx, by, pw, ph, shade); break;
    case ENEMY_TYPE.MUMMY:        drawMummy      (ctx, cx, by, pw, ph, shade); break;
    case ENEMY_TYPE.ANUBIS_GUARD: drawAnubisGuard(ctx, cx, by, pw, ph, shade); break;
  }
}

// ---------------------------------------------------------------------------
// Sprite helpers
// ---------------------------------------------------------------------------

function drawEllipse(ctx, ex, ey, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Scarab — wide low beetle
// ---------------------------------------------------------------------------
function drawScarab(ctx, cx, by, pw, ph, shade) {
  const bx = cx;
  const by2 = by - ph * 0.22;

  // Carapace
  drawEllipse(ctx, bx, by2, pw * 0.28, ph * 0.18, shadeColor('#3a0a0a', shade));
  // Shell highlight
  drawEllipse(ctx, bx, by2, pw * 0.154, ph * 0.072, shadeColor('#7a1818', shade));

  // Head
  const hx = bx, hy = by2 - ph * 0.22;
  drawEllipse(ctx, hx, hy, pw * 0.09, ph * 0.07, shadeColor('#2a0808', shade));

  // Legs — 3 per side, angled outward
  const legColor = shadeColor('#1a0505', shade);
  const bodyLeft  = bx - pw * 0.26;
  const bodyRight = bx + pw * 0.26;
  const legAngles = [-0.4, 0, 0.4]; // radians from horizontal
  const legLen = pw * 0.18;
  for (const ang of legAngles) {
    // Left legs extend to the left
    ctx.save();
    ctx.translate(bodyLeft, by2);
    ctx.rotate(Math.PI + ang);
    ctx.fillStyle = legColor;
    ctx.fillRect(-legLen, -1, legLen, 2);
    ctx.restore();
    // Right legs extend to the right
    ctx.save();
    ctx.translate(bodyRight, by2);
    ctx.rotate(ang);
    ctx.fillStyle = legColor;
    ctx.fillRect(0, -1, legLen, 2);
    ctx.restore();
  }

  // Antennae from head
  const antColor = shadeColor('#1a0505', shade);
  ctx.strokeStyle = antColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx - pw * 0.04, hy - ph * 0.04);
  ctx.lineTo(hx - pw * 0.12, hy - ph * 0.14);
  ctx.moveTo(hx + pw * 0.04, hy - ph * 0.04);
  ctx.lineTo(hx + pw * 0.12, hy - ph * 0.14);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Snake — low S-curve silhouette
// ---------------------------------------------------------------------------
function drawSnake(ctx, cx, by, pw, ph, shade) {
  const bodyColor = shadeColor('#1a2a10', shade);
  const rx = pw * 0.15, ry = ph * 0.08;

  // Three overlapping ellipses forming the S-body
  drawEllipse(ctx, cx - pw * 0.10, by - ph * 0.55, rx, ry, bodyColor);
  drawEllipse(ctx, cx + pw * 0.10, by - ph * 0.35, rx, ry, bodyColor);
  drawEllipse(ctx, cx - pw * 0.10, by - ph * 0.18, rx, ry, bodyColor);

  // Head — small elongated ellipse at the top
  const hx = cx - pw * 0.10, hy = by - ph * 0.63;
  drawEllipse(ctx, hx, hy, pw * 0.08, ph * 0.06, bodyColor);

  // Forked tongue
  fillPoly(ctx, [
    [hx,            hy - ph * 0.065],
    [hx - pw * 0.05, hy - ph * 0.11],
    [hx - pw * 0.02, hy - ph * 0.09],
    [hx,            hy - ph * 0.085],
    [hx + pw * 0.02, hy - ph * 0.09],
    [hx + pw * 0.05, hy - ph * 0.11],
  ], shadeColor('#e03030', shade));
}

// ---------------------------------------------------------------------------
// Hollow — tall gaunt humanoid; colour close to wall to look unsettling
// ---------------------------------------------------------------------------
function drawHollow(ctx, cx, by, pw, ph, shade) {
  const color = shadeColor('#3a3028', shade);
  const bw = pw * 0.18;
  const bh = ph * 0.55;
  const bx = cx - bw / 2;
  const bt = by - bh;

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(bx, bt, bw, bh);

  // Shoulders — slightly wider strip at top of body
  const sw = pw * 0.28;
  ctx.fillRect(cx - sw / 2, bt, sw, ph * 0.06);

  // Head ellipse
  const hy = bt - ph * 0.10;
  drawEllipse(ctx, cx, hy, pw * 0.11, ph * 0.10, color);

  // Eye sockets
  const eyeColor = shadeColor('#0a0808', shade);
  const ew = pw * 0.03, eh = ph * 0.025;
  ctx.fillStyle = eyeColor;
  ctx.fillRect(cx - pw * 0.07 - ew / 2, hy - eh / 2, ew, eh);
  ctx.fillRect(cx + pw * 0.07 - ew / 2, hy - eh / 2, ew, eh);
}

// ---------------------------------------------------------------------------
// Mummy — boxy wrapped figure
// ---------------------------------------------------------------------------
function drawMummy(ctx, cx, by, pw, ph, shade) {
  const bw = pw * 0.22;
  const bh = ph * 0.60;
  const bx = cx - bw / 2;
  const bt = by - bh;

  // Body
  ctx.fillStyle = shadeColor('#7a6a50', shade);
  ctx.fillRect(bx, bt, bw, bh);

  // Wrapping stripes
  const stripeColor = shadeColor('#3a3020', shade);
  ctx.fillStyle = stripeColor;
  const stripes = 6;
  for (let i = 1; i <= stripes; i++) {
    const sy = bt + (bh / (stripes + 1)) * i;
    ctx.fillRect(bx, sy, bw, ph * 0.03);
  }

  // Head — square-ish
  const hw = bw * 0.9;
  const hh = ph * 0.12;
  const hx = cx - hw / 2;
  ctx.fillStyle = shadeColor('#8a7a60', shade);
  ctx.fillRect(hx, bt - hh, hw, hh);

  // Arms — thin horizontal rects
  const aw = pw * 0.14, ah = ph * 0.04;
  const ay = bt + bh * 0.25;
  ctx.fillStyle = shadeColor('#7a6a50', shade);
  ctx.fillRect(bx - aw, ay, aw, ah);
  ctx.fillRect(bx + bw, ay, aw, ah);
}

// ---------------------------------------------------------------------------
// Anubis Guard — armoured jackal-headed figure
// ---------------------------------------------------------------------------
function drawAnubisGuard(ctx, cx, by, pw, ph, shade) {
  const bodyColor = shadeColor('#1a1a2a', shade);
  const goldColor = shadeColor('#f5d485', shade);
  const staffColor = shadeColor('#8b5e1a', shade);

  const spriteTop = by - ph * 0.88;

  // Staff — thin rect to the left of the body
  const staffX = cx - pw * 0.28;
  ctx.fillStyle = staffColor;
  ctx.fillRect(staffX, spriteTop, pw * 0.025, ph * 0.88);

  // Body — trapezoid wide at shoulders, narrow at feet
  const shoulderW = pw * 0.30;
  const feetW     = pw * 0.16;
  const bodyTop   = by - ph * 0.58;
  fillPoly(ctx, [
    [cx - shoulderW / 2, bodyTop],
    [cx + shoulderW / 2, bodyTop],
    [cx + feetW     / 2, by],
    [cx - feetW     / 2, by],
  ], bodyColor);

  // Shoulder gold accent line
  ctx.fillStyle = goldColor;
  ctx.fillRect(cx - shoulderW / 2, bodyTop, shoulderW, 2);

  // Neck
  const neckW = pw * 0.10;
  const neckTop = bodyTop - ph * 0.06;
  ctx.fillStyle = bodyColor;
  ctx.fillRect(cx - neckW / 2, neckTop, neckW, ph * 0.06);

  // Jackal head — elongated snout pointing left-ish
  const headCx = cx;
  const headCy = neckTop - ph * 0.12;
  drawEllipse(ctx, headCx, headCy, pw * 0.09, ph * 0.10, bodyColor);

  // Snout
  fillPoly(ctx, [
    [headCx - pw * 0.06, headCy - ph * 0.03],
    [headCx - pw * 0.20, headCy + ph * 0.02],
    [headCx - pw * 0.06, headCy + ph * 0.05],
  ], bodyColor);

  // Pointed ears
  fillPoly(ctx, [
    [headCx - pw * 0.04, headCy - ph * 0.10],
    [headCx - pw * 0.10, headCy - ph * 0.22],
    [headCx + pw * 0.01, headCy - ph * 0.10],
  ], bodyColor);
  fillPoly(ctx, [
    [headCx + pw * 0.04, headCy - ph * 0.10],
    [headCx + pw * 0.10, headCy - ph * 0.22],
    [headCx + pw * 0.15, headCy - ph * 0.10],
  ], bodyColor);

  // Eye accent (gold dot)
  drawEllipse(ctx, headCx + pw * 0.04, headCy - ph * 0.02, pw * 0.018, ph * 0.018, goldColor);
}
