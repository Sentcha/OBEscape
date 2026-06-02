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
  // Pommel — brass cap
  ctx.fillStyle = shadeColor('#c8a018', shade);
  ctx.fillRect(cx - pw*0.022, by - ph*0.080, pw*0.044, ph*0.028);
  ctx.fillStyle = shadeColor('#e8c830', shade);
  ctx.fillRect(cx - pw*0.022, by - ph*0.080, pw*0.044, ph*0.010);
  // Grip — dark walnut
  ctx.fillStyle = shadeColor('#3c1c08', shade);
  ctx.fillRect(cx - pw*0.016, by - ph*0.160, pw*0.032, ph*0.080);
  // Grip lit face
  ctx.fillStyle = shadeColor('#5c2e12', shade);
  ctx.fillRect(cx - pw*0.016, by - ph*0.160, pw*0.010, ph*0.080);
  // Grip wrap bands
  ctx.fillStyle = shadeColor('#241204', shade);
  for (let i = 0; i < 3; i++)
    ctx.fillRect(cx - pw*0.016, by - ph*(0.100 + i*0.022), pw*0.032, ph*0.008);
  // Crossguard — brass horizontal bar
  ctx.fillStyle = shadeColor('#c8a018', shade);
  ctx.fillRect(cx - pw*0.048, by - ph*0.168, pw*0.096, ph*0.020);
  ctx.fillStyle = shadeColor('#e8c830', shade);
  ctx.fillRect(cx - pw*0.048, by - ph*0.168, pw*0.096, ph*0.006);
  // Blade — clip-point polygon
  fillPoly(ctx, [
    [cx - pw*0.014, by - ph*0.168],
    [cx + pw*0.014, by - ph*0.168],
    [cx + pw*0.008, by - ph*0.462],
    [cx,            by - ph*0.488],
    [cx - pw*0.008, by - ph*0.462],
  ], shadeColor('#b2b4c0', shade));
  // Edge highlight (right bevel)
  fillPoly(ctx, [
    [cx + pw*0.006, by - ph*0.168],
    [cx + pw*0.014, by - ph*0.168],
    [cx + pw*0.008, by - ph*0.462],
    [cx,            by - ph*0.488],
  ], shadeColor('#dce0ee', shade));
  // Spine shadow
  ctx.fillStyle = shadeColor('#808098', shade);
  ctx.fillRect(cx - pw*0.014, by - ph*0.460, pw*0.006, ph*0.292);
  // Fuller groove
  ctx.fillStyle = shadeColor('#9090a8', shade);
  ctx.fillRect(cx - pw*0.004, by - ph*0.440, pw*0.006, ph*0.240);
}

function drawPickaxeHandle(ctx, cx, by, pw, ph, shade) {
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(cx - pw*0.040, by - ph*0.012, pw*0.080, ph*0.010);
  // Shaft — tapered wooden pole
  fillPoly(ctx, [
    [cx - pw*0.024, by - ph*0.040],
    [cx + pw*0.024, by - ph*0.040],
    [cx + pw*0.018, by - ph*0.560],
    [cx - pw*0.018, by - ph*0.560],
  ], shadeColor('#5c2e12', shade));
  // Lit face
  fillPoly(ctx, [
    [cx + pw*0.008, by - ph*0.040],
    [cx + pw*0.024, by - ph*0.040],
    [cx + pw*0.018, by - ph*0.560],
    [cx + pw*0.008, by - ph*0.560],
  ], shadeColor('#8c5a28', shade));
  // Grain lines
  ctx.strokeStyle = shadeColor('#3c1c08', shade);
  ctx.lineWidth = Math.max(0.5, pw*0.004);
  for (let i = 0; i < 4; i++) {
    const y = by - ph*(0.12 + i*0.11);
    ctx.beginPath();
    ctx.moveTo(cx - pw*0.018, y);
    ctx.lineTo(cx + pw*0.014, y - ph*0.020);
    ctx.stroke();
  }
  // Worn/splintered top
  fillPoly(ctx, [
    [cx - pw*0.022, by - ph*0.540],
    [cx + pw*0.022, by - ph*0.540],
    [cx + pw*0.012, by - ph*0.578],
    [cx - pw*0.008, by - ph*0.572],
    [cx - pw*0.018, by - ph*0.554],
  ], shadeColor('#8c5a28', shade));
  // Grip wraps — 3 darker bands near bottom
  ctx.fillStyle = shadeColor('#241204', shade);
  for (let i = 0; i < 3; i++)
    ctx.fillRect(cx - pw*0.024, by - ph*(0.100 + i*0.060), pw*0.048, ph*0.014);
}

