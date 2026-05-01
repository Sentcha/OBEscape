// On-screen D-pad — four buttons drawn on the canvas for touch and mouse input.
// Positioned in the bottom-right corner so it doesn't overlap the minimap.
//
// The canvas is always drawn at 800x600 internally. CSS may scale it to fit
// smaller screens, so any touch/click coordinates must be converted back to
// canvas space before checking button hits. See getCanvasXY() below.

const DPAD_CX   = 700; // center x of the d-pad cluster in canvas pixels
const BTN_SIZE  = 60;  // width and height of each button
const BTN_HALF  = BTN_SIZE / 2;
const ARROW_R   = 16;  // half-size of the arrow triangle inside each button
const DPAD_CY   = VIEW_BOT - BTN_SIZE - BTN_HALF - 2; // bottom of view

// Button definitions: position, arrow direction, and the key event they mimic.
// Arrow directions: 0=up, 1=right, 2=down, 3=left
const DPAD_BUTTONS = [
  { x: DPAD_CX,            y: DPAD_CY - BTN_SIZE, arrow: 0, key: 'ArrowUp'    }, // forward
  { x: DPAD_CX + BTN_SIZE, y: DPAD_CY,            arrow: 1, key: 'ArrowRight' }, // turn right
  { x: DPAD_CX,            y: DPAD_CY + BTN_SIZE, arrow: 2, key: 'ArrowDown'  }, // backward
  { x: DPAD_CX - BTN_SIZE, y: DPAD_CY,            arrow: 3, key: 'ArrowLeft'  }, // turn left
];

function drawArrow(ctx, cx, cy, dir) {
  const r = ARROW_R;
  ctx.beginPath();
  if (dir === 0) { ctx.moveTo(cx,   cy-r); ctx.lineTo(cx+r, cy+r); ctx.lineTo(cx-r, cy+r); }
  if (dir === 1) { ctx.moveTo(cx+r, cy  ); ctx.lineTo(cx-r, cy-r); ctx.lineTo(cx-r, cy+r); }
  if (dir === 2) { ctx.moveTo(cx,   cy+r); ctx.lineTo(cx-r, cy-r); ctx.lineTo(cx+r, cy-r); }
  if (dir === 3) { ctx.moveTo(cx-r, cy  ); ctx.lineTo(cx+r, cy-r); ctx.lineTo(cx+r, cy+r); }
  ctx.closePath();
  ctx.fill();
}

function drawDpad(ctx) {
  for (const btn of DPAD_BUTTONS) {
    // Dark semi-transparent button background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(btn.x - BTN_HALF, btn.y - BTN_HALF, BTN_SIZE, BTN_SIZE, 8);
    ctx.fill();

    // Gold arrow
    ctx.fillStyle = '#f5d485';
    drawArrow(ctx, btn.x, btn.y, btn.arrow);
  }
}

// Return the key string for whichever button contains canvas point (cx, cy),
// or null if the point doesn't hit any button.
function getDpadKey(cx, cy) {
  for (const btn of DPAD_BUTTONS) {
    if (Math.abs(cx - btn.x) <= BTN_HALF && Math.abs(cy - btn.y) <= BTN_HALF) {
      return btn.key;
    }
  }
  return null;
}

// Convert a touch or mouse event to canvas-space (x, y), correcting for any
// CSS scaling that makes the canvas appear smaller or larger than 800x600.
function getCanvasXY(e, canvas) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}
