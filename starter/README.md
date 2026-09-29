## Project Structure

- `app.py` defines the Flask page and JSON routes. It keeps the active puzzle, its solution, and hinted-cell state in process memory.
- `sudoku_logic.py` provides Sudoku board helpers and generates puzzles, accepting a puzzle only when it has exactly one solution.
- `static/main.js` creates and updates the board, calls the Flask routes for validation, checking, and hints, and manages the timer and theme preference.
- `static/leaderboard.js` validates, sorts, and stores the top scores in browser local storage, and formats elapsed time.
- `tests/` contains pytest coverage for Sudoku logic and Flask routes, plus Node.js tests for leaderboard and theme behavior.

## Error Handling

- Flask routes return a JSON error and HTTP 400 for cases such as an unknown difficulty (`/new`), an invalid or locked cell (`/validate`), or an invalid board / no available empty cell (`/hint`). `/check` returns an error when no game is in progress.
- The client keeps the current cell styling if `/validate` cannot be reached.
- Theme and leaderboard storage failures are caught so unavailable browser storage does not prevent the game from running; scores load as an empty list when stored data cannot be read or parsed.

## Testing

Run the Python test suite with:

```bash
python -m pytest
```

It covers Sudoku helpers and puzzle generation, including uniqueness, as well as Flask routes and their responses.

Run the JavaScript tests with Node.js's built-in test runner:

```bash
node --test tests/test_leaderboard.js tests/test_theme.js
```

These tests cover leaderboard storage, validation, ordering, and time formatting, along with theme preference persistence and fallback behavior. Run both commands when verifying changes to the corresponding logic or features.
