const ITEM_TYPE = {
  BOWIE_KNIFE:    'bowieKnife',
  PICKAXE_HANDLE: 'pickaxeHandle',
  REVOLVER:       'revolver',
  MACHETE:        'machete',
  ALIEN_ROD:      'alienRod',
  BANDAGES:       'bandages',
  LAUDANUM:       'laudanum',
  LEATHER_VEST:   'leatherVest',
  SURVEY_COAT:    'surveyCoat',
  ALIEN_PLATE:    'alienPlate',
};

// Items available per dungeon level — scarce, colonial on upper floors,
// alien on lower floors.
const LEVEL_ITEMS = {
  1: ['bandages', 'pickaxeHandle', 'leatherVest'],
  2: ['bandages', 'revolver',      'leatherVest', 'surveyCoat', 'machete'],
  3: ['bandages', 'laudanum',      'surveyCoat',  'machete',    'revolver'],
  4: ['laudanum', 'machete',       'surveyCoat',  'alienPlate', 'alienRod'],
  5: ['laudanum', 'alienRod',      'alienPlate'],
};

const ITEM_STATS = {
  bowieKnife:    { name: 'Bowie Knife',    attack:  4,                    itemType: 'weapon'     },
  pickaxeHandle: { name: 'Pickaxe Handle', attack:  5,                    itemType: 'weapon'     },
  revolver:      { name: 'Revolver',       attack:  7,                    itemType: 'weapon'     },
  machete:       { name: 'Machete',        attack:  5,                    itemType: 'weapon'     },
  alienRod:      { name: 'Alien Rod',      attack:  9,                    itemType: 'weapon'     },
  bandages:      { name: 'Bandages',       heal:    8,                    itemType: 'consumable' },
  laudanum:      { name: 'Laudanum',       heal:   14,                    itemType: 'consumable' },
  leatherVest:   { name: 'Leather Vest',   defense: 1, maxDurability: 3,  itemType: 'armor'      },
  surveyCoat:    { name: 'Survey Coat',    defense: 2, maxDurability: 4,  itemType: 'armor'      },
  alienPlate:    { name: 'Alien Plate',    defense: 4, maxDurability: 2,  itemType: 'armor'      },
};

// Scan map for TILE.ITEM markers, build live item objects, replace with TILE.FLOOR.
function loadItems(map, dungeonLevel) {
  const pool  = LEVEL_ITEMS[dungeonLevel] || ['bandages'];
  const items = [];
  for (let y = 0; y < map.length; y++)
    for (let x = 0; x < map[y].length; x++)
      if (map[y][x] === TILE.ITEM) {
        const type  = pool[Math.floor(Math.random() * pool.length)];
        const stats = ITEM_STATS[type];
        const item  = { x, y, type, ...stats };
        if (item.itemType === 'armor') item.durability = stats.maxDurability;
        items.push(item);
        map[y][x] = TILE.FLOOR;
      }
  return items;
}

// ---------------------------------------------------------------------------
// Sprite cache — populated by preloadItemSprites() before the game starts.
// ---------------------------------------------------------------------------

const itemSpriteMap = {};

// Call this once at startup (async, awaited from main.js).
function preloadItemSprites(version) {
  const NAMES = [
    [ITEM_TYPE.BOWIE_KNIFE,    'bowie-knife'],
    [ITEM_TYPE.PICKAXE_HANDLE, 'pickaxe-handle'],
    [ITEM_TYPE.REVOLVER,       'revolver'],
    [ITEM_TYPE.MACHETE,        'machete'],
    [ITEM_TYPE.ALIEN_ROD,      'alien-rod'],
    [ITEM_TYPE.BANDAGES,       'bandages'],
    [ITEM_TYPE.LAUDANUM,       'laudanum'],
    [ITEM_TYPE.LEATHER_VEST,   'leather-vest'],
    [ITEM_TYPE.SURVEY_COAT,    'survey-coat'],
    [ITEM_TYPE.ALIEN_PLATE,    'alien-plate'],
  ];
  return Promise.all(NAMES.map(([type, name]) =>
    new Promise(resolve => {
      const img = new Image();
      img.onload  = () => { itemSpriteMap[type] = img; resolve(); };
      img.onerror = resolve; // graceful degradation — drawItem returns early if missing
      img.src = `assets/items/${name}.png?v=${version}`;
    })
  ));
}

