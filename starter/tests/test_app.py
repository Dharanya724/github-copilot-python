import pytest

import sudoku_logic
from app import CURRENT, app


@pytest.fixture()
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index_route_renders_main_page(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Sudoku Game" in response.data
    assert b'id="theme-toggle"' in response.data
    assert b'aria-pressed="false">Dark mode: Off</button>' in response.data


def test_new_game_route_returns_puzzle(client):
    response = client.get("/new?clues=35")

    assert response.status_code == 200
    data = response.get_json()
    assert "puzzle" in data
    assert "solution" not in data

    puzzle = data["puzzle"]
    assert len(puzzle) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert any(cell == sudoku_logic.EMPTY for row in puzzle for cell in row)
    assert sum(cell != sudoku_logic.EMPTY for row in puzzle for cell in row) == 35
    assert CURRENT["puzzle"] == puzzle
    assert CURRENT["solution"] is not None


@pytest.mark.parametrize(
    ("difficulty", "expected_clues"),
    [("easy", 40), ("medium", 35), ("hard", 30)],
)
def test_new_game_route_generates_unique_puzzle_for_each_difficulty(
    client, difficulty, expected_clues
):
    response = client.get(f"/new?difficulty={difficulty}")

    assert response.status_code == 200
    puzzle = response.get_json()["puzzle"]
    filled_cells = sum(
        cell != sudoku_logic.EMPTY for row in puzzle for cell in row
    )
    assert filled_cells == expected_clues
    assert sudoku_logic.count_solutions(puzzle) == 1


def test_new_game_route_rejects_unknown_difficulty(client):
    response = client.get("/new?difficulty=expert")

    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid difficulty"}


def test_check_route_marks_correct_and_incorrect_boards(client):
    client.get("/new?clues=35")
    solution = CURRENT["solution"]

    correct_response = client.post("/check", json={"board": solution})
    assert correct_response.status_code == 200
    assert correct_response.get_json() == {"incorrect": []}

    wrong_board = [row[:] for row in solution]
    wrong_board[0][0] = 2 if solution[0][0] != 2 else 3
    wrong_response = client.post("/check", json={"board": wrong_board})
    assert wrong_response.status_code == 200
    wrong_data = wrong_response.get_json()
    assert [0, 0] in wrong_data["incorrect"]


def test_check_route_without_game_returns_error(client):
    CURRENT["solution"] = None

    response = client.post("/check", json={"board": [[0] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]})

    assert response.status_code == 400
    assert response.get_json() == {"error": "No game in progress"}


def test_hint_route_returns_one_correct_value_for_an_empty_cell(client):
    puzzle = client.get("/new?clues=35").get_json()["puzzle"]
    board = [row[:] for row in puzzle]
    empty_before = sum(cell == sudoku_logic.EMPTY for row in board for cell in row)

    response = client.post("/hint", json={"board": board})

    assert response.status_code == 200
    hint = response.get_json()
    row, col = hint["row"], hint["col"]
    assert board[row][col] == sudoku_logic.EMPTY
    assert hint["value"] == CURRENT["solution"][row][col]
    board[row][col] = hint["value"]
    assert sum(cell == sudoku_logic.EMPTY for line in board for cell in line) == empty_before - 1


def test_hint_route_rejects_a_board_without_empty_cells(client):
    client.get("/new?clues=35")
    complete_board = [row[:] for row in CURRENT["solution"]]

    response = client.post("/hint", json={"board": complete_board})

    assert response.status_code == 400
    assert response.get_json() == {"error": "No empty cells available"}
