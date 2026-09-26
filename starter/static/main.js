// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const THEME_STORAGE_KEY = 'sudoku.theme.v1';
let puzzle = [];
let currentDifficulty = 'medium';
let timerStartedAt = null;
let timerInterval = null;
let gameCompleted = false;
let hintCount = 0;

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggle = document.getElementById('theme-toggle');
  toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  toggle.textContent = `Dark mode: ${theme === 'dark' ? 'On' : 'Off'}`;
}

function initializeTheme() {
  let theme = 'light';
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') theme = storedTheme;
  } catch (error) {
    // Keep the game usable when browser storage is unavailable.
  }

  setTheme(theme);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // The theme still applies for this page even if it cannot be persisted.
    }
  });
}

function getCurrentBoard() {
  const inputs = document.getElementById('sudoku-board').getElementsByTagName('input');
  const board = [];
  for (let row = 0; row < SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < SIZE; col++) {
      const value = inputs[row * SIZE + col].value;
      board[row][col] = value ? parseInt(value, 10) : 0;
    }
  }
  return board;
}

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
      String(score.hintCount),
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
        validateCell(e.target);
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

async function validateCell(input) {
  if (input.disabled) return;
  if (!input.value) {
    input.classList.remove('incorrect');
    return;
  }

  const value = input.value;
  try {
    const res = await fetch('/validate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        row: Number(input.dataset.row),
        col: Number(input.dataset.col),
        value: Number(value)
      })
    });
    const data = await res.json();
    if (res.ok && input.isConnected && !input.disabled && input.value === value) {
      input.classList.toggle('incorrect', !data.correct);
    }
  } catch (error) {
    // Leave the current styling unchanged if server validation is unavailable.
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
  hintCount = 0;
  document.getElementById('hint-count').textContent = String(hintCount);
  document.getElementById('use-hint').disabled = false;
  startTimer();
  document.getElementById('message').innerText = '';
}

async function useHint() {
  const hintButton = document.getElementById('use-hint');
  hintButton.disabled = true;
  const msg = document.getElementById('message');
  try {
    const res = await fetch('/hint', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({board: getCurrentBoard()})
    });
    const data = await res.json();
    if (data.error) {
      msg.style.color = 'var(--message-error)';
      msg.innerText = data.error;
      return;
    }

    const input = document.querySelector(
      `.sudoku-cell[data-row="${data.row}"][data-col="${data.col}"]`
    );
    input.value = data.value;
    input.disabled = true;
    input.className = 'sudoku-cell hinted';
    puzzle[data.row][data.col] = data.value;
    hintCount++;
    document.getElementById('hint-count').textContent = String(hintCount);
    msg.innerText = '';
  } catch (error) {
    msg.style.color = 'var(--message-error)';
    msg.innerText = 'Unable to get a hint.';
  } finally {
    hintButton.disabled = gameCompleted;
  }
}

async function checkSolution() {
  const inputs = document.getElementById('sudoku-board').getElementsByTagName('input');
  const board = getCurrentBoard();
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = 'var(--message-error)';
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
    msg.style.color = 'var(--message-success)';
    msg.innerText = 'Congratulations! You solved it!';
    if (!gameCompleted) {
      const timeMs = stopTimer();
      gameCompleted = true;
      window.SudokuLeaderboard.recordScore({
        name: document.getElementById('player-name').value,
        timeMs,
        hintCount,
        difficulty: currentDifficulty,
        completedAt: Date.now()
      });
      document.getElementById('use-hint').disabled = true;
      renderLeaderboard();
    }
  } else {
    msg.style.color = 'var(--message-error)';
    msg.innerText = 'Some cells are incorrect.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('use-hint').addEventListener('click', useHint);
  initializeTheme();
  renderLeaderboard();
  // initialize
  newGame();
});