// Blit cached sprite into the portal with depth-based shading.
function drawItem(ctx, far, shade, type) {
  const img = itemSpriteMap[type];
  if (!img) return;
  const cx   = (far.l + far.r) / 2;
  const ph   = far.b - far.t;
  const size = ph * 0.40;
  ctx.globalAlpha = shade;
  ctx.drawImage(img, Math.round(cx - size / 2), Math.round(far.b - size), Math.round(size), Math.round(size));
  ctx.globalAlpha = 1.0;
}

// ---------------------------------------------------------------------------
// Internal sprite dispatch — called by the generator script and by the
// browser-side sprite fallback (if ever needed).
// ---------------------------------------------------------------------------

function _drawItemSprite(ctx, type, S) {
  switch (type) {
    case ITEM_TYPE.BOWIE_KNIFE:    drawBowieKnifeSprite   (ctx, S); break;
    case ITEM_TYPE.PICKAXE_HANDLE: drawPickaxeHandleSprite(ctx, S); break;
    case ITEM_TYPE.REVOLVER:       drawRevolverSprite     (ctx, S); break;
    case ITEM_TYPE.MACHETE:        drawMacheteSprite      (ctx, S); break;
    case ITEM_TYPE.ALIEN_ROD:      drawAlienRodSprite     (ctx, S); break;
    case ITEM_TYPE.BANDAGES:       drawBandagesSprite     (ctx, S); break;
    case ITEM_TYPE.LAUDANUM:       drawLaudanumSprite     (ctx, S); break;
    case ITEM_TYPE.LEATHER_VEST:   drawLeatherVestSprite  (ctx, S); break;
    case ITEM_TYPE.SURVEY_COAT:    drawSurveyCoatSprite   (ctx, S); break;
    case ITEM_TYPE.ALIEN_PLATE:    drawAlienPlateSprite   (ctx, S); break;
  }
}

// ---------------------------------------------------------------------------
// Item sprites — designed for 128×128 px, anchored bottom-centre.
// Colors at full brightness (shade=1.0); globalAlpha applied at blit time.
// ---------------------------------------------------------------------------

function drawBowieKnifeSprite(ctx, S) {
  const cx = S / 2;
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, S - 4, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pommel — brass cap
  ctx.fillStyle = shadeColor('#c8a018', 1);
  ctx.fillRect(cx - 8, S - 12, 16, 11);
  ctx.fillStyle = shadeColor('#e8c830', 1);
  ctx.fillRect(cx - 8, S - 12, 16, 4);
  // Grip — dark walnut
  ctx.fillStyle = shadeColor('#3c1c08', 1);
  ctx.fillRect(cx - 6, S - 38, 12, 26);
  // Grip lit face
  ctx.fillStyle = shadeColor('#5c2e12', 1);
  ctx.fillRect(cx - 6, S - 38, 4, 26);
  // Grip wrap bands
  ctx.fillStyle = shadeColor('#241204', 1);
  ctx.fillRect(cx - 6, S - 18, 12, 3);
  ctx.fillRect(cx - 6, S - 26, 12, 3);
  ctx.fillRect(cx - 6, S - 34, 12, 3);
  // Crossguard — brass bar
  ctx.fillStyle = shadeColor('#c8a018', 1);
  ctx.fillRect(cx - 22, S - 42, 44, 5);
  ctx.fillStyle = shadeColor('#e8c830', 1);
  ctx.fillRect(cx - 22, S - 42, 44, 2);
  ctx.fillStyle = shadeColor('#906c08', 1);
  ctx.fillRect(cx - 22, S - 38, 44, 1);
  // Blade — clip-point polygon (spine left, edge clips to right)
  fillPoly(ctx, [
    [cx - 7, S - 42],
    [cx + 7, S - 42],
    [cx + 7, S - 84],  // right edge climbs to clip start
    [cx + 1, S - 108], // tip (slightly right of centre — classic clip-point)
    [cx - 7, S - 104], // spine top
  ], shadeColor('#b2b4c0', 1));
  // Bright edge bevel (right side, ~3px)
  fillPoly(ctx, [
    [cx + 4, S - 42],
    [cx + 7, S - 42],
    [cx + 7, S - 84],
    [cx + 1, S - 108],
  ], shadeColor('#dce0ee', 1));
  // Spine shadow strip
  ctx.fillStyle = shadeColor('#808098', 1);
  ctx.fillRect(cx - 7, S - 104, 3, 62);
  // Fuller groove
  ctx.fillStyle = shadeColor('#9090a8', 1);
  ctx.fillRect(cx - 3, S - 98, 2, 50);
}

