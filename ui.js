/*===========================UI IMPORTS=======================*/

import {
  getRowIndex,
  hasPiece,
  movePiece,
  removePiece,
  executeMove,
  checkForWinner,
  checkForTie,
  switchPlayerTurn,
} from "./game.js";

/*===========================UI CONSTANTS=======================*/

const boardCells = document.querySelectorAll("div.game > div.cell");
const msgCell = document.querySelector("#message");

/*===========================UI INITIALIZATION=======================*/

function initializeUI(state, ui) {
  ui.selectedPieceIndex = null;
  ui.possibleMoveIndices = [];
  ui.possibleJumps = {};
  ui.isCapturing = false;
  ui.capturePos = null;
  ui.captureStart = null;
  ui.captureCursor = 0;
  ui.activeJumpSequences = [];
  for (let i = 0; i < 64; i++) {
    const isCellEven = i % 2 === 0;
    const rowIndex = getRowIndex(i);
    const isRowEven = rowIndex % 2 === 0;
    const cell = boardCells[i];
    const isDark = (isRowEven && isCellEven) || (!isRowEven && !isCellEven);

    if (isDark) {
      cell.classList.add("dark");
      // playableIndices.push(i);
    }
  }
}

/*===========================UI RENDERING=======================*/

function updateMessage(msg) {
  msgCell.textContent = msg;
}

function render(state, ui) {
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
    if (index === ui.selectedPieceIndex) cell.classList.add("selected");
    else cell.classList.remove("selected");
    // check if cell is a possible move
    // if so, update class to reflect this
    if (ui.possibleMoveIndices.includes(index) || index in ui.possibleJumps)
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
  else if (state.isTie)
    updateMessage(
      `It's a tie! No legal moves available. Hit reset to play again.`
    );
  else updateMessage(`It is player ${state.turn}'s turn`);
}

/*===========================UI PIECE SELECTION=======================*/

// Updated to use dfs
function selectPiece(state, ui, cellIndex) {
  ui.selectedPieceIndex = cellIndex;

  // If in capture mode, only allow selecting the capturing piece
  if (ui.isCapturing) {
    if (cellIndex !== ui.capturePos) return;
    ui.possibleMoveIndices = [];
    ui.possibleJumps = {};

    // Build next-hop options from activeJumpSequences
    for (const seq of ui.activeJumpSequences) {
      if (seq.path.length > ui.captureCursor) {
        const nextLanding = seq.path[ui.captureCursor];
        if (!ui.possibleJumps[nextLanding]) {
          ui.possibleJumps[nextLanding] = [];
        }
        ui.possibleJumps[nextLanding].push(seq);
      }
    }

    // If no more hops available, end capture sequence
    if (Object.keys(ui.possibleJumps).length === 0) {
      handleEndJumpSeq(state, ui);
    }
    return;
  }

  // Filter moves that start from this cell
  const pieceMoves = state.legalMoves.filter((m) => m.path[0] === cellIndex);

  // Separate for UI rendering
  ui.possibleMoveIndices = pieceMoves
    .filter((m) => m.type === "regular")
    .map((m) => m.path[m.path.length - 1]);

  // Build possibleJumps keyed by first-hop landing square (path[1])
  // Store arrays to handle multiple sequences sharing the same first hop
  ui.possibleJumps = {};
  pieceMoves
    .filter((m) => m.type === "jump")
    .forEach((move) => {
      const firstHop = move.path[1];
      if (!ui.possibleJumps[firstHop]) {
        ui.possibleJumps[firstHop] = [];
      }
      ui.possibleJumps[firstHop].push(move);
    });
}

function unselectPiece(state, ui) {
  ui.selectedPieceIndex = null;
  ui.possibleMoveIndices = [];
  ui.possibleJumps = {};
}

/*===========================EVENT HANDLERS=======================*/

function handleRegularClick(state, ui, cellIndex) {
  const isPiece = hasPiece(state, cellIndex);
  const cellValue = state.boardValues[cellIndex];
  const isTurn = cellValue && state.turn === cellValue.split("_")[0];

  if (isPiece && isTurn) {
    unselectPiece(state, ui);
    selectPiece(state, ui, cellIndex);
    return true;
  }

  // Check if clicking a regular move destination
  if (ui.possibleMoveIndices.includes(cellIndex)) {
    const selectedMove = state.legalMoves.find(
      (m) =>
        m.path[0] === ui.selectedPieceIndex &&
        m.path[m.path.length - 1] === cellIndex &&
        m.type === "regular"
    );
    if (selectedMove) {
      executeMove(state, ui, selectedMove, unselectPiece);
      return true;
    }
  }

  // Check if clicking a jump destination (first hop)
  if (cellIndex in ui.possibleJumps) {
    handleStartJumpSeq(state, ui, cellIndex);
    return true;
  }

  return false;
}

