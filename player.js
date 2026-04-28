// Cardinal directions, numbered 0–3 clockwise from North.
// This numbering means turning right = +1, turning left = -1 (with wrap-around).
const FACING_NAMES = ['North', 'East', 'South', 'West'];

// How one step changes your grid position for each facing direction.
// In our grid, y increases going DOWN, so North = dy of -1.
const DIR = [
  { dx:  0, dy: -1 }, // 0 = North
  { dx:  1, dy:  0 }, // 1 = East
  { dx:  0, dy:  1 }, // 2 = South
  { dx: -1, dy:  0 }, // 3 = West
];

// The player's current game state.
// x = column, y = row on the map grid.
const player = {
  x:            1,
  y:            1,
  facing:       2, // Start facing South (into the map, away from the top wall)
  hp:           20,
  maxHp:        20,
  dungeonLevel: 1,
  inventory:    [],
  gold:         0,
};

// Move the player by (dx, dy) if the destination cell exists and is not a wall.
function tryMove(map, dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (map[ny] !== undefined && map[ny][nx] !== undefined && map[ny][nx] !== TILE.WALL) {
    player.x = nx;
    player.y = ny;
  }
}

// Build the scene description for the renderer from the player's current
// position and facing direction.
//
// For each depth d (1–4) we step d tiles forward, then check:
//   - the cell to the LEFT of that position  → scene[d-1].left
//   - the cell to the RIGHT                  → scene[d-1].right
//   - the cell straight ahead (the forward tile itself) → scene[d-1].back
//
// Out-of-bounds cells are treated as walls so the renderer always has
// something to draw at the map's edges.
//
function buildScene(map) {
  const fwd = DIR[player.facing];
  const rgt = { dx: -fwd.dy, dy:  fwd.dx }; // 90° clockwise from forward
  const lft = { dx:  fwd.dy, dy: -fwd.dx }; // 90° counter-clockwise

  function isWall(x, y) {
    if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return true;
    return map[y][x] === TILE.WALL;
  }

  const scene = [];
  for (let d = 1; d <= 4; d++) {
    const fx = player.x + d * fwd.dx;
    const fy = player.y + d * fwd.dy;
    scene.push({
      left:  isWall(fx + lft.dx, fy + lft.dy),
      right: isWall(fx + rgt.dx, fy + rgt.dy),
      back:  isWall(fx, fy),
    });
  }
  return scene;
}

// Process a keydown event and update the player state.
// Returns true if anything changed (so the caller knows to redraw).
function handleKey(e, map) {
  const d = DIR[player.facing];
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W':
      tryMove(map, d.dx, d.dy);
      return true;
    case 'ArrowDown':  case 's': case 'S':
      tryMove(map, -d.dx, -d.dy);
      return true;
    case 'ArrowLeft':  case 'a': case 'A':
      // +3 is the same as -1 but avoids negative modulo
      player.facing = (player.facing + 3) % 4;
      return true;
    case 'ArrowRight': case 'd': case 'D':
      player.facing = (player.facing + 1) % 4;
      return true;
  }
  return false;
}
