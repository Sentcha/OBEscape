const CANVAS_W = 800;
const CANVAS_H = 960;
const CX = CANVAS_W / 2;    // 400
const CY = CANVAS_H / 2;    // 480
const VIEW_TOP = 180;        // CY - 300
const VIEW_BOT = 780;        // CY + 300

// A "portal" is the rectangular cross-section of the corridor at a given depth.
// 1/d perspective: each deeper portal is proportionally smaller, converging on the center.
function makePortal(d) {
  return {
    l: Math.round(CX - 280 / d),
    r: Math.round(CX + 280 / d),
    t: Math.round(CY - 200 / d),
    b: Math.round(CY + 200 / d),
  };
}

// Per-level colour palette: warm Egyptian sandstone (levels 1–2) →
// grey-green stone (3–4) → cold alien metal (5).
function getPalette(level) {
  if (level <= 2) return {
    ceiling:     '#0a0a1a',
    floor:       '#c2a256',
    wallBack:    '#d4933a',
    wallSide:    '#b87a28',
    bandDark:    '#a06820',
    bandAccent:  '#f0c060',
    glyphColor:  '#f5d485',
    mortar:      '#4a2a0a',
    stoneBlocks: true,
  };
  if (level <= 4) return {
    ceiling:    '#080a10',
    floor:      '#8a9a78',
    wallBack:   '#7a8a6a',
    wallSide:   '#5a6a4a',
    bandDark:   '#4a5a3a',
    bandAccent: '#b0c090',
    glyphColor: '#90b070',
  };
  return {
    ceiling:    '#040408',
    floor:      '#303038',
    wallBack:   '#2a2a36',
    wallSide:   '#1a1a28',
    bandDark:   '#18181f',
    bandAccent: '#5060a0',
    glyphColor: '#7080c0',
  };
}

// Brightness at each depth. Starts at 1.0 (full) and fades by 0.15 per step,
// flooring at 0.05 so distant walls remain just barely visible.
function shadeAtDepth(d) {
  return Math.max(0.05, 1.0 - (d - 1) * 0.15);
}

// Multiply each RGB channel of a hex color by `factor` to simulate distance darkness.
function shadeColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

// Draw a staircase on the floor in the corridor section leading to a stairs tile.
// Fills the floor trapezoid (between near and far portals' bottom edges) with
// alternating tread/riser bands that converge toward the vanishing point.
// Width is 80% of the corridor, centred, so the staircase reads as a tile
// feature rather than a full-floor fill.
function drawStairs(ctx, near, far, shade) {
  const N = 5;

  const m = 0.10;
  const nw = near.r - near.l;
  const fw = far.r  - far.l;
  const nl = near.l + nw * m,  nr = near.r - nw * m;
  const fl = far.l  + fw * m,  fr = far.r  - fw * m;

  for (let i = 0; i < N; i++) {
    const t0 = 1 - i / N;
    const t1 = 1 - (i + 1) / N;

    const y0  = Math.round(far.b + t0 * (near.b - far.b));
    const y1  = Math.round(far.b + t1 * (near.b - far.b));
    const xl0 = Math.round(fl + t0 * (nl - fl));
    const xr0 = Math.round(fr + t0 * (nr - fr));
    const xl1 = Math.round(fl + t1 * (nl - fl));
    const xr1 = Math.round(fr + t1 * (nr - fr));

    const bandShade = shade * (1.0 - (i / (N - 1)) * 0.80);
    const color = i % 2 === 0
      ? shadeColor('#d4a840', bandShade)
      : shadeColor('#281200', bandShade);

    fillPoly(ctx, [[xl1, y1], [xr1, y1], [xr0, y0], [xl0, y0]], color);
  }
}

