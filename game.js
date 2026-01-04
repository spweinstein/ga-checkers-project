/*===========================CONSTANTS=======================*/

const players = ["White", "Black"];
const pieceTypes = ["Regular", "King"];

/*===========================ENGINE HELPERS (GRID + RULES)=======================*/

function getRowIndex(cellId) {
  return Math.floor(cellId / 8);
}

function getColIndex(cellId) {
  const rowIdx = getRowIndex(cellId);
  const rowStartIdx = rowIdx * 8;
  return cellId * 1 - rowStartIdx;
}

function getCellIndex(rowIndex, colIndex) {
  if (rowIndex > 7 || rowIndex < 0 || colIndex > 7 || colIndex < 0)
    return false;
  return rowIndex * 8 + colIndex;
}

function getCellValue(state, cellIndex) {
  return state.boardValues[cellIndex];
}

function isCellEmpty(state, cellIndex) {
  return getCellValue(state, cellIndex) === "";
}

function isCellEnemy(state, cellIndex) {
  if (cellIndex === false) return false;
  const cellVal = getCellValue(state, cellIndex);
  if (cellVal === "") return false;
  return cellVal.split("_")[0] !== state.turn;
}

function isInLastRow(state, cellId) {
  const rowIndex = getRowIndex(cellId);
  const player = getCellValue(state, cellId).split("_")[0];
  return (
    (player === players[0] && rowIndex === 7) ||
    (player === players[1] && rowIndex === 0)
  );
}

function isOnBoard(idx) {
  return idx >= 0 && idx <= 7;
}

function getValidMoveRows(state, cellId) {
  const rowIndex = getRowIndex(cellId);
  const cellValue = state.boardValues[cellId];
  const [player, pieceType] = cellValue.split("_");
  const [nextRowIdx, prevRowIdx] = [rowIndex + 1, rowIndex - 1];
  const idxs = [];
  if (pieceType === "King") {
    if (nextRowIdx <= 7) idxs.push(nextRowIdx);
    if (prevRowIdx >= 0) idxs.push(prevRowIdx);
  } else if (state.turn === players[0] && nextRowIdx <= 7) {
    idxs.push(nextRowIdx);
  } else if (state.turn === players[1] && prevRowIdx >= 0) {
    idxs.push(prevRowIdx);
  }
  return idxs;
}

function getValidMoveCols(state, cellId) {
  const colIndex = getColIndex(cellId);
  return [colIndex + 1, colIndex - 1].filter(isOnBoard);
}

function getValidNeighbors(state, cell) {
  const adjRows = getValidMoveRows(state, cell);
  const adjCols = getValidMoveCols(state, cell);
  const neighbors = adjRows
    .map((rowIdx) => {
      return adjCols.map((colIdx) => {
        return getCellIndex(rowIdx, colIdx);
      });
    })
    .flat();
  return neighbors;
}

/*===========================ENGINE CORE=======================*/

function addPiece(state, index, player, pieceType) {
  state.boardValues[index] = `${player}_${pieceType}`;
}

function hasPiece(state, index) {
  return state.boardValues[index] !== "";
}

function removePiece(state, index) {
  const pieceValue = state.boardValues[index];
  state.boardValues[index] = "";
  return pieceValue;
}

function crownPiece(state, index) {
  state.boardValues[index] = state.boardValues[index].replace(
    "Regular",
    "King"
  );
}

function movePiece(state, fromIdx, toIdx) {
  const [player, pieceType] = removePiece(state, fromIdx).split("_");
  addPiece(state, toIdx, player, pieceType);
  if (isInLastRow(state, toIdx)) {
    crownPiece(state, toIdx);
  }
}

function executeMove(state, ui, move, onMoveComplete) {
  // Apply full path
  const startPos = move.path[0];
  const endPos = move.path[move.path.length - 1];

  const [player, pieceType] = removePiece(state, startPos).split("_");
  addPiece(state, endPos, player, pieceType);

  // Remove all captures
  move.captures.forEach((idx) => removePiece(state, idx));

  // Crown if reached end
  if (isInLastRow(state, endPos)) {
    crownPiece(state, endPos);
  }

  // Clean up and switch turn
  switchPlayerTurn(state);
  onMoveComplete(state, ui);
  checkForWinner(state);
  checkForTie(state);
}

function checkForWinner(state) {
  const boardString = state.boardValues.join(" ");
  if (!boardString.includes(state.players[0])) {
    state.winner = state.players[1];
  } else if (!boardString.includes(state.players[1])) {
    state.winner = state.players[0];
  }
}

function checkForTie(state) {
  // If current player has pieces but no legal moves, it's a stalemate
  if (!state.winner && state.legalMoves.length === 0) {
    state.isTie = true;
  }
}

function switchPlayerTurn(state) {
  state.turn =
    state.turn === state.players[0] ? state.players[1] : state.players[0];
  state.legalMoves = generateAllLegalMoves(state);
}

