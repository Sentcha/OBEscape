const debug = { enabled: false, noclip: false, godMode: false };

// Layout constants — shared by drawDebugPanel and getDebugHit so geometry stays in sync.
const DBG_BTN   = { x: 744, y: 8, w: 48, h: 24 };
const DBG_PANEL = { x: 494, w: 300 };
const DBG_ROW_H = 26;
const DBG_PAD   = { x: 10, y: 8 };

const DBG_CMDS = ['n', 'g', 't', 'x', 'l', 'r'];
const DBG_LABELS = [
  () => `N  noclip   [${debug.noclip  ? 'ON ' : 'OFF'}]`,
  () => `G  god mode [${debug.godMode ? 'ON ' : 'OFF'}]`,
  () =>  'T  teleport',
  () =>  'X  → stairs',
  () =>  'L  next level',
  () =>  'R  regen map',
];

function drawDebugPanel(ctx, map) {
  // Toggle button — always visible in top-right corner.
  ctx.fillStyle = debug.enabled ? '#f5d485' : 'rgba(245,212,133,0.35)';
  ctx.fillRect(DBG_BTN.x, DBG_BTN.y, DBG_BTN.w, DBG_BTN.h);
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = debug.enabled ? '#000' : '#f5d485';
  ctx.fillText('DBG', DBG_BTN.x + 8, DBG_BTN.y + 17);

  if (!debug.enabled) return;

  // Locate stairs tile for the info row.
  let sx = '?', sy = '?';
  outer: for (let y = 0; y < map.length; y++)
    for (let x = 0; x < map[y].length; x++)
      if (map[y][x] === TILE.STAIRS) { sx = x; sy = y; break outer; }

  const rows = [
    '── DEBUG ──────────────────',
    `(${player.x},${player.y})  ${FACING_NAMES[player.facing].toUpperCase()}`,
    ...DBG_LABELS.map(fn => fn()),
    `stairs (${sx},${sy})  ${map[0].length}\xD7${map.length}`,
  ];

  const panelY  = DBG_BTN.y + DBG_BTN.h;
  const totalH  = rows.length * DBG_ROW_H + DBG_PAD.y * 2;
  const { x: px, w } = DBG_PANEL;

  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(px, panelY, w, totalH);
  ctx.strokeStyle = '#f5d485';
  ctx.lineWidth = 1;
  ctx.strokeRect(px, panelY, w, totalH);

  ctx.font = 'bold 13px monospace';
  rows.forEach((row, i) => {
    ctx.fillStyle = i <= 1 ? '#f5d485' : '#c0c0c0';
    ctx.fillText(row, px + DBG_PAD.x, panelY + DBG_PAD.y + (i + 1) * DBG_ROW_H - 6);
  });
}

// Returns 'toggle', a command key string, or null.
// cx/cy are canvas-space coordinates (800×600).
function getDebugHit(cx, cy) {
  if (cx >= DBG_BTN.x && cx < DBG_BTN.x + DBG_BTN.w &&
      cy >= DBG_BTN.y && cy < DBG_BTN.y + DBG_BTN.h) return 'toggle';
  if (!debug.enabled) return null;
  const panelY = DBG_BTN.y + DBG_BTN.h;
  if (cx < DBG_PANEL.x || cx >= DBG_PANEL.x + DBG_PANEL.w) return null;
  // Row 0 = title, row 1 = position (both non-interactive); rows 2..N+1 = commands.
  const row = Math.floor((cy - panelY - DBG_PAD.y) / DBG_ROW_H);
  if (row >= 2 && row <= DBG_CMDS.length + 1) return DBG_CMDS[row - 2];
  return null;
}
