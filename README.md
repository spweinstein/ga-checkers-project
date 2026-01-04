# Checkers Browser Game

For this project, I built a basic checkers game with a mostly casual ruleset (can choose a basic move instead of forcing a jump; however, once you are jumping, you are forced to multijump if a multijump is available)

[Play Here](https://spweinstein.github.io/ga-checkers-project/)

## How to Play

### Basic Rules

1. **White** moves first, then players alternate turns
2. **Regular pieces** can only move diagonally forward into empty squares
3. **Kings** (crowned pieces) can move diagonally forward or backward
4. Click on your piece to select it and see available moves highlighted

### Capturing

- Jump over an opponent's piece into an empty square on the same diagonal trajectory to capture the opponent's piece
- After capturing, you must continue jumping with the same piece if another capture is available

### Winning

- Capture all of your opponent's pieces

### Tying/Stalemate

- Occurs when no legal moves remain for either player

## Technologies Used

- **HTML**
- **CSS**
- **JS** - three separate modules (main.js, game.js, and ui.js)

## Wireframe

![Wireframe](image.png)

## Project Structure

### Module Overview

**`main.js`** - Entry point that initializes game and UI state, sets up event listeners

**`game.js`** - Pure game logic

- Move generation using depth-first search for multi-jump sequences
- Rule validation (legal moves, captures, king promotion)
- Game state management (turn switching, win/tie detection)
- Board utilities (coordinate conversion, neighbor finding)

**`ui.js`** - User interface layer

- DOM manipulation and rendering
- Event handling (clicks, piece selection)
- Multi-jump sequence management
- Visual feedback (highlights, selections)

### Key Design Decisions

- **Separation of Concerns**: Game engine is completely independent from UI layer
- **Callback Pattern**: `executeMove()` accepts a callback for UI cleanup
- **State Management**: Centralized state objects (`state` for game, `ui` for interface)
- **Pre-computed Moves**: All legal moves generated after each turn for efficient validation

## Future Improvements

- **Forced Captures Mode** - Add a toggle in the UI to enable/disable mandatory jumping. When enabled, players must capture if any jump is available (currently set to `false` in game initialization).
- **Move History** - Implement a move log that displays all previous moves. This will help implement undo/redo and save/load games.
- **Undo/Redo** - Add buttons to step backward and forward through game history. Store board states in a stack to allow players to review or reverse moves during gameplay.
- **AI Opponent** - Implement single-player mode with computer opponent using minimax algorithm with alpha-beta pruning. Include difficulty levels (easy, medium, hard) with varying search depths. (already made some progress on this, but wasn't happy enough with all functionality to submit as the final version of the project)
- **Save/Load Games** - Add localStorage integration to persist game state between sessions. Include options to save multiple games, export/import game files, and resume interrupted matches.

## Author

- Spencer Weinstein
- [GitHub](https://github.com/spweinstein)

## Reflections

This was a really fun project to build, though implementing an AI opponent wound up being much more challenging than I anticipated - but it did require refactoring the project in a way that led to much cleaner code that allowed for other functionality to be added more easily.
