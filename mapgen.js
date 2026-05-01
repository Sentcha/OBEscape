// Tile type constants — shared vocabulary for map, renderer, player, and enemies.
const TILE = {
  FLOOR:  0,
  WALL:   1,
  STAIRS: 2,
  ENEMY:  3,
  ITEM:   4,
  TRAP:   5,
};

// Generate a random maze for the given dungeon level.
//
// Algorithm: Recursive Backtracker (depth-first search with backtracking).
// This guarantees a "perfect maze" — every room is reachable and there is
// exactly one path between any two cells. That single-path property produces
// long winding corridors with no shortcuts, which suits a dungeon well.
//
// How the grid works:
//   Room cells live at ODD coordinates: (1,1), (1,3), (3,1), ...
//   The cells at EVEN coordinates are the walls between rooms.
//   Carving a passage means setting the even-coordinate wall between two
//   adjacent rooms to FLOOR.
//
//   Example for a 5×5 grid (N=2 rooms per side):
//     1 1 1 1 1      1 1 1 1 1
//     1 R 1 R 1  →   1 0 1 0 1   (R = room, 0 = floor after carving)
//     1 1 1 1 1      1 0 1 0 1
//     1 R 1 R 1      1 0 0 0 1
//     1 1 1 1 1      1 1 1 1 1
//
// Grid size grows with dungeon depth: 15×15 at level 1, +2 per level, max 25×25.
// Player start: (1,1) — always the top-left room.
// Stairs:       placed at the cell farthest from the start via BFS.
//
function generateMaze(dungeonLevel) {
  // Grid side length: must be odd so room cells land on odd coordinates.
  const size = Math.min(13 + dungeonLevel * 2, 25);

  // Start with all walls.
  const map = Array.from({ length: size }, () => new Array(size).fill(TILE.WALL));

  // N = number of room cells along one axis (e.g. size 15 → N = 7).
  const N = Math.floor(size / 2);

  // Convert a room index (0..N-1) to its map coordinate (1, 3, 5, ...).
  function toMap(i) { return 1 + i * 2; }

  // --- Recursive Backtracker ---
  const visited = Array.from({ length: N }, () => new Array(N).fill(false));
  const stack   = [{ r: 0, c: 0 }];
  visited[0][0] = true;
  map[1][1]     = TILE.FLOOR;

  while (stack.length > 0) {
    const { r, c } = stack[stack.length - 1];

    // Collect unvisited neighbours in room-index space.
    const neighbours = [];
    if (r > 0   && !visited[r - 1][c]) neighbours.push({ r: r - 1, c });
    if (r < N-1 && !visited[r + 1][c]) neighbours.push({ r: r + 1, c });
    if (c > 0   && !visited[r][c - 1]) neighbours.push({ r, c: c - 1 });
    if (c < N-1 && !visited[r][c + 1]) neighbours.push({ r, c: c + 1 });

    if (neighbours.length > 0) {
      // Pick a random unvisited neighbour.
      const next = neighbours[Math.floor(Math.random() * neighbours.length)];

      // Carve: open the wall between the current room and the chosen neighbour.
      // The wall sits at the midpoint between the two rooms in map coordinates.
      const wallR = toMap(r) + (next.r - r);
      const wallC = toMap(c) + (next.c - c);
      map[wallR][wallC]                   = TILE.FLOOR;
      map[toMap(next.r)][toMap(next.c)]   = TILE.FLOOR;

      visited[next.r][next.c] = true;
      stack.push(next);
    } else {
      stack.pop(); // Dead end — backtrack to previous room.
    }
  }

  // --- Place stairs at the farthest reachable cell from (1,1) ---
  // BFS flood-fill measures the distance from the start to every floor cell.
  // The farthest one becomes the level exit, maximising required exploration.
  const stairsPos = findFarthestCell(map, 1, 1);
  map[stairsPos.y][stairsPos.x] = TILE.STAIRS;

  // --- Scatter enemies on room nodes (odd x AND odd y) ---
  // Exclude the player start (1,1) and the stairs cell.
  const enemyCandidates = [];
  for (let y = 1; y < size; y += 2)
    for (let x = 1; x < size; x += 2)
      if (map[y][x] === TILE.FLOOR &&
          !(x === 1 && y === 1) &&
          !(x === stairsPos.x && y === stairsPos.y))
        enemyCandidates.push({ x, y });

  // Fisher-Yates shuffle so enemies are spread randomly.
  for (let i = enemyCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [enemyCandidates[i], enemyCandidates[j]] = [enemyCandidates[j], enemyCandidates[i]];
  }

  const enemyCount = Math.min(2 + dungeonLevel, 6);
  for (let i = 0; i < Math.min(enemyCount, enemyCandidates.length); i++)
    map[enemyCandidates[i].y][enemyCandidates[i].x] = TILE.ENEMY;

  // --- Scatter items on remaining floor room nodes ---
  const itemCandidates = [];
  for (let y = 1; y < size; y += 2)
    for (let x = 1; x < size; x += 2)
      if (map[y][x] === TILE.FLOOR && !(x === 1 && y === 1))
        itemCandidates.push({ x, y });

  for (let i = itemCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [itemCandidates[i], itemCandidates[j]] = [itemCandidates[j], itemCandidates[i]];
  }

  for (let i = 0; i < Math.min(3, itemCandidates.length); i++)
    map[itemCandidates[i].y][itemCandidates[i].x] = TILE.ITEM;

  return map;
}

// BFS from (startX, startY). Returns the floor cell that requires the most
// steps to reach — used to place stairs as far from the player as possible.
function findFarthestCell(map, startX, startY) {
  const rows  = map.length;
  const cols  = map[0].length;
  const dist  = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  const queue = [{ x: startX, y: startY }];
  dist[startY][startX] = 0;
  let farthest = { x: startX, y: startY };

  const steps = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    for (const s of steps) {
      const nx = x + s.dx;
      const ny = y + s.dy;
      if (ny >= 0 && ny < rows && nx >= 0 && nx < cols &&
          dist[ny][nx] === -1 && map[ny][nx] !== TILE.WALL) {
        dist[ny][nx] = dist[y][x] + 1;
        if (dist[ny][nx] > dist[farthest.y][farthest.x]) farthest = { x: nx, y: ny };
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return farthest;
}