function drawPickaxeHandleSprite(ctx, S) {
  const cx = S / 2;
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, S - 4, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shaft — tapered wooden pole (wider at bottom)
  fillPoly(ctx, [
    [cx - 8, S - 10],
    [cx + 8, S - 10],
    [cx + 6, S - 108],
    [cx - 6, S - 108],
  ], shadeColor('#5c2e12', 1));
  // Lit right face
  fillPoly(ctx, [
    [cx + 2, S - 10],
    [cx + 8, S - 10],
    [cx + 6, S - 108],
    [cx + 2, S - 108],
  ], shadeColor('#8c5a28', 1));
  // Wood grain lines
  ctx.strokeStyle = shadeColor('#3c1c08', 1);
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = S - 22 - i * 18;
    ctx.beginPath();
    ctx.moveTo(cx - 7, y);
    ctx.lineTo(cx + 4, y - 4);
    ctx.stroke();
  }
  // Worn / splintered top
  fillPoly(ctx, [
    [cx - 6, S - 104],
    [cx + 6, S - 104],
    [cx + 4, S - 116],
    [cx + 1, S - 118],
    [cx - 3, S - 114],
    [cx - 5, S - 108],
  ], shadeColor('#8c5a28', 1));
  // Grip wrap bands (near bottom)
  ctx.fillStyle = shadeColor('#241204', 1);
  ctx.fillRect(cx - 8, S - 28, 16, 4);
  ctx.fillRect(cx - 8, S - 42, 16, 4);
  ctx.fillRect(cx - 8, S - 56, 16, 4);
}

