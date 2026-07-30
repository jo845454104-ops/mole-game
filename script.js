const GAME_SECONDS = 30;
const EVADE_DIST = 95;
const EVADE_COOLDOWN = 180;

const gameArea = document.getElementById("game-area");
const mole = document.getElementById("mole");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startOverlay = document.getElementById("start-overlay");
const endOverlay = document.getElementById("end-overlay");
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");
const restartBtn = document.getElementById("restart-btn");
const finalScoreEl = document.getElementById("final-score");

let score = 0;
let timeLeft = GAME_SECONDS;
let playing = false;
let timerId = null;
let lastEvadeAt = 0;

const HIT_MESSAGES = ["잡았다!", "도망 못가!", "+1", "성공!"];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function moleSize() {
  return { w: mole.offsetWidth, h: mole.offsetHeight };
}

function placeMoleRandom(avoidX, avoidY) {
  const rect = gameArea.getBoundingClientRect();
  const { w, h } = moleSize();
  const padX = w / 2 + 10;
  const padY = h / 2 + 10;

  let x, y, tries = 0;
  do {
    x = randomBetween(padX, rect.width - padX);
    y = randomBetween(padY, rect.height - padY);
    tries++;
  } while (
    avoidX != null &&
    Math.hypot(x - avoidX, y - avoidY) < EVADE_DIST &&
    tries < 12
  );

  mole.style.left = `${x}px`;
  mole.style.top = `${y}px`;
}

function moleCenter() {
  const rect = gameArea.getBoundingClientRect();
  const moleRect = mole.getBoundingClientRect();
  return {
    x: moleRect.left + moleRect.width / 2 - rect.left,
    y: moleRect.top + moleRect.height / 2 - rect.top,
  };
}

function handlePointerMove(e) {
  if (!playing) return;

  const now = performance.now();
  if (now - lastEvadeAt < EVADE_COOLDOWN) return;

  const rect = gameArea.getBoundingClientRect();
  const px = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
  const py = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;

  const c = moleCenter();
  const dist = Math.hypot(px - c.x, py - c.y);

  if (dist < EVADE_DIST) {
    lastEvadeAt = now;
    placeMoleRandom(px, py);
  }
}

function spawnHitPop(x, y) {
  const pop = document.createElement("div");
  pop.className = "hit-pop";
  pop.textContent = HIT_MESSAGES[Math.floor(Math.random() * HIT_MESSAGES.length)];
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  gameArea.appendChild(pop);
  window.setTimeout(() => pop.remove(), 600);
}

function handleHit(e) {
  if (!playing) return;
  e.stopPropagation();

  score += 1;
  scoreEl.textContent = score;

  const c = moleCenter();
  spawnHitPop(c.x, c.y);

  mole.classList.remove("is-hit");
  void mole.offsetWidth;
  mole.classList.add("is-hit");

  placeMoleRandom(c.x, c.y);
}

function tick() {
  timeLeft -= 1;
  timeEl.textContent = timeLeft;
  if (timeLeft <= 0) {
    endGame();
  }
}

function startGame() {
  score = 0;
  timeLeft = GAME_SECONDS;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  playing = true;

  startOverlay.hidden = true;
  endOverlay.hidden = true;
  mole.style.visibility = "visible";

  placeMoleRandom();
  timerId = window.setInterval(tick, 1000);
}

function endGame() {
  playing = false;
  window.clearInterval(timerId);
  mole.style.visibility = "hidden";
  finalScoreEl.textContent = score;
  endOverlay.hidden = false;
}

mole.style.visibility = "hidden";
mole.addEventListener("click", handleHit);
gameArea.addEventListener("pointermove", handlePointerMove);
startBtn.addEventListener("click", startGame);
retryBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
