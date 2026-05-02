// Entry point and game coordinator.
// Milestone 10: Main menu, game over screen, win screen.

window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Game state — 'menu' | 'playing' | 'dead' | 'won'
  let gameState  = 'menu';
  let difficulty = 'standard';

  // Run-level state — undefined until startRun() is called.
  let map, maxDepth, enemies, items, visited;

  const eventLog = [];  // { msg, color } — newest last, capped at 20

  // visited[row][col] — true once the player has been close enough to see that cell.
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

  // ------------------------------------------------------------------
  // Start / restart a run at the chosen difficulty.
  // ------------------------------------------------------------------
  function startRun(diff) {
    difficulty = diff;
    Object.assign(player, {
      x: 1, y: 1, facing: 2,
      hp: 20, maxHp: 20,
      dungeonLevel: 1,
      inventory: [],
      equippedWeapon: { name: 'Bowie Knife', attack: 5, itemType: 'weapon' },
      equippedArmor: null,
    });
    newGlyphSeed();
    map      = generateMaze(1);
    maxDepth = map[0].length - 2;
    enemies  = difficulty === 'explorer' ? [] : loadEnemies(map, 1);
    items    = difficulty === 'explorer' ? [] : loadItems(map, 1);
    visited  = makeVisited();
    markVisited(1, 1);
    eventLog.length = 0;
    gameState = 'playing';
    draw();
  }

  // Hook for M7 combat — call after any action that reduces player HP.
  function checkDeath() {
    if (player.hp <= 0) {
      gameState = 'dead';
      draw();
    }
  }

  // ------------------------------------------------------------------
  // Level transition — called when the player steps onto TILE.STAIRS.
  // ------------------------------------------------------------------
  function descend() {
    if (player.dungeonLevel >= 5) {
      gameState = 'won';
      logEvent('Escaped the labyrinth!', '#4fc3f7');
      return;
    }
    player.dungeonLevel++;
    logEvent(`Descended to Level ${ROMAN[player.dungeonLevel - 1]}`, '#4fc3f7');
    player.x      = 1;
    player.y      = 1;
    player.facing = 2;
    newGlyphSeed();
    map      = generateMaze(player.dungeonLevel);
    maxDepth = map[0].length - 2;
    enemies  = difficulty === 'explorer' ? [] : loadEnemies(map, player.dungeonLevel);
    items    = difficulty === 'explorer' ? [] : loadItems(map, player.dungeonLevel);
    visited  = makeVisited();
    markVisited(1, 1);
  }

  // ------------------------------------------------------------------
  // Minimap — small top-down grid drawn in the bottom-left corner.
  // ------------------------------------------------------------------
  function drawMinimap() {
    const cols    = map[0].length;
    const rows    = map.length;
    const CELL    = Math.floor(88 / Math.max(rows, cols));
    const originX = 10;
    const originY = VIEW_BOT + 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(originX - 2, originY - 2, cols * CELL + 4, rows * CELL + 4);

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

    ctx.fillStyle = '#ffe066';
    for (const it of items)
      if (visited[it.y][it.x])
        ctx.fillRect(originX + it.x * CELL, originY + it.y * CELL, CELL - 1, CELL - 1);

    ctx.fillStyle = '#e03030';
    for (const en of enemies)
      if (visited[en.y][en.x])
        ctx.fillRect(originX + en.x * CELL, originY + en.y * CELL, CELL - 1, CELL - 1);

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

  function logEvent(msg, color = '#f5d485') {
    eventLog.push({ msg, color });
    if (eventLog.length > 20) eventLog.shift();
  }

  // ------------------------------------------------------------------
  // Item pickup — called after every successful move.
  // ------------------------------------------------------------------
  function pickupItem(item) {
    switch (item.itemType) {
      case 'consumable':
        player.hp = Math.min(player.hp + item.heal, player.maxHp);
        logEvent(`Drank ${item.name}  +${item.heal} HP`);
        break;
      case 'weapon':
        player.equippedWeapon = item;
        logEvent(`Equipped ${item.name}`);
        break;
      case 'armor':
        player.equippedArmor = { ...item };
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
  // HUD — top and bottom strips drawn over the corridor view.
  // ------------------------------------------------------------------
  function drawHUD() {
    const gold  = '#f5d485';
    const serif = 'bold 12px Georgia, serif';

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(8, 6, 220, 88);

    const barX = 36, barY = 16, barW = 160, barH = 14;
    ctx.font = serif;
    ctx.fillStyle = gold;
    ctx.fillText('HP', 12, 25);

    const fill = Math.round(barW * Math.max(0, player.hp / player.maxHp));
    ctx.fillStyle = '#c03030';
    ctx.fillRect(barX, barY, fill, barH);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = serif;
    ctx.fillStyle = gold;
    ctx.textAlign = 'right';
    ctx.fillText(`${player.hp} / ${player.maxHp}`, 228, 25);
    ctx.textAlign = 'left';

    const wpn = player.equippedWeapon
      ? `${player.equippedWeapon.name.toUpperCase()}  +${player.equippedWeapon.attack}`
      : '--';
    ctx.fillText(`[${wpn}]`, 12, 52);

    const arm = player.equippedArmor
      ? `${player.equippedArmor.name.toUpperCase()}  ${player.equippedArmor.durability}/${player.equippedArmor.maxDurability}`
      : '--';
    ctx.fillText(`[${arm}]`, 12, 72);

    const roman = ROMAN[player.dungeonLevel - 1] || String(player.dungeonLevel);
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillStyle = gold;
    ctx.fillText('LEVEL', 790, 28);
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText(roman, 790, 72);
    ctx.textAlign = 'left';

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

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(245,212,133,0.45)';
    const buildStr = `${VERSION.branch}@${VERSION.commit}  ${VERSION.date}`;
    const bw = ctx.measureText(buildStr).width;
    ctx.fillText(buildStr, canvas.width - bw - 10, canvas.height - 10);

    drawCompass(ctx, player.facing);
  }

  // ------------------------------------------------------------------
  // Button helpers — shared by menu, win, and game-over screens.
  // ------------------------------------------------------------------
  function drawMenuButton(cx, cy, label, sublabel) {
    const W = 320, H = 52;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(cx - W / 2, cy - H / 2, W, H, 8);
    ctx.fill();
    ctx.strokeStyle = '#6b4a1a';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f5d485';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, sublabel ? cy - 8 : cy);
    if (sublabel) {
      ctx.fillStyle = 'rgba(245,212,133,0.5)';
      ctx.font = '11px Georgia, serif';
      ctx.fillText(sublabel, cx, cy + 10);
    }
    ctx.textBaseline = 'alphabetic';
  }

  function drawSmallButton(cx, cy, label) {
    const W = 220, H = 52;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(cx - W / 2, cy - H / 2, W, H, 8);
    ctx.fill();
    ctx.strokeStyle = '#6b4a1a';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f5d485';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
    ctx.textBaseline = 'alphabetic';
  }

  function hitMenuButton(x, y, cx, cy)  { return Math.abs(x - cx) <= 160 && Math.abs(y - cy) <= 26; }
  function hitSmallButton(x, y, cx, cy) { return Math.abs(x - cx) <= 110 && Math.abs(y - cy) <= 26; }

  // ------------------------------------------------------------------
  // Screens.
  // ------------------------------------------------------------------
  function drawMainMenu() {
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d485';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('OBESCAPE', CANVAS_W / 2, 220);

    ctx.fillStyle = 'rgba(245,212,133,0.55)';
    ctx.font = '15px Georgia, serif';
    ctx.fillText('Five levels. No second chances.', CANVAS_W / 2, 290);

    drawMenuButton(400, 380, 'EXPLORER', 'No enemies · pure maze walk');
    drawMenuButton(400, 456, 'STANDARD', 'Permadeath · balanced');
    drawMenuButton(400, 532, 'BRUTAL',   'Harder · deadlier · less loot');
    ctx.textAlign = 'left';
  }

  function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e03030';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('YOU DIED', CANVAS_W / 2, 330);

    const lvl = ROMAN[player.dungeonLevel - 1] || player.dungeonLevel;
    ctx.fillStyle = '#f5d485';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(`Fell on Level ${lvl}`, CANVAS_W / 2, 400);

    drawSmallButton(230, 560, 'TRY AGAIN');
    drawSmallButton(570, 560, 'MAIN MENU');
    ctx.textAlign = 'left';
  }

  function drawWinScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d485';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('YOU ESCAPED', CANVAS_W / 2, 310);

    ctx.fillStyle = 'rgba(245,212,133,0.6)';
    ctx.font = '16px Georgia, serif';
    ctx.fillText('The labyrinth is behind you. The desert waits above.', CANVAS_W / 2, 380);

    drawSmallButton(230, 560, 'PLAY AGAIN');
    drawSmallButton(570, 560, 'MAIN MENU');
    ctx.textAlign = 'left';
  }

  // ------------------------------------------------------------------
  // Debug command executor.
  // ------------------------------------------------------------------
  function runDebugCmd(cmd) {
    switch (cmd) {
      case 'toggle': debug.enabled = !debug.enabled; break;
      case 'n': debug.noclip   = !debug.noclip;   break;
      case 'g': debug.godMode  = !debug.godMode;  break;
      case 'd': debug.showDpad = !debug.showDpad; break;
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
        enemies = difficulty === 'explorer' ? [] : loadEnemies(map, player.dungeonLevel);
        items   = difficulty === 'explorer' ? [] : loadItems(map, player.dungeonLevel);
        visited = makeVisited();
        markVisited(player.x, player.y);
        break;
    }
    if (gameState === 'playing') markVisited(player.x, player.y);
    draw();
  }

  // ------------------------------------------------------------------
  // Main draw — dispatches on gameState.
  // ------------------------------------------------------------------
  function draw() {
    if (gameState === 'menu') { drawMainMenu(); return; }

    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    renderView(ctx, buildScene(map, maxDepth, enemies, items));

    if (gameState === 'won')  { drawWinScreen();      return; }
    if (gameState === 'dead') { drawGameOverScreen();  return; }

    drawMinimap();
    drawEventLog();
    drawHUD();
    if (debug.showDpad) drawDpad(ctx);
    drawDebugPanel(ctx, map);
  }

  // ------------------------------------------------------------------
  // Input — keyboard (desktop) and D-pad / screen buttons (touch/mouse).
  // ------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === '`') { runDebugCmd('toggle'); return; }
    if (debug.enabled) {
      const k = e.key.toLowerCase();
      if (k.length === 1 && 'ngtxlrd'.includes(k)) { runDebugCmd(k); return; }
    }
    if (gameState === 'menu') {
      if (e.key === '1') startRun('explorer');
      if (e.key === '2') startRun('standard');
      if (e.key === '3') startRun('brutal');
      return;
    }
    if (gameState === 'won' || gameState === 'dead') {
      if (e.key === 'Enter' || e.key.toLowerCase() === 'r') startRun(difficulty);
      if (e.key === 'Escape') { gameState = 'menu'; draw(); }
      return;
    }
    if (handleKey(e, map)) {
      markVisited(player.x, player.y);
      const itemIdx = items.findIndex(it => it.x === player.x && it.y === player.y);
      if (itemIdx !== -1) pickupItem(items.splice(itemIdx, 1)[0]);
      if (map[player.y][player.x] === TILE.STAIRS) descend();
      draw();
    }
  });

  function handlePointer(e) {
    e.preventDefault();
    const { x, y } = getCanvasXY(e, canvas);
    const dbgCmd = getDebugHit(x, y);
    if (dbgCmd) { runDebugCmd(dbgCmd); return; }

    if (gameState === 'menu') {
      if (hitMenuButton(x, y, 400, 380)) startRun('explorer');
      else if (hitMenuButton(x, y, 400, 456)) startRun('standard');
      else if (hitMenuButton(x, y, 400, 532)) startRun('brutal');
      return;
    }
    if (gameState === 'won' || gameState === 'dead') {
      if (hitSmallButton(x, y, 230, 560)) startRun(difficulty);
      else if (hitSmallButton(x, y, 570, 560)) { gameState = 'menu'; draw(); }
      return;
    }
    const key = getDpadKey(x, y) ?? getViewTapKey(x, y);
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
