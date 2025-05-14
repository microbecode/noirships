import { useState } from 'react';
import './App.css';

// Customizable constants
const BOARD_SIZE = 10;
export const PLAYER_SHIP_TYPES = [3, 4]; // Allowed ship lengths for player's placement
export const ENEMY_SHIPS = [
  { startRow: 2, startCol: 3, orientation: 'horizontal', length: 3 },
  { startRow: 6, startCol: 7, orientation: 'vertical', length: 3 },
];
export const DUMMY_HIT_COORDS = [
  { row: 2, col: 4 },
  { row: 7, col: 7 },
];

type Cell = {
  hasShip: boolean;
  hit: boolean;
};

type Phase = 'placement' | 'battle';

const createEmptyBoard = (): Cell[][] =>
  Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ hasShip: false, hit: false })),
  );

// Place enemy ships on the board using customizable ENEMY_SHIPS
const placeEnemyShips = (board: Cell[][]): Cell[][] => {
  ENEMY_SHIPS.forEach(({ startRow, startCol, orientation, length }) => {
    if (orientation === 'horizontal') {
      for (let i = 0; i < length; i++) {
        board[startRow][startCol + i].hasShip = true;
      }
    } else if (orientation === 'vertical') {
      for (let i = 0; i < length; i++) {
        board[startRow + i][startCol].hasShip = true;
      }
    }
  });
  return board;
};

// Validate that the board has exactly two ships:
// one ship of length PLAYER_SHIP_TYPES[0] and one ship of length PLAYER_SHIP_TYPES[1],
// placed in a straight line.
const validateShips = (board: Cell[][]): boolean => {
  const visited = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(false),
  );
  const ships: number[] = [];

  const dfs = (i: number, j: number, cells: [number, number][]) => {
    visited[i][j] = true;
    cells.push([i, j]);
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [di, dj] of directions) {
      const ni = i + di,
        nj = j + dj;
      if (
        ni >= 0 &&
        ni < BOARD_SIZE &&
        nj >= 0 &&
        nj < BOARD_SIZE &&
        !visited[ni][nj] &&
        board[ni][nj].hasShip
      ) {
        dfs(ni, nj, cells);
      }
    }
  };

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j].hasShip && !visited[i][j]) {
        const cells: [number, number][] = [];
        dfs(i, j, cells);
        // Check if cells form a straight line
        const allInSameRow = cells.every(([x]) => x === cells[0][0]);
        const allInSameCol = cells.every(([, y]) => y === cells[0][1]);
        if (!(allInSameRow || allInSameCol)) {
          return false;
        }
        ships.push(cells.length);
      }
    }
  }

  ships.sort((a, b) => a - b);
  return (
    ships.length === PLAYER_SHIP_TYPES.length &&
    ships.every(
      (length, index) =>
        length === PLAYER_SHIP_TYPES.sort((a, b) => a - b)[index],
    )
  );
};

function App() {
  const [phase, setPhase] = useState<Phase>('placement');
  // Enemy board set up for battle phase
  const [enemyBoard, setEnemyBoard] = useState<Cell[][]>(() =>
    placeEnemyShips(createEmptyBoard()),
  );
  // My board is used also in placement phase (initially empty)
  const [myBoard, setMyBoard] = useState<Cell[][]>(createEmptyBoard());
  const [message, setMessage] = useState<string>('');

  // In placement phase, clicking toggles ship placement on your board.
  const handlePlacementClick = (row: number, col: number) => {
    setMyBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => r.map((cell) => ({ ...cell })));
      newBoard[row][col].hasShip = !newBoard[row][col].hasShip;
      return newBoard;
    });
  };

  // In battle phase, click enemy board to attack.
  const handleEnemyCellClick = (row: number, col: number) => {
    setEnemyBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => r.map((cell) => ({ ...cell })));
      const cell = newBoard[row][col];
      if (cell.hit) return prevBoard; // Skip if cell already clicked

      cell.hit = true;
      if (cell.hasShip) {
        setMessage(`Hit at (${row + 1}, ${col + 1})`);
      } else {
        setMessage(`Miss at (${row + 1}, ${col + 1})`);
      }
      return newBoard;
    });
  };

  // Start the battle phase after validating player's ship placement.
  const startBattle = () => {
    if (!validateShips(myBoard)) {
      setMessage(
        `Invalid ship placement. Place exactly two ships of lengths: ${PLAYER_SHIP_TYPES.join(
          ' and ',
        )}.`,
      );
      return;
    }
    // Simulate dummy enemy hits using DUMMY_HIT_COORDS.
    setMyBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => r.map((cell) => ({ ...cell })));
      DUMMY_HIT_COORDS.forEach(({ row, col }) => {
        if (newBoard[row][col].hasShip) newBoard[row][col].hit = true;
      });
      return newBoard;
    });
    setMessage('');
    setPhase('battle');
  };

  return (
    <div className="App">
      <h1>Battleships Game</h1>
      {message && <p>{message}</p>}
      {phase === 'placement' && (
        <div className="placement-phase">
          <h2>Place Your Ships</h2>
          <p>
            Place exactly {PLAYER_SHIP_TYPES.length} ships:
            <br />• One ship of length {PLAYER_SHIP_TYPES[0]}
            <br />• One ship of length {PLAYER_SHIP_TYPES[1]}
            <br />
            Click on cells to toggle a ship.
          </p>
          <div className="board">
            {myBoard.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`cell ${cell.hasShip ? 'ship' : ''}`}
                    onClick={() => handlePlacementClick(rowIndex, colIndex)}
                  >
                    {cell.hasShip ? 'S' : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button onClick={startBattle}>Start Battle</button>
        </div>
      )}
      {phase === 'battle' && (
        <div className="boards">
          <div className="board-section">
            <h2>Enemy Board</h2>
            <div className="board">
              {enemyBoard.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`cell ${
                        cell.hit ? (cell.hasShip ? 'hit' : 'miss') : ''
                      }`}
                      onClick={() => handleEnemyCellClick(rowIndex, colIndex)}
                    >
                      {cell.hit && cell.hasShip && 'X'}
                      {cell.hit && !cell.hasShip && 'O'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="board-section">
            <h2>My Board</h2>
            <div className="board">
              {myBoard.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`cell ${
                        cell.hit ? 'hit' : cell.hasShip ? 'ship' : ''
                      }`}
                    >
                      {cell.hasShip ? (cell.hit ? 'X' : 'S') : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
