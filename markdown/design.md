# OBEscape — Game Design Document

## Concept Summary

A first-person, turn-based roguelike dungeon crawler set in 1890s outback Australia. An escaped convict falls through a collapsed shaft into an ancient labyrinth buried beneath the desert — a structure humanity has long mistaken for the Egyptian underworld, but which reveals itself, level by level, to be something far older and stranger. The player explores procedurally generated mazes across five descending levels, encountering enemies, traps, and items rendered in a clean, bold vector graphic style inspired by early arcade games. The aesthetic is geometric and striking — think Atari-era visuals with an Egyptian mythological theme.

---

## Narrative

### Setting
1890s outback Australia. Beneath the red desert, an alien vessel has lain buried for fifty thousand years. Its geometry is vast and labyrinthine, its walls carved with symbols that humanity — stumbling upon glimpses of it over the centuries — interpreted as Egyptian iconography. It is not an underworld. It is a ship. The truth reveals itself slowly as the convict descends.

### The Player — "The Convict"
No name given. No backstory explained. A male escaped convict, somewhere in the Australian outback, running from something. Whether that's troopers, a past, or himself is left unsaid.

He falls through a collapsed mineshaft or dry creek bed into darkness. When he lands, the walls around him aren't sandstone — they're something older. Carved. Geometric. Wrong.

He has one goal from the moment he wakes up: **get out.** The only way out is through — down to the deepest chamber where the labyrinth's heart can be shattered, opening an exit upward.

### The Labyrinth — Revelation Arc
The alien origin unfolds across the five levels through environmental storytelling — carvings, architecture, and anomalies that slowly don't add up:

| Level | What the player notices | What it implies |
|---|---|---|
| 1 | Egyptian-looking symbols, but the geometry is subtly *off* | Something copied Egyptian style imperfectly |
| 2 | The scarab carvings have too many legs. Proportions aren't human | Whatever built this wasn't working from life |
| 3 | Metal in the walls — not ore, *manufactured*. Fused with stone | This was constructed with technology |
| 4 | The Anubis Guard architecture looks like it was *grown*, not built | The labyrinth is partly organic, partly machine |
| 5 | The heart of the labyrinth is a dormant alien structure — a crashed vessel, buried for fifty thousand years | It was never an underworld. It's a ship. |

### The Dead — Who They Were
The bodies the convict finds tell a fragmented, wordless history of the labyrinth's pull on the surface world. Different lives, different reasons, all the same ending.

| Era | Who | How they got there |
|---|---|---|
| 1850s–60s | Early convicts & bushrangers | Fell through, like him |
| 1870s | An Aboriginal elder | Came deliberately — his people knew something was here |
| 1880s | A small British survey team | Paid explorers, organised and thorough. Didn't make it past level 3 |
| 1889 | A lone woman in field clothes | Days dead at most. Well-equipped. She got further than anyone |

The fresh bodies suggest someone on the surface knows the labyrinth exists and has been probing it — sending people in, waiting, getting nothing back. The convict stumbled in by accident, but he may have fallen into the middle of someone else's operation.

---

## World — Level Themes

| Level | Name | Environment | Escalation |
|---|---|---|---|
| 1 | **The Entry Halls** | Crumbling temple corridors, torchlight | Finding your footing |
| 2 | **The Scarab Warrens** | Tunnels choked with nests and sand | Claustrophobic, ambush threats |
| 3 | **The Embalming Pits** | Flooded chambers, reek of natron | Mummies emerge from the deep |
| 4 | **The Black Gate** | Obsidian fortifications, Anubis Guard territory | Organised, militaristic resistance |
| 5 | **The Heart** | The labyrinth's core — alive, pulsing, wrong | Boss, then escape |

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

All enemies are ambiguous in nature — the convict cannot tell whether they are biological, mechanical, or supernatural, and neither can the player. They are mindless, reacting on pure instinct with no awareness of the convict as a person.

| Name | HP | Attack | Defense | Levels | Behavior |
|---|---|---|---|---|---|
| Scarab | 6 | 4 | 1 | 1–2 | Charges on sight, fast and direct, always solo |
| Snake | 5 | 5 | 0 | 2–3 | Whip-quick strike, applies venom debuff for several turns |
| The Hollow | 7 | 3 | 0 | 2–4 | Sound-reactive, slow but unnerving, dangerous in pairs |
| Mummy | 12 | 4 | 3 | 3–4 | Slow and inevitable, hard to kill, keeps coming |
| Anubis Guard | 20 | 7 | 6 | 4–5 | Heavily armoured wall, absorbs punishment, stands its ground |
| The Warden (boss) | 50 | 10 | 4 | 5 | Relentless pursuer, hunts the convict through the final chamber |

Enemies are placed at spawn points during map generation. They do not roam between turns unless the player is within 3 tiles.

### Enemy Lore

