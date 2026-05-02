// Entry point and game coordinator.
// Milestone 9: HUD and minimap.

window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let map      = generateMaze(player.dungeonLevel);
  let maxDepth = map[0].length - 2;
  let enemies  = loadEnemies(map, player.dungeonLevel);
  let items    = loadItems(map, player.dungeonLevel);
  let gameWon  = false;

  const eventLog = [];  // { msg, color } — newest last, capped at 20

  // visited[row][col] — true once the player has been close enough to see that cell.
  // Reset whenever a new map is loaded; revealed in a 3×3 area around each step.
  function makeVisited() {
    return Array.from({ length: map.length }, () => new Array(map[0].length).fill(false));
  }
  function markVisited(x, y) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const ny = y + dy, nx = x + dx;
        if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length)
          visited[ny][nx] = true;
      }
  }
  let visited = makeVisited();
  markVisited(1, 1); // reveal the starting cell on load

  // ------------------------------------------------------------------
  // Level transition — called when the player steps onto TILE.STAIRS.
  // Increments dungeonLevel, generates a fresh map, and resets the
  // player back to the top-left starting position.
  // ------------------------------------------------------------------
  function descend() {
    if (player.dungeonLevel >= 5) {
      gameWon = true;
      logEvent('Escaped the labyrinth!', '#4fc3f7');
      return;
    }
    player.dungeonLevel++;
    logEvent(`Descended to Level ${ROMAN[player.dungeonLevel - 1]}`, '#4fc3f7');
    player.x      = 1;
    player.y      = 1;
    player.facing = 2; // South — same as starting orientation
    map      = generateMaze(player.dungeonLevel);
    maxDepth = map[0].length - 2;
    enemies  = loadEnemies(map, player.dungeonLevel);
    items    = loadItems(map, player.dungeonLevel);
    visited  = makeVisited();
    markVisited(1, 1);
  }

  // ------------------------------------------------------------------
  // Minimap — small top-down grid drawn in the bottom-left corner.
  // Cell size shrinks for larger maps so the minimap stays within 120px.
  // ------------------------------------------------------------------
  function drawMinimap() {
    const cols    = map[0].length;
    const rows    = map.length;
    const CELL    = Math.floor(88 / Math.max(rows, cols));
    const originX = 10;
    const originY = VIEW_BOT + 8;

    // Dark backing panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(originX - 2, originY - 2, cols * CELL + 4, rows * CELL + 4);

    // Cells — unvisited areas stay black (fog of war).
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!visited[row][col]) {
          ctx.fillStyle = '#000';
        } else {
          const tile = map[row][col];
          if      (tile === TILE.WALL)   ctx.fillStyle = '#1a1a1a';
          else if (tile === TILE.STAIRS) ctx.fillStyle = '#4fc3f7';
          else                           ctx.fillStyle = '#3d3225';
        }
        ctx.fillRect(originX + col * CELL, originY + row * CELL, CELL - 1, CELL - 1);
      }
    }

    // Item dots (amber) — visible once the cell has been visited
    ctx.fillStyle = '#ffe066';
    for (const it of items)
      if (visited[it.y][it.x])
        ctx.fillRect(originX + it.x * CELL, originY + it.y * CELL, CELL - 1, CELL - 1);

    // Enemy dots (red)
    ctx.fillStyle = '#e03030';
    for (const en of enemies)
      if (visited[en.y][en.x])
        ctx.fillRect(originX + en.x * CELL, originY + en.y * CELL, CELL - 1, CELL - 1);

    // Player dot (gold)
    ctx.fillStyle = '#f5d485';
    ctx.fillRect(originX + player.x * CELL, originY + player.y * CELL, CELL - 1, CELL - 1);
  }

  // ------------------------------------------------------------------
  // Compass rose — rotates so current facing direction is always at top.
  // ------------------------------------------------------------------
  function drawCompass(ctx, facing) {
    const cx   = 145;
    const cy   = VIEW_BOT + 50;
    const R    = 30;
    const gold = '#f5d485';

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fill();
    ctx.strokeStyle = '#6b4a1a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-facing * Math.PI / 2);

    const labels = ['N', 'E', 'S', 'W'];
    ctx.font = 'bold 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 4; i++) {
      const a  = i * Math.PI / 2 - Math.PI / 2;
      const tx = Math.cos(a) * (R - 8);
      const ty = Math.sin(a) * (R - 8);
      ctx.fillStyle = labels[i] === 'N' ? '#e03030' : gold;
      ctx.fillText(labels[i], tx, ty);
    }

    ctx.restore();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawEventLog() {
    const x        = 185;
    const startY   = VIEW_BOT + 16;
    const lineH    = 17;
    const maxLines = 5;

    const visible = eventLog.slice(-maxLines);
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'left';
    for (let i = 0; i < visible.length; i++) {
      ctx.fillStyle = visible[i].color;
      ctx.fillText(visible[i].msg, x, startY + i * lineH);
    }
  }

  // ------------------------------------------------------------------
  // Item pickup — called after every successful move.
  // ------------------------------------------------------------------
  function logEvent(msg, color = '#f5d485') {
    eventLog.push({ msg, color });
    if (eventLog.length > 20) eventLog.shift();
  }

  function pickupItem(item) {
    switch (item.itemType) {
      case 'consumable':
        player.hp = Math.min(player.hp + item.heal, player.maxHp);
        logEvent(`Drank ${item.name}  +${item.heal} HP`);
        break;
      case 'weapon':
        player.equippedWeapon = item; // always swap — old weapon is dropped
        logEvent(`Equipped ${item.name}`);
        break;
      case 'armor':
        player.equippedArmor = { ...item }; // copy so durability is per-instance
        logEvent(`Equipped ${item.name}`);
        break;
    }
  }

  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

  // Returns a contextual prompt string for the tile 1 step ahead, or null.
  function getActionPrompt() {
    const d  = DIR[player.facing];
    const nx = player.x + d.dx;
    const ny = player.y + d.dy;
    if (map[ny]?.[nx] === TILE.STAIRS) return 'STAIRS DOWN';
    const item = items.find(it => it.x === nx && it.y === ny);
    if (item) return item.name.toUpperCase();
    if (enemies.find(e => e.x === nx && e.y === ny)) return 'ENEMY';
    return null;
  }

  // ------------------------------------------------------------------
  // HUD — full M9 layout.
  // ------------------------------------------------------------------
  function drawHUD() {
    const gold  = '#f5d485';
    const serif = 'bold 12px Georgia, serif';

    // --- Top-left panel: HP bar + equipped gear ---
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(8, 6, 220, 88);

    // HP bar
    const barX = 36, barY = 16, barW = 160, barH = 14;
    ctx.font = serif;
    ctx.fillStyle = gold;
    ctx.fillText('HP', 12, 25);

    // bar fill (red)
    const fill = Math.round(barW * Math.max(0, player.hp / player.maxHp));
    ctx.fillStyle = '#c03030';
    ctx.fillRect(barX, barY, fill, barH);
    // bar border (gold)
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // HP numbers right of bar
    ctx.font = serif;
    ctx.fillStyle = gold;
    ctx.textAlign = 'right';
    ctx.fillText(`${player.hp} / ${player.maxHp}`, 228, 25);
    ctx.textAlign = 'left';

    // Weapon row
    const wpn = player.equippedWeapon
      ? `${player.equippedWeapon.name.toUpperCase()}  +${player.equippedWeapon.attack}`
      : '--';
    ctx.fillText(`[${wpn}]`, 12, 52);

    // Armour row
    const arm = player.equippedArmor
      ? `${player.equippedArmor.name.toUpperCase()}  ${player.equippedArmor.durability}/${player.equippedArmor.maxDurability}`
      : '--';
    ctx.fillText(`[${arm}]`, 12, 72);

    // --- Top-right: level indicator ---
    const roman = ROMAN[player.dungeonLevel - 1] || String(player.dungeonLevel);
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillStyle = gold;
    ctx.fillText('LEVEL', 790, 28);
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText(roman, 790, 72);
    ctx.textAlign = 'left';

    // --- Bottom-centre: action prompt ---
    const prompt = getActionPrompt();
    if (prompt) {
      ctx.font = 'bold 13px Georgia, serif';
      const tw = ctx.measureText(prompt).width;
      const px = (canvas.width - tw) / 2;
      const py = VIEW_BOT + 50;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(px - 8, py - 16, tw + 16, 22);
      ctx.fillStyle = gold;
      ctx.fillText(prompt, px, py);
    }

    // --- Bottom-right: build info ---
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(245,212,133,0.45)';
    const buildStr = `${VERSION.branch}@${VERSION.commit}  ${VERSION.date}`;
    const bw = ctx.measureText(buildStr).width;
    ctx.fillText(buildStr, canvas.width - bw - 10, canvas.height - 10);

    drawCompass(ctx, player.facing);
  }

  // ------------------------------------------------------------------
  // Win screen — placeholder until the full screen arrives in M10.
  // Draws a dark overlay over the final dungeon view.
  // ------------------------------------------------------------------
  function drawWinScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.font = 'bold 64px monospace';
    ctx.fillStyle = '#f5d485';
    ctx.fillText('YOU ESCAPED', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#c2a256';
    ctx.fillText('The labyrinth is behind you. The desert waits above.', canvas.width / 2, canvas.height / 2 + 30);

    ctx.textAlign = 'left'; // reset to default
  }

  // ------------------------------------------------------------------
  // Debug command executor — shared by keyboard and touch paths.
  // ------------------------------------------------------------------
  function runDebugCmd(cmd) {
    switch (cmd) {
      case 'toggle': debug.enabled = !debug.enabled; break;
      case 'n': debug.noclip  = !debug.noclip;  break;
      case 'g': debug.godMode = !debug.godMode; break;
      case 't': {
        const raw = prompt('Teleport to x,y:', `${player.x},${player.y}`);
        if (raw) {
          const [tx, ty] = raw.split(',').map(s => parseInt(s.trim(), 10));
          if (!isNaN(tx) && !isNaN(ty) &&
              ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length)
            { player.x = tx; player.y = ty; }
        }
        break;
      }
      case 'x':
        outer: for (let y = 0; y < map.length; y++)
          for (let x = 0; x < map[y].length; x++)
            if (map[y][x] === TILE.STAIRS) { player.x = x; player.y = y; break outer; }
        break;
      case 'l': descend(); break;
      case 'r':
        map = generateMaze(player.dungeonLevel);
        maxDepth = map[0].length - 2;
        enemies = loadEnemies(map, player.dungeonLevel);
        items   = loadItems(map, player.dungeonLevel);
        visited = makeVisited();
        markVisited(player.x, player.y);
        break;
    }
    markVisited(player.x, player.y); // reveal wherever a debug command landed the player
    draw();
  }

  // ------------------------------------------------------------------
  // Main draw — called once on load and again after every player action.
  // ------------------------------------------------------------------
  function draw() {
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    renderView(ctx, buildScene(map, maxDepth, enemies, items));

    if (gameWon) {
      drawWinScreen();
      return;
    }

    drawMinimap();
    drawEventLog();
    drawHUD();
    drawDpad(ctx);
    drawDebugPanel(ctx, map);
  }

  // ------------------------------------------------------------------
  // Input — keyboard (desktop) and D-pad buttons (touch / mouse click).
  // ------------------------------------------------------------------

  // Keyboard: prevent arrow keys from scrolling the browser page.
  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    // Debug panel toggle always intercepts backtick; command keys intercept when panel is open.
    if (e.key === '`') { runDebugCmd('toggle'); return; }
    if (debug.enabled) {
      const k = e.key.toLowerCase();
      if (k.length === 1 && 'ngtxlr'.includes(k)) { runDebugCmd(k); return; }
    }
    if (gameWon) return;
    if (handleKey(e, map)) {
      markVisited(player.x, player.y);
      const itemIdx = items.findIndex(it => it.x === player.x && it.y === player.y);
      if (itemIdx !== -1) pickupItem(items.splice(itemIdx, 1)[0]);
      if (map[player.y][player.x] === TILE.STAIRS) descend();
      draw();
    }
  });

  // Touch and mouse: convert the pointer position to canvas coordinates,
  // check if it hit a D-pad button, then fire the same handleKey logic.
  function handlePointer(e) {
    e.preventDefault();
    const { x, y } = getCanvasXY(e, canvas);
    // Debug panel is checked before game-won guard so the DBG button always works.
    const dbgCmd = getDebugHit(x, y);
    if (dbgCmd) { runDebugCmd(dbgCmd); return; }
    if (gameWon) return;
    const key = getDpadKey(x, y);
    if (key && handleKey({ key }, map)) {
      markVisited(player.x, player.y);
      const itemIdx = items.findIndex(it => it.x === player.x && it.y === player.y);
      if (itemIdx !== -1) pickupItem(items.splice(itemIdx, 1)[0]);
      if (map[player.y][player.x] === TILE.STAIRS) descend();
      draw();
    }
  }

  canvas.addEventListener('touchstart', handlePointer, { passive: false });
  canvas.addEventListener('mousedown',  handlePointer);

  draw();
});
