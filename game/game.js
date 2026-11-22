// Heist game: reach the vault without being seen by the guards.
// The room the thief crosses, guards with vision cones, cameras, a loot target and an alarm meter.
// Controls: WASD or the arrow keys to move; Space waits; Esc pauses;
// Enter starts on the title screen.

const W = 640;
const H = 480;
const PLAYER_SPEED = 5;
const GUARD_SPEED = 2.6;
const CHASE_SPEED = 6;
const VISION_RANGE = 115;
const VISION_ANGLE = 0.55; // radians, ~31 degrees
const WIN_DIST = 16;
const LOSE_DIST = 34;
const ALARM_MAX = 120;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function angleDiff(a, b) {
  let d = Math.abs(a - b) % (2 * Math.PI);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d;
}
function lerpPoint(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

const canvas = document.createElement("canvas");
canvas.width = W;
canvas.height = H;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

// The thief in the museum: the white dot, eyes on the door to the vault.
const player = {
  pos: { x: 80, y: 360 },
  speed: PLAYER_SPEED,
  keys: new Set(),
  titleBtn: null,
};
// Guards patrol the room; their vision cones are drawn always.
const guards = [
  { pos: { x: 240, y: 100 }, p0: { x: 160, y: 100 }, p1: { x: 400, y: 100 }, t: 0, step: GUARD_SPEED * 0.004, alert: false, chaseTimer: 0 },
  { pos: { x: 110, y: 290 }, p0: { x: 110, y: 170 }, p1: { x: 110, y: 430 }, t: 0, step: GUARD_SPEED * 0.005, alert: false, chaseTimer: 0 },
  { pos: { x: 590, y: 260 }, p0: { x: 480, y: 260 }, p1: { x: 590, y: 260 }, t: 0, step: GUARD_SPEED * 0.004, alert: false, chaseTimer: 0 },
  { pos: { x: 440, y: 380 }, p0: { x: 380, y: 380 }, p1: { x: 500, y: 380 }, t: 0, step: GUARD_SPEED * 0.004, alert: false, chaseTimer: 0 },
  { pos: { x: 300, y: 200 }, p0: { x: 250, y: 200 }, p1: { x: 350, y: 200 }, t: 0, step: GUARD_SPEED * 0.004, alert: false, chaseTimer: 0 },
];
// Cameras, watching; they never sleep.
const cameras = [
  { x: 440, y: 90 },
  { x: 150, y: 330 },
  { x: 320, y: 150 },
  { x: 550, y: 260 },
];
// The alarm meter: rises while anyone watches the thief.
const alarm = { level: 0 };
// The loot target: the vault, guarded, at the top right of the room.
const vault = { x: 600, y: 60 };

let state = "title";
let paused = false;

function guardFacing(g) {
  const fwd = Math.atan2(g.p1.y - g.p0.y, g.p1.x - g.p0.x);
  return g.t < 0.5 ? fwd : fwd + Math.PI;
}
function guardSeesPlayer(g) {
  const d = dist(g.pos, player.pos);
  if (d > VISION_RANGE) return false;
  if (angleDiff(guardFacing(g), Math.atan2(player.pos.y - g.pos.y, player.pos.x - g.pos.x)) > VISION_ANGLE) return false;
  return true;
}
function updatePlayer() {
  let dx = 0;
  let dy = 0;
  if (player.keys.has("ArrowLeft") || player.keys.has("a") || player.keys.has("A")) dx -= 1;
  if (player.keys.has("ArrowRight") || player.keys.has("d") || player.keys.has("D")) dx += 1;
  if (player.keys.has("ArrowUp") || player.keys.has("w") || player.keys.has("W")) dy -= 1;
  if (player.keys.has("ArrowDown") || player.keys.has("s") || player.keys.has("S")) dy += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    player.pos.x += (dx / len) * player.speed;
    player.pos.y += (dy / len) * player.speed;
    player.pos.x = clamp(player.pos.x, 20, W - 20);
    player.pos.y = clamp(player.pos.y, 20, H - 20);
  }
}
function updateGuards() {
  for (const g of guards) {
    if (g.alert) {
      g.chaseTimer += 1;
      const pd = dist(g.pos, player.pos);
      if (pd < LOSE_DIST) {
        state = "lose";
        return;
      }
      if (pd > 140 || g.chaseTimer > 400) {
        g.alert = false;
        g.chaseTimer = 0;
        continue;
      }
      const f = Math.atan2(player.pos.y - g.pos.y, player.pos.x - g.pos.x);
      g.pos.x += Math.cos(f) * CHASE_SPEED;
      g.pos.y += Math.sin(f) * CHASE_SPEED;
      continue;
    }
    g.t = (g.t + g.step) % 1;
    g.pos = lerpPoint(g.p0, g.p1, g.t);
    if (guardSeesPlayer(g)) g.alert = true;
  }
}
function updateAlarm() {
  // The alarm meter: while anyone watches the thief, the alarm rises.
  if (state === "play" && guards.some(guardSeesPlayer)) {
    alarm.level = Math.min(alarm.level + 2, ALARM_MAX);
  } else {
    alarm.level = Math.max(alarm.level - 0.5, 0);
  }
  if (alarm.level >= ALARM_MAX) state = "lose";
}
function drawPlayer() {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(player.pos.x, player.pos.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d0d0d0";
  ctx.beginPath();
  ctx.arc(player.pos.x - 3, player.pos.y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawGuard(g) {
  ctx.save();
  ctx.fillStyle = g.alert ? "#ff2020" : "#c01818";
  ctx.beginPath();
  ctx.arc(g.pos.x, g.pos.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawGuardVision(g) {
  // The guard's vision cone: always drawn, the direction the guard faces.
  const f = guardFacing(g);
  ctx.save();
  ctx.strokeStyle = "#ffc060";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(g.pos.x, g.pos.y);
  ctx.lineTo(g.pos.x + Math.cos(f) * 60, g.pos.y + Math.sin(f) * 60);
  ctx.stroke();
  ctx.restore();
}
function drawCamera(c) {
  ctx.save();
  ctx.strokeStyle = "#50a0ff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x, c.y - 12);
  ctx.stroke();
  ctx.restore();
}
function drawVault() {
  ctx.save();
  ctx.strokeStyle = "#2ddd70";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(vault.x, vault.y, 17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#1fa845";
  ctx.beginPath();
  ctx.arc(vault.x, vault.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawAlarm() {
  // The alarm meter: a bar in the corner, rising when the guards watch the thief.
  ctx.save();
  ctx.fillStyle = "#1a1f26";
  ctx.fillRect(10, H - 34, 300, 14);
  const level = clamp(alarm.level, 0, 100);
  const filled = level / 100 * 284;
  ctx.fillStyle = level >= ALARM_MAX ? "#ff4040" : "#ffc060";
  ctx.fillRect(13, H - 31, filled, 8);
  ctx.strokeStyle = "#303842";
  ctx.strokeRect(10, H - 34, 300, 14);
  ctx.restore();
}
function drawTitleButton(label) {
  const bx = W / 2 - 45, by = H / 2 + 10, bw = 90, bh = 28;
  ctx.fillStyle = "#3a86ff";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, bx + bw / 2, by + bh / 2 + 4);
  player.titleBtn = { x: bx, y: by, w: bw, h: bh };
}
function drawHint() {
  if (state === "title") {
    ctx.fillStyle = "#c8c8c8";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Phantom Heist", W / 2, 60);
    ctx.font = "13px sans-serif";
    ctx.fillText("Reach the vault at the top right without being seen by the guards.", W / 2, 85);
    ctx.fillText("The alarm meter fills when they watch you.", W / 2, 105);
    ctx.fillText("WASD/arrows: move   Space: wait   Esc: pause   Enter: start", W / 2, H - 30);
    drawTitleButton("Start");
  } else if (state === "win") {
    ctx.fillStyle = "#2ddd70";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("The vault is open!", W / 2, 120);
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("You stole the prize and slipped away.", W / 2, 150);
    drawTitleButton("Try again");
  } else if (state === "lose") {
    ctx.fillStyle = "#ff4040";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Alarm!", W / 2, 120);
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("The alarm has sounded. Try again.", W / 2, 150);
    drawTitleButton("Try again");
  } else if (state === "pause") {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Paused", W / 2, H / 2);
  }
}
function draw() {
  // The room the thief crosses.
  ctx.fillStyle = "#101418";
  ctx.fillRect(0, 0, W, H);
  for (const c of cameras) drawCamera(c);
  for (const g of guards) drawGuardVision(g);
  drawVault();
  drawPlayer();
  for (const g of guards) drawGuard(g);
  drawAlarm();
  drawHint();
}
function resetGame() {
  player.pos = { x: 80, y: 360 };
  player.keys = new Set();
  guards.forEach((g, i) => {
    g.t = 0.02 + 0.04 * i;
    g.pos = lerpPoint(g.p0, g.p1, g.t);
    g.alert = false;
    g.chaseTimer = 0;
  });
  alarm.level = 0;
  state = "title";
  paused = false;
}
function loop() {
  if (state === "play" && !paused) {
    updatePlayer();
    updateGuards();
    updateAlarm();
    if (dist(player.pos, vault) < WIN_DIST) {
      state = "win";
    }
  }
  draw();
  requestAnimationFrame(loop);
}
function onPointerDown(e) {
  if (state !== "title") return;
  const btn = player.titleBtn;
  if (!btn) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (x >= btn.x && x < btn.x + btn.w && y >= btn.y && y < btn.y + btn.h) {
    state = "play";
    player.keys = new Set();
  }
}
document.addEventListener("pointerdown", onPointerDown);
document.addEventListener("keydown", (e) => {
  player.keys.add(e.key);
  if (e.key === "Escape") {
    paused = !paused;
    if (state === "pause") state = "play";
    else if (state === "play") state = "pause";
  }
  if (e.key === "Enter" && state === "title") state = "play";
  if (e.key === "Enter" && (state === "win" || state === "lose")) resetGame();
});
document.addEventListener("keyup", (e) => {
  player.keys.delete(e.key);
});
resetGame();
loop();

// Expose the game for testing and debugging.
const heistGame = {
  canvas,
  state: () => state,
  player: { pos: player.pos, keys: player.keys, speed: player.speed },
  guards,
  cameras,
  alarm,
  vault,
};
window.heistGame = heistGame;
