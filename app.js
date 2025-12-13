// const { cloneElement } = require("react");

/*===========================CONSTANTS=======================*/

const players = ["White", "Black"];
const pieceTypes = ["Regular", "King"];
const boardValues = [];
const boardCells = document.querySelectorAll("div.game > div.cell");

/*===========================VARIABLES=======================*/
let turn = players[0];
let selectedPiece = null;
let isWinner = false;
let isTie = false;

const state = { boardValues, boardCells, isWinner, isTie };

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
  return rowIndex * 8 + colIndex;
}

function getCellValue(cellIndex) {
  return boardValues[cellIndex];
}

function isCellEmpty(cellIndex) {
  return getCellValue(cellIndex) === "";
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
  const idxs = [rowIndex + 1, rowIndex - 1].filter(filterIndex);
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
  const cellValue = boardValues[cellId];
  const [player, pieceType] = cellValue.split("_");
  const adjRows = getAdjacentRows(cellId, player);
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

function render() {
  boardCells.forEach((cell, index) => {
    const cellValue = boardValues[index];
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
  });
}

/*===========================GAME LOGIC=======================*/
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
}

function hasDoubleJump(fromIdx) {}

function getLegalMoves(index) {
  const rowIndex = getRowIndex(index);
  const cell = boardCells[index];
}

function selectPiece(cellIndex) {
  if (selectedPiece !== null) {
    const selectedPieceElem = boardCells[selectedPiece];
    selectedPieceElem.classList.remove("selected");
    document.querySelectorAll("div.cell.possible-move").forEach((elem) => {
      elem.classList.remove("possible-move");
    });
  }
  selectedPiece = cellIndex;
  const selectedPieceElem = boardCells[selectedPiece];
  selectedPieceElem.classList.add("selected");

  const emptyNeighbors = getEmptyDiagonalNeighbors(cellIndex);
  emptyNeighbors.forEach((cellIndex) => {
    boardCells[cellIndex].classList.add("possible-move");
  });
}

function checkForWinner() {}

function checkForTie() {}

function switchPlayerTurn() {}

initialize();

/*===========================EVENT LISTENERS=======================*/

function handlePieceClick(event) {
  const clickedElem = event.target;
  const cellIndex = clickedElem.parentNode.id * 1;
  const cell = boardCells[cellIndex];
  const isPiece = hasPiece(cellIndex);
  const cellValue = boardValues[cellIndex];
  const isTurn = turn === cellValue.split("_")[0];
  const adjRows = getAdjacentRows(cellIndex);
  const adjCols = getAdjacentCols(cellIndex);
  const neighbors = getDiagonalNeighbors(cellIndex);
  const emptyNeighbors = getEmptyDiagonalNeighbors(cellIndex);
  if (isPiece && isTurn) {
    selectPiece(cellIndex);
  }

  console.log(
    `Clicked ${cellIndex}
    Has piece: ${isPiece}
    Cell value: ${cellValue}
    Is player's turn: ${isTurn}
    Adj Rows: ${adjRows}
    Adj Cols: ${adjCols}
    Neighboring Cells: ${neighbors}
    Empty Diagonal Neighbors: ${emptyNeighbors}
    `
  );

  checkForWinner();
  checkForTie();
  switchPlayerTurn();
  render();
}

document.querySelectorAll("#game div.cell > div").forEach((cell) => {
  cell.addEventListener("click", handlePieceClick);
});