// Apply a complete move to the state
// Takes the full path and all captures, returns new state
function applyMove(state, move) {
  const stateClone = structuredClone(state);
  const startPos = move.path[0];
  const endPos = move.path[move.path.length - 1];

  // Move the piece from start to end
  stateClone.boardValues[endPos] = stateClone.boardValues[startPos];
  if (endPos !== startPos) stateClone.boardValues[startPos] = "";

  // Remove all captured pieces
  move.captures.forEach((cell) => (stateClone.boardValues[cell] = ""));

  return stateClone;
}

// Returns list of possible single jumps from square at index pos
function findSingleJumps(state, pos) {
  const { boardValues, turn } = state;
  const moves = [];
  if (!boardValues[pos].startsWith(turn)) return moves;

  const neighbors = getValidNeighbors(state, pos);
  const [row, col] = [getRowIndex(pos), getColIndex(pos)];

  for (const neighbor of neighbors) {
    if (!isCellEnemy(state, neighbor)) continue;

    const [landingRow, landingCol] = [
      getRowIndex(neighbor),
      getColIndex(neighbor),
    ];
    const [rowDiff, colDiff] = [landingRow - row, landingCol - col];
    const jumpCoords = [row + rowDiff * 2, col + colDiff * 2];
    const jumpToId = getCellIndex(...jumpCoords);

    if (jumpToId !== false && isCellEmpty(state, jumpToId)) {
      moves.push({
        path: [pos, jumpToId],
        captures: [neighbor],
        type: "jump",
      });
    }
  }
  return moves;
}

// Returns continuation jumps from the current move
function findContinuationJumps(state, move) {
  const stateClone = applyMove(state, move);
  const curPos = move.path[move.path.length - 1];
  const continuationJumps = findSingleJumps(stateClone, curPos);

  return continuationJumps.map((continuationJump) => {
    return {
      path: [
        ...move.path,
        continuationJump.path[continuationJump.path.length - 1],
      ],
      captures: [
        ...move.captures,
        continuationJump.captures[continuationJump.captures.length - 1],
      ],
      type: "jump",
    };
  });
}

// DFS to find all complete jump sequences
function jumpDFS(state, move, results) {
  const continuations = findContinuationJumps(state, move);

  if (continuations.length === 0) {
    results.push(move);
    return results;
  }

  for (const nextMove of continuations) {
    jumpDFS(state, nextMove, results);
  }

  return results;
}

// Find all possible jump paths for the current player
function findAllJumpPaths(state) {
  const results = [];

  state.boardValues.forEach((cellValue, cellIndex) => {
    const jumps = findSingleJumps(state, cellIndex);
    jumps.forEach((jump) => {
      jumpDFS(state, jump, results);
    });
  });

  return results;
}

function generateAllLegalMoves(state) {
  const regularMoves = [];
  const jumpPaths = findAllJumpPaths(state);

  // Only generate regular moves if no jumps available (forced capture rule)
  if (jumpPaths.length === 0 || !state.forcedCaptures) {
    state.boardValues.forEach((cellValue, cellIndex) => {
      if (!cellValue.startsWith(state.turn)) return;

      const neighbors = getValidNeighbors(state, cellIndex);
      neighbors.forEach((neighbor) => {
        if (isCellEmpty(state, neighbor)) {
          regularMoves.push({
            path: [cellIndex, neighbor],
            captures: [],
            type: "regular",
          });
        }
      });
    });
  }

  // If forced captures and jumps exist, return only jumps
  if (state.forcedCaptures && jumpPaths.length > 0) {
    return jumpPaths;
  }

  return [...regularMoves, ...jumpPaths];
}

function initializeGame(state) {
  state.winner = false;
  state.isTie = false;
  state.legalMoves = [];
  state.boardValues = [];
  state.players = ["White", "Black"];
  state.pieceTypes = ["Regular", "King"];
  state.turn = state.players[0];
  state.isJumping = false;
  state.forcedCaptures = false;
  for (let i = 0; i < 64; i++) {
    const isCellEven = i % 2 === 0;
    const rowIndex = getRowIndex(i);
    const isRowEven = rowIndex % 2 === 0;
    const isPlayer1 = rowIndex < 3;
    const isPlayer2 = rowIndex > 4;
    const isPiece =
      (isPlayer1 || isPlayer2) &&
      ((isRowEven && isCellEven) || (!isRowEven && !isCellEven));

    if (isPlayer1 && isPiece) {
      addPiece(state, i, players[0], "Regular");
    } else if (isPlayer2 && isPiece) {
      addPiece(state, i, players[1], "Regular");
    } else {
      removePiece(state, i);
    }
  }
  state.legalMoves = generateAllLegalMoves(state);
}

export {
  getRowIndex,
  getColIndex,
  getCellIndex,
  getCellValue,
  isCellEmpty,
  isCellEnemy,
  isInLastRow,
  isOnBoard,
  getValidMoveRows,
  getValidMoveCols,
  getValidNeighbors,
  addPiece,
  hasPiece,
  removePiece,
  crownPiece,
  movePiece,
  executeMove,
  checkForWinner,
  checkForTie,
  switchPlayerTurn,
  applyMove,
  findSingleJumps,
  findContinuationJumps,
  jumpDFS,
  findAllJumpPaths,
  generateAllLegalMoves,
  initializeGame,
};
