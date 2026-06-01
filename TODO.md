# OBEscape — TODO

## Known Issues
- [x] Fix render bug when staring at wall that has a corridor parallel to direction of view on left or right side
- [ ] Fix how stairs are drawn
- [ ] Support side visibility for monsters
- [ ] Redesign enemy sprites
- [ ] Update sprites for loot
- [ ] Update compass sprite
- [x] Implement cache busting
- [ ] Scrollable event log
- [ ] Fix corpse rendering, possibly with sprites
- [x] Fix hieroglyphics rendering

## Advanced Features
- [ ] Tap-to-expand minimap — small minimap by default; tapping it opens a full-canvas map overlay at a large cell size, dismissed with a second tap or close button
- [ ] Compass as discoverable item — player starts without the compass; minimap direction indicator is absent until a compass item is found and picked up (like other equipment items)
- [ ] Responsive canvas — use `window.devicePixelRatio` to render at native device pixel density (crisp text on retina/high-DPI screens). Requires scaling `canvas.width/height` by dpr at startup and adding a resize listener. All draw coordinates stay in logical 800-wide units via `ctx.scale(dpr, dpr)`.
- [ ] Noise mechanics based on speed of user input
- [ ] Sound effects
- [ ] Ranged combat for weapons like revolver and alien rod
- [ ] Enemy status effects on attack (e.g. snake venom, mummy slow)

## Milestones
- [x] M1: Static corridor view renders on canvas
- [x] M2: Grid map loads and player moves on it
- [x] M3: Renderer connects to player position/facing
- [x] M4: Procedural maze generation per level
- [x] M5: Multiple levels with stairs
- [x] M6: Enemies placed and visible in renderer
- [ ] M7: Turn-based combat
- [x] M8: Items and inventory
- [x] M9: HUD and minimap
- [x] M10: Main menu, game over screen, win screen
- [ ] M11: Polish — hieroglyph decorations
