# User Statements

## Setup

- As a user, I want the game to start with an 8x8 board
- As a user, I want half of the squares to be dark and half light, in a checkerboard pattern
- As a user, I want each side to begin with 12 pieces in the standard starting positions
- As a user, I want the game to clearly show whose turn it is at the start
- As a user, I want to be able to reset the game by hitting a reset button
- As a user, turns end automatically after completing a move

## Turns

- As a user, I want the game to clearly show whose turn it is at any given time
- As a user, I want to be able to select one of my pieces when it is my turn
- As a user, I want to see valid moves highlighted when I click on one of my pieces
- As a user, I want to be able to move my pieces only in valid ways (simple move, jump, or multi-jump)
- As a user, when I click an empty square, the selected piece is deselected

## Basic Moves

- As a user, I want to be able to move a normal piece one square diagonally forward into an empty square
- As a user, I want to be prevented from moving onto occupied squares
- As a user, I want to be prevented from moving normal pieces backwards
- As a user, I want king pieces to be able to move backwards

## Capturing Rules

- As a user, I want to be able to jump diagonally over an adjacent opponent piece into an empty square beyond it
- As a user, I want captured pieces to be removed after a capturing sequence
- As a user, my turn ends automatically after completing any move

## Multiple Jumps (Multi-capture)

- As a user, I can optionally continue jumping with the same piece if another capture is available
- As a user, multi-jump continuation is shown with highlighted valid moves after each jump
- As a user, I can click the piece again to see remaining jump options during a sequence
- As a user, if I don't continue jumping, my turn ends automatically

## Kinging/Kings

- As a user, I want my piece to become a king when it reaches the farthest row
- As a user, I want kings to be able to use basic moves either forward or backward
- As a user, I want kings to be able to capture forward or backward (and chain multi-captures with both forward and backward moves)

## Game End

- As a user, I want the game to declare a winner when one player has no pieces remaining
- As a user, I want the game to declare a tie when the current player has pieces but no legal moves available
- As a user, I want to see a message indicating the game is over and prompting me to reset

# Pseudocode

## Game State:

- players: ["White", "Black"]
- pieceTypes: ["Regular", "King"]
- boardValues: array of 64 values
  - Values: "player\_{pieceType}" or "" for empty
- turn: always equal to either players[0] or players[1] (while game is in play)
- winner: initialized to false; when players[0] or players[1] wins, becomes equal to players[0] or players[1]
- isTie: initialized to false; becomes true when current player has no legal moves but still has pieces
- legalMoves: array of move objects, regenerated after each turn
  - Each move object: { path: [cellIndex, ...], captures: [cellIndex, ...], type: "regular" | "jump" }
- forcedCaptures: boolean flag; when true, only jump moves are legal if any jumps exist
- boardCells: array of cached 64 DOM grid cells
- msgCell: cached DOM element displaying game messages

## UI State:

- selectedPieceIndex: index within boardValues that is "selected"
  - Must be a piece belonging to the player whose turn it is
  - Only one piece can be selected at a time
  - Null when no piece is selected
  - Resets when turn switches
- possibleMoveIndices: array of indices for regular (non-jump) moves available from selected piece
- possibleJumps: object mapping landing square indices to arrays of jump move objects
  - Key: first landing square index
  - Value: array of complete jump sequences that start with that landing square
- isCapturing: boolean, true when in the middle of a multi-jump sequence
- capturePos: current position during multi-jump sequence
- captureStart: original position where multi-jump started
- captureCursor: tracks which index in the path array we're currently at during multi-jump
- activeJumpSequences: array of possible jump sequences being narrowed down during multi-jump

## Methods:

### Setup:

- initializeGame: sets up the board with standard piece positions, initializes all game state
- initializeUI: sets up UI state and adds "dark" class to appropriate cells

### Rendering:

- updateMessage: updates the message above the board to show whose turn it is or game end state
- render:
  - Iterates over boardCells to update their classes based on:
    - Whether cell is empty or has a piece, and which player's piece
    - Whether piece is a king or regular piece
    - Whether cell is selected
    - Whether cell is a possible move destination
  - Updates the message to reflect whose turn it is or game end state

### Grid Helpers:

- getRowIndex(cellIndex): returns row index (0-7) for a cell index
- getColIndex(cellIndex): returns column index (0-7) for a cell index
- getCellIndex(rowIndex, colIndex): returns cell index (0-63) or false if out of bounds
- getCellValue(cellIndex): returns the value at boardValues[cellIndex]
- isCellEmpty(cellIndex): returns true if cell has no piece
- isCellEnemy(cellIndex): returns true if cell contains opponent's piece
- isInLastRow(cellIndex): returns true if piece at cellIndex is in its promotion row
- isOnBoard(idx): returns true if index is between 0 and 7

### Turn Logic Helpers:

- getValidMoveRows(cellIndex): returns valid row indices for piece movement
  - Kings: both forward and backward (±1 row)
  - Regular pieces: forward only (direction depends on player)
- getValidMoveCols(cellIndex): returns valid column indices (±1 column)
- getValidNeighbors(cellIndex): combines getValidMoveRows and getValidMoveCols to get all valid diagonal neighbors

### Piece Management:

- addPiece(index, player, pieceType): sets boardValues[index] to "player_pieceType"
- hasPiece(index): returns true if boardValues[index] is not empty
- removePiece(index): clears boardValues[index] and returns the removed value
- crownPiece(index): replaces "Regular" with "King" in boardValues[index]
- movePiece(fromIdx, toIdx): moves piece and crowns if it reaches last row

### Move Generation:

- findSingleJumps(pos): finds all single jump moves available from position pos
  - Checks each diagonal neighbor for enemy pieces
  - Checks if landing square (2 squares away) is empty
  - Returns array of move objects with path, captures, and type
- findContinuationJumps(move): finds possible continuation jumps from end of given move
  - Creates clone of state with move applied
  - Finds single jumps from new position
  - Extends the path and captures arrays
- jumpDFS(move, results): recursively finds all complete multi-jump sequences
  - Uses DFS to explore all possible continuation paths
  - Adds complete sequences (no more continuations) to results
- findAllJumpPaths(): finds all possible jump sequences for current player
  - Iterates through all board positions
  - Runs jumpDFS on each piece's initial jumps
- generateAllLegalMoves(): computes all legal moves for current player
  - First finds all jump paths
  - If forcedCaptures is true and jumps exist, returns only jumps
  - Otherwise generates and includes regular diagonal moves
  - Returns combined array of all legal moves

### Move Execution:

- executeMove(move, ui, unselectFn): executes a complete move
  - Moves piece from start to end of path
  - Removes all captured pieces
  - Crowns piece if it reaches last row
  - Switches turn, unselects piece, checks for winner/tie
- applyMove(move): creates a cloned state with the move applied (used for lookahead)

### Selection and UI Interaction:

- selectPiece(cellIndex): sets selectedPieceIndex and computes available moves
  - If in capture mode, only allows selecting the capturing piece
  - Filters legalMoves for moves starting from cellIndex
  - Separates into possibleMoveIndices and possibleJumps
  - If in capture mode and no continuations, auto-ends jump sequence
- unselectPiece(): clears selectedPieceIndex, possibleMoveIndices, and possibleJumps

### Game Logic:

- checkForWinner: checks if either player has no pieces left, sets winner
- checkForTie: checks if current player has no legal moves, sets isTie to true
- switchPlayerTurn: switches turn to other player and regenerates legalMoves

### Event Handlers:

- handleClick: main click handler
  - Ignores clicks if game is over
  - If in capture mode, only processes continuation jumps
  - Otherwise handles piece selection, regular moves, or jump starts
  - Calls render if state changed
- handleRegularClick: handles clicks in normal (non-capturing) mode
  - If clicking own piece, selects it
  - If clicking regular move destination, executes move
  - If clicking jump destination, starts jump sequence
- handleStartJumpSeq: starts a multi-jump sequence
  - Applies first jump (moves piece, removes captured)
  - Enters capture mode with updated UI state
  - Builds next hop options
  - Auto-ends if no continuations available
- handleContinueJumpSeq: continues a multi-jump sequence
  - Applies next jump in sequence
  - Narrows activeJumpSequences to matching paths
  - Updates capture position and cursor
  - Auto-ends if no more continuations
- handleEndJumpSeq: ends a multi-jump sequence
  - Clears all capture-related UI state
  - Switches turn, checks for winner/tie
- setupEventListeners: attaches click handlers to cells and reset button