**The Scarab** — Black, glossy, the size of a greyhound. It doesn't slow when it sees him. It lowers its head and comes. Each encounter is one-on-one and over quickly. The narrow corridors of the upper levels make dodging its charge the first real skill the convict has to learn. The shell is too uniform, too perfect. It bleeds — something dark and slow — but even that doesn't look entirely right. *Sidestep the charge. Hit it while it's turning.*

**The Snake** — No warning. A dark blur along the floor or wall, faster than anything down here has a right to be. The bite itself might feel like nothing in the moment. It's only a few turns later that the convict starts to notice — hands shaking, vision swimming. The venom doesn't kill quickly. It kills by making everything else kill him. Getting struck is a clock. *Don't get hit. If you do — keep moving.*

**The Hollow** — A figure in explorer's clothes, upright, walking the corridors with slow and aimless purpose. From a distance it could almost be a survivor. Up close the illusion collapses — eyes open but vacant, skin waxy and sunken. The clothes are recognisable. Survey gear. Field jackets. Once or twice, the distinctive dress of a woman who got further than anyone else down here. *It's not them anymore. Don't hesitate.*

**The Mummy** — Wrapped figures that emerge from alcoves and sealed chambers, moving with the slow certainty of something that has nowhere to be and all the time in the world. They don't bleed. They don't flinch. Hack off an arm and the body keeps walking. The wrappings aren't linen — on close inspection they're fibrous, almost root-like. *Don't let them corner you. Keep moving.*

**The Anubis Guard** — Tall, heavily built figures in black stone-like armour, jackal-headed, carrying weapons that look ceremonial but hit like sledgehammers. Their armour shows no joins, no buckles, no way in or out — as though it grew around whatever is inside. They absorb punishment that would drop anything else and keep standing. *Everything I have, or go around.*

**The Warden** — The heart of the labyrinth has one occupant. A mummy unlike the others — massive, ancient, wrapped in something dark and glistening. The moment the convict enters the final chamber, it comes for him and doesn't stop. No tactics. No pattern to exploit. Just pursuit — steady, inevitable, absorbing every hit without slowing. What it is — guardian, prisoner, the ship's last system — the labyrinth never explains. Destroying it brings the structure down around the convict's ears. The exit appears. He runs. *Don't stop. Don't look back.*

---

## Loot & Items

Loot is scarce — every item feels precious, every swap a decision. The convict carries one weapon at a time. Finding a better weapon means leaving the current one behind.

Items shift across the five levels: early floors yield crude 1890s gear from unlucky predecessors; deeper floors surface alien artefacts the convict has no name for.

### Weapons — One Equipped at a Time

| Item | Levels | Notes |
|---|---|---|
| Bowie knife | 1 — starting weapon | Fast, reliable for close quarters |
| Pickaxe handle | 1–2 | Slow swing, hits hard. Good against mummies |
| Revolver | 2–3 | Loud. Limited rounds. Stops a scarab charge cold |
| Repeater rifle | 2–3 | More rounds than the revolver, slower to swing in close quarters |
| Shotgun | 3 | One shot, devastating. Reloading costs a full turn |
| Machete | 2–4 | Fast, reliable, wears down with use |
| Alien Rod | 4–5 | Hums faintly. Delivers a pulse that staggers armoured guards. Origin unknown |

### Consumables

| Item | Effect | Source |
|---|---|---|
| Bandages | Restores health instantly | Found throughout, common on explorer bodies |
| Antidote vial | Clears snake venom | Medical kits on survey team bodies |
| Laudanum | Restores more health but blurs next two turns | Older bodies, levels 1–3 |
| Torch | Extends visibility in dark chambers. Can ignite oil | Found throughout, burns out over time |
| Dynamite | Clears a room, also collapses it | Survey team only, levels 2–3 |
| Alien Capsule | Unknown effect until used — could heal, could harm | Levels 4–5 only |

### Armour — Worn Passively, Degrades with Hits

| Item | Protection | Source |
|---|---|---|
| Leather vest | Light, doesn't slow movement | Bushrangers, level 1 |
| Survey coat | Moderate, padded shoulders | Survey team, levels 2–3 |
| Alien Plate Fragment | Heavy protection, slightly slows movement | Prised off a defeated Anubis Guard, level 4 |

### Tools

| Item | Use | Source |
|---|---|---|
| Rope | Descend shafts faster, bypass one floor section | Survey team |
| Oil flask | Poured — slows enemies for several turns. Ignited with torch — area fire damage | Prospector bodies, levels 1–3 |
| Map fragments | Reveals partial layout of current level | Explorer bodies throughout |
| Journal pages | Lore fragments — reveal who the dead were | Scattered throughout |
| Crowbar | Forces sealed doors, one-time use | Prospector bodies |

---

## Roguelike Rules

- **Permadeath**: No saves. Death returns to main menu.
- **Procedural levels**: Each run generates a new maze per level.
- **5 levels deep**: Level 5 contains the Warden boss. Defeating him wins the run.
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
