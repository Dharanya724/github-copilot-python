const LEADERBOARD_STORAGE_KEY = 'sudoku.leaderboard.v1';
const LEADERBOARD_VERSION = 1;
const MAX_LEADERBOARD_ENTRIES = 10;
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

function sanitizePlayerName(name) {
  if (typeof name !== 'string') return 'Anonymous';
  const cleanedName = name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
  return cleanedName || 'Anonymous';
}

function normalizeScore(score) {
  if (!score || typeof score !== 'object' || Array.isArray(score)) return null;
  if (typeof score.name !== 'string') return null;
  if (!Number.isFinite(score.timeMs) || score.timeMs < 0) return null;
  if (!Number.isFinite(score.completedAt) || score.completedAt < 0) return null;
  if (!VALID_DIFFICULTIES.has(score.difficulty)) return null;
  const hintCount = score.hintCount === undefined ? 0 : score.hintCount;
  if (!Number.isSafeInteger(hintCount) || hintCount < 0) return null;

  return {
    name: sanitizePlayerName(score.name),
    timeMs: score.timeMs,
    hintCount,
    difficulty: score.difficulty,
    completedAt: score.completedAt
  };
}

function sortScores(scores) {
  return scores.sort((first, second) => {
    const timeDifference = first.timeMs - second.timeMs;
    if (timeDifference !== 0) return timeDifference;

    const completionDifference = first.completedAt - second.completedAt;
    if (completionDifference !== 0) return completionDifference;

    const firstName = first.name.toLowerCase();
    const secondName = second.name.toLowerCase();
    if (firstName !== secondName) return firstName < secondName ? -1 : 1;
    return first.name < second.name ? -1 : first.name > second.name ? 1 : 0;
  });
}

function loadScores() {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (stored === null) return [];
    const data = JSON.parse(stored);
    if (!data || data.version !== LEADERBOARD_VERSION || !Array.isArray(data.scores)) {
      return [];
    }
    return sortScores(data.scores.map(normalizeScore).filter(Boolean))
      .slice(0, MAX_LEADERBOARD_ENTRIES);
  } catch (error) {
    return [];
  }
}

function recordScore(score) {
  const candidate = score && typeof score === 'object'
    ? {...score, name: sanitizePlayerName(score.name)}
    : score;
  const normalized = normalizeScore(candidate);
  const scores = loadScores();
  if (!normalized) return scores;

  const topScores = sortScores([...scores, normalized]).slice(0, MAX_LEADERBOARD_ENTRIES);
  try {
    window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify({
      version: LEADERBOARD_VERSION,
      scores: topScores
    }));
  } catch (error) {
    // Storage can be disabled or full; keep the current game playable.
  }
  return topScores;
}

function formatTime(timeMs) {
  const totalSeconds = Math.floor(Math.max(0, timeMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

window.SudokuLeaderboard = {loadScores, recordScore, formatTime};