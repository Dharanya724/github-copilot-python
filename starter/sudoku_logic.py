import copy
import random

SIZE = 9
EMPTY = 0


def deep_copy(board):
    return copy.deepcopy(board)


def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board, row, col, num):
    if num == EMPTY:
        return False

    for x in range(SIZE):
        if x != col and board[row][x] == num:
            return False
        if x != row and board[x][col] == num:
            return False

    start_row = (row // 3) * 3
    start_col = (col // 3) * 3
    for i in range(start_row, start_row + 3):
        for j in range(start_col, start_col + 3):
            if (i != row or j != col) and board[i][j] == num:
                return False
    return True


def is_board_valid(board):
    for row in range(SIZE):
        for col in range(SIZE):
            value = board[row][col]
            if value == EMPTY:
                continue
            if not is_safe(board, row, col, value):
                return False
    return True


def find_empty_cell(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def count_solutions(board, limit=2):
    working_board = deep_copy(board)

    if not is_board_valid(working_board):
        return 0

    solutions = 0

    def backtrack():
        nonlocal solutions
        if solutions >= limit:
            return

        empty_cell = find_empty_cell(working_board)
        if empty_cell is None:
            solutions += 1
            return

        row, col = empty_cell
        for candidate in range(1, SIZE + 1):
            if not is_safe(working_board, row, col, candidate):
                continue
            working_board[row][col] = candidate
            backtrack()
            if solutions >= limit:
                working_board[row][col] = EMPTY
                return
            working_board[row][col] = EMPTY

    backtrack()
    return solutions


def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True


def remove_cells(board, clues):
    attempts = SIZE * SIZE - clues
    while attempts > 0:
        row = random.randrange(SIZE)
        col = random.randrange(SIZE)
        if board[row][col] != EMPTY:
            board[row][col] = EMPTY
            attempts -= 1


def generate_puzzle(clues=35):
    target_clues = max(1, min(int(clues), SIZE * SIZE))

    for _ in range(200):
        board = create_empty_board()
        if not fill_board(board):
            continue

        solution = deep_copy(board)
        puzzle = deep_copy(board)

        cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
        random.shuffle(cells)

        filled_count = SIZE * SIZE
        for row, col in cells:
            if filled_count <= target_clues:
                break
            current_value = puzzle[row][col]
            puzzle[row][col] = EMPTY
            if count_solutions(puzzle) != 1:
                puzzle[row][col] = current_value
                continue
            filled_count -= 1

        if count_solutions(puzzle) == 1:
            return puzzle, solution

    raise ValueError(f"Unable to generate a unique Sudoku puzzle with {target_clues} clues")
