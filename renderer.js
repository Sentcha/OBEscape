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
//   Each entry: { back, left, right, leftFlat, rightFlat }
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

    // Left wall — always a trapezoid spanning near→far portals.
    // wallSide for a parallel corridor wall; wallBack for a front-facing surface
    // (back-wall extension or branch-entry inner face). Same shape means every
    // segment meets its neighbours at exactly the right perspective angle.
    fillPoly(ctx, [
      [near.l, near.t],
      [far.l,  far.t],
      [far.l,  far.b],
      [near.l, near.b],
    ], shadeColor(s.left && !s.leftFlat ? COLORS.wallSide : COLORS.wallBack, shade));

    // Right wall — same logic, mirrored.
    fillPoly(ctx, [
      [far.r,  far.t],
      [near.r, near.t],
      [near.r, near.b],
      [far.r,  far.b],
    ], shadeColor(s.right && !s.rightFlat ? COLORS.wallSide : COLORS.wallBack, shade));
  }
}
