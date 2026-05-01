const CANVAS_W = 800;
const CANVAS_H = 600;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

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

// Color palette from the design document
const COLORS = {
  ceiling:  '#0a0a1a',
  floor:    '#c2a256',
  wallBack: '#d4933a',
  wallSide: '#b87a28',
};

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
  const N = 5;  // bands: tread, riser, tread, riser, tread (nearest → farthest)

  // 10% margin each side → 80% of corridor width, applied in perspective at both ends.
  const m = 0.10;
  const nw = near.r - near.l;
  const fw = far.r  - far.l;
  const nl = near.l + nw * m,  nr = near.r - nw * m;
  const fl = far.l  + fw * m,  fr = far.r  - fw * m;

  for (let i = 0; i < N; i++) {
    const t0 = 1 - i / N;        // near edge of this band (t=1 = player, t=0 = far portal)
    const t1 = 1 - (i + 1) / N;  // far edge of this band

    const y0  = Math.round(far.b + t0 * (near.b - far.b));
    const y1  = Math.round(far.b + t1 * (near.b - far.b));
    const xl0 = Math.round(fl + t0 * (nl - fl));
    const xr0 = Math.round(fr + t0 * (nr - fr));
    const xl1 = Math.round(fl + t1 * (nl - fl));
    const xr1 = Math.round(fr + t1 * (nr - fr));

    // Steps fade into darkness: nearest band full brightness, farthest at 20%.
    const bandShade = shade * (1.0 - (i / (N - 1)) * 0.80);
    const color = i % 2 === 0
      ? shadeColor('#d4a840', bandShade)  // tread — warm lit surface
      : shadeColor('#281200', bandShade); // riser — shadow face

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

// Render the first-person corridor view.
//
// scene: array built by buildScene — one entry per depth level.
//   Each entry: { back, stairs, left, right, leftFlat, rightFlat }
//
function renderView(ctx, scene) {
  // 1. Background: ceiling (top half) and floor (bottom half).
  //    Walls will be painted over these.
  ctx.fillStyle = COLORS.ceiling;
  ctx.fillRect(0, 0, CANVAS_W, CY);

  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, CY, CANVAS_W, CY);

  // 2. Painter's algorithm — draw deepest depth first, depth 1 last.
  //    This ensures nearer walls paint over farther ones.
  const maxDepth = scene.length;
  for (let d = maxDepth; d >= 1; d--) {
    const s     = scene[d - 1];
    const far   = makePortal(d);
    // For depth 1, the "near" boundary is the screen edge itself.
    const near  = d > 1 ? makePortal(d - 1) : { l: 0, r: CANVAS_W, t: 0, b: CANVAS_H };
    const shade = shadeAtDepth(d);

    // Back wall: a flat rectangle filling the portal at this depth.
    if (s.back) {
      ctx.fillStyle = shadeColor(COLORS.wallBack, shade);
      ctx.fillRect(far.l, far.t, far.r - far.l, far.b - far.t);
    }

    // Stairs: alternating tread/riser bands drawn on the floor ahead of the tile.
    if (s.stairs) drawStairs(ctx, near, far, shade);

    // Item sprite: drawn on the floor of the far portal.
    if (s.item)  drawItem (ctx, far, shade, s.item.type);

    // Enemy sprite: drawn centred in the far portal, on top of the back wall.
    if (s.enemy) drawEnemy(ctx, far, shade, s.enemy.type);

    // Left wall: either a flat extension of the back wall, or a perspective trapezoid.
    if (s.left) {
      if (s.leftFlat) {
        // Part of a perpendicular wall — flat rectangle at back-wall height, same color.
        ctx.fillStyle = shadeColor(COLORS.wallBack, shade);
        ctx.fillRect(near.l, far.t, far.l - near.l, far.b - far.t);
      } else {
        fillPoly(ctx, [
          [near.l, near.t],
          [far.l,  far.t],
          [far.l,  far.b],
          [near.l, near.b],
        ], shadeColor(COLORS.wallSide, shade));
      }
    } else {
      // Side opening — draw the near face of the branch corridor entry wall.
      // x: 1 corridor-width further left from the far portal edge, clamped to screen.
      // y: sized to the FAR portal so the face sits at the correct perspective depth.
      //    Ceiling and floor of the junction reveal above and below via the background.
      const wx = Math.max(0, 2 * far.l - CX);
      ctx.fillStyle = shadeColor(COLORS.wallSide, shade);
      ctx.fillRect(wx, far.t, far.l - wx, far.b - far.t);
    }

    // Right wall: either a flat extension of the back wall, or a perspective trapezoid.
    if (s.right) {
      if (s.rightFlat) {
        ctx.fillStyle = shadeColor(COLORS.wallBack, shade);
        ctx.fillRect(far.r, far.t, near.r - far.r, far.b - far.t);
      } else {
        fillPoly(ctx, [
          [far.r,  far.t],
          [near.r, near.t],
          [near.r, near.b],
          [far.r,  far.b],
        ], shadeColor(COLORS.wallSide, shade));
      }
    } else {
      const wx = Math.min(CANVAS_W, 2 * far.r - CX);
      ctx.fillStyle = shadeColor(COLORS.wallSide, shade);
      ctx.fillRect(far.r, far.t, wx - far.r, far.b - far.t);
    }
  }
}