// Draw a filled polygon from an array of [x, y] coordinate pairs.
function fillPoly(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Draw horizontal architectural bands (top frieze + dado rail) on a rectangular wall.
function drawWallBandsRect(ctx, l, t, r, b, shade, palette) {
  const h = b - t, w = r - l;
  if (h < 8 || w < 4) return;
  const frH = Math.max(2, Math.round(h * 0.10));
  const drH = Math.max(2, Math.round(h * 0.18));
  ctx.fillStyle = shadeColor(palette.bandDark, shade);
  ctx.fillRect(l, t, w, frH);
  ctx.fillStyle = shadeColor(palette.bandAccent, shade);
  ctx.fillRect(l, t + frH - 1, w, 2);
  ctx.fillStyle = shadeColor(palette.bandDark, shade);
  ctx.fillRect(l, b - drH, w, drH);
  ctx.fillStyle = shadeColor(palette.bandAccent, shade);
  ctx.fillRect(l, b - drH, w, 2);
}

// Draw horizontal architectural bands on a trapezoidal wall face.
// x0/y0t/y0b = one vertical edge; x1/y1t/y1b = the other vertical edge.
function drawWallBandsTrap(ctx, x0, y0t, y0b, x1, y1t, y1b, shade, palette) {
  const h0 = y0b - y0t, h1 = y1b - y1t;
  if (h0 < 8 || h1 < 8 || Math.abs(x1 - x0) < 2) return;
  const fr = 0.10, dr = 0.18;
  fillPoly(ctx,
    [[x0, y0t], [x1, y1t], [x1, y1t + h1 * fr], [x0, y0t + h0 * fr]],
    shadeColor(palette.bandDark, shade));
  fillPoly(ctx,
    [[x0, y0t + h0 * fr - 1], [x1, y1t + h1 * fr - 1],
     [x1, y1t + h1 * fr + 1], [x0, y0t + h0 * fr + 1]],
    shadeColor(palette.bandAccent, shade));
  fillPoly(ctx,
    [[x0, y0b - h0 * dr], [x1, y1b - h1 * dr], [x1, y1b], [x0, y0b]],
    shadeColor(palette.bandDark, shade));
  fillPoly(ctx,
    [[x0, y0b - h0 * dr - 1], [x1, y1b - h1 * dr - 1],
     [x1, y1b - h1 * dr + 1], [x0, y0b - h0 * dr + 1]],
    shadeColor(palette.bandAccent, shade));
}

// Mortar joint thickness as a fraction of wall-face height (shared by back and
// side walls so the brickwork weight matches across orientations).
const MORTAR_FRAC = 0.005;

// Draw stone masonry block joints on a rectangular wall face (back walls, flat extensions).
// Produces a running-bond brick pattern: 3 rows with staggered vertical joints.
// anchorX/brickW world-anchor the vertical joints so a face that only partly faces
// the player still shows correctly-scaled bricks (the rest clipped out of view).
function drawStoneBlocksBack(ctx, l, t, r, b, shade, palette, anchorX = l, brickW = (r - l) / 2) {
  const h = b - t, w = r - l;
  if (h < 12 || w < 8 || brickW < 1) return;
  const mc = shadeColor(palette.mortar, shade);
  const mw = Math.max(1, Math.round(h * MORTAR_FRAC));

  // Horizontal joints at 1/3 and 2/3 of height
  ctx.fillStyle = mc;
  for (const f of [1 / 3, 2 / 3]) {
    ctx.fillRect(l, Math.round(t + h * f) - Math.floor(mw / 2), w, mw);
  }

  // Vertical joints — running bond anchored to the world grid: non-offset courses
  // (top/bottom) at anchorX + k*brickW; middle course offset by a half brick.
  // Joints outside [l, r] are clipped, so off-view bricks fall away instead of
  // being compressed into the visible face.
  const rows  = [[0, 1/3], [1/3, 2/3], [2/3, 1]];
  const phase = [0, 0.5, 0];                 // half-brick offset for the middle course
  for (let i = 0; i < rows.length; i++) {
    const yt = Math.round(t + h * rows[i][0]);
    const yb = Math.round(t + h * rows[i][1]);
    const k0 = Math.ceil((l - anchorX) / brickW - phase[i]);
    for (let x = anchorX + (k0 + phase[i]) * brickW; x <= r; x += brickW) {
      if (x < l) continue;                   // skip joints before the left edge
      ctx.fillStyle = mc;
      ctx.fillRect(Math.round(x) - Math.floor(mw / 2), yt, mw, yb - yt);
    }
  }
}

// Draw stone masonry joints on a trapezoidal side wall face, matching the
// running-bond brick grid of back walls (drawStoneBlocksBack) but skewed for
// perspective. proj = { p, sign, dNear, dFar } describes the depth projection:
// a line of constant world depth D projects to a vertical screen line at
// x = CX + sign * p / D. dNear/dFar are the world depths at edges x0/x1.
function drawStoneBlocksSide(ctx, x0, y0t, y0b, x1, y1t, y1b, shade, palette, proj = null) {
  const h0 = y0b - y0t, h1 = y1b - y1t;
  if (h0 < 12 || h1 < 12 || Math.abs(x1 - x0) < 2) return;
  const mc = shadeColor(palette.mortar, shade);

  // Horizontal joints — thickness tapers with local height to match back walls.
  const mw0 = Math.max(1, h0 * MORTAR_FRAC) / 2;   // half-thickness at edge x0
  const mw1 = Math.max(1, h1 * MORTAR_FRAC) / 2;   // half-thickness at edge x1
  for (const f of [1 / 3, 2 / 3]) {
    const c0 = y0t + h0 * f, c1 = y1t + h1 * f;
    fillPoly(ctx, [
      [x0, c0 - mw0], [x1, c1 - mw1],
      [x1, c1 + mw1], [x0, c0 + mw0],
    ], mc);
  }
  if (!proj) return;

  // Vertical joints — player-relative running-bond grid (brick depth = 0.5 tile),
  // same pattern as the back wall: top/bottom courses joint-centred, middle course
  // offset by a half brick. Mortar thickness scales with local height to match.
  const { p, sign, dNear, dFar } = proj;
  const dLo = Math.min(dNear, dFar), dHi = Math.max(dNear, dFar);
  const xMin = Math.min(x0, x1), xMax = Math.max(x0, x1);
  const rows  = [[0, 1/3], [1/3, 2/3], [2/3, 1]];
  const phase = [0, 0.25, 0];          // running-bond phase per course (tiles)
  const STEP  = 0.5;                    // brick depth in tiles
  for (let i = 0; i < rows.length; i++) {
    const k = Math.ceil((dLo - phase[i]) / STEP);
    for (let D = phase[i] + k * STEP; D <= dHi + 1e-6; D += STEP) {
      if (D <= dLo + 1e-6) continue;             // near edge belongs to the nearer segment
      const vx = CX + sign * p / D;              // constant-depth line → vertical
      if (vx < xMin - 1 || vx > xMax + 1) continue;
      const t  = (vx - x0) / (x1 - x0);
      const et = y0t + t * (y1t - y0t);
      const eb = y0b + t * (y1b - y0b);
      const yt = et + rows[i][0] * (eb - et);
      const yb = et + rows[i][1] * (eb - et);
      const mw = Math.max(1, Math.round((eb - et) * MORTAR_FRAC));   // match back-wall weight
      ctx.fillStyle = mc;
      ctx.fillRect(Math.round(vx) - Math.floor(mw / 2), Math.round(yt), mw, Math.round(yb - yt));
    }
  }
}

// Composites stone blocks + decorative bands on rectangular and trapezoidal walls.
// Stone blocks drawn first so band paint covers the joint lines at the edges.
function drawWallSurfaceRect(ctx, l, t, r, b, shade, palette, anchorX, brickW) {
  if (palette.stoneBlocks) drawStoneBlocksBack(ctx, l, t, r, b, shade, palette, anchorX, brickW);
  drawWallBandsRect(ctx, l, t, r, b, shade, palette);
}

function drawWallSurfaceTrap(ctx, x0, y0t, y0b, x1, y1t, y1b, shade, palette, proj = null) {
  if (palette.stoneBlocks) drawStoneBlocksSide(ctx, x0, y0t, y0b, x1, y1t, y1b, shade, palette, proj);
  drawWallBandsTrap(ctx, x0, y0t, y0b, x1, y1t, y1b, shade, palette);
}

// Draw a perspective-correct stone tile grid on the floor.
// Two lateral lines per side (wider flagstone cells) and depth boundary lines.
function drawFloorGrid(ctx, maxDepth, palette) {
  ctx.save();
  ctx.lineWidth = palette.stoneBlocks ? 2 : 1;

  ctx.strokeStyle = shadeColor(palette.floor, palette.stoneBlocks ? 0.45 : 0.60);
  ctx.globalAlpha = palette.stoneBlocks ? 0.70 : 0.55;
  ctx.beginPath();
  for (let i = 1; i <= 2; i++) {
    const xR = CX + (i / 3) * (CANVAS_W / 2);
    const xL = CX - (i / 3) * (CANVAS_W / 2);
    ctx.moveTo(xR, VIEW_BOT); ctx.lineTo(CX, CY);
    ctx.moveTo(xL, VIEW_BOT); ctx.lineTo(CX, CY);
  }
  ctx.stroke();

  for (let d = 1; d <= maxDepth; d++) {
    const { b: y } = makePortal(d);
    ctx.strokeStyle = shadeColor(palette.floor, shadeAtDepth(d) * (palette.stoneBlocks ? 0.45 : 0.60));
    ctx.globalAlpha = palette.stoneBlocks ? 0.65 : 0.50;
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }

  ctx.restore();
}

// Render the first-person corridor view.
//
// scene: array built by buildScene — one entry per depth level.
//   Each entry: { back, stairs, left, right, leftFlat, rightFlat }
//
function renderView(ctx, scene) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, VIEW_TOP, CANVAS_W, VIEW_BOT - VIEW_TOP);
  ctx.clip();

  const palette = getPalette(player.dungeonLevel);

  // 1. Background: ceiling (top of view to centre) and floor (centre to bottom of view).
  ctx.fillStyle = palette.ceiling;
  ctx.fillRect(0, VIEW_TOP, CANVAS_W, CY - VIEW_TOP);

  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, CY, CANVAS_W, VIEW_BOT - CY);

  // 2. Floor tile grid — drawn before walls so painter's algorithm hides it correctly.
  drawFloorGrid(ctx, scene.length, palette);

  // 3. Painter's algorithm — draw deepest depth first, depth 1 last.
  //    This ensures nearer walls paint over farther ones.
  const maxDepth = scene.length;
  const fwd = DIR[player.facing];
  const lft = { dx: fwd.dy,  dy: -fwd.dx };
  const rgt = { dx: -fwd.dy, dy:  fwd.dx };

  // Absolute world-space face directions for stable glyph hashing.
  // These are invariant to player orientation so the same wall face always gets the same glyph.
  const absFaceBack  = (player.facing + 2) % 4;
  const absFaceLeft  = (player.facing + 1) % 4;
  const absFaceRight = (player.facing + 3) % 4;

  for (let d = maxDepth; d >= 1; d--) {
    const s     = scene[d - 1];
    const far   = makePortal(d);
    // For depth 1, the "near" boundary is the view edge (not the full canvas).
    const near  = d > 1 ? makePortal(d - 1) : { l: 0, r: CANVAS_W, t: VIEW_TOP, b: VIEW_BOT };
    const shade = shadeAtDepth(d);
    const fx    = player.x + d * fwd.dx;
    const fy    = player.y + d * fwd.dy;
    const nx    = player.x + (d - 1) * fwd.dx;
    const ny    = player.y + (d - 1) * fwd.dy;

    // Back wall: a flat rectangle filling the portal at this depth.
    if (s.back) {
      ctx.fillStyle = shadeColor(palette.wallBack, shade);
      ctx.fillRect(far.l, far.t, far.r - far.l, far.b - far.t);
      drawWallSurfaceRect(ctx, far.l, far.t, far.r, far.b, shade, palette);
      const sz = Math.min(far.r - far.l, far.b - far.t) * 0.30;
      maybeDrawGlyph(ctx, (far.l + far.r) / 2, (far.t + far.b) / 2, sz, shade, fx, fy, absFaceBack, palette.glyphColor);
    }

    // Stairs: alternating tread/riser bands drawn on the floor ahead of the tile.
    if (s.stairs) drawStairs(ctx, near, far, shade);

    // Item sprite: drawn on the floor of the far portal.
    if (s.item)   drawItem  (ctx, far, shade, s.item.type);

    // Corpse: flat dark mark left where an enemy died.
    if (s.corpse) drawCorpse(ctx, far, shade, s.corpse.type);

    // Enemy sprite: drawn centred in the far portal, on top of the back wall.
    if (s.enemy)  drawEnemy (ctx, far, shade, s.enemy.type);

    // Left wall: either a flat extension of the back wall, or a perspective trapezoid.
    if (s.left) {
      if (s.leftFlat) {
        if (s.leftParallel && 3 * far.l - 2 * CX > 0) {
          const wx_far  = Math.max(0, 3 * far.l  - 2 * CX);
          const wx_near = Math.max(0, 3 * near.l - 2 * CX);
          fillPoly(ctx, [
            [wx_near, near.t],
            [wx_far,  far.t],
            [wx_far,  far.b],
            [wx_near, near.b],
          ], shadeColor(palette.wallSide, shade));
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(wx_near, near.t); ctx.lineTo(wx_far, far.t);
          ctx.lineTo(wx_far, far.b);   ctx.lineTo(wx_near, near.b);
          ctx.closePath(); ctx.clip();
          drawWallSurfaceTrap(ctx, wx_near, near.t, near.b, wx_far, far.t, far.b, shade, palette, { p: 840, sign: -1, dNear: d - 1, dFar: d });
          maybeDrawGlyph(ctx, CX - 840 / (d - 0.5), CY, 120 / (d - 0.5), shade, fx + lft.dx, fy + lft.dy, absFaceBack, palette.glyphColor);
          ctx.restore();
        } else {
          // Side was closed before this depth: branch end — draw perpendicular face.
          ctx.fillStyle = shadeColor(palette.wallBack, shade);
          ctx.fillRect(near.l, far.t, far.l - near.l, far.b - far.t);
          drawWallSurfaceRect(ctx, near.l, far.t, far.l, far.b, shade, palette, far.l, (far.r - far.l) / 2);
          ctx.save();
          ctx.beginPath();
          ctx.rect(near.l, far.t, far.l - near.l, far.b - far.t);
          ctx.clip();
          maybeDrawGlyph(ctx, (near.l + far.l) / 2, (far.t + far.b) / 2, 120 / d, shade, fx + lft.dx, fy + lft.dy, absFaceBack, palette.glyphColor);
          ctx.restore();
        }
      } else {
        fillPoly(ctx, [
          [near.l, near.t],
          [far.l,  far.t],
          [far.l,  far.b],
          [near.l, near.b],
        ], shadeColor(palette.wallSide, shade));
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(near.l, near.t); ctx.lineTo(far.l, far.t);
        ctx.lineTo(far.l, far.b);   ctx.lineTo(near.l, near.b);
        ctx.closePath(); ctx.clip();
        const gcxL = CX - 280 / (d - 0.5);
        drawWallSurfaceTrap(ctx, near.l, near.t, near.b, far.l, far.t, far.b, shade, palette, { p: 280, sign: -1, dNear: d - 1, dFar: d });
        const RL   = (far.l - near.l) * (d - 0.5) / 560;
        ctx.transform(RL, 0, 0, 1, gcxL * (1 - RL), 0);
        if (d > 1) maybeDrawGlyph(ctx, gcxL, CY, 120 / (d - 0.5), shade, nx + lft.dx, ny + lft.dy, absFaceLeft, palette.glyphColor);
        ctx.restore();
      }
    } else {
      // Side opening — outer wall of the parallel corridor.
      const wx_far  = Math.max(0, 3 * far.l  - 2 * CX);
      const wx_near = Math.max(0, 3 * near.l - 2 * CX);
      fillPoly(ctx, [
        [wx_near, near.t],
        [wx_far,  far.t],
        [wx_far,  far.b],
        [wx_near, near.b],
      ], shadeColor(palette.wallSide, shade));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(wx_near, near.t); ctx.lineTo(wx_far, far.t);
      ctx.lineTo(wx_far, far.b);   ctx.lineTo(wx_near, near.b);
      ctx.closePath(); ctx.clip();
      drawWallSurfaceTrap(ctx, wx_near, near.t, near.b, wx_far, far.t, far.b, shade, palette, { p: 840, sign: -1, dNear: d - 1, dFar: d });
      maybeDrawGlyph(ctx, CX - 840 / (d - 0.5), CY, 120 / (d - 0.5), shade, fx + lft.dx, fy + lft.dy, absFaceBack, palette.glyphColor);
      ctx.restore();
    }

    // Right wall: either a flat extension of the back wall, or a perspective trapezoid.
    if (s.right) {
      if (s.rightFlat) {
        if (s.rightParallel && 3 * far.r - 2 * CX < CANVAS_W) {
          const wx_far  = Math.min(CANVAS_W, 3 * far.r  - 2 * CX);
          const wx_near = Math.min(CANVAS_W, 3 * near.r - 2 * CX);
          fillPoly(ctx, [
            [wx_far,  far.t],
            [wx_near, near.t],
            [wx_near, near.b],
            [wx_far,  far.b],
          ], shadeColor(palette.wallSide, shade));
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(wx_far, far.t);   ctx.lineTo(wx_near, near.t);
          ctx.lineTo(wx_near, near.b); ctx.lineTo(wx_far, far.b);
          ctx.closePath(); ctx.clip();
          drawWallSurfaceTrap(ctx, wx_far, far.t, far.b, wx_near, near.t, near.b, shade, palette, { p: 840, sign: 1, dNear: d, dFar: d - 1 });
          maybeDrawGlyph(ctx, CX + 840 / (d - 0.5), CY, 120 / (d - 0.5), shade, fx + rgt.dx, fy + rgt.dy, absFaceBack, palette.glyphColor);
          ctx.restore();
        } else {
          // Side was closed before this depth: branch end — draw perpendicular face.
          ctx.fillStyle = shadeColor(palette.wallBack, shade);
          ctx.fillRect(far.r, far.t, near.r - far.r, far.b - far.t);
          drawWallSurfaceRect(ctx, far.r, far.t, near.r, far.b, shade, palette, far.r, (far.r - far.l) / 2);
          ctx.save();
          ctx.beginPath();
          ctx.rect(far.r, far.t, near.r - far.r, far.b - far.t);
          ctx.clip();
          maybeDrawGlyph(ctx, (near.r + far.r) / 2, (far.t + far.b) / 2, 120 / d, shade, fx + rgt.dx, fy + rgt.dy, absFaceBack, palette.glyphColor);
          ctx.restore();
        }
      } else {
        fillPoly(ctx, [
          [far.r,  far.t],
          [near.r, near.t],
          [near.r, near.b],
          [far.r,  far.b],
        ], shadeColor(palette.wallSide, shade));
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(far.r, far.t);   ctx.lineTo(near.r, near.t);
        ctx.lineTo(near.r, near.b); ctx.lineTo(far.r, far.b);
        ctx.closePath(); ctx.clip();
        const gcxR = CX + 280 / (d - 0.5);
        drawWallSurfaceTrap(ctx, far.r, far.t, far.b, near.r, near.t, near.b, shade, palette, { p: 280, sign: 1, dNear: d, dFar: d - 1 });
        const RR   = (near.r - far.r) * (d - 0.5) / 560;
        ctx.transform(RR, 0, 0, 1, gcxR * (1 - RR), 0);
        if (d > 1) maybeDrawGlyph(ctx, gcxR, CY, 120 / (d - 0.5), shade, nx + rgt.dx, ny + rgt.dy, absFaceRight, palette.glyphColor);
        ctx.restore();
      }
    } else {
      const wx_far  = Math.min(CANVAS_W, 3 * far.r  - 2 * CX);
      const wx_near = Math.min(CANVAS_W, 3 * near.r - 2 * CX);
      fillPoly(ctx, [
        [wx_far,  far.t],
        [wx_near, near.t],
        [wx_near, near.b],
        [wx_far,  far.b],
      ], shadeColor(palette.wallSide, shade));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(wx_far, far.t);   ctx.lineTo(wx_near, near.t);
      ctx.lineTo(wx_near, near.b); ctx.lineTo(wx_far, far.b);
      ctx.closePath(); ctx.clip();
      drawWallSurfaceTrap(ctx, wx_far, far.t, far.b, wx_near, near.t, near.b, shade, palette, { p: 840, sign: 1, dNear: d, dFar: d - 1 });
      maybeDrawGlyph(ctx, CX + 840 / (d - 0.5), CY, 120 / (d - 0.5), shade, fx + rgt.dx, fy + rgt.dy, absFaceBack, palette.glyphColor);
      ctx.restore();
    }
  }

  ctx.restore();
}
