# Egyptian Roguelike — Game Design Document

## Concept Summary

A first-person, turn-based roguelike dungeon crawler set in an ancient Egyptian underworld. The player explores procedurally generated mazes across multiple descending levels, encountering enemies, traps, and items rendered in a clean, bold vector graphic style inspired by early arcade games. The aesthetic is geometric and striking — think Atari-era visuals with an Egyptian mythological theme.

---

## Tech Stack

- **Language**: Vanilla JavaScript (no frameworks)
- **Rendering**: HTML5 Canvas API
- **Graphics**: Vector polygons drawn directly on canvas (no sprites or image assets)
- **Platform**: Web browser
- **IDE**: Cursor
- **AI Tooling**: Claude Code for scaffolding systems, Cursor for editing and wiring

---

## Project Structure

```
/project-root
  index.html          # Entry point
  main.js             # Game loop and init
  renderer.js         # First-person view drawing
  mapgen.js           # Procedural maze generation
  player.js           # Player state and movement
  combat.js           # Turn-based combat logic
  entities.js         # Enemies and items
  ui.js               # HUD, minimap, menus
  DESIGN.md           # This file
```

---

## Renderer

### Approach
Grid-based first-person perspective renderer. No raycasting — the view is constructed by checking what exists at each depth level (1–4 tiles ahead) and drawing the corresponding geometry using the painter's algorithm (back to front).

### Draw Order (each frame)
1. Ceiling fill (full screen)
2. Floor fill (full screen)
3. For each depth level, farthest to nearest:
   - Back wall polygon (if wall present)
   - Left wall slice (trapezoid, if wall present)
   - Right wall slice (trapezoid, if wall present)
   - Entity sprite (if enemy or item present at this depth)
4. HUD overlay

### Depth Shading
Each depth level applies a darkness multiplier to wall colors. Depth 1 (nearest) is full brightness, depth 4 (farthest) is darkest. Simple and effective.

### Color Palette
| Element      | Color                        |
|--------------|------------------------------|
| Ceiling      | `#0a0a1a` (deep navy/black)  |
| Floor        | `#c2a256` (sandy tan)        |
| Walls        | `#d4933a` (sandstone amber)  |
| Wall edges   | `#8b5e1a` (darker brown)     |
| UI / text    | `#f5d485` (gold)             |
| Enemies      | `#e03030` (danger red)       |
| Items        | `#4fc3f7` (pale blue)        |

### Entity Sprites
All drawn as static vector shapes — no animation. Each enemy/item is a small set of filled polygons representing a silhouette. Examples:
- **Anubis Guard**: Jackal head silhouette, staff shape
- **Scarab**: Oval body, six short lines for legs
- **Mummy**: Rectangular body with horizontal line wrapping
- **Health item (canopic jar)**: Simple urn shape
- **Key**: Circle and rectangle

---

## Map System

### Grid Representation
The maze is stored as a 2D array of integers:

```
0 = open floor
1 = wall
2 = stairs down
3 = enemy spawn
4 = item spawn
5 = trap
```

### Maze Generation
Algorithm: **Recursive Backtracker** (depth-first search).
- Guarantees all cells are reachable (perfect maze)
- Produces long, winding corridors — good for dungeon feel
- Run once per level, seeded randomly

### Map Size
- Default: 15 × 15 grid per level
- Scale up slightly on deeper levels (e.g. +2 per level, max 25 × 25)

### Player Start / Exit
- Player always starts at top-left open cell
- Stairs down placed at a maximally distant cell from start

---

## Player

### State
```
{
  x: int,           // grid column
  y: int,           // grid row
  facing: int,      // 0=North, 1=East, 2=South, 3=West
  hp: int,          // current health
  maxHp: int,       // maximum health
  level: int,       // dungeon depth (starts at 1)
  inventory: [],    // held items (max 6 slots)
  gold: int         // collected gold count
}
```

### Controls
| Key          | Action         |
|--------------|----------------|
| Arrow Up / W | Move forward   |
| Arrow Down / S | Move backward |
| Arrow Left / A | Turn left     |
| Arrow Right / D | Turn right   |
| E            | Interact / pick up |
| I            | Open inventory |
| Escape       | Pause / menu   |

### Movement Rules
- One grid tile per turn
- Cannot move into walls
- Moving into an enemy tile initiates combat instead

---

## Combat System

### Turn Order
1. Player chooses action (attack, use item, flee)
2. Player action resolves
3. All visible enemies take their turn
4. Repeat until combat ends

### Resolution
- Attack: `damage = playerAttack - enemyDefense` (minimum 1)
- Flee: 50% chance to move back one tile, combat ends
- Death: Permadeath — game over, return to main menu

### Stats
```
Player base: attack 5, defense 2, hp 20
Scales slightly each dungeon level descended
```

---

## Enemies

| Name         | HP | Attack | Defense | Behavior               |
|--------------|----|--------|---------|------------------------|
| Scarab Swarm | 4  | 2      | 0       | Moves toward player    |
| Mummy        | 10 | 4      | 2       | Slow, high HP          |
| Anubis Guard | 16 | 7      | 4       | Stationary until seen  |
| Sand Serpent | 8  | 5      | 1       | Fast, poisons player   |
| Pharaoh (boss)| 40 | 10   | 6       | Appears on level 5     |

Enemies are placed at spawn points during map generation. They do not roam between turns unless the player is within 3 tiles.

---

## Items

| Name          | Effect                          |
|---------------|---------------------------------|
| Canopic Jar   | Restore 10 HP                   |
| Scarab Amulet | +1 defense permanently          |
| Eye of Ra     | Reveals full map for this level |
| Khopesh       | +3 attack permanently           |
| Gold Coin     | Adds to score                   |
| Trap (hidden) | Deals 5 damage when stepped on  |

---

## Roguelike Rules

- **Permadeath**: No saves. Death returns to main menu.
- **Procedural levels**: Each run generates a new maze per level.
- **5 levels deep**: Level 5 contains the Pharaoh boss. Defeating him wins the run.
- **Score**: Based on gold collected + enemies defeated + levels cleared + turns taken (fewer = better).

---

## UI / HUD

Drawn on top of the canvas each frame:

- **Top left**: Current HP bar (gold outline, red fill)
- **Top right**: Dungeon level indicator ("Level III")
- **Bottom left**: Minimap (small grid, fog of war, reveals explored tiles)
- **Bottom center**: Action prompt ("E to pick up" etc.)
- **Bottom right**: Gold count

Font style: All-caps, serif or slab-serif to match Egyptian aesthetic.

---

## Milestone Build Order

1. Static corridor view renders on canvas
2. Grid map loads and player moves on it
3. Renderer connects to player position/facing
4. Procedural maze generation per level
5. Multiple levels with stairs
6. Enemies placed and visible in renderer
7. Turn-based combat
8. Items and inventory
9. HUD and minimap
10. Main menu, game over screen, win screen
11. Polish — depth shading, sound (optional), hieroglyph decorations

---

## Art Direction Notes

- Every visual element is a flat filled polygon — no gradients (except optional ceiling/floor)
- Silhouettes over detail: enemies should read clearly as shapes at small sizes
- Border decorations on walls can use simple repeating geometric patterns (chevrons, cartouche shapes)
- Keep the palette tight — max 6–8 colors total for a cohesive retro look
