// const { cloneElement } = require("react");

/*===========================CONSTANTS=======================*/

const players = ["White", "Black"];
const pieceTypes = ["Regular", "King"];
const boardValues = [];
const possibleMoveIndices = [];
const boardCells = document.querySelectorAll("div.game > div.cell");
const msgCell = document.querySelector("#message");

/*===========================VARIABLES=======================*/
let turn = players[0];
let selectedPieceIndex = null;
let isWinner = false;
let isTie = false;

const state = {
  boardValues,
  boardCells,
  isWinner,
  isTie,
  selectedPieceIndex,
  possibleMoveIndices,
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
    (turn === players[1] && rowIndex === 7)
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
  for (let i = 0; i < 64; i++) {
    // if((i+1)%8==0){
    //   columnIndex+=1;
    //   cellIndicesByColumn[columnIndex] = [i];
    // }
    // else {
    //   cellIndicesByColumn[columnIndex].push(i);
    // }

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

function updateCell(cellIndex) {
  const cellValue = boardValues[index];
}

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
      cell.classList.add("has-piece", "white");
      if (cellValue.endsWith("king")) {
        cell.classList.add("king");
      }
    } else if (cellValue.startsWith(players[1])) {
      cell.classList.add("has-piece", "black");
      if (cellValue.endsWith("king")) {
        cell.classList.add("king");
      }
    } else {
      cell.classList.remove("has-piece", "black", "white", "king");
    }

    // check if cell is selected
    // if so, update class to reflect this
    if (index === selectedPieceIndex) cell.classList.add("selected");
    else cell.classList.remove("selected");
    // check if cell is a possible mvoe
    // if so, update class to reflect this
    if (possibleMoveIndices.includes(index))
      cell.classList.add("possible-move");
    else cell.classList.remove("possible-move");
  });

  // updateSelected();
  updateMessage(`It is player ${turn}'s turn`);
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

function crownPiece(index) {}

function movePiece(fromIdx, toIdx) {
  const [player, pieceType] = removePiece(fromIdx).split("_");
  addPiece(toIdx, player, pieceType);
  switchPlayerTurn();
  unselectPiece();
}

function hasDoubleJump(fromIdx) {}

function getJumpMoves(index) {
  const neighbors = getDiagonalNeighbors(index);
  const originCoords = [getRowIndex(index), getColIndex(index)];
  const [rowIdx, colIdx] = originCoords;
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
  return jumps;
}

// Needs integration with getEmptyDiagonalNeighbors + later with jumps and double-jumps
function getLegalMoves(index) {
  const rowIndex = getRowIndex(index);
  const cell = boardCells[index];
  const simpleMoves = getEmptyDiagonalNeighbors(index);
  const jumpMoves = getJumpMoves(index);
}

/*
  selectPiece(cellIndex):
  Changes the data store's selected piece index to reflect piece clicked 
*/
function selectPiece(cellIndex) {
  selectedPieceIndex = cellIndex;
  const emptyNeighbors = getEmptyDiagonalNeighbors(cellIndex);
  possibleMoveIndices.splice(0, possibleMoveIndices.length, ...emptyNeighbors);
  getLegalMoves(cellIndex);
}

function unselectPiece() {
  selectedPieceIndex = null;
  possibleMoveIndices.length = 0;
}

function checkForWinner() {}

function checkForTie() {}

function switchPlayerTurn() {
  turn = turn === players[0] ? players[1] : players[0];
}

initialize();

/*===========================EVENT LISTENERS=======================*/

function handleClick(event) {
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
    console.log(`Clicked in possible move square ${cellIndex}`);
    movePiece(selectedPieceIndex, cellIndex);
  }

  checkForWinner();
  checkForTie();
  // updateSelected();
  render();
}

document.querySelectorAll("#game div.cell").forEach((cell) => {
  cell.addEventListener("click", handleClick);
});
