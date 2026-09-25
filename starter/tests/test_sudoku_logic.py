import sudoku_logic


def test_create_empty_board_returns_9_by_9_zero_grid():
    board = sudoku_logic.create_empty_board()

    assert len(board) == sudoku_logic.SIZE == 9
    assert all(len(row) == sudoku_logic.SIZE for row in board)
    assert all(cell == sudoku_logic.EMPTY for row in board for cell in row)


def test_is_safe_detects_conflicts_in_row_column_and_box():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 5
    board[0][1] = 1
    board[1][0] = 2
    board[1][1] = 3
    board[2][2] = 4

    assert sudoku_logic.is_safe(board, 0, 2, 5) is False
    assert sudoku_logic.is_safe(board, 2, 0, 5) is False
    assert sudoku_logic.is_safe(board, 2, 2, 5) is False
    assert sudoku_logic.is_safe(board, 3, 3, 5) is True


def test_fill_board_solves_a_complete_valid_grid():
    board = sudoku_logic.create_empty_board()
    assert sudoku_logic.fill_board(board) is True
    assert all(cell != sudoku_logic.EMPTY for row in board for cell in row)
    for row in range(sudoku_logic.SIZE):
        assert sorted(board[row]) == list(range(1, sudoku_logic.SIZE + 1))


def test_generate_puzzle_returns_valid_board_and_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(clues=35)

    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert all(len(row) == sudoku_logic.SIZE for row in solution)
    assert any(cell == sudoku_logic.EMPTY for row in puzzle for cell in row)
    assert all(cell in range(1, sudoku_logic.SIZE + 1) for row in solution for cell in row)
