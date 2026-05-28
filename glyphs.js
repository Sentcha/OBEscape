// Per-level seed — randomised on each new level so decorations differ between runs.
let glyphSeed = (Math.random() * 0x7fffffff) | 0;

function newGlyphSeed() {
  glyphSeed = (Math.random() * 0x7fffffff) | 0;
}

// Deterministic hash → float [0, 1) seeded by (x, y, side) and the current level seed.
function hash31(x, y, side) {
  let h = (x * 374761393 ^ y * 1073741827 ^ side * 668265263 ^ glyphSeed) | 0;
  h ^= h >>> 16;
  h  = Math.imul(h, 0x45d9f3b) | 0;
  h ^= h >>> 15;
  return (h >>> 0) / 0x100000000;
}

// --- Individual glyph draw functions ---
// Each draws a single symbol centred at (cx, cy).
// 's' is the half-height of the bounding box.
// ctx stroke style, lineWidth, and globalAlpha are pre-set by maybeDrawGlyph.

function drawAnkh(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.35, s * 0.20, s * 0.22, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.13);
  ctx.lineTo(cx, cy + s * 0.50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.30, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.30, cy + s * 0.05);
  ctx.stroke();
}

function drawEye(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.40, cy);
  ctx.bezierCurveTo(cx - s * 0.20, cy - s * 0.25, cx + s * 0.20, cy - s * 0.25, cx + s * 0.40, cy);
  ctx.bezierCurveTo(cx + s * 0.20, cy + s * 0.25, cx - s * 0.20, cy + s * 0.25, cx - s * 0.40, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.40, cy);
  ctx.bezierCurveTo(cx - s * 0.55, cy + s * 0.10, cx - s * 0.45, cy + s * 0.35, cx - s * 0.28, cy + s * 0.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy - s * 0.18);
  ctx.quadraticCurveTo(cx, cy - s * 0.40, cx + s * 0.35, cy - s * 0.18);
  ctx.stroke();
}

function drawScarab(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.10, s * 0.22, s * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.28, s * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.22, cy + s * 0.05);
  ctx.bezierCurveTo(cx - s * 0.42, cy - s * 0.08, cx - s * 0.50, cy + s * 0.15, cx - s * 0.38, cy + s * 0.32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.22, cy + s * 0.05);
  ctx.bezierCurveTo(cx + s * 0.42, cy - s * 0.08, cx + s * 0.50, cy + s * 0.15, cx + s * 0.38, cy + s * 0.32);
  ctx.stroke();
}

function drawDjed(ctx, cx, cy, s) {
  const bars = 4, baseW = s * 0.35, barH = s * 0.14, shaftW = s * 0.10;
  const baseY = cy + s * 0.30, topY = baseY - bars * barH;
  ctx.beginPath();
  ctx.moveTo(cx - shaftW, baseY); ctx.lineTo(cx - shaftW, topY);
  ctx.moveTo(cx + shaftW, baseY); ctx.lineTo(cx + shaftW, topY);
  ctx.moveTo(cx - baseW, baseY);  ctx.lineTo(cx + baseW, baseY);
  ctx.stroke();
  for (let i = 0; i < bars; i++) {
    const w = baseW * (1 - i * 0.08);
    const y = baseY - (i + 1) * barH;
    ctx.beginPath();
    ctx.moveTo(cx - w, y); ctx.lineTo(cx + w, y);
    ctx.stroke();
  }
}

function drawWas(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.50);
  ctx.lineTo(cx, cy + s * 0.32);
  ctx.moveTo(cx, cy + s * 0.32); ctx.lineTo(cx - s * 0.20, cy + s * 0.50);
  ctx.moveTo(cx, cy + s * 0.32); ctx.lineTo(cx + s * 0.10, cy + s * 0.50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.50);
  ctx.bezierCurveTo(cx + s * 0.10, cy - s * 0.48, cx + s * 0.20, cy - s * 0.36, cx + s * 0.14, cy - s * 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.04, cy - s * 0.42);
  ctx.lineTo(cx + s * 0.16, cy - s * 0.52);
  ctx.stroke();
}

function drawCartouche(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, s * 0.24, s * 0.46, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const t    = (i + 1) / 5;
    const ly   = cy - s * 0.38 + t * s * 0.76;
    const relY = (ly - cy) / (s * 0.46);
    const hw   = s * 0.24 * Math.sqrt(Math.max(0, 1 - relY * relY)) * 0.80;
    ctx.beginPath();
    ctx.moveTo(cx - hw, ly); ctx.lineTo(cx + hw, ly);
    ctx.stroke();
  }
}

function drawFeather(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.50);
  ctx.bezierCurveTo(cx - s * 0.26, cy + s * 0.20, cx - s * 0.26, cy - s * 0.30, cx, cy - s * 0.50);
  ctx.bezierCurveTo(cx + s * 0.26, cy - s * 0.30, cx + s * 0.26, cy + s * 0.20, cx, cy + s * 0.50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.50); ctx.lineTo(cx, cy + s * 0.50);
  ctx.stroke();
  for (let i = -3; i <= 3; i++) {
    const ly   = cy + i * s * 0.14;
    const relY = (ly - cy) / (s * 0.50);
    const hw   = s * 0.24 * Math.sqrt(Math.max(0, 1 - relY * relY)) * 0.80;
    if (hw < 1.5) continue;
    ctx.beginPath();
    ctx.moveTo(cx - hw, ly); ctx.lineTo(cx, ly);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, ly); ctx.lineTo(cx + hw, ly);
    ctx.stroke();
  }
}

function drawSunDisc(ctx, cx, cy, s) {
  const r = s * 0.24;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r + s * 0.07), cy + Math.sin(a) * (r + s * 0.07));
    ctx.lineTo(cx + Math.cos(a) * (r + s * 0.20), cy + Math.sin(a) * (r + s * 0.20));
    ctx.stroke();
  }
}

const GLYPHS = [drawAnkh, drawEye, drawScarab, drawDjed, drawWas, drawCartouche, drawFeather, drawSunDisc];

const DECO_DENSITY = 0.10;

// Draw a glyph on a wall face centred at (cx, cy) with the given available size and shade.
// mapX/mapY/side uniquely identify the wall face; the hash determines whether to draw and which glyph.
function maybeDrawGlyph(ctx, cx, cy, size, shade, mapX, mapY, side) {
  if (hash31(mapX, mapY, side) >= DECO_DENSITY) return;
  const s = Math.min(size, 70);
  if (s < 5) return;
  const fn = GLYPHS[Math.floor(hash31(mapX + 97, mapY + 31, side) * GLYPHS.length)];
  ctx.save();
  ctx.globalAlpha = 0.70 * shade;
  ctx.strokeStyle = '#f5d485';
  ctx.lineWidth   = Math.max(1, s * 0.055);
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  fn(ctx, cx, cy, s);
  ctx.restore();
}
