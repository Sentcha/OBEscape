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

// Dispatch to the correct item sprite.
function drawItem(ctx, far, shade, type) {
  const cx = (far.l + far.r) / 2;
  const by = far.b;
  const pw = far.r - far.l;
  const ph = far.b - far.t;
  switch (type) {
    case ITEM_TYPE.BOWIE_KNIFE:    drawBowieKnife   (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.PICKAXE_HANDLE: drawPickaxeHandle(ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.REVOLVER:       drawRevolver     (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.MACHETE:        drawMachete      (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.ALIEN_ROD:      drawAlienRod     (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.BANDAGES:       drawBandages     (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.LAUDANUM:       drawLaudanum     (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.LEATHER_VEST:   drawLeatherVest  (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.SURVEY_COAT:    drawSurveyCoat   (ctx, cx, by, pw, ph, shade); break;
    case ITEM_TYPE.ALIEN_PLATE:    drawAlienPlate   (ctx, cx, by, pw, ph, shade); break;
  }
}

// ---------------------------------------------------------------------------
// Item sprites — silhouettes sitting in the lower third of the portal
// ---------------------------------------------------------------------------

function drawBowieKnife(ctx, cx, by, pw, ph, shade) {
  // Blade
  ctx.fillStyle = shadeColor('#c0c0c0', shade);
  ctx.fillRect(cx - pw * 0.0125, by - ph * 0.32, pw * 0.025, ph * 0.26);
  // Crossguard
  ctx.fillStyle = shadeColor('#8b6914', shade);
  ctx.fillRect(cx - pw * 0.04,   by - ph * 0.08, pw * 0.08,  ph * 0.02);
  // Handle
  ctx.fillStyle = shadeColor('#5a3010', shade);
  ctx.fillRect(cx - pw * 0.015,  by - ph * 0.06, pw * 0.03,  ph * 0.06);
}

function drawPickaxeHandle(ctx, cx, by, pw, ph, shade) {
  const woodColor = shadeColor('#8b6030', shade);
  // Shaft
  ctx.fillStyle = woodColor;
  ctx.fillRect(cx - pw * 0.025, by - ph * 0.34, pw * 0.05, ph * 0.30);
  // Flared head
  ctx.fillStyle = shadeColor('#6a4820', shade);
  ctx.fillRect(cx - pw * 0.045, by - ph * 0.34, pw * 0.09, ph * 0.06);
}

function drawRevolver(ctx, cx, by, pw, ph, shade) {
  const metalColor  = shadeColor('#484848', shade);
  const woodColor   = shadeColor('#5a3010', shade);
  // Barrel (horizontal)
  ctx.fillStyle = metalColor;
  ctx.fillRect(cx - pw * 0.09, by - ph * 0.24, pw * 0.18, ph * 0.05);
  // Cylinder
  ctx.beginPath();
  ctx.ellipse(cx - pw * 0.01, by - ph * 0.17, pw * 0.06, ph * 0.07, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#383838', shade);
  ctx.fill();
  // Grip
  fillPoly(ctx, [
    [cx + pw * 0.04, by - ph * 0.10],
    [cx + pw * 0.08, by - ph * 0.10],
    [cx + pw * 0.10, by - ph * 0.04],
    [cx + pw * 0.06, by - ph * 0.04],
  ], woodColor);
}

function drawMachete(ctx, cx, by, pw, ph, shade) {
  // Broad blade — wider at tip
  fillPoly(ctx, [
    [cx - pw * 0.02, by - ph * 0.06],
    [cx + pw * 0.02, by - ph * 0.06],
    [cx + pw * 0.06, by - ph * 0.32],
    [cx - pw * 0.01, by - ph * 0.32],
  ], shadeColor('#a0a080', shade));
  // Handle
  ctx.fillStyle = shadeColor('#5a3010', shade);
  ctx.fillRect(cx - pw * 0.015, by - ph * 0.06, pw * 0.03, ph * 0.06);
}

function drawAlienRod(ctx, cx, by, pw, ph, shade) {
  // Rod body
  ctx.fillStyle = shadeColor('#2a2a3a', shade);
  ctx.fillRect(cx - pw * 0.02, by - ph * 0.33, pw * 0.04, ph * 0.29);
  // Ring details
  ctx.fillStyle = shadeColor('#4a4a6a', shade);
  ctx.fillRect(cx - pw * 0.025, by - ph * 0.18, pw * 0.05, ph * 0.01);
  ctx.fillRect(cx - pw * 0.025, by - ph * 0.24, pw * 0.05, ph * 0.01);
  // Glowing tip
  ctx.beginPath();
  ctx.ellipse(cx, by - ph * 0.35, pw * 0.05, ph * 0.04, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#a0e0ff', shade);
  ctx.fill();
}

function drawBandages(ctx, cx, by, pw, ph, shade) {
  // Rolled bandage
  ctx.beginPath();
  ctx.ellipse(cx, by - ph * 0.08, pw * 0.07, ph * 0.06, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#e8dcc8', shade);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, by - ph * 0.08, pw * 0.035, ph * 0.03, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor('#d0c0a0', shade);
  ctx.fill();
  // Unrolled tail
  ctx.fillStyle = shadeColor('#e8dcc8', shade);
  ctx.fillRect(cx + pw * 0.06, by - ph * 0.09, pw * 0.06, ph * 0.015);
}

function drawLaudanum(ctx, cx, by, pw, ph, shade) {
  // Bottle body
  ctx.fillStyle = shadeColor('#3a1a2a', shade);
  ctx.fillRect(cx - pw * 0.03, by - ph * 0.18, pw * 0.06, ph * 0.14);
  // Neck
  ctx.fillRect(cx - pw * 0.015, by - ph * 0.22, pw * 0.03, ph * 0.04);
  // Cork
  ctx.fillStyle = shadeColor('#8b6030', shade);
  ctx.fillRect(cx - pw * 0.02, by - ph * 0.25, pw * 0.04, ph * 0.025);
  // Label highlight
  ctx.fillStyle = shadeColor('#6a3a5a', shade);
  ctx.fillRect(cx - pw * 0.022, by - ph * 0.15, pw * 0.044, ph * 0.06);
}

function drawLeatherVest(ctx, cx, by, pw, ph, shade) {
  const color = shadeColor('#6a3a20', shade);
  // Body trapezoid — wider at shoulders
  fillPoly(ctx, [
    [cx - pw * 0.12, by - ph * 0.36],
    [cx + pw * 0.12, by - ph * 0.36],
    [cx + pw * 0.09, by - ph * 0.06],
    [cx - pw * 0.09, by - ph * 0.06],
  ], color);
  // V-neck cutout
  fillPoly(ctx, [
    [cx,             by - ph * 0.36],
    [cx - pw * 0.04, by - ph * 0.26],
    [cx + pw * 0.04, by - ph * 0.26],
  ], shadeColor('#c2a256', shade));
}

function drawSurveyCoat(ctx, cx, by, pw, ph, shade) {
  const color  = shadeColor('#4a4a38', shade);
  const lapel  = shadeColor('#5a5a48', shade);
  // Coat body
  fillPoly(ctx, [
    [cx - pw * 0.13, by - ph * 0.44],
    [cx + pw * 0.13, by - ph * 0.44],
    [cx + pw * 0.10, by - ph * 0.04],
    [cx - pw * 0.10, by - ph * 0.04],
  ], color);
  // Left lapel
  fillPoly(ctx, [
    [cx,             by - ph * 0.44],
    [cx - pw * 0.06, by - ph * 0.30],
    [cx - pw * 0.02, by - ph * 0.28],
  ], lapel);
  // Right lapel
  fillPoly(ctx, [
    [cx,             by - ph * 0.44],
    [cx + pw * 0.06, by - ph * 0.30],
    [cx + pw * 0.02, by - ph * 0.28],
  ], lapel);
}

function drawAlienPlate(ctx, cx, by, pw, ph, shade) {
  const color     = shadeColor('#1a1a2a', shade);
  const highlight = shadeColor('#4a4a6a', shade);
  // Irregular angular fragment
  fillPoly(ctx, [
    [cx - pw * 0.04, by - ph * 0.40],
    [cx + pw * 0.10, by - ph * 0.36],
    [cx + pw * 0.13, by - ph * 0.18],
    [cx + pw * 0.06, by - ph * 0.06],
    [cx - pw * 0.10, by - ph * 0.10],
    [cx - pw * 0.12, by - ph * 0.28],
  ], color);
  // Metallic highlight lines
  ctx.fillStyle = highlight;
  ctx.fillRect(cx - pw * 0.02, by - ph * 0.38, pw * 0.10, ph * 0.01);
  ctx.fillRect(cx + pw * 0.04, by - ph * 0.28, pw * 0.07, ph * 0.01);
}
