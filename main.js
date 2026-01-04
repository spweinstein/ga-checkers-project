/*===========================MAIN ENTRY POINT=======================*/

import { initializeGame } from "./game.js";
import { initializeUI, render, setupEventListeners } from "./ui.js";

const state = {};
const ui = {};

function initialize(state, ui) {
  initializeGame(state);
  initializeUI(state, ui);
  render(state, ui);
}

initialize(state, ui);
setupEventListeners(state, ui, initialize);
