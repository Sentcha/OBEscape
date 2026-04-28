const CANVAS_W = 800;
const CANVAS_H = 600;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

// A "portal" is the rectangular cross-section of the corridor at a given depth.
// Depth 1 = nearest tile, depth 4 = farthest visible tile.
// 1/d perspective: each deeper portal is proportionally smaller, converging on the center.
function makePortal(d) {
  return {
    l: Math.round(CX - 280 / d),
    r: Math.round(CX + 280 / d),
    t: Math.round(CY - 200 / d),
    b: Math.round(CY + 200 / d),
  };
}

const PORTALS = [
  null,          // index 0 unused
  makePortal(1), // depth 1 — nearest
  makePortal(2),
  makePortal(3),
  makePortal(4), // depth 4 — farthest
];

// Color palette from the design document
const COLORS = {
  ceiling:  '#0a0a1a',
  floor:    '#c2a256',
  wallBack: '#d4933a',
  wallSide: '#b87a28',
};

// Brightness multiplier per depth. Depth 1 (nearest) is full brightness.
// Depth 4 (farthest) is only 40% — simulates the corridor fading into darkness.
const SHADE = [null, 1.0, 0.75, 0.55, 0.40];

// Multiply each RGB channel of a hex color by `factor` to darken it.
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
// scene: array of 4 objects (index 0 = depth 1, index 3 = depth 4).
//   Each object: { left: bool, right: bool, back: bool }
//   left/right — is there a wall on that side at this depth?
//   back       — is there a wall blocking the path at this depth?
//
function renderView(ctx, scene) {
  // 1. Background: ceiling (top half) and floor (bottom half).
  //    Walls will be painted over these.
  ctx.fillStyle = COLORS.ceiling;
  ctx.fillRect(0, 0, CANVAS_W, CY);

  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, CY, CANVAS_W, CY);

  // 2. Painter's algorithm — draw depth 4 first, depth 1 last.
  //    This ensures nearer walls paint over farther ones.
  for (let d = 4; d >= 1; d--) {
    const s     = scene[d - 1];
    const far   = PORTALS[d];
    // For depth 1, the "near" boundary is the screen edge itself.
    const near  = d > 1 ? PORTALS[d - 1] : { l: 0, r: CANVAS_W, t: 0, b: CANVAS_H };
    const shade = SHADE[d];

    // Back wall: a flat rectangle filling the portal at this depth.
    if (s.back) {
      ctx.fillStyle = shadeColor(COLORS.wallBack, shade);
      ctx.fillRect(far.l, far.t, far.r - far.l, far.b - far.t);
    }

    // Left wall: trapezoid connecting the near-left edge to the far-left edge.
    if (s.left) {
      fillPoly(ctx, [
        [near.l, near.t],
        [far.l,  far.t],
        [far.l,  far.b],
        [near.l, near.b],
      ], shadeColor(COLORS.wallSide, shade));
    }

    // Right wall: trapezoid connecting the far-right edge to the near-right edge.
    if (s.right) {
      fillPoly(ctx, [
        [far.r,  far.t],
        [near.r, near.t],
        [near.r, near.b],
        [far.r,  far.b],
      ], shadeColor(COLORS.wallSide, shade));
    }
  }
}