function drawRevolverSprite(ctx, S) {
  const cx = S / 2;
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, S - 4, 36, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Grip — angled walnut block (bottom-right)
  fillPoly(ctx, [
    [cx + 12, S - 16],
    [cx + 40, S - 16],
    [cx + 38, S - 62],
    [cx + 10, S - 62],
  ], shadeColor('#3c1c08', 1));
  // Grip lit face
  fillPoly(ctx, [
    [cx + 10, S - 16],
    [cx + 20, S - 16],
    [cx + 18, S - 62],
    [cx + 10, S - 62],
  ], shadeColor('#5c2e12', 1));
  // Grip checkering lines
  ctx.strokeStyle = shadeColor('#241204', 1);
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = S - 24 - i * 8;
    ctx.beginPath();
    ctx.moveTo(cx + 13, y);
    ctx.lineTo(cx + 37, y);
    ctx.stroke();
  }
  // Frame — main steel body (center-left)
  fillPoly(ctx, [
    [cx - 24, S - 48],
    [cx + 10, S - 48],
    [cx + 10, S - 16],
    [cx + 12, S - 16],
    [cx + 12, S - 62],
    [cx - 24, S - 62],
  ], shadeColor('#808098', 1));
  // Frame highlight strip
  ctx.fillStyle = shadeColor('#b2b4c0', 1);
  ctx.fillRect(cx - 24, S - 62, 5, 44);
  // Trigger guard — small arc at bottom
  ctx.beginPath();
  ctx.arc(cx + 2, S - 20, 16, 0, Math.PI);
  ctx.strokeStyle = shadeColor('#808098', 1);
  ctx.lineWidth = 4;
  ctx.stroke();
  // Cylinder — large distinctive ellipse
  ctx.beginPath();
  ctx.ellipse(cx - 6, S - 48, 22, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#606070', 1);
  ctx.fill();
  // Cylinder chambers (6 dots)
  ctx.fillStyle = shadeColor('#2a2a36', 1);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    ctx.beginPath();
    ctx.ellipse(cx - 6 + Math.cos(a) * 11, S - 48 + Math.sin(a) * 9, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cylinder highlight
  ctx.beginPath();
  ctx.ellipse(cx - 14, S - 56, 8, 6, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#9090a8', 1);
  ctx.fill();
  // Barrel — horizontal, pointing left
  ctx.fillStyle = shadeColor('#808098', 1);
  ctx.fillRect(cx - 56, S - 72, 36, 12);
  // Barrel top highlight
  ctx.fillStyle = shadeColor('#b2b4c0', 1);
  ctx.fillRect(cx - 56, S - 72, 36, 3);
  // Muzzle end cap
  ctx.fillStyle = shadeColor('#606070', 1);
  ctx.fillRect(cx - 60, S - 76, 6, 20);
  // Front sight
  ctx.fillStyle = shadeColor('#404050', 1);
  ctx.fillRect(cx - 50, S - 78, 5, 6);
  // Hammer — small notch at top-right of frame
  fillPoly(ctx, [
    [cx + 10, S - 62],
    [cx + 24, S - 62],
    [cx + 26, S - 72],
    [cx + 12, S - 74],
  ], shadeColor('#606070', 1));
}

function drawMacheteSprite(ctx, S) {
  const cx = S / 2;
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, S - 4, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Handle — rubber grip
  ctx.fillStyle = shadeColor('#282828', 1);
  ctx.fillRect(cx - 7, S - 10, 14, 24);
  // Grip lit edge
  ctx.fillStyle = shadeColor('#404040', 1);
  ctx.fillRect(cx - 7, S - 10, 4, 24);
  // Finger grooves
  ctx.fillStyle = shadeColor('#141414', 1);
  ctx.fillRect(cx - 5, S - 16, 10, 3);
  ctx.fillRect(cx - 5, S - 22, 10, 3);
  ctx.fillRect(cx - 5, S - 28, 10, 3);
  // Guard — flat steel bar (wider than grip)
  ctx.fillStyle = shadeColor('#b2b4c0', 1);
  ctx.fillRect(cx - 24, S - 35, 48, 6);
  ctx.fillStyle = shadeColor('#dce0ee', 1);
  ctx.fillRect(cx - 24, S - 35, 48, 2);
  ctx.fillStyle = shadeColor('#606070', 1);
  ctx.fillRect(cx - 24, S - 30, 48, 1);
  // Blade — wide belly (distinctly wider than knife — key identifier)
  fillPoly(ctx, [
    [cx - 8,  S - 35],  // base left (guard)
    [cx + 8,  S - 35],  // base right
    [cx + 54, S - 76],  // wide belly tip area
    [cx + 44, S - 106], // tip
    [cx - 8,  S - 106], // spine top
  ], shadeColor('#a0a090', 1));
  // Edge highlight — wide bright bevel (right side)
  fillPoly(ctx, [
    [cx + 2,  S - 35],
    [cx + 8,  S - 35],
    [cx + 54, S - 76],
    [cx + 44, S - 106],
    [cx + 22, S - 106],
  ], shadeColor('#dce0ee', 1));
  // Spine shadow (left edge)
  fillPoly(ctx, [
    [cx - 8,  S - 35],
    [cx - 2,  S - 35],
    [cx - 2,  S - 106],
    [cx - 8,  S - 96],
  ], shadeColor('#606070', 1));
}

function drawAlienRodSprite(ctx, S) {
  const cx = S / 2;
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, S - 4, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bottom end cap — angular alien metal
  fillPoly(ctx, [
    [cx - 10, S - 10],
    [cx + 10, S - 10],
    [cx + 7,  S - 22],
    [cx - 7,  S - 22],
  ], shadeColor('#304858', 1));
  ctx.fillStyle = shadeColor('#4c6878', 1);
  ctx.fillRect(cx - 10, S - 10, 20, 4);
  // Shaft — dark metal body
  ctx.fillStyle = shadeColor('#1c2c38', 1);
  ctx.fillRect(cx - 6, S - 112, 12, 90);
  // Shaft lit left face
  ctx.fillStyle = shadeColor('#304858', 1);
  ctx.fillRect(cx - 6, S - 112, 4, 90);
  // Shaft shadow right face
  ctx.fillStyle = shadeColor('#0e1820', 1);
  ctx.fillRect(cx + 3,  S - 112, 3, 90);
  // Three teal energy bands
  const bands = [S - 44, S - 66, S - 88];
  for (const by of bands) {
    ctx.fillStyle = shadeColor('#30a878', 1);
    ctx.fillRect(cx - 9, by - 6, 18, 12);
    ctx.fillStyle = shadeColor('#40b890', 1);
    ctx.fillRect(cx - 9, by - 4, 18, 8);
    ctx.fillStyle = shadeColor('#80e8d0', 1);
    ctx.fillRect(cx - 9, by - 2, 18, 4);
  }
  // Energy core glow (centre section between bands)
  ctx.fillStyle = shadeColor('#40b890', 1);
  ctx.fillRect(cx - 5, S - 82, 10, 22);
  ctx.fillStyle = shadeColor('#c0fff0', 1);
  ctx.fillRect(cx - 2, S - 80, 4, 18);
  // Top end cap — angular hexagonal
  fillPoly(ctx, [
    [cx - 7,  S - 112],
    [cx + 7,  S - 112],
    [cx + 10, S - 120],
    [cx + 5,  S - 126],
    [cx - 5,  S - 126],
    [cx - 10, S - 120],
  ], shadeColor('#304858', 1));
  ctx.fillStyle = shadeColor('#80e8d0', 1);
  ctx.fillRect(cx - 3, S - 124, 6, 8);
}

function drawBandagesSprite(ctx, S) {
  const cx = S / 2;
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, S - 4, 44, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Roll cylinder side face
  ctx.fillStyle = shadeColor('#c8c0b0', 1);
  ctx.fillRect(cx - 38, S - 50, 76, 38);
  // Layer division lines on side
  ctx.strokeStyle = shadeColor('#b0a890', 1);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, S - 50); ctx.lineTo(cx - 14, S - 12);
  ctx.moveTo(cx + 14, S - 50); ctx.lineTo(cx + 14, S - 12);
  ctx.stroke();
  // Right shadow on cylinder side
  ctx.fillStyle = shadeColor('#a09880', 1);
  ctx.fillRect(cx + 22, S - 50, 16, 38);
  // Top ellipse of roll
  ctx.beginPath();
  ctx.ellipse(cx, S - 50, 38, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#e0d8c8', 1);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, S - 50, 30, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#c8c0b0', 1);
  ctx.fill();
  // Red cross — bold, key identifier
  ctx.fillStyle = shadeColor('#c02020', 1);
  ctx.fillRect(cx - 5,  S - 66, 10, 30); // vertical bar
  ctx.fillRect(cx - 18, S - 55, 36, 10); // horizontal bar
  // Cross highlight
  ctx.fillStyle = shadeColor('#e03030', 1);
  ctx.fillRect(cx - 5,  S - 66, 4, 30);
  ctx.fillRect(cx - 18, S - 55, 36, 4);
  // Unrolling tail (to the right)
  fillPoly(ctx, [
    [cx + 38, S - 28],
    [cx + 38, S - 16],
    [cx + 58, S - 12],
    [cx + 60, S - 22],
  ], shadeColor('#e0d8c8', 1));
}

function drawLaudanumSprite(ctx, S) {
  const cx = S / 2;
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, S - 4, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bottle body — amber glass (slight trapezoid, wider at bottom)
  fillPoly(ctx, [
    [cx - 15, S - 10],
    [cx + 15, S - 10],
    [cx + 12, S - 74],
    [cx - 12, S - 74],
  ], shadeColor('#883c0e', 1));
  // Glass highlight — left column
  fillPoly(ctx, [
    [cx - 15, S - 10],
    [cx - 6,  S - 10],
    [cx - 6,  S - 74],
    [cx - 12, S - 74],
  ], shadeColor('#c05820', 1));
  // Glass transparency glint
  ctx.fillStyle = shadeColor('#f08040', 1);
  ctx.fillRect(cx - 12, S - 58, 4, 34);
  // Aged paper label
  fillPoly(ctx, [
    [cx - 12, S - 18],
    [cx + 12, S - 18],
    [cx + 11, S - 58],
    [cx - 11, S - 58],
  ], shadeColor('#d4c090', 1));
  // Skull head — ink on label
  ctx.fillStyle = shadeColor('#3a2808', 1);
  ctx.beginPath();
  ctx.arc(cx, S - 42, 7, 0, Math.PI * 2);
  ctx.fill();
  // Skull eye sockets
  ctx.fillStyle = shadeColor('#d4c090', 1);
  ctx.fillRect(cx - 5, S - 44, 3, 4);
  ctx.fillRect(cx + 2, S - 44, 3, 4);
  // Crossbones
  ctx.strokeStyle = shadeColor('#3a2808', 1);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 9, S - 26); ctx.lineTo(cx + 9, S - 34);
  ctx.moveTo(cx + 9, S - 26); ctx.lineTo(cx - 9, S - 34);
  ctx.stroke();
  // Bottle shoulder taper
  fillPoly(ctx, [
    [cx - 12, S - 74],
    [cx + 12, S - 74],
    [cx + 7,  S - 84],
    [cx - 7,  S - 84],
  ], shadeColor('#883c0e', 1));
  // Bottle neck
  ctx.fillStyle = shadeColor('#883c0e', 1);
  ctx.fillRect(cx - 6, S - 96, 12, 12);
  ctx.fillStyle = shadeColor('#c05820', 1);
  ctx.fillRect(cx - 6, S - 96, 4, 12);
  // Neck ring
  ctx.fillStyle = shadeColor('#c05820', 1);
  ctx.fillRect(cx - 8, S - 100, 16, 5);
  // Cork
  ctx.fillStyle = shadeColor('#7a5030', 1);
  ctx.fillRect(cx - 5, S - 116, 10, 18);
  ctx.fillStyle = shadeColor('#9a6840', 1);
  ctx.fillRect(cx - 5, S - 116, 4, 18);
}

function drawLeatherVestSprite(ctx, S) {
  const cx = S / 2;
  // Vest body — trapezoid wider at shoulders
  fillPoly(ctx, [
    [cx - 46, S - 18],
    [cx + 46, S - 18],
    [cx + 34, S - 106],
    [cx - 34, S - 106],
  ], shadeColor('#7a4018', 1));
  // Right panel shadow
  fillPoly(ctx, [
    [cx + 8,  S - 18],
    [cx + 46, S - 18],
    [cx + 34, S - 106],
    [cx + 8,  S - 106],
  ], shadeColor('#5a2c10', 1));
  // Left panel highlight
  fillPoly(ctx, [
    [cx - 46, S - 18],
    [cx - 28, S - 18],
    [cx - 24, S - 106],
    [cx - 34, S - 106],
  ], shadeColor('#b05828', 1));
  // V-neck cutout (dark interior)
  fillPoly(ctx, [
    [cx,      S - 106],
    [cx - 18, S - 68],
    [cx + 18, S - 68],
  ], shadeColor('#1c1410', 1));
  // Left armhole
  ctx.beginPath();
  ctx.ellipse(cx - 40, S - 74, 10, 16, -0.25, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#1c1410', 1);
  ctx.fill();
  // Right armhole
  ctx.beginPath();
  ctx.ellipse(cx + 40, S - 74, 10, 16, 0.25, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#1c1410', 1);
  ctx.fill();
  // Stitching along seams (dashed)
  ctx.strokeStyle = shadeColor('#5a2c10', 1);
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx - 30, S - 100); ctx.lineTo(cx - 22, S - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 30, S - 100); ctx.lineTo(cx + 22, S - 22);
  ctx.stroke();
  ctx.setLineDash([]);
  // Brass front buckle
  ctx.fillStyle = shadeColor('#c8a018', 1);
  ctx.fillRect(cx - 8, S - 56, 16, 12);
  ctx.fillStyle = shadeColor('#e8c830', 1);
  ctx.fillRect(cx - 8, S - 56, 16, 4);
  ctx.fillStyle = shadeColor('#906c08', 1);
  ctx.fillRect(cx - 3, S - 50, 6, 6);
}

function drawSurveyCoatSprite(ctx, S) {
  const cx = S / 2;
  // Coat body — taller and wider than vest
  fillPoly(ctx, [
    [cx - 50, S - 12],
    [cx + 50, S - 12],
    [cx + 38, S - 120],
    [cx - 38, S - 120],
  ], shadeColor('#b89850', 1));
  // Right side shadow
  fillPoly(ctx, [
    [cx + 8,  S - 12],
    [cx + 50, S - 12],
    [cx + 38, S - 120],
    [cx + 8,  S - 120],
  ], shadeColor('#8a7030', 1));
  // Left side highlight
  fillPoly(ctx, [
    [cx - 50, S - 12],
    [cx - 32, S - 12],
    [cx - 28, S - 120],
    [cx - 38, S - 120],
  ], shadeColor('#e0b860', 1));
  // Centre button placket
  ctx.fillStyle = shadeColor('#8a7030', 1);
  ctx.fillRect(cx - 6, S - 12, 12, 108);
  // 5 Brass buttons down centre
  ctx.fillStyle = shadeColor('#c8a018', 1);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(cx, S - 28 - i * 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = shadeColor('#e8c830', 1);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(cx - 1, S - 29 - i * 18, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Left lapel
  fillPoly(ctx, [
    [cx,      S - 120],
    [cx - 28, S - 80],
    [cx - 8,  S - 68],
    [cx - 6,  S - 120],
  ], shadeColor('#e0b860', 1));
  // Right lapel
  fillPoly(ctx, [
    [cx,     S - 120],
    [cx + 28, S - 80],
    [cx + 8,  S - 68],
    [cx + 6,  S - 120],
  ], shadeColor('#c8a040', 1));
  // Left armhole
  ctx.beginPath();
  ctx.ellipse(cx - 44, S - 72, 10, 18, -0.25, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#1c1410', 1);
  ctx.fill();
  // Right armhole
  ctx.beginPath();
  ctx.ellipse(cx + 44, S - 72, 10, 18, 0.25, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#1c1410', 1);
  ctx.fill();
  // Shoulder epaulettes — brass strips
  ctx.fillStyle = shadeColor('#c8a018', 1);
  ctx.fillRect(cx - 50, S - 126, 22, 8);
  ctx.fillRect(cx + 28, S - 126, 22, 8);
  ctx.fillStyle = shadeColor('#e8c830', 1);
  ctx.fillRect(cx - 50, S - 126, 22, 3);
  ctx.fillRect(cx + 28, S - 126, 22, 3);
  // Chest pocket (left breast)
  ctx.strokeStyle = shadeColor('#8a7030', 1);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 42, S - 94, 18, 20);
  // Lower pocket flap (right)
  ctx.fillStyle = shadeColor('#8a7030', 1);
  ctx.fillRect(cx + 18, S - 56, 18, 6);
}

function drawAlienPlateSprite(ctx, S) {
  const cx = S / 2;
  // Main angular chest plate
  fillPoly(ctx, [
    [cx - 38, S - 106],
    [cx + 38, S - 106],
    [cx + 46, S - 58],
    [cx + 30, S - 12],
    [cx - 30, S - 12],
    [cx - 46, S - 58],
  ], shadeColor('#1c2c38', 1));
  // Left lit panel
  fillPoly(ctx, [
    [cx - 38, S - 106],
    [cx,      S - 106],
    [cx,      S - 12],
    [cx - 30, S - 12],
    [cx - 46, S - 58],
  ], shadeColor('#304858', 1));
  // Right dark panel
  fillPoly(ctx, [
    [cx,      S - 106],
    [cx + 38, S - 106],
    [cx + 46, S - 58],
    [cx + 30, S - 12],
    [cx,      S - 12],
  ], shadeColor('#141e28', 1));
  // Left shoulder pauldron
  fillPoly(ctx, [
    [cx - 38, S - 106],
    [cx - 46, S - 58],
    [cx - 58, S - 66],
    [cx - 54, S - 112],
  ], shadeColor('#304858', 1));
  // Right shoulder pauldron
  fillPoly(ctx, [
    [cx + 38, S - 106],
    [cx + 46, S - 58],
    [cx + 58, S - 66],
    [cx + 54, S - 112],
  ], shadeColor('#1c2c38', 1));
  // Vertical energy channel (centre spine)
  ctx.fillStyle = shadeColor('#30a878', 1);
  ctx.fillRect(cx - 4, S - 102, 8, 90);
  ctx.fillStyle = shadeColor('#c0fff0', 1);
  ctx.fillRect(cx - 2, S - 100, 4, 86);
  // Three horizontal energy bands
  const hbands = [S - 36, S - 60, S - 84];
  for (const hy of hbands) {
    ctx.fillStyle = shadeColor('#30a878', 1);
    ctx.fillRect(cx - 36, hy - 5, 72, 10);
    ctx.fillStyle = shadeColor('#80e8d0', 1);
    ctx.fillRect(cx - 36, hy - 3, 72, 6);
  }
  // Power core — triple concentric ellipses
  ctx.beginPath();
  ctx.ellipse(cx, S - 62, 16, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#40b890', 1);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, S - 62, 10, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#80e8d0', 1);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, S - 62, 5, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#c0fff0', 1);
  ctx.fill();
  // Edge trim highlights
  ctx.strokeStyle = shadeColor('#4c6878', 1);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 38, S - 106);
  ctx.lineTo(cx + 38, S - 106);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 54, S - 112);
  ctx.lineTo(cx - 46, S - 58);
  ctx.moveTo(cx + 46, S - 58);
  ctx.lineTo(cx + 54, S - 112);
  ctx.stroke();
}