function handleStartJumpSeq(state, ui, cellIndex) {
  // Get all sequences that start with this first hop
  ui.activeJumpSequences = ui.possibleJumps[cellIndex];

  if (!ui.activeJumpSequences || ui.activeJumpSequences.length === 0) return;

  // Use first sequence to determine the hop details (all should agree on first hop)
  const seq = ui.activeJumpSequences[0];
  const from = seq.path[0];
  const to = seq.path[1];
  const captured = seq.captures[0];

  // Apply first hop
  movePiece(state, from, to);
  removePiece(state, captured);

  // Enter capture mode
  ui.isCapturing = true;
  ui.capturePos = to;
  ui.captureStart = from;
  ui.selectedPieceIndex = to;
  ui.captureCursor = 2; // Next hop would be at path[2]
  ui.possibleMoveIndices = [];
  ui.possibleJumps = {};

  // Build next-hop options from remaining sequences
  for (const s of ui.activeJumpSequences) {
    if (s.path.length > ui.captureCursor) {
      const nextLanding = s.path[ui.captureCursor];
      if (!ui.possibleJumps[nextLanding]) {
        ui.possibleJumps[nextLanding] = [];
      }
      ui.possibleJumps[nextLanding].push(s);
    }
  }

  // If no more hops available, end sequence
  if (Object.keys(ui.possibleJumps).length === 0) {
    handleEndJumpSeq(state, ui);
  }
}

function handleContinueJumpSeq(state, ui, cellIndex) {
  // Narrow to sequences that match this hop
  ui.activeJumpSequences = ui.possibleJumps[cellIndex];

  if (!ui.activeJumpSequences || ui.activeJumpSequences.length === 0) return;

  // Use first sequence to determine the hop details
  const seq = ui.activeJumpSequences[0];
  const from = ui.capturePos;
  const to = cellIndex;
  const captureIndex = ui.captureCursor - 1; // captureCursor tracks path index, captures are 0-indexed
  const captured = seq.captures[captureIndex];

  // Apply hop
  movePiece(state, from, to);
  removePiece(state, captured);

  // Update capture state
  ui.capturePos = to;
  ui.selectedPieceIndex = to;
  ui.captureCursor++;
  ui.possibleJumps = {};

  // Build next-hop options from remaining sequences
  for (const s of ui.activeJumpSequences) {
    if (s.path.length > ui.captureCursor) {
      const nextLanding = s.path[ui.captureCursor];
      if (!ui.possibleJumps[nextLanding]) {
        ui.possibleJumps[nextLanding] = [];
      }
      ui.possibleJumps[nextLanding].push(s);
    }
  }

  // If no more hops available, end sequence
  if (Object.keys(ui.possibleJumps).length === 0) {
    handleEndJumpSeq(state, ui);
  }
}

function handleEndJumpSeq(state, ui) {
  // Clear capture state
  ui.isCapturing = false;
  ui.capturePos = null;
  ui.captureStart = null;
  ui.captureCursor = 0;
  ui.activeJumpSequences = [];
  unselectPiece(state, ui);

  // End turn
  switchPlayerTurn(state);
  checkForWinner(state);
  checkForTie(state);
}

function handleClick(state, ui, event) {
  if (state.winner || state.isTie) return;

  const el = event.currentTarget;
  const cellIndex = el.id * 1;

  let changed = false;

  if (ui.isCapturing) {
    // In capture mode: only process continuation jumps
    if (cellIndex in ui.possibleJumps) {
      handleContinueJumpSeq(state, ui, cellIndex);
      changed = true;
    }
  } else {
    // Normal mode: handle piece selection, regular moves, or jump starts
    changed = handleRegularClick(state, ui, cellIndex);
  }

  if (changed) {
    render(state, ui);
  }
}

/*===========================EVENT LISTENER SETUP=======================*/

function setupEventListeners(state, ui, initializeFn) {
  document.querySelectorAll("#game div.cell").forEach((cell) => {
    cell.addEventListener("click", (event) => handleClick(state, ui, event));
  });

  document
    .querySelector("#reset")
    .addEventListener("click", () => initializeFn(state, ui));
}

/*===========================TEST HELPERS=======================*/

function clearPlayerPieces(state, ui, playerIdx = 0) {
  state.boardValues.forEach((val, i) => {
    if (val.includes(state.players[playerIdx])) state.boardValues[i] = "";
  });
  checkForWinner(state);
  checkForTie(state);
  render(state, ui);
}

export {
  initializeUI,
  updateMessage,
  render,
  selectPiece,
  unselectPiece,
  handleRegularClick,
  handleStartJumpSeq,
  handleContinueJumpSeq,
  handleEndJumpSeq,
  handleClick,
  setupEventListeners,
  clearPlayerPieces,
};
