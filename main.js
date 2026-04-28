// Entry point and game coordinator.
//
// Milestone 2: map + player movement + minimap feedback.
// The 3D view is still a static hardcoded scene — Milestone 3 will replace it
// with a view computed from the player's real position and facing.

window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const map = createTestMap();

  // ------------------------------------------------------------------
  // Minimap — small top-down grid drawn in the bottom-left corner.
  // Each map cell is CELL px square. The player is shown as a gold dot.
  // ------------------------------------------------------------------
  const CELL = 8;

  function drawMinimap() {
    const cols    = map[0].length;
    const rows    = map.length;
    const originX = 10;
    const originY = canvas.height - rows * CELL - 10;

    // Dark backing panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(originX - 2, originY - 2, cols * CELL + 4, rows * CELL + 4);

    // Cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = map[row][col];
        if      (tile === TILE.WALL)   ctx.fillStyle = '#1a1a1a';
        else if (tile === TILE.STAIRS) ctx.fillStyle = '#4fc3f7';
        else                           ctx.fillStyle = '#3d3225';

        ctx.fillRect(originX + col * CELL, originY + row * CELL, CELL - 1, CELL - 1);
      }
    }

    // Player dot (gold)
    ctx.fillStyle = '#f5d485';
    ctx.fillRect(originX + player.x * CELL, originY + player.y * CELL, CELL - 1, CELL - 1);
  }

  // ------------------------------------------------------------------
  // HUD — temporary position readout until the full HUD arrives in M9.
  // ------------------------------------------------------------------
  function drawHUD() {
    ctx.fillStyle = '#f5d485';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `Level ${player.dungeonLevel}    (${player.x}, ${player.y})    Facing: ${FACING_NAMES[player.facing]}`,
      10, 22
    );
  }

  // ------------------------------------------------------------------
  // Main draw — called once on load and again after every player action.
  // ------------------------------------------------------------------
  function draw() {
    // 3D view: hardcoded static scene until Milestone 3.
    renderView(ctx, [
      { left: true,  right: true,  back: false },
      { left: true,  right: true,  back: false },
      { left: true,  right: false, back: false },
      { left: true,  right: false, back: true  },
    ]);

    drawMinimap();
    drawHUD();
    drawDpad(ctx);
  }

  // ------------------------------------------------------------------
  // Input — keyboard (desktop) and D-pad buttons (touch / mouse click).
  // ------------------------------------------------------------------

  // Keyboard: prevent arrow keys from scrolling the browser page.
  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    if (handleKey(e, map)) draw();
  });

  // Touch and mouse: convert the pointer position to canvas coordinates,
  // check if it hit a D-pad button, then fire the same handleKey logic.
  function handlePointer(e) {
    e.preventDefault();
    const { x, y } = getCanvasXY(e, canvas);
    const key = getDpadKey(x, y);
    if (key && handleKey({ key }, map)) draw();
  }

  canvas.addEventListener('touchstart', handlePointer, { passive: false });
  canvas.addEventListener('mousedown',  handlePointer);

  draw();
});
