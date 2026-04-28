// Entry point. For Milestone 1 this renders a static test scene once.
// Future milestones will replace the hardcoded scene with one built from
// the real map and player position.

window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Static test scene.
  // Corridor with walls on both sides at depths 1 and 2.
  // At depth 3 the right wall opens up (a branching passage).
  // A back wall closes the corridor at depth 4.
  // This tests that the renderer correctly handles both closed and open passages.
  const testScene = [
    { left: true,  right: true,  back: false }, // depth 1 — nearest
    { left: true,  right: true,  back: false }, // depth 2
    { left: true,  right: false, back: false }, // depth 3 — open on the right
    { left: true,  right: false, back: true  }, // depth 4 — wall at the far end
  ];

  renderView(ctx, testScene);
});
