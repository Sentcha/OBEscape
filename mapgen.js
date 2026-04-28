// Tile type constants — a shared vocabulary used by the map, renderer, and player.
const TILE = {
  FLOOR:  0,
  WALL:   1,
  STAIRS: 2,
  ENEMY:  3,
  ITEM:   4,
  TRAP:   5,
};

// Hardcoded test map for Milestone 2.
// Procedural generation (Milestone 4) will replace this with a random maze each run.
//
// Grid is 12 columns wide and 11 rows tall.
// The outer edge is all walls. Interior 0s and 1s form a small navigable maze.
// Stairs (2) are placed at the bottom-right corner as the level exit.
//
// Player starts at column 1, row 1 (top-left open cell).
//
function createTestMap() {
  return [
    [1,1,1,1,1,1,1,1,1,1,1,1],  // row 0  — top wall
    [1,0,0,0,0,0,0,0,0,0,0,1],  // row 1  — open corridor across the top
    [1,0,1,1,1,1,1,1,1,0,0,1],  // row 2
    [1,0,0,0,0,0,0,0,1,0,0,1],  // row 3
    [1,1,1,1,1,0,1,0,1,0,0,1],  // row 4
    [1,0,0,0,1,0,1,0,0,0,0,1],  // row 5
    [1,0,1,0,1,0,1,1,1,1,0,1],  // row 6
    [1,0,1,0,0,0,0,0,0,1,0,1],  // row 7
    [1,0,1,1,1,1,1,0,0,1,0,1],  // row 8
    [1,0,0,0,0,0,0,0,0,0,2,1],  // row 9  — open corridor across the bottom, stairs at end
    [1,1,1,1,1,1,1,1,1,1,1,1],  // row 10 — bottom wall
  ];
}