function drawRevolver(ctx, cx, by, pw, ph, shade) {
  // Grip — angled walnut block
  fillPoly(ctx, [
    [cx + pw*0.018, by - ph*0.076],
    [cx + pw*0.068, by - ph*0.076],
    [cx + pw*0.074, by - ph*0.240],
    [cx + pw*0.024, by - ph*0.240],
  ], shadeColor('#3c1c08', shade));
  // Grip lit face
  fillPoly(ctx, [
    [cx + pw*0.018, by - ph*0.076],
    [cx + pw*0.034, by - ph*0.076],
    [cx + pw*0.038, by - ph*0.240],
    [cx + pw*0.024, by - ph*0.240],
  ], shadeColor('#5c2e12', shade));
  // Grip checkering lines
  ctx.strokeStyle = shadeColor('#241204', shade);
  ctx.lineWidth = Math.max(0.5, pw*0.003);
  for (let i = 0; i < 4; i++) {
    const y = by - ph*(0.108 + i*0.036);
    ctx.beginPath();
    ctx.moveTo(cx + pw*0.022, y);
    ctx.lineTo(cx + pw*0.070, y);
    ctx.stroke();
  }
  // Frame — main steel body
  fillPoly(ctx, [
    [cx - pw*0.028, by - ph*0.240],
    [cx + pw*0.024, by - ph*0.240],
    [cx + pw*0.018, by - ph*0.076],
    [cx - pw*0.028, by - ph*0.100],
  ], shadeColor('#808098', shade));
  // Frame highlight
  ctx.fillStyle = shadeColor('#b2b4c0', shade);
  ctx.fillRect(cx - pw*0.028, by - ph*0.240, pw*0.010, ph*0.140);
  // Trigger guard — bottom arc
  ctx.beginPath();
  ctx.arc(cx + pw*0.008, by - ph*0.088, pw*0.036, 0, Math.PI);
  ctx.strokeStyle = shadeColor('#808098', shade);
  ctx.lineWidth = Math.max(1, pw*0.014);
  ctx.stroke();
  // Cylinder — large ellipse (most distinctive feature)
  ctx.beginPath();
  ctx.ellipse(cx - pw*0.010, by - ph*0.188, pw*0.054, ph*0.058, 0, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#606070', shade);
  ctx.fill();
  // Cylinder chamber dots
  ctx.fillStyle = shadeColor('#303040', shade);
  const cr = pw*0.014, cy2 = by - ph*0.188;
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    ctx.beginPath();
    ctx.ellipse(cx - pw*0.010 + Math.cos(a)*cr, cy2 + Math.sin(a)*cr*0.5,
                pw*0.010, ph*0.012, 0, 0, Math.PI*2);
    ctx.fill();
  }
  // Cylinder highlight
  ctx.beginPath();
  ctx.ellipse(cx - pw*0.018, by - ph*0.204, pw*0.022, ph*0.022, -0.4, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#9090a8', shade);
  ctx.fill();
  // Barrel — horizontal, pointing left
  ctx.fillStyle = shadeColor('#808098', shade);
  ctx.fillRect(cx - pw*0.090, by - ph*0.270, pw*0.062, ph*0.030);
  // Barrel top highlight
  ctx.fillStyle = shadeColor('#b2b4c0', shade);
  ctx.fillRect(cx - pw*0.090, by - ph*0.270, pw*0.062, ph*0.008);
  // Muzzle end cap
  ctx.fillStyle = shadeColor('#606070', shade);
  ctx.fillRect(cx - pw*0.094, by - ph*0.278, pw*0.010, ph*0.046);
  // Front sight
  ctx.fillStyle = shadeColor('#404050', shade);
  ctx.fillRect(cx - pw*0.076, by - ph*0.280, pw*0.008, ph*0.012);
  // Hammer
  fillPoly(ctx, [
    [cx + pw*0.020, by - ph*0.266],
    [cx + pw*0.042, by - ph*0.266],
    [cx + pw*0.046, by - ph*0.288],
    [cx + pw*0.024, by - ph*0.292],
  ], shadeColor('#606070', shade));
}

function drawMachete(ctx, cx, by, pw, ph, shade) {
  // Handle — rubber grip
  ctx.fillStyle = shadeColor('#282828', shade);
  ctx.fillRect(cx - pw*0.020, by - ph*0.080, pw*0.040, ph*0.078);
  // Grip lit edge
  ctx.fillStyle = shadeColor('#404040', shade);
  ctx.fillRect(cx - pw*0.020, by - ph*0.080, pw*0.010, ph*0.078);
  // Finger groove slots
  ctx.fillStyle = shadeColor('#141414', shade);
  for (let i = 0; i < 3; i++)
    ctx.fillRect(cx - pw*0.018, by - ph*(0.038 + i*0.020), pw*0.036, ph*0.008);
  // Guard — flat steel bar
  ctx.fillStyle = shadeColor('#b2b4c0', shade);
  ctx.fillRect(cx - pw*0.050, by - ph*0.092, pw*0.100, ph*0.018);
  ctx.fillStyle = shadeColor('#dce0ee', shade);
  ctx.fillRect(cx - pw*0.050, by - ph*0.092, pw*0.100, ph*0.006);
  // Blade — wide belly (much wider than knife — key identifier)
  fillPoly(ctx, [
    [cx - pw*0.020, by - ph*0.092],
    [cx + pw*0.020, by - ph*0.092],
    [cx + pw*0.098, by - ph*0.300],
    [cx + pw*0.078, by - ph*0.342],
    [cx - pw*0.010, by - ph*0.342],
  ], shadeColor('#a0a090', shade));
  // Edge highlight — wide bright bevel
  fillPoly(ctx, [
    [cx + pw*0.010, by - ph*0.092],
    [cx + pw*0.020, by - ph*0.092],
    [cx + pw*0.098, by - ph*0.300],
    [cx + pw*0.078, by - ph*0.342],
    [cx + pw*0.036, by - ph*0.342],
  ], shadeColor('#dce0ee', shade));
  // Spine shadow
  fillPoly(ctx, [
    [cx - pw*0.020, by - ph*0.092],
    [cx - pw*0.010, by - ph*0.092],
    [cx - pw*0.010, by - ph*0.342],
    [cx - pw*0.020, by - ph*0.312],
  ], shadeColor('#606070', shade));
}

function drawAlienRod(ctx, cx, by, pw, ph, shade) {
  // Bottom end cap — angular alien metal
  fillPoly(ctx, [
    [cx - pw*0.028, by - ph*0.040],
    [cx + pw*0.028, by - ph*0.040],
    [cx + pw*0.020, by - ph*0.088],
    [cx - pw*0.020, by - ph*0.088],
  ], shadeColor('#304858', shade));
  ctx.fillStyle = shadeColor('#4c6878', shade);
  ctx.fillRect(cx - pw*0.028, by - ph*0.040, pw*0.056, ph*0.012);
  // Shaft — dark metal body
  ctx.fillStyle = shadeColor('#1c2c38', shade);
  ctx.fillRect(cx - pw*0.018, by - ph*0.088, pw*0.036, ph*0.440);
  // Shaft lit left face
  ctx.fillStyle = shadeColor('#304858', shade);
  ctx.fillRect(cx - pw*0.018, by - ph*0.088, pw*0.010, ph*0.440);
  // Shaft shadow right face
  ctx.fillStyle = shadeColor('#0e1820', shade);
  ctx.fillRect(cx + pw*0.008, by - ph*0.088, pw*0.010, ph*0.440);
  // Energy band rings — 3 teal bands
  const bands = [0.180, 0.300, 0.416];
  for (const bf of bands) {
    ctx.fillStyle = shadeColor('#30a878', shade);
    ctx.fillRect(cx - pw*0.022, by - ph*(bf + 0.016), pw*0.044, ph*0.032);
    ctx.fillStyle = shadeColor('#40b890', shade);
    ctx.fillRect(cx - pw*0.022, by - ph*(bf + 0.010), pw*0.044, ph*0.020);
    ctx.fillStyle = shadeColor('#80e8d0', shade);
    ctx.fillRect(cx - pw*0.022, by - ph*(bf + 0.006), pw*0.044, ph*0.010);
  }
  // Energy core glow section (center)
  ctx.fillStyle = shadeColor('#40b890', shade);
  ctx.fillRect(cx - pw*0.014, by - ph*0.340, pw*0.028, ph*0.060);
  ctx.fillStyle = shadeColor('#c0fff0', shade);
  ctx.fillRect(cx - pw*0.006, by - ph*0.334, pw*0.012, ph*0.048);
  // Top end cap — angular
  fillPoly(ctx, [
    [cx - pw*0.020, by - ph*0.528],
    [cx + pw*0.020, by - ph*0.528],
    [cx + pw*0.030, by - ph*0.558],
    [cx + pw*0.014, by - ph*0.578],
    [cx - pw*0.014, by - ph*0.578],
    [cx - pw*0.030, by - ph*0.558],
  ], shadeColor('#304858', shade));
  ctx.fillStyle = shadeColor('#80e8d0', shade);
  ctx.fillRect(cx - pw*0.010, by - ph*0.572, pw*0.020, ph*0.016);
}

function drawBandages(ctx, cx, by, pw, ph, shade) {
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(cx, by - ph*0.010, pw*0.090, ph*0.014, 0, 0, Math.PI*2);
  ctx.fill();
  // Roll cylinder side face
  ctx.fillStyle = shadeColor('#c8c0b0', shade);
  ctx.fillRect(cx - pw*0.072, by - ph*0.060, pw*0.144, ph*0.048);
  // Layer lines on side
  ctx.strokeStyle = shadeColor('#b0a890', shade);
  ctx.lineWidth = Math.max(0.5, ph*0.006);
  for (let i = 1; i < 4; i++) {
    const x = cx - pw*0.072 + pw*0.144 * (i/4);
    ctx.beginPath();
    ctx.moveTo(x, by - ph*0.060);
    ctx.lineTo(x, by - ph*0.012);
    ctx.stroke();
  }
  // Top ellipse of roll
  ctx.beginPath();
  ctx.ellipse(cx, by - ph*0.060, pw*0.072, ph*0.028, 0, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#e0d8c8', shade);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, by - ph*0.060, pw*0.058, ph*0.020, 0, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#c8c0b0', shade);
  ctx.fill();
  // Red cross — key identifier
  ctx.fillStyle = shadeColor('#c02020', shade);
  ctx.fillRect(cx - pw*0.010, by - ph*0.090, pw*0.020, ph*0.048);
  ctx.fillRect(cx - pw*0.028, by - ph*0.076, pw*0.056, ph*0.020);
  // Unrolling tail
  fillPoly(ctx, [
    [cx + pw*0.072, by - ph*0.030],
    [cx + pw*0.072, by - ph*0.018],
    [cx + pw*0.112, by - ph*0.014],
    [cx + pw*0.114, by - ph*0.024],
  ], shadeColor('#e0d8c8', shade));
}

function drawLaudanum(ctx, cx, by, pw, ph, shade) {
  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, by - ph*0.008, pw*0.050, ph*0.012, 0, 0, Math.PI*2);
  ctx.fill();
  // Bottle body — amber glass (slight trapezoid)
  fillPoly(ctx, [
    [cx - pw*0.034, by - ph*0.016],
    [cx + pw*0.034, by - ph*0.016],
    [cx + pw*0.028, by - ph*0.200],
    [cx - pw*0.028, by - ph*0.200],
  ], shadeColor('#883c0e', shade));
  // Glass highlight column
  fillPoly(ctx, [
    [cx - pw*0.034, by - ph*0.016],
    [cx - pw*0.020, by - ph*0.016],
    [cx - pw*0.016, by - ph*0.200],
    [cx - pw*0.028, by - ph*0.200],
  ], shadeColor('#c05820', shade));
  // Transparency glint
  ctx.fillStyle = shadeColor('#f08040', shade);
  ctx.fillRect(cx - pw*0.028, by - ph*0.140, pw*0.008, ph*0.060);
  // Aged paper label
  fillPoly(ctx, [
    [cx - pw*0.026, by - ph*0.058],
    [cx + pw*0.026, by - ph*0.058],
    [cx + pw*0.024, by - ph*0.150],
    [cx - pw*0.024, by - ph*0.150],
  ], shadeColor('#d4c090', shade));
  // Skull on label — circle head
  ctx.fillStyle = shadeColor('#3a2808', shade);
  ctx.beginPath();
  ctx.arc(cx, by - ph*0.096, pw*0.012, 0, Math.PI*2);
  ctx.fill();
  // Skull eye sockets
  ctx.fillStyle = shadeColor('#d4c090', shade);
  ctx.fillRect(cx - pw*0.010, by - ph*0.094, pw*0.006, ph*0.008);
  ctx.fillRect(cx + pw*0.004, by - ph*0.094, pw*0.006, ph*0.008);
  // Crossbones under skull
  ctx.strokeStyle = shadeColor('#3a2808', shade);
  ctx.lineWidth = Math.max(0.5, pw*0.006);
  ctx.beginPath();
  ctx.moveTo(cx - pw*0.018, by - ph*0.068);
  ctx.lineTo(cx + pw*0.018, by - ph*0.080);
  ctx.moveTo(cx + pw*0.018, by - ph*0.068);
  ctx.lineTo(cx - pw*0.018, by - ph*0.080);
  ctx.stroke();
  // Bottle neck
  ctx.fillStyle = shadeColor('#883c0e', shade);
  ctx.fillRect(cx - pw*0.016, by - ph*0.214, pw*0.032, ph*0.016);
  // Neck ring
  ctx.fillStyle = shadeColor('#c05820', shade);
  ctx.fillRect(cx - pw*0.018, by - ph*0.220, pw*0.036, ph*0.008);
  // Cork
  ctx.fillStyle = shadeColor('#7a5030', shade);
  ctx.fillRect(cx - pw*0.014, by - ph*0.244, pw*0.028, ph*0.026);
  ctx.fillStyle = shadeColor('#9a6840', shade);
  ctx.fillRect(cx - pw*0.014, by - ph*0.244, pw*0.010, ph*0.026);
}

function drawLeatherVest(ctx, cx, by, pw, ph, shade) {
  // Vest body — trapezoid wider at shoulders
  fillPoly(ctx, [
    [cx - pw*0.120, by - ph*0.360],
    [cx + pw*0.120, by - ph*0.360],
    [cx + pw*0.090, by - ph*0.040],
    [cx - pw*0.090, by - ph*0.040],
  ], shadeColor('#7a4018', shade));
  // Right panel shadow
  fillPoly(ctx, [
    [cx + pw*0.020, by - ph*0.360],
    [cx + pw*0.120, by - ph*0.360],
    [cx + pw*0.090, by - ph*0.040],
    [cx + pw*0.020, by - ph*0.040],
  ], shadeColor('#5a2c10', shade));
  // Left panel highlight
  fillPoly(ctx, [
    [cx - pw*0.120, by - ph*0.360],
    [cx - pw*0.072, by - ph*0.360],
    [cx - pw*0.060, by - ph*0.040],
    [cx - pw*0.090, by - ph*0.040],
  ], shadeColor('#b05828', shade));
  // V-neck opening
  fillPoly(ctx, [
    [cx,             by - ph*0.360],
    [cx - pw*0.044, by - ph*0.240],
    [cx + pw*0.044, by - ph*0.240],
  ], shadeColor('#1c1410', shade));
  // Left armhole
  ctx.beginPath();
  ctx.ellipse(cx - pw*0.100, by - ph*0.300, pw*0.026, ph*0.042, -0.3, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#1c1410', shade);
  ctx.fill();
  // Right armhole
  ctx.beginPath();
  ctx.ellipse(cx + pw*0.100, by - ph*0.300, pw*0.026, ph*0.042, 0.3, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#1c1410', shade);
  ctx.fill();
  // Stitching along seams
  ctx.strokeStyle = shadeColor('#5a2c10', shade);
  ctx.lineWidth = Math.max(0.5, pw*0.003);
  ctx.setLineDash([pw*0.008, pw*0.006]);
  ctx.beginPath();
  ctx.moveTo(cx - pw*0.076, by - ph*0.350);
  ctx.lineTo(cx - pw*0.062, by - ph*0.050);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + pw*0.076, by - ph*0.350);
  ctx.lineTo(cx + pw*0.062, by - ph*0.050);
  ctx.stroke();
  ctx.setLineDash([]);
  // Brass front buckle
  ctx.fillStyle = shadeColor('#c8a018', shade);
  ctx.fillRect(cx - pw*0.016, by - ph*0.170, pw*0.032, ph*0.028);
  ctx.fillStyle = shadeColor('#906c08', shade);
  ctx.fillRect(cx - pw*0.006, by - ph*0.164, pw*0.012, ph*0.016);
  ctx.fillStyle = shadeColor('#e8c830', shade);
  ctx.fillRect(cx - pw*0.016, by - ph*0.170, pw*0.032, ph*0.008);
}

function drawSurveyCoat(ctx, cx, by, pw, ph, shade) {
  // Coat body — longer than vest
  fillPoly(ctx, [
    [cx - pw*0.126, by - ph*0.440],
    [cx + pw*0.126, by - ph*0.440],
    [cx + pw*0.100, by - ph*0.030],
    [cx - pw*0.100, by - ph*0.030],
  ], shadeColor('#b89850', shade));
  // Right side shadow
  fillPoly(ctx, [
    [cx + pw*0.020, by - ph*0.440],
    [cx + pw*0.126, by - ph*0.440],
    [cx + pw*0.100, by - ph*0.030],
    [cx + pw*0.020, by - ph*0.030],
  ], shadeColor('#8a7030', shade));
  // Left side highlight
  fillPoly(ctx, [
    [cx - pw*0.126, by - ph*0.440],
    [cx - pw*0.076, by - ph*0.440],
    [cx - pw*0.066, by - ph*0.030],
    [cx - pw*0.100, by - ph*0.030],
  ], shadeColor('#e0b860', shade));
  // Center button placket
  ctx.fillStyle = shadeColor('#8a7030', shade);
  ctx.fillRect(cx - pw*0.016, by - ph*0.440, pw*0.032, ph*0.410);
  // Brass buttons — 5 down center
  ctx.fillStyle = shadeColor('#c8a018', shade);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(cx, by - ph*(0.076 + i*0.074), pw*0.012, 0, Math.PI*2);
    ctx.fill();
  }
  // Button highlights
  ctx.fillStyle = shadeColor('#e8c830', shade);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(cx - pw*0.003, by - ph*(0.078 + i*0.074), pw*0.005, 0, Math.PI*2);
    ctx.fill();
  }
  // Left lapel
  fillPoly(ctx, [
    [cx,             by - ph*0.440],
    [cx - pw*0.070, by - ph*0.310],
    [cx - pw*0.022, by - ph*0.280],
    [cx - pw*0.016, by - ph*0.440],
  ], shadeColor('#e0b860', shade));
  // Right lapel
  fillPoly(ctx, [
    [cx,             by - ph*0.440],
    [cx + pw*0.070, by - ph*0.310],
    [cx + pw*0.022, by - ph*0.280],
    [cx + pw*0.016, by - ph*0.440],
  ], shadeColor('#c8a040', shade));
  // Left armhole
  ctx.beginPath();
  ctx.ellipse(cx - pw*0.108, by - ph*0.360, pw*0.026, ph*0.044, -0.3, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#1c1410', shade);
  ctx.fill();
  // Right armhole
  ctx.beginPath();
  ctx.ellipse(cx + pw*0.108, by - ph*0.360, pw*0.026, ph*0.044, 0.3, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#1c1410', shade);
  ctx.fill();
  // Shoulder epaulettes — brass
  ctx.fillStyle = shadeColor('#c8a018', shade);
  ctx.fillRect(cx - pw*0.126, by - ph*0.460, pw*0.052, ph*0.022);
  ctx.fillRect(cx + pw*0.074, by - ph*0.460, pw*0.052, ph*0.022);
  ctx.fillStyle = shadeColor('#e8c830', shade);
  ctx.fillRect(cx - pw*0.126, by - ph*0.460, pw*0.052, ph*0.008);
  ctx.fillRect(cx + pw*0.074, by - ph*0.460, pw*0.052, ph*0.008);
  // Chest pocket (left breast)
  ctx.strokeStyle = shadeColor('#8a7030', shade);
  ctx.lineWidth = Math.max(0.5, pw*0.004);
  ctx.strokeRect(cx - pw*0.100, by - ph*0.362, pw*0.042, ph*0.052);
  // Lower pocket flap (right side)
  ctx.fillStyle = shadeColor('#8a7030', shade);
  ctx.fillRect(cx + pw*0.040, by - ph*0.200, pw*0.046, ph*0.014);
}

function drawAlienPlate(ctx, cx, by, pw, ph, shade) {
  // Main angular chest plate
  fillPoly(ctx, [
    [cx - pw*0.090, by - ph*0.400],
    [cx + pw*0.090, by - ph*0.400],
    [cx + pw*0.110, by - ph*0.180],
    [cx + pw*0.070, by - ph*0.040],
    [cx - pw*0.070, by - ph*0.040],
    [cx - pw*0.110, by - ph*0.180],
  ], shadeColor('#1c2c38', shade));
  // Left lit panel
  fillPoly(ctx, [
    [cx - pw*0.090, by - ph*0.400],
    [cx,             by - ph*0.400],
    [cx,             by - ph*0.040],
    [cx - pw*0.070, by - ph*0.040],
    [cx - pw*0.110, by - ph*0.180],
  ], shadeColor('#304858', shade));
  // Right dark panel
  fillPoly(ctx, [
    [cx,             by - ph*0.400],
    [cx + pw*0.090, by - ph*0.400],
    [cx + pw*0.110, by - ph*0.180],
    [cx + pw*0.070, by - ph*0.040],
    [cx,             by - ph*0.040],
  ], shadeColor('#141e28', shade));
  // Shoulder pauldrons
  fillPoly(ctx, [
    [cx - pw*0.110, by - ph*0.180],
    [cx - pw*0.090, by - ph*0.400],
    [cx - pw*0.130, by - ph*0.380],
    [cx - pw*0.146, by - ph*0.240],
  ], shadeColor('#304858', shade));
  fillPoly(ctx, [
    [cx + pw*0.090, by - ph*0.400],
    [cx + pw*0.110, by - ph*0.180],
    [cx + pw*0.146, by - ph*0.240],
    [cx + pw*0.130, by - ph*0.380],
  ], shadeColor('#1c2c38', shade));
  // Vertical energy channel (center spine)
  ctx.fillStyle = shadeColor('#30a878', shade);
  ctx.fillRect(cx - pw*0.010, by - ph*0.390, pw*0.020, ph*0.350);
  ctx.fillStyle = shadeColor('#c0fff0', shade);
  ctx.fillRect(cx - pw*0.004, by - ph*0.388, pw*0.008, ph*0.346);
  // Horizontal energy bands — 3
  const hbands = [0.120, 0.220, 0.320];
  for (const hb of hbands) {
    ctx.fillStyle = shadeColor('#30a878', shade);
    ctx.fillRect(cx - pw*0.086, by - ph*(hb + 0.016), pw*0.172, ph*0.024);
    ctx.fillStyle = shadeColor('#80e8d0', shade);
    ctx.fillRect(cx - pw*0.086, by - ph*(hb + 0.010), pw*0.172, ph*0.012);
  }
  // Power core — triple concentric ellipses
  ctx.beginPath();
  ctx.ellipse(cx, by - ph*0.220, pw*0.038, ph*0.044, 0, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#40b890', shade);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, by - ph*0.220, pw*0.024, ph*0.028, 0, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#80e8d0', shade);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, by - ph*0.220, pw*0.012, ph*0.014, 0, 0, Math.PI*2);
  ctx.fillStyle = shadeColor('#c0fff0', shade);
  ctx.fill();
  // Edge trim highlights
  ctx.strokeStyle = shadeColor('#4c6878', shade);
  ctx.lineWidth = Math.max(1, pw*0.010);
  ctx.beginPath();
  ctx.moveTo(cx - pw*0.090, by - ph*0.400);
  ctx.lineTo(cx + pw*0.090, by - ph*0.400);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - pw*0.146, by - ph*0.240);
  ctx.lineTo(cx - pw*0.110, by - ph*0.180);
  ctx.moveTo(cx + pw*0.110, by - ph*0.180);
  ctx.lineTo(cx + pw*0.146, by - ph*0.240);
  ctx.stroke();
}
