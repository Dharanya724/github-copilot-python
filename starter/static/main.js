// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let currentDifficulty = 'medium';
let timerStartedAt = null;
let timerInterval = null;
let gameCompleted = false;

function updateTimer() {
  if (timerStartedAt === null) return;
  const elapsedMs = performance.now() - timerStartedAt;
  document.getElementById('game-timer').textContent =
    window.SudokuLeaderboard.formatTime(elapsedMs);
}

function startTimer() {
  if (timerInterval !== null) clearInterval(timerInterval);
  timerStartedAt = performance.now();
  timerInterval = setInterval(updateTimer, 250);
  gameCompleted = false;
  document.getElementById('game-timer').textContent = '00:00';
}

function stopTimer() {
  if (timerStartedAt === null) return 0;
  const elapsedMs = Math.max(0, performance.now() - timerStartedAt);
  clearInterval(timerInterval);
  timerInterval = null;
  timerStartedAt = null;
  document.getElementById('game-timer').textContent =
    window.SudokuLeaderboard.formatTime(elapsedMs);
  return elapsedMs;
}

function renderLeaderboard() {
  const entries = document.getElementById('leaderboard-entries');
  entries.replaceChildren();
  const scores = window.SudokuLeaderboard.loadScores();
  scores.forEach((score, index) => {
    const row = document.createElement('tr');
    const values = [
      String(index + 1),
      score.name,
      window.SudokuLeaderboard.formatTime(score.timeMs),
      score.difficulty[0].toUpperCase() + score.difficulty.slice(1)
    ];
    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    entries.appendChild(row);
  });
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  const difficulty = document.getElementById('difficulty').value;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  currentDifficulty = difficulty;
  startTimer();
  document.getElementById('message').innerText = '';
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
    if (!gameCompleted) {
      const timeMs = stopTimer();
      gameCompleted = true;
      window.SudokuLeaderboard.recordScore({
        name: document.getElementById('player-name').value,
        timeMs,
        difficulty: currentDifficulty,
        completedAt: Date.now()
      });
      renderLeaderboard();
    }
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  renderLeaderboard();
  // initialize
  newGame();
});