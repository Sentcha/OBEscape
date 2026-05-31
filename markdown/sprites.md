# OBEscape — Sprite Design Guide

## Canvas & Coordinate Reference

- Canvas resolution: **800 × 800 px**
- First-person view occupies y 100–700 (600 px tall)
- Corridor centre: CX = 400, CY = 400
- Portal (back-wall rectangle) at depth `d`:
  - Width = `560 / d` px
  - Height = `400 / d` px
  - Positioned centred on CX, CY

| Depth | Portal size on canvas |
|-------|-----------------------|
| d=1 (adjacent) | 560 × 400 px |
| d=2 | 280 × 200 px |
| d=3 | 187 × 133 px |
| d=4 | 140 × 100 px |

---

## Sprite Resolution

**128 × 128 px per frame.**

This gives clean 1:1 pixels at d=2–3 (typical combat range). The portal aspect ratio is 7:5 but sprites are scaled via `ctx.drawImage` to fill the portal rectangle, so square source images work correctly.

Use **256 × 256** only if you need extra detail that holds up at d=1 (adjacent tile — the enemy fills the entire view). 128 is sufficient for the game's art style.

---

## File Format

**PNG with alpha transparency.**

Enemies are drawn in front of the back wall; items sit on the floor. Both require a transparent background so the corridor shows through. JPEG has no alpha channel and is not suitable.

---

## Folder Structure

```
assets/
  enemies/
    scarab.png
    snake.png
    hollow.png
    mummy.png
    anubis-guard.png
  items/
    bowie-knife.png
    pickaxe-handle.png
    revolver.png
    machete.png
    alien-rod.png
    bandages.png
    laudanum.png
    leather-vest.png
    survey-coat.png
    alien-plate.png
```

---

## Directional Sprite Sheets

Each enemy sprite is a **horizontal strip of 4 frames** (512 × 128 px total) covering the four directions relative to the enemy's own facing.

```
┌────────┬────────┬────────┬────────┐
│ front  │  back  │  left  │  right │  128 px tall
└────────┴────────┴────────┴────────┘
←─────────────── 512 px ────────────→
```

Frame indices:

| Index | Direction (enemy-relative) |
|-------|---------------------------|
| 0 | Front — player faces the enemy head-on |
| 1 | Back — player is behind the enemy |
| 2 | Left — player sees the enemy's left side |
| 3 | Right — player sees the enemy's right side |

Directions are **enemy-relative**, not world-relative. At render time the game computes the relative angle between the player's view direction and the enemy's facing to select the frame.

### Drawing a specific frame

```js
const FRAME_W = 128;
ctx.drawImage(img, frameIndex * FRAME_W, 0, FRAME_W, 128, far.l, far.t, pw, ph);
```

### Why a sprite sheet over separate files

- One HTTP request per enemy type instead of four
- Single cache-bust version string per enemy
- Guaranteed atomic load — impossible to have some directions loaded and others missing

---

## Anchor Points

### Enemies

Anchored to **bottom of the portal** (`far.b`). Design the sprite with the character's feet at the very bottom of the 128 px frame. Empty transparent space at the top is correct and expected for shorter enemies.

### Items

Items sit in the **lower third of the portal** — they appear to rest on the dungeon floor. Design item sprites with content in the lower ~30% of the frame and transparent space above.

---

## Shading

The renderer applies depth-based darkening via a `shade` multiplier (1.0 = full brightness at depth 1, darker at greater depth). With bitmap sprites the equivalent is:

```js
ctx.globalAlpha = shade;
ctx.drawImage(img, ...);
ctx.globalAlpha = 1.0;
```

This dims the sprite uniformly, consistent with how walls darken at depth.

---

## Preloading

All images must be fully loaded before the first frame renders. Missing this causes blank or flickering sprites on first appearance, especially on mobile over a slow connection.

Pattern: create an `Image()` for every sprite, collect all `onload` promises, resolve when all complete, then start the game loop.

```js
function loadSprite(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

// In init:
const [scarab, snake, ...] = await Promise.all([
  loadSprite('assets/enemies/scarab.png?v=xxxx'),
  loadSprite('assets/enemies/snake.png?v=xxxx'),
  // ...
]);
```

---

## Cache-Busting

Append a version query string to every sprite URL, the same way JS files are versioned in `index.html`:

```
assets/enemies/scarab.png?v=abc1234
```

Update the version string whenever the sprite file changes. The version can be the git commit hash of the commit that changed the asset.

---

## Prerequisites Before Implementing

### Enemy facing direction

Enemies currently have no `facing` field — they are stored as `{ x, y, type, hp, maxHp }`. Directional sprites require adding a `facing` value (0=N, 1=E, 2=S, 3=W) to each enemy and deciding when it updates (e.g. face toward the player each turn). This is a prerequisite for the **"Support side visibility for monsters"** TODO item.

### design.md update

`design.md` currently states *"Vector polygons drawn directly on canvas (no sprites or image assets)"* under Tech Stack. Update that section when sprites are introduced.
