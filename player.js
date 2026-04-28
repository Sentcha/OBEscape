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
