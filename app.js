/*===========================CONSTANTS=======================*/

const players = ["White", "Black"];
const pieceTypes = ["Regular", "King"];
const boardValues = [];
const possibleMoveIndices = [];
const possibleJumps = {};
const boardCells = document.querySelectorAll("div.game > div.cell");
const msgCell = document.querySelector("#message");

/*===========================VARIABLES=======================*/

const state = {
  // boardValues,
  // boardCells,
  // turn,
  // winner,
  // isTie,
  // isJumping,
  // forcedCaptures,
  // selectedPieceIndex,
  // possibleMoveIndices,
  // possibleJumps,
  // players,
  // pieceTypes,
};

/*===========================GRID HELPER FUNCTIONS=======================*/

function getRowIndex(cellId) {
  return Math.floor(cellId / 8);
}

function getColIndex(cellId) {
  const rowIdx = getRowIndex(cellId);
  const rowStartIdx = rowIdx * 8;
  // console.log(`
  //   Cell ${cellId} is in row ${rowIdx} which starts at ${rowStartIdx} and ends at ${rowEndIdx}
  //   `);
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
  return (
    (state.turn === players[0] && rowIndex === 7) ||
    (state.turn === players[1] && rowIndex === 0)
  );
}

function isOnBoard(idx) {
  return idx >= 0 && idx <= 7;
}

//add backwards king functionality later
function getValidMoveRows(state, cellId) {
  const rowIndex = getRowIndex(cellId);
  const cellValue = state.boardValues[cellId];
  const [player, pieceType] = cellValue.split("_");
  const [nextRowIdx, prevRowIdx] = [rowIndex + 1, rowIndex - 1];
  const idxs = [];
  // console.log(player, pieceType, rowIndex, nextRowIdx);
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
        return getCellIndex(rowIdx, colIdx); //[rowIdx, colIdx];
      });
    })
    .flat();
  return neighbors;
}

/*===========================INITIALIZATION=======================*/

function initialize(state) {
  state.winner = false;
  state.isTie = false;
  state.selectedPieceIndex = null;
  state.possibleMoveIndices = [];
  state.possibleJumps = {};
  state.legalMoves = [];
  state.boardValues = [];
  state.players = ["White", "Black"];
  state.pieceTypes = ["Regular", "King"];
  state.turn = state.players[0];
  state.isJumping = false;
  state.forcedCaptures = false;
  for (let i = 0; i < 64; i++) {
    // removePiece(state, i);
    const isCellEven = i % 2 === 0;
    const rowIndex = getRowIndex(i);
    const isRowEven = rowIndex % 2 === 0;
    const cell = boardCells[i];
    const isPlayer1 = rowIndex < 3;
    const isPlayer2 = rowIndex > 4;
    const isPiece =
      (isPlayer1 || isPlayer2) &&
      ((isRowEven && isCellEven) || (!isRowEven && !isCellEven));
    const isDark = (isRowEven && isCellEven) || (!isRowEven && !isCellEven);

    if (isPlayer1 && isPiece) {
      addPiece(state, i, players[0], "Regular");
    } else if (isPlayer2 && isPiece) {
      addPiece(state, i, players[1], "Regular");
    } else {
      removePiece(state, i);
    }

    if (isDark) {
      cell.classList.add("dark");
      // playableIndices.push(i);
    }
  }
  updateLegalMoves(state);
  render(state);
}

/*===========================RENDER=======================*/

function updateMessage(msg) {
  msgCell.textContent = msg;
}

function render(state) {
  console.log("Rendering...");
  boardCells.forEach((cell, index) => {
    const cellValue = state.boardValues[index];

    // check if cell has a piece
    // if so, update cell's classes to reflect this
    if (cellValue.startsWith(state.players[0])) {
      cell.classList.add("has-piece", state.players[0]);
      cell.classList.remove(state.players[1]);
      if (cellValue.endsWith(state.pieceTypes[1])) {
        cell.classList.add(state.pieceTypes[1]);
      }
    } else if (cellValue.startsWith(state.players[1])) {
      cell.classList.add("has-piece", state.players[1]);
      cell.classList.remove(state.players[0]);
      if (cellValue.endsWith(state.pieceTypes[1])) {
        cell.classList.add(state.pieceTypes[1]);
      }
    } else {
      cell.classList.remove(
        "has-piece",
        state.players[1],
        state.players[0],
        state.pieceTypes[1]
      );
    }

    // check if cell is selected
    // if so, update class to reflect this
    if (index === state.selectedPieceIndex) cell.classList.add("selected");
    else cell.classList.remove("selected");
    // check if cell is a possible mvoe
    // if so, update class to reflect this
    if (
      state.possibleMoveIndices.includes(index) ||
      index in state.possibleJumps
    )
      cell.classList.add("possible-move");
    else cell.classList.remove("possible-move");

    //check if cell is king and change to reflect
    if (cellValue.includes("King")) {
      cell.classList.add("King");
    } else {
      cell.classList.remove("King");
    }
  });

  if (state.winner)
    updateMessage(
      `Congratulations, player ${state.winner}! Hit reset to play again.`
    );
  else updateMessage(`It is player ${state.turn}'s turn`);
}

