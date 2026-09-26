const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'static', 'leaderboard.js'),
  'utf8'
);
const storageKey = 'sudoku.leaderboard.v1';

function createLeaderboard(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) values.set(storageKey, initialValue);
  const localStorage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
  const context = {window: {localStorage}};
  vm.runInNewContext(source, context);
  return {leaderboard: context.window.SudokuLeaderboard, values};
}

function score(name, timeMs, completedAt, difficulty = 'medium') {
  return {name, timeMs, completedAt, difficulty};
}

test('missing and malformed storage produce an empty leaderboard', () => {
  assert.equal(JSON.stringify(createLeaderboard().leaderboard.loadScores()), '[]');
  assert.equal(JSON.stringify(createLeaderboard('{not json').leaderboard.loadScores()), '[]');
});

test('outdated versions and invalid score records are ignored', () => {
  const outdated = JSON.stringify({version: 0, scores: [score('A', 1000, 1)]});
  assert.equal(JSON.stringify(createLeaderboard(outdated).leaderboard.loadScores()), '[]');

  const malformed = JSON.stringify({
    version: 1,
    scores: [score('Valid', 1000, 1), score('Bad time', -1, 2), score('Bad level', 500, 3, 'expert')]
  });
  assert.equal(
    JSON.stringify(createLeaderboard(malformed).leaderboard.loadScores()),
    JSON.stringify([{name: 'Valid', timeMs: 1000, difficulty: 'medium', completedAt: 1}])
  );
});

test('recording keeps the ten shortest times with deterministic tie ordering', () => {
  const initialScores = Array.from({length: 11}, (_, index) =>
    score(`Player ${index}`, 20000 - index * 1000, index)
  );
  const stored = JSON.stringify({version: 1, scores: initialScores});
  const {leaderboard} = createLeaderboard(stored);

  const topScores = leaderboard.recordScore(score('Fastest', 500, 20, 'hard'));

  assert.equal(topScores.length, 10);
  assert.equal(topScores[0].name, 'Fastest');
  assert.equal(topScores[0].difficulty, 'hard');
  assert.equal(topScores[9].name, 'Player 2');
  const persisted = createLeaderboard(JSON.stringify({
    version: 1,
    scores: topScores
  })).leaderboard.loadScores();
  assert.equal(persisted.length, 10);
  assert.equal(persisted[0].name, 'Fastest');

  const tied = createLeaderboard().leaderboard;
  tied.recordScore(score('Beta', 1000, 20));
  const ordered = tied.recordScore(score('Alpha', 1000, 10));
  assert.equal(
    JSON.stringify(Array.from(ordered.slice(0, 2), (entry) => entry.name)),
    '["Alpha","Beta"]'
  );

  const sameCompletionTime = createLeaderboard().leaderboard;
  sameCompletionTime.recordScore(score('Zed', 1000, 10));
  const alphabetical = sameCompletionTime.recordScore(score('Ada', 1000, 10));
  assert.equal(alphabetical[0].name, 'Ada');
});

test('blank and invalid names are safely replaced before storage', () => {
  const {leaderboard} = createLeaderboard();
  const blankName = leaderboard.recordScore(score('  \n ', 1000, 1));
  const invalidName = leaderboard.recordScore(score(null, 2000, 2));

  assert.equal(blankName[0].name, 'Anonymous');
  assert.equal(invalidName[0].name, 'Anonymous');
});

test('elapsed time formatting is stable at minute boundaries', () => {
  const {leaderboard} = createLeaderboard();
  assert.equal(leaderboard.formatTime(59999), '00:59');
  assert.equal(leaderboard.formatTime(60000), '01:00');
});