# Copilot Instructions - Flask Sudoku Project

## Project Goal

Build and refactor a Flask-based Sudoku game using modern, readable, maintainable Python, HTML, CSS, and JavaScript.

The application must support:

- Easy, Medium, and Hard difficulty levels
- Sudoku puzzles with exactly one unique solution
- Locked prefilled cells
- Immediate invalid-move feedback
- Check Puzzle functionality
- Hint functionality
- Completion detection
- Game timer
- Top 10 fastest scores
- Local storage persistence for scores
- Dark/light mode
- Responsive desktop and mobile layouts
- Alternating styling for the 3x3 Sudoku regions

## Code Quality

- Prefer clear, modular, reusable functions and components.
- Keep Sudoku logic separate from Flask route handling.
- Avoid unnecessary duplication.
- Use descriptive variable and function names.
- Keep functions focused on a single responsibility.
- Use modern Python features where they improve readability.
- Add useful comments for non-obvious logic.
- Include appropriate error handling.
- Do not introduce unnecessary dependencies.

## Sudoku Logic

- Generated puzzles must have exactly one valid solution.
- Validate puzzle generation programmatically.
- Keep the solution separate from the visible puzzle.
- Prefilled and hinted cells must be protected from user modification.
- Invalid user entries should provide immediate visual feedback.

## Frontend

- Keep HTML semantic and accessible.
- Use responsive CSS.
- Support both light and dark themes.
- Ensure text and controls remain readable in both themes.
- Use consistent styling for the 3x3 Sudoku regions.
- Avoid layout shifts when highlighting cells or displaying messages.
- Keep JavaScript modular and easy to understand.

## Testing

- Use pytest for Python testing.
- Run the test suite after every significant change.
- Do not modify existing behavior unnecessarily when refactoring.
- Add tests for important new functionality when practical.
- Never consider a feature complete until the relevant tests pass.

## Copilot Behavior

Before making major changes:

1. Inspect the existing implementation.
2. Explain the proposed approach.
3. Make focused changes rather than rewriting unrelated code.
4. Identify potential regressions.
5. Allow the developer to review and approve changes.

Do not silently remove existing functionality.

When there are multiple reasonable approaches, explain the tradeoffs briefly before implementing one.

## Project Workflow

Work incrementally:

1. Establish baseline tests.
2. Refactor the core Sudoku logic.
3. Add and test individual game features.
4. Improve the frontend.
5. Test the complete application.
6. Review the final implementation against the project requirements.