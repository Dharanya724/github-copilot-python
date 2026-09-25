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


def test_new_game_route_returns_puzzle(client):
    response = client.get("/new?clues=35")

    assert response.status_code == 200
    data = response.get_json()
    assert "puzzle" in data

    puzzle = data["puzzle"]
    assert len(puzzle) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert any(cell == sudoku_logic.EMPTY for row in puzzle for cell in row)
    assert CURRENT["puzzle"] == puzzle
    assert CURRENT["solution"] is not None


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