/*===========================LOGIC=======================*/
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
  // if (isInLastRow(index)) {
  state.boardValues[index] = state.boardValues[index].replace(
    "Regular",
    "King"
  );
  // boardCells[index].querySelector("div").textContent = "King";
  // }
}

function movePiece(state, fromIdx, toIdx) {
  console.log(`Moving ${fromIdx} to ${toIdx}`);
  const [player, pieceType] = removePiece(state, fromIdx).split("_");
  addPiece(state, toIdx, player, pieceType);
  if (isInLastRow(state, toIdx)) {
    console.log(`Piece is in last row; making king`);
    crownPiece(state, toIdx);
  }
}

function basicMove(state, fromIdx, toIdx) {
  console.log(`Called basicMove(${fromIdx}, ${toIdx})`);
  movePiece(state, fromIdx, toIdx);
  switchPlayerTurn(state);
  unselectPiece(state);
  checkForWinner(state);
  checkForTie(state);
}

function jumpMove(state, move) {
  console.log(`Called jumpMove(${move.from}, ${move.to})`);
  state.isJumping = true;
  movePiece(state, move.from, move.to);
  move.captures.forEach((captureIdx) => removePiece(state, captureIdx));
  updateLegalMoves(state, move.to);

  if (state.legalMoves.length > 0) {
    state.selectedPieceIndex = move.to;
    state.possibleMoveIndices = [];
    state.possibleJumps = {};
    state.legalMoves.forEach((jumpMove) => {
      state.possibleJumps[jumpMove.to] = jumpMove;
    });
    return;
  }

  state.isJumping = false;
  switchPlayerTurn(state);
  unselectPiece(state);
  checkForWinner(state);
  checkForTie(state);
}

function updateLegalMoves(state, activeCellIdx = null) {
  const player = state.turn;
  const moves = [];
  const cellIndices =
    activeCellIdx === null
      ? state.boardValues.map((val, idx) => idx)
      : [activeCellIdx];
  for (const cellIndex of cellIndices) {
    const cellValue = state.boardValues[cellIndex];
    if (!cellValue.includes(player)) continue;

    const validNeighbors = getValidNeighbors(state, cellIndex);
    const [row, col] = [getRowIndex(cellIndex), getColIndex(cellIndex)];

    for (const neighbor of validNeighbors) {
      if (isCellEmpty(state, neighbor)) {
        moves.push({
          from: cellIndex,
          to: neighbor,
          captures: [],
          type: "regular",
        });
      } else if (isCellEnemy(state, neighbor)) {
        const [landingRow, landingCol] = [
          getRowIndex(neighbor),
          getColIndex(neighbor),
        ];
        const [rowDiff, colDiff] = [landingRow - row, landingCol - col];
        const jumpCoords = [row + rowDiff * 2, col + colDiff * 2];
        const jumpToId = getCellIndex(...jumpCoords);
        if (isCellEmpty(state, jumpToId)) {
          moves.push({
            from: cellIndex,
            to: jumpToId,
            captures: [neighbor],
            type: "jump",
          });
        }
      }
    }
  }
  const hasJump = moves.some((move) => move.type === "jump");
  const { isJumping, forcedCaptures } = state;
  // If we're forcing captures and there is a jump available
  // Then return only moves of type jump
  console.log(`We're jumping: current piece ${state.selectedPieceIndex}`);
  if (isJumping || (forcedCaptures && hasJump)) {
    state.legalMoves = moves.filter((move) => move.type === "jump");
  }
  // Otherwise, return all moves found
  else {
    state.legalMoves = moves;
  }
}

/*
  selectPiece(cellIndex):
  Changes the data store's selected piece index to reflect piece clicked 
*/
function selectPiece(state, cellIndex) {
  console.log(`Selecting piece ${cellIndex}...`);
  state.selectedPieceIndex = cellIndex;
  state.possibleMoveIndices = state.legalMoves
    .filter((m) => m.type === "regular" && m.from === cellIndex)
    .map((m) => m.to);

  state.possibleJumps = {};
  state.legalMoves
    .filter((m) => m.type === "jump" && m.from === cellIndex)
    .forEach((move) => {
      state.possibleJumps[move.to] = move;
    });
}

