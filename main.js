// Entry point and game coordinator.
// Milestone 10: Main menu, game over screen, win screen.

window.addEventListener('load', async () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Game state — 'menu' | 'playing' | 'dead' | 'won'
  let gameState  = 'menu';
  let difficulty = 'standard';

  // Run-level state — undefined until startRun() is called.
  let map, maxDepth, enemies, items, corpses, visited;

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
      defense: 2,
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
    corpses  = [];
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
    corpses  = [];
    visited  = makeVisited();
    markVisited(1, 1);
  }

  // ------------------------------------------------------------------
  // Shared minimap geometry — keeps drawMinimap, drawCompass, and drawEventLog in sync.
  function minimapGeom() {
    const dim   = Math.max(map.length, map[0].length);
    const CELL  = Math.floor(160 / dim);
    const mapPx = dim * CELL;
    return { originX: 10, originY: VIEW_BOT + 8, CELL, mapPx };
  }

  // Minimap — small top-down grid drawn in the bottom-left corner.
  // ------------------------------------------------------------------
  function drawMinimap() {
    const { originX, originY, CELL, mapPx } = minimapGeom();
    const rows = map.length, cols = map[0].length;
    const w = cols * CELL, h = rows * CELL;

    // Parchment background with cheap aged vignette
    const cx = originX + w / 2, cy = originY + h / 2;
    const grad = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.15,
                                          cx, cy, Math.max(w, h) * 0.65);
    grad.addColorStop(0, '#b09060');
    grad.addColorStop(1, '#8a6a3c');
    ctx.fillStyle = grad;
    ctx.fillRect(originX - 2, originY - 2, w + 4, h + 4);

    // Tiles: ink walls + fogged unvisited; floor leaves parchment showing
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const px = originX + col * CELL, py = originY + row * CELL;
        if (!visited[row][col]) {
          ctx.fillStyle = '#6b5230';                 // un-inked / fog
          ctx.fillRect(px, py, CELL - 1, CELL - 1);
        } else if (map[row][col] === TILE.WALL) {
          ctx.fillStyle = '#3a2808';                 // dark ink wall
          ctx.fillRect(px, py, CELL - 1, CELL - 1);
        }
        // floor/corridor/stairs base: parchment shows through (no fill)
      }
    }

    // Faint engraved grid over the chart
    ctx.strokeStyle = 'rgba(58, 40, 8, 0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      const x = Math.round(originX + c * CELL) + 0.5;
      ctx.moveTo(x, originY); ctx.lineTo(x, originY + h);
    }
    for (let r = 0; r <= rows; r++) {
      const y = Math.round(originY + r * CELL) + 0.5;
      ctx.moveTo(originX, y); ctx.lineTo(originX + w, y);
    }
    ctx.stroke();

    // Stairs: solid verdigris square with ink outline
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++)
        if (visited[row][col] && map[row][col] === TILE.STAIRS) {
          const px = originX + col * CELL, py = originY + row * CELL;
          ctx.fillStyle = '#3f6b54';
          ctx.fillRect(px, py, CELL - 1, CELL - 1);
          if (CELL >= 6) {
            ctx.strokeStyle = '#3a2808';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, CELL - 2, CELL - 2);
          }
        }

    // Items: gold
    ctx.fillStyle = '#b89040';
    for (const it of items)
      if (visited[it.y][it.x])
        ctx.fillRect(originX + it.x * CELL, originY + it.y * CELL, CELL - 1, CELL - 1);

    // Enemies: dark red
    ctx.fillStyle = '#7a1808';
    for (const en of enemies)
      if (debug.showEnemies || visited[en.y][en.x])
        ctx.fillRect(originX + en.x * CELL, originY + en.y * CELL, CELL - 1, CELL - 1);

    // Player: light-gold marker with dark ink outline
    {
      const px = originX + player.x * CELL, py = originY + player.y * CELL;
      ctx.fillStyle = '#f5d485';
      ctx.fillRect(px, py, CELL - 1, CELL - 1);
      ctx.strokeStyle = '#3a2808';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, CELL - 2, CELL - 2);
    }

    // Ornamental double frame (echoes compass bezel), drawn last.
    // Sits in the existing -2 margin: footprint & compass placement unchanged.
    ctx.strokeStyle = '#7a5010';      // outer thick brass
    ctx.lineWidth = 2;
    ctx.strokeRect(originX - 1.5, originY - 1.5, w + 3, h + 3);
    ctx.strokeStyle = '#b89040';      // inner thin gold
    ctx.lineWidth = 1;
    ctx.strokeRect(originX + 0.5, originY + 0.5, w - 1, h - 1);
  }

  // ------------------------------------------------------------------
  // Compass rose — rotates so current facing direction is always at top.
  // ------------------------------------------------------------------
  function drawCompass(ctx, facing) {
    const { originX, originY, mapPx } = minimapGeom();
    const GAP = 10;
    const R   = Math.round(mapPx / 2);
    const cx  = originX + mapPx + GAP + R;
    const cy  = originY + mapPx / 2;

    // Parchment face
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#b09060';
    ctx.fill();

    // Outer bezel
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = '#7a5010';
    ctx.lineWidth = Math.max(2, Math.round(R * 0.055));
    ctx.stroke();

    // Inner bezel ring
    ctx.beginPath();
    ctx.arc(cx, cy, Math.round(R * 0.90), 0, Math.PI * 2);
    ctx.strokeStyle = '#b89040';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-facing * Math.PI / 2);

    // 8-point engraved star (4 cardinal + 4 intercardinal petals)
    for (let i = 0; i < 8; i++) {
      const isCard = i % 2 === 0;
      const outerR = isCard ? R * 0.60 : R * 0.38;
      const sideW  = isCard ? R * 0.09 : R * 0.06;
      const baseR  = R * 0.12;
      ctx.save();
      ctx.rotate(i * Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -outerR);
      ctx.lineTo(sideW, -baseR);
      ctx.lineTo(0, R * 0.02);
      ctx.lineTo(-sideW, -baseR);
      ctx.closePath();
      ctx.strokeStyle = (i === 0) ? '#7a1808' : '#4a3418';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2, Math.round(R * 0.05)), 0, Math.PI * 2);
    ctx.fillStyle = '#7a5010';
    ctx.fill();

    // Cardinal labels N/E/S/W
    const fontSize  = Math.round(R / 3);
    const labelDist = R * 0.77;
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ['N', 'E', 'S', 'W'].forEach((lbl, i) => {
      const a = i * Math.PI / 2 - Math.PI / 2;
      ctx.fillStyle = (i === 0) ? '#8b1808' : '#3a2808';
      ctx.fillText(lbl, Math.cos(a) * labelDist, Math.sin(a) * labelDist);
    });

    // Intercardinal labels NE/SE/SW/NW
    const interSize = Math.round(fontSize * 0.60);
    ctx.font = `bold ${interSize}px Georgia, serif`;
    ctx.fillStyle = '#3a2808';
    ['NE', 'SE', 'SW', 'NW'].forEach((lbl, i) => {
      const a = i * Math.PI / 2 - Math.PI / 4;
      ctx.fillText(lbl, Math.cos(a) * labelDist * 0.72, Math.sin(a) * labelDist * 0.72);
    });

    ctx.restore();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawEventLog() {
    const { originX, mapPx } = minimapGeom();
    const GAP = 10;
    const R   = Math.round(mapPx / 2);
    const x   = originX + mapPx + GAP + 2 * R + GAP;
    const startY   = VIEW_BOT + 24;
    const lineH    = 22;
    const maxLines = 4;

    const visible = eventLog.slice(-maxLines);
    ctx.font = 'bold 20px Georgia, serif';
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
    if (map[ny]?.[nx] === TILE.STAIRS) return { text: 'STAIRS DOWN', color: '#4fc3f7' };
    const item = items.find(it => it.x === nx && it.y === ny);
    if (item) return { text: item.name.toUpperCase(), color: '#4fc3f7' };
    const foe = enemies.find(e => e.x === nx && e.y === ny);
    if (foe) return { text: `${foe.name.toUpperCase()}  ${foe.hp}/${foe.maxHp} HP`, color: '#e03030' };
    return null;
  }

  // Returns true if any live enemy is adjacent (Manhattan distance 1) to the player
  // but NOT directly in front (those are already shown in the action prompt).
  function hasFlankingEnemy() {
    const fwd = DIR[player.facing];
    return enemies.some(e => {
      const dx = e.x - player.x, dy = e.y - player.y;
      if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
      return !(dx === fwd.dx && dy === fwd.dy);
    });
  }

  // ------------------------------------------------------------------
  // HUD — top and bottom strips drawn over the corridor view.
  // ------------------------------------------------------------------
  function drawHUD() {
    const gold  = '#f5d485';
    const serif = 'bold 22px Georgia, serif';

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(8, 8, 260, 140);

    const barX = 38, barY = 20, barW = 196, barH = 22;
    ctx.font = serif;
    ctx.fillStyle = gold;
    ctx.fillText('HP', 12, 38);

    const hpFrac = Math.max(0, player.hp / player.maxHp);
    const fill = Math.round(barW * hpFrac);
    ctx.fillStyle = hpFrac > 0.50 ? '#c03030' : hpFrac > 0.25 ? '#c07820' : '#c0b020';
    ctx.fillRect(barX, barY, fill, barH);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = serif;
    ctx.fillStyle = gold;
    ctx.textAlign = 'right';
    ctx.fillText(`${player.hp} / ${player.maxHp}`, 268, 38);
    ctx.textAlign = 'left';

    const wpn = player.equippedWeapon
      ? `${player.equippedWeapon.name.toUpperCase()}  +${player.equippedWeapon.attack}`
      : '--';
    ctx.fillText(`[${wpn}]`, 12, 80);

    const arm = player.equippedArmor
      ? `${player.equippedArmor.name.toUpperCase()}  ${player.equippedArmor.durability}/${player.equippedArmor.maxDurability}`
      : '--';
    ctx.fillText(`[${arm}]`, 12, 118);

    const roman = ROMAN[player.dungeonLevel - 1] || String(player.dungeonLevel);
    ctx.textAlign = 'right';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillStyle = gold;
    ctx.fillText('LEVEL', 790, 38);
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText(roman, 790, 105);
    ctx.textAlign = 'left';

    const prompt = getActionPrompt();
    if (prompt) {
      ctx.font = 'bold 23px Georgia, serif';
      const tw = ctx.measureText(prompt.text).width;
      const px = (canvas.width - tw) / 2;
      const py = VIEW_BOT + 116;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(px - 8, py - 20, tw + 16, 28);
      ctx.fillStyle = prompt.color;
      ctx.fillText(prompt.text, px, py);
    }

    if (hasFlankingEnemy()) {
      ctx.font = 'bold 23px Georgia, serif';
      const warn = '! DANGER';
      const tw = ctx.measureText(warn).width;
      const px = (canvas.width - tw) / 2;
      const py = VIEW_BOT + 148;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(px - 8, py - 20, tw + 16, 28);
      ctx.fillStyle = '#e03030';
      ctx.fillText(warn, px, py);
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
      case 'n': debug.noclip      = !debug.noclip;      break;
      case 'g': debug.godMode     = !debug.godMode;     break;
      case 'd': debug.showDpad    = !debug.showDpad;    break;
      case 'e': debug.showEnemies = !debug.showEnemies; break;
      case 'm': debug.showMouse  = !debug.showMouse;   break;
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
    renderView(ctx, buildScene(map, maxDepth, enemies, items, corpses));

    if (gameState === 'won')  { drawWinScreen();      return; }
    if (gameState === 'dead') { drawGameOverScreen();  return; }

    drawMinimap();
    drawEventLog();
    drawHUD();
    if (debug.showDpad) drawDpad(ctx);
    drawDebugPanel(ctx, map);
    drawMouseCoords(ctx);
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
      if (k.length === 1 && 'ngtxlrdm'.includes(k)) { runDebugCmd(k); return; }
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
    const { acted, moved, bumpedEnemy } = handleKey(e, map, enemies);
    if (acted && moved)  resolvePlayerAction(bumpedEnemy);
    else if (acted)      draw();
  });

  // Roll a player attack. Returns { hit, crit, damage }.
  // 15% miss chance; on a hit, 10% crit doubles damage.
  function rollPlayerAttack(weaponAttack, targetDefense) {
    if (Math.random() < 0.15) return { hit: false, crit: false, damage: 0 };
    const roll = Math.ceil(Math.random() * 6);
    const base = Math.max(1, roll + weaponAttack - targetDefense);
    const crit = Math.random() < 0.10;
    return { hit: true, crit, damage: crit ? base * 2 : base };
  }

  // Roll an enemy attack. Returns { hit, damage }. Enemies cannot crit.
  function rollEnemyAttack(enemyAttack, targetDefense) {
    if (Math.random() < 0.15) return { hit: false, damage: 0 };
    const roll = Math.ceil(Math.random() * 6);
    return { hit: true, damage: Math.max(1, roll + enemyAttack - targetDefense) };
  }

  function resolvePlayerAction(bumpedEnemy = null) {
    if (bumpedEnemy) {
      const { hit, crit, damage } = rollPlayerAttack(player.equippedWeapon.attack, bumpedEnemy.defense);
      if (!hit) {
        logEvent(`You miss the ${bumpedEnemy.name}.`, '#808080');
      } else {
        bumpedEnemy.hp -= damage;
        if (crit) logEvent(`CRITICAL HIT! You hit the ${bumpedEnemy.name} for ${damage}!`, '#ffd700');
        else       logEvent(`You hit the ${bumpedEnemy.name} for ${damage}.`, '#f5d485');
        if (bumpedEnemy.hp <= 0) {
          enemies.splice(enemies.indexOf(bumpedEnemy), 1);
          corpses.push({ x: bumpedEnemy.x, y: bumpedEnemy.y, type: bumpedEnemy.type });
          logEvent(`The ${bumpedEnemy.name} is dead.`, '#e03030');
        }
      }
    }
    // Enemy turn — each enemy either attacks (if adjacent) or moves toward the player (if alerted).
    if (!debug.godMode) {
      const totalDefense = player.defense + (player.equippedArmor?.defense ?? 0);

      // Grant awareness to any enemy that now has line of sight to the player.
      // Alert state is permanent — once spotted, enemies chase around corners.
      for (const e of enemies) {
        if (!e.alerted) {
          const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
          if (dist <= 1 || hasLineOfSight(map, e.x, e.y)) e.alerted = true;
        }
      }

      for (const e of enemies) {
        const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
        if (dist === 1) {
          e.alerted = true;
          const { hit, damage } = rollEnemyAttack(e.attack, totalDefense);
          if (!hit) logEvent(`The ${e.name} misses you.`, '#808080');
          else { player.hp -= damage; logEvent(`The ${e.name} hits you for ${damage}.`, '#e03030'); }
        } else if (e.alerted) {
          e.moveTimer++;
          if (e.moveTimer >= e.movePeriod) {
            e.moveTimer = 0;
            stepTowardPlayer(map, e, enemies);
          }
        }
      }
      checkDeath();
    }
    markVisited(player.x, player.y);
    const itemIdx = items.findIndex(it => it.x === player.x && it.y === player.y);
    if (itemIdx !== -1) pickupItem(items.splice(itemIdx, 1)[0]);
    if (map[player.y][player.x] === TILE.STAIRS) descend();
    updateEnemyFacing(map, enemies);
    draw();
  }

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
    if (key) {
      const { acted, moved, bumpedEnemy } = handleKey({ key }, map, enemies);
      if (acted && moved)  resolvePlayerAction(bumpedEnemy);
      else if (acted)      draw();
    }
  }

  canvas.addEventListener('touchstart', handlePointer, { passive: false });
  canvas.addEventListener('mousedown',  handlePointer);
  canvas.addEventListener('pointermove',   e  => { debug.mousePos = getCanvasXY(e, canvas); if (debug.showMouse) draw(); });
  canvas.addEventListener('pointerleave',  () => { debug.mousePos = null; if (debug.showMouse) draw(); });
  canvas.addEventListener('pointerup',     () => { debug.mousePos = null; if (debug.showMouse) draw(); });
  canvas.addEventListener('pointercancel', () => { debug.mousePos = null; if (debug.showMouse) draw(); });

  await preloadItemSprites(VERSION.commit);
  draw();
});
