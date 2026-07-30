const GAME_SECONDS = 120;
const COLS = 8;
const ROWS = 10;
const TARGET_SUM = 10;

const gridEl = document.getElementById("apple-grid");
const selectionBox = document.getElementById("selection-box");
const sumBadge = document.getElementById("sum-badge");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startOverlay = document.getElementById("start-overlay");
const endOverlay = document.getElementById("end-overlay");
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");
const restartBtn = document.getElementById("restart-btn");
const finalScoreEl = document.getElementById("final-score");
const endTitleEl = document.getElementById("end-title");

let score = 0;
let timeLeft = GAME_SECONDS;
let playing = false;
let timerId = null;
let apples = [];
let isSelecting = false;
let startX = 0;
let startY = 0;
let clearedCount = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateBalancedValues(total) {
  const values = [];
  const perNumber = Math.floor(total / 9);
  for (let n = 1; n <= 9; n++) {
    for (let i = 0; i < perNumber; i++) values.push(n);
  }
  while (values.length < total) {
    values.push(Math.floor(Math.random() * 9) + 1);
  }
  return shuffle(values);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildGrid() {
  gridEl.innerHTML = "";
  apples = [];
  clearedCount = 0;

  const values = generateBalancedValues(COLS * ROWS);

  values.forEach((value, idx) => {
    const el = document.createElement("div");
    el.className = "apple";
    el.textContent = value;
    gridEl.appendChild(el);
    apples.push({ value, el, cleared: false, rect: null });
  });
}

function measureRects() {
  const gridRect = gridEl.getBoundingClientRect();
  apples.forEach((apple) => {
    const r = apple.el.getBoundingClientRect();
    apple.rect = {
      left: r.left - gridRect.left,
      top: r.top - gridRect.top,
      right: r.right - gridRect.left,
      bottom: r.bottom - gridRect.top,
    };
  });
}

function rectsIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function getSelectionRect(curX, curY) {
  return {
    left: Math.min(startX, curX),
    top: Math.min(startY, curY),
    right: Math.max(startX, curX),
    bottom: Math.max(startY, curY),
  };
}

function updateSelectionVisual(sel) {
  selectionBox.hidden = false;
  selectionBox.style.left = `${sel.left}px`;
  selectionBox.style.top = `${sel.top}px`;
  selectionBox.style.width = `${sel.right - sel.left}px`;
  selectionBox.style.height = `${sel.bottom - sel.top}px`;

  let sum = 0;
  apples.forEach((apple) => {
    if (apple.cleared) return;
    const hit = rectsIntersect(apple.rect, sel);
    apple.el.classList.toggle("is-selecting", hit);
    if (hit) sum += apple.value;
  });

  sumBadge.hidden = false;
  sumBadge.textContent = sum;
  sumBadge.style.left = `${sel.right}px`;
  sumBadge.style.top = `${sel.top}px`;
  sumBadge.classList.toggle("is-good", sum === TARGET_SUM);
  sumBadge.classList.toggle("is-over", sum > TARGET_SUM);
}

function clearSelectionVisual() {
  selectionBox.hidden = true;
  sumBadge.hidden = true;
  apples.forEach((apple) => apple.el.classList.remove("is-selecting"));
}

function finalizeSelection() {
  const selected = apples.filter((a) => !a.cleared && a.el.classList.contains("is-selecting"));
  const sum = selected.reduce((acc, a) => acc + a.value, 0);

  if (sum === TARGET_SUM && selected.length > 0) {
    selected.forEach((a) => {
      a.cleared = true;
      a.el.classList.remove("is-selecting");
      a.el.classList.add("is-cleared");
    });
    clearedCount += selected.length;
    score += selected.length;
    scoreEl.textContent = score;

    if (clearedCount >= apples.length) {
      endGame(true);
    }
  }

  clearSelectionVisual();
}

function relativePoint(e) {
  const rect = gridEl.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  return {
    x: Math.min(Math.max(point.clientX - rect.left, 0), rect.width),
    y: Math.min(Math.max(point.clientY - rect.top, 0), rect.height),
  };
}

function handlePointerDown(e) {
  if (!playing) return;
  const p = relativePoint(e);
  isSelecting = true;
  startX = p.x;
  startY = p.y;
  measureRects();
  gridEl.setPointerCapture?.(e.pointerId);
  updateSelectionVisual(getSelectionRect(startX, startY));
}

function handlePointerMove(e) {
  if (!isSelecting) return;
  const p = relativePoint(e);
  updateSelectionVisual(getSelectionRect(p.x, p.y));
}

function handlePointerUp() {
  if (!isSelecting) return;
  isSelecting = false;
  finalizeSelection();
}

function tick() {
  timeLeft -= 1;
  timeEl.textContent = formatTime(timeLeft);
  if (timeLeft <= 0) {
    endGame(false);
  }
}

function startGame() {
  score = 0;
  timeLeft = GAME_SECONDS;
  scoreEl.textContent = score;
  timeEl.textContent = formatTime(timeLeft);
  playing = true;

  startOverlay.hidden = true;
  endOverlay.hidden = true;

  buildGrid();
  clearSelectionVisual();

  window.clearInterval(timerId);
  timerId = window.setInterval(tick, 1000);
}

function endGame(cleared) {
  playing = false;
  isSelecting = false;
  window.clearInterval(timerId);
  clearSelectionVisual();

  endTitleEl.textContent = cleared ? "올 클리어! 🎉" : "시간 종료!";
  finalScoreEl.textContent = score;
  endOverlay.hidden = false;
}

gridEl.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerup", handlePointerUp);

startBtn.addEventListener("click", startGame);
retryBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

buildGrid();