function unselectPiece(state) {
  state.selectedPieceIndex = null;
  state.possibleMoveIndices = [];
  state.possibleJumps = {};
  // state.legalMoves = [];
}

function checkForWinner(state) {
  const boardString = state.boardValues.join(" ");
  if (!boardString.includes(state.players[0])) {
    state.winner = state.players[1];
  } else if (!boardString.includes(state.players[1])) {
    state.winner = state.players[0];
  }
  console.log(`Checking for winner....${state.winner}`);
}

function checkForTie(state) {}

function switchPlayerTurn(state) {
  state.turn =
    state.turn === state.players[0] ? state.players[1] : state.players[0];
  updateLegalMoves(state);
}

initialize(state);

/*===========================EVENT LISTENERS=======================*/

function handleClick(event) {
  if (state.winner) return;
  const el = event.currentTarget;
  const cellIndex = el.id * 1;
  const cell = boardCells[cellIndex];
  const isPiece = hasPiece(state, cellIndex);
  const cellValue = state.boardValues[cellIndex];
  const isTurn = cellValue && state.turn === cellValue.split("_")[0];

  console.log(`Board clicked at cell ${cellIndex}.
     isPiece: ${isPiece}
     cellValue: ${cellValue}`);
  if (isPiece && isTurn) {
    unselectPiece(state);
    selectPiece(state, cellIndex);
  } else {
    // Find the move object that matches this click
    const selectedMove = state.legalMoves.find(
      (m) => m.from === state.selectedPieceIndex && m.to === cellIndex
    );

    if (selectedMove) {
      if (selectedMove.type === "regular") {
        console.log(
          `Regular move from ${selectedMove.from} to ${selectedMove.to}`
        );
        basicMove(state, selectedMove.from, selectedMove.to);
      } else if (selectedMove.type === "jump") {
        console.log(
          `Jump from ${selectedMove.from} to ${selectedMove.to}, capturing ${selectedMove.captures}`
        );
        jumpMove(state, selectedMove);
      }
    }
  }
  render(state);
}

document.querySelectorAll("#game div.cell").forEach((cell) => {
  cell.addEventListener("click", handleClick);
});

document
  .querySelector("#reset")
  .addEventListener("click", () => initialize(state));

/*=================TEST FUNCTIONS======*/

function clearPlayerPieces(state, playerIdx = 0) {
  state.boardValues.forEach((val, i) => {
    if (val.includes(state.players[playerIdx])) state.boardValues[i] = "";
  });
  checkForWinner(state);
  checkForTie(state);
  render(state);
}

/*==================UPGRADE TO RECURSIVE DFS THAT UNTANGLES GAME STATE LOGIC FROM UI*=============================*/

/* 
 generateTurnMoves(state)

  Has to compute all full turn moves for the player to move, independent of piece
  UI can then disregard possibleMoveIndices, possibleJumps and simply filter the moves returned by this method to those that start at the index of the cell that was clicked

  Given {boardValues, turn}, return a list of possible move objects:
   [{
      from: starting index,
      path: [start, ..., end],
      captures: [] for simple moves, [idx1, idx2, ....] for jump sequences,
      type: "simple" or "jump"
   }]
 */
// function generateJumpSequences(
//   state,
//   pos = null,
//   path = null,
//   captures = null
// ) {
//   const { boardValues, turn } = state;
//   const moves = [];

//   // SEED
//   if (pos === null) {
//     for (let i = 0; i < boardValues.length; i++) {
//       moves.push(
//         ...generateJumpSequences(
//           state,
//           (pos = i),
//           (path = [i]),
//           (captures = [])
//         )
//       );
//     }
//     return moves;
//   }

//   return moves;
// }

// Returns list of possible single jumps from square at index pos

function generateSingleJumps(state, pos) {
  const { boardValues, turn } = state;
  const moves = [];
  console.log(pos, boardValues[pos]);
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
    // console.log(jumpCoords);
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

// Returns a list of modified 

function generateContinuationJumps(state, move) {
  const stateClone = structuredClone(state);
  const curPos = move.path[move.path.length - 1];
  const lastPos = move.path[move.path.length - 2];
  stateClone.boardValues[curPos] = stateClone.boardValues[lastPos];
  stateClone.boardValues[lastPos] = "";
  move.captures.forEach((cell) => (stateClone.boardValues[cell] = ""));
  const continuationJumps = generateSingleJumps(stateClone, curPos);
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
// Pseudocode for DFS:

// jumpDFS(state, move, results):
//   continuations = generateContinuationJumps(state, move)

//   if continuations is empty:
//     // no further jumps possible from the landing square
//     add move to results
//     return

//   for each nextMove in continuations:
//     jumpDFS(state, nextMove, results)

function jumpDFS(state, pos, path, captures) {}
