from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty')
    if difficulty is not None:
        difficulty = difficulty.lower()
        if difficulty not in sudoku_logic.DIFFICULTY_CLUES:
            return jsonify({'error': 'Invalid difficulty'}), 400
        clues = sudoku_logic.DIFFICULTY_CLUES[difficulty]
    else:
        clues = int(request.args.get('clues', 35))
    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    return jsonify({'puzzle': puzzle})

@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400
    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])
    return jsonify({'incorrect': incorrect})

@app.route('/hint', methods=['POST'])
def get_hint():
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    data = request.get_json(silent=True)
    board = data.get('board') if isinstance(data, dict) else None
    if (
        not isinstance(board, list)
        or len(board) != sudoku_logic.SIZE
        or any(not isinstance(row, list) or len(row) != sudoku_logic.SIZE for row in board)
        or any(
            type(value) is not int or value < sudoku_logic.EMPTY or value > sudoku_logic.SIZE
            for row in board
            for value in row
        )
    ):
        return jsonify({'error': 'Invalid board'}), 400

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if board[row][col] == sudoku_logic.EMPTY:
                return jsonify({'row': row, 'col': col, 'value': solution[row][col]})

    return jsonify({'error': 'No empty cells available'}), 400

if __name__ == '__main__':
    app.run(debug=True)