/*===========================CONSTANTS=======================*/

const players = ["White", "Black"];
const pieceTypes = ["Regular", "King"];
const boardValues = [];
const possibleMoveIndices = [];
const possibleJumps = {};
const boardCells = document.querySelectorAll("div.game > div.cell");
const msgCell = document.querySelector("#message");

/*===========================VARIABLES=======================*/
let turn = players[0];
let selectedPieceIndex = null;
let winner = false;
let isTie = false;
let isJumping = false;
let forcedCaptures = false;

const state = {
  boardValues,
  boardCells,
  winner,
  isTie,
  isJumping,
  forcedCaptures,
  selectedPieceIndex,
  possibleMoveIndices,
  possibleJumps,
};

/*===========================GRID HELPER FUNCTIONS=======================*/

function getRowIndex(cellId) {
  return Math.floor(cellId / 8);
}

function getColIndex(cellId) {
  const rowIdx = getRowIndex(cellId);
  const rowStartIdx = rowIdx * 8;
  const rowEndIdx = rowStartIdx + 7;
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

function getCellValue(cellIndex) {
  return boardValues[cellIndex];
}

function isCellEmpty(cellIndex) {
  return getCellValue(cellIndex) === "";
}

function isCellEnemy(cellIndex) {
  if (cellIndex === false) return false;
  const cellVal = getCellValue(cellIndex);
  if (cellVal === "") return false;
  return cellVal.split("_")[0] !== turn;
}

function isInLastRow(cellId) {
  const rowIndex = getRowIndex(cellId);
  return (
    (turn === players[0] && rowIndex === 7) ||
    (turn === players[1] && rowIndex === 0)
  );
}

//add backwards king functionality later
function getAdjacentRows(cellId) {
  const rowIndex = getRowIndex(cellId);
  const cellValue = boardValues[cellId];
  const [player, pieceType] = cellValue.split("_");
  const [nextRowIdx, prevRowIdx] = [rowIndex + 1, rowIndex - 1];
  const idxs = [];
  if (pieceType === "King") {
    if (nextRowIdx <= 7) idxs.push(nextRowIdx);
    if (prevRowIdx >= 0) idxs.push(prevRowIdx);
  } else if (turn === players[0] && nextRowIdx <= 7) {
    idxs.push(nextRowIdx);
  } else if (turn === players[1] && prevRowIdx >= 0) {
    idxs.push(prevRowIdx);
  }
  return idxs;
}

function filterIndex(idx) {
  return idx >= 0 && idx <= 7;
}

function getAdjacentCols(cellId) {
  const colIndex = getColIndex(cellId);
  return [colIndex + 1, colIndex - 1].filter(filterIndex);
}

function getDiagonalNeighbors(cellId) {
  const adjRows = getAdjacentRows(cellId);
  const adjCols = getAdjacentCols(cellId);
  const neighbors = adjRows
    .map((rowIdx) => {
      return adjCols.map((colIdx) => {
        return getCellIndex(rowIdx, colIdx); //[rowIdx, colIdx];
      });
    })
    .flat();
  return neighbors;
}

function getEmptyDiagonalNeighbors(cellId) {
  const neighbors = getDiagonalNeighbors(cellId);
  return neighbors.filter(isCellEmpty);
}
/*===========================INITIALIZATION=======================*/

function initialize() {
  let columnIndex = 0;
  winner = false;
  isTie = false;
  selectedPieceIndex = null;
  possibleMoveIndices.splice(0, possibleMoveIndices.length);
  clearPossibleJumps();
  for (let i = 0; i < 64; i++) {
    removePiece(i);
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
      addPiece(i, players[0], "Regular");
    } else if (isPlayer2 && isPiece) {
      addPiece(i, players[1], "Regular");
    } else {
      removePiece(i);
    }

    if (isDark) {
      cell.classList.add("dark");
      // playableIndices.push(i);
    }
  }
  render();
}

/*===========================RENDER=======================*/

function updateMessage(msg) {
  msgCell.textContent = msg;
}

function render() {
  console.log("Rendering...");
  boardCells.forEach((cell, index) => {
    const cellValue = boardValues[index];

    // check if cell has a piece
    // if so, update cell's classes to reflect this
    if (cellValue.startsWith(players[0])) {
      cell.classList.add("has-piece", players[0]);
      cell.classList.remove(players[1]);
      if (cellValue.endsWith(pieceTypes[1])) {
        cell.classList.add(pieceTypes[1]);
      }
    } else if (cellValue.startsWith(players[1])) {
      cell.classList.add("has-piece", players[1]);
      cell.classList.remove(players[0]);
      if (cellValue.endsWith(pieceTypes[1])) {
        cell.classList.add(pieceTypes[1]);
      }
    } else {
      cell.classList.remove("has-piece", players[1], players[0], pieceTypes[1]);
    }

    // check if cell is selected
    // if so, update class to reflect this
    if (index === selectedPieceIndex) cell.classList.add("selected");
    else cell.classList.remove("selected");
    // check if cell is a possible mvoe
    // if so, update class to reflect this
    if (possibleMoveIndices.includes(index) || index in possibleJumps)
      cell.classList.add("possible-move");
    else cell.classList.remove("possible-move");

    //check if cell is king and change to reflect
    if (cellValue.includes("King")) {
      cell.classList.add("King");
    } else {
      cell.classList.remove("King");
    }
  });

  // updateSelected();
  if (winner)
    updateMessage(
      `Congratulations, player ${winner}! Hit reset to play again.`
    );
  else updateMessage(`It is player ${turn}'s turn`);
}

/*===========================LOGIC=======================*/
function addPiece(index, player, pieceType) {
  boardValues[index] = `${player}_${pieceType}`;
}

function hasPiece(index) {
  return boardValues[index] !== "";
}

function removePiece(index) {
  const pieceValue = boardValues[index];
  boardValues[index] = "";
  return pieceValue;
}

function crownPiece(index) {
  // if (isInLastRow(index)) {
  boardValues[index] = boardValues[index].replace("Regular", "King");
  // boardCells[index].querySelector("div").textContent = "King";
  // }
}

function movePiece(fromIdx, toIdx) {
  console.log(`Moving ${fromIdx} to ${toIdx}`);
  const [player, pieceType] = removePiece(fromIdx).split("_");
  addPiece(toIdx, player, pieceType);
  if (isInLastRow(toIdx)) {
    console.log(`Piece is in last row; making king`);
    crownPiece(toIdx);
  }
  // switchPlayerTurn();
  // unselectPiece();
}

function basicMove(fromIdx, toIdx) {
  console.log(`Called basicMove(${fromIdx}, ${toIdx})`);
  movePiece(fromIdx, toIdx);
  switchPlayerTurn();
  unselectPiece();
  checkForWinner();
  checkForTie();
}

function jumpMove(jump) {
  console.log(`Called jumpMove(${jump.originId}, ${jump.jumpToId})`);
  isJumping = true;

  movePiece(jump.originId, jump.jumpToId);
  removePiece(jump.captureCellId);
  unselectPiece();
  selectPiece(jump.jumpToId);
  // selectPiece(jump.jumpToid);

  // Before resolving the jump and switching player turn, let's check if there are any other jumps available

  if (Object.keys(possibleJumps).length !== 0) return;
  isJumping = false;
  switchPlayerTurn();
  unselectPiece();
  clearPossibleJumps();
  checkForWinner();
  checkForTie();
}

function hasDoubleJump(fromIdx) {}

function getJumpMoves(index) {
  const neighbors = getDiagonalNeighbors(index);
  const originCoords = [getRowIndex(index), getColIndex(index)];
  const [rowIdx, colIdx] = originCoords;
  const originId = index;
  const jumps = neighbors
    .map((captureCellId) => {
      const [neighborRowIdx, neighborColIdx] = [
        getRowIndex(captureCellId),
        getColIndex(captureCellId),
      ];
      const [rowDiff, colDiff] = [
        neighborRowIdx - rowIdx,
        neighborColIdx - colIdx,
      ];
      const jumpCoords = [rowIdx + rowDiff * 2, colIdx + colDiff * 2];
      const jumpToId = getCellIndex(...jumpCoords);
      // console.log(rowDiff, colDiff);
      return {
        originId,
        originCoords,
        jumpCoords,
        captureCellId,
        jumpToId,
      };
    })
    .filter((jump) => {
      return (
        isCellEnemy(jump.captureCellId) &&
        jump.jumpToId !== false &&
        isCellEmpty(jump.jumpToId)
      );
    });
  clearPossibleJumps();
  jumps.forEach((jump) => {
    possibleJumps[jump.jumpToId] = jump;
  });
}

// Needs integration with getEmptyDiagonalNeighbors + later with jumps and double-jumps
function getLegalMoves(cellIndex) {
  const rowIndex = getRowIndex(cellIndex);
  const cell = boardCells[cellIndex];
  getJumpMoves(cellIndex);
  if (Object.keys(possibleJumps).length !== 0 && forcedCaptures)
    isJumping = true;

  if (!isJumping) {
    const emptyNeighbors = getEmptyDiagonalNeighbors(cellIndex);
    possibleMoveIndices.splice(
      0,
      possibleMoveIndices.length,
      ...emptyNeighbors
    );
  }
  //possibleJumps.splice(0, possibleJumps.length, ...jumpMoves);
  //possibleMoveIndices.push(...possibleJumps.map((jump) => jump.jumpToId));
}

/*
  selectPiece(cellIndex):
  Changes the data store's selected piece index to reflect piece clicked 
*/
function selectPiece(cellIndex) {
  selectedPieceIndex = cellIndex;
  // const emptyNeighbors = getEmptyDiagonalNeighbors(cellIndex);
  // possibleMoveIndices.splice(0, possibleMoveIndices.length, ...emptyNeighbors);
  getLegalMoves(cellIndex);
}

function clearPossibleJumps() {
  console.log(`Clearing possible jumps...`);
  Object.keys(possibleJumps).forEach((key) => delete possibleJumps[key]);
}

function unselectPiece() {
  selectedPieceIndex = null;
  possibleMoveIndices.length = 0;
  // clearPossibleJumps();
}

function checkForWinner() {
  const boardString = boardValues.join(" ");
  if (!boardString.includes(players[0])) {
    winner = players[1];
  } else if (!boardString.includes(players[1])) {
    winner = players[0];
  }
  console.log(`Checking for winner....${winner}`);
}

function checkForTie() {}

function switchPlayerTurn() {
  turn = turn === players[0] ? players[1] : players[0];
}

initialize();

/*===========================EVENT LISTENERS=======================*/

function handleClick(event) {
  if (winner) return;
  const el = event.currentTarget;
  const cellIndex = el.id * 1;
  const cell = boardCells[cellIndex];
  const isPiece = hasPiece(cellIndex);
  const cellValue = boardValues[cellIndex];
  const isTurn = cellValue && turn === cellValue.split("_")[0];

  console.log(`Board clicked at cell ${cellIndex}.
     isPiece: ${isPiece}
     cellValue: ${cellValue}`);
  if (isPiece && isTurn) {
    unselectPiece();
    selectPiece(cellIndex);
  } else if (possibleMoveIndices.includes(cellIndex)) {
    console.log(
      `Clicked in empty square ${cellIndex}; moving ${selectedPieceIndex} to ${cellIndex}`
    );
    basicMove(selectedPieceIndex, cellIndex);
  } else if (cellIndex in possibleJumps) {
    const jump = possibleJumps[cellIndex];
    console.log(
      `Clicked in empty square ${cellIndex}; moving ${selectedPieceIndex} to ${cellIndex} and capturing ${jump.captureCellId}`
    );

    jumpMove(jump);
  }
  render();
}

document.querySelectorAll("#game div.cell").forEach((cell) => {
  cell.addEventListener("click", handleClick);
});

document.querySelector("#reset").addEventListener("click", initialize);

/*=================TEST FUNCTIONS======*/

function clearPlayerPieces(playerIdx = 0) {
  boardValues.forEach((val, i) => {
    if (val.includes(players[playerIdx])) boardValues[i] = "";
  });
  checkForWinner();
  checkForTie();
  render();
}
