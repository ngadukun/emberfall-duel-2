// main.js — boots Emberfall Duel and runs the screen flow:
// title -> table (player turn / rival turn alternating) -> win or loss,
// with restart. Also wires the deterministic ?shot= scenes.

import { createGame, beginDuel, endPlayerTurn, beginFoeTurn, beginPlayerTurn } from './state.js';
import { planIntent, takeTurnSteps } from './opponent.js';
import { renderTitle, renderTable, renderEnd } from './render.js';
import { createUI, bindInput } from './input.js';
import { readShotParam, applyTableScene, applyEndScene } from './shots.js';

const root = document.getElementById('app');
const ui = createUI();
let state = createGame(Math.random);
let foeTimer = null;

function refresh() {
  if (state.screen === 'title') renderTitle(root);
  else if (state.screen === 'table') renderTable(root, state, ui);
  else renderEnd(root, state);
  wireScreenButtons();
}

function wireScreenButtons() {
  const playBtn = document.getElementById('play-btn');
  if (playBtn) playBtn.addEventListener('click', startDuel);
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', restart);
  const endBtn = document.getElementById('end-turn-btn');
  if (endBtn) endBtn.addEventListener('click', endTurn);
}

function startDuel() {
  beginDuel(state);
  state.intent = planIntent(state);
  refresh();
}

function restart() {
  if (foeTimer) { clearTimeout(foeTimer); foeTimer = null; }
  // Reuse the same state object: input.js holds a reference to it.
  Object.assign(state, createGame(Math.random));
  ui.selectedHand = null; ui.selectedAttacker = null; ui.targetMode = null; ui.hint = '';
  beginDuel(state);
  state.intent = planIntent(state);
  refresh();
}

function endTurn() {
  if (state.active !== 'player' || state.screen !== 'table') return;
  ui.selectedHand = null; ui.selectedAttacker = null; ui.targetMode = null; ui.hint = '';
  endPlayerTurn(state);
  refresh();
  runFoeTurn();
}

function runFoeTurn() {
  beginFoeTurn(state);
  refresh();
  const steps = takeTurnSteps(state);
  let i = 0;
  const stepOnce = () => {
    if (state.screen !== 'table') { refresh(); return; }
    if (i < steps.length) {
      steps[i++]();
      refresh();
      foeTimer = setTimeout(stepOnce, 650);
    } else {
      foeTimer = setTimeout(() => {
        if (state.screen !== 'table') { refresh(); return; }
        beginPlayerTurn(state);
        state.intent = planIntent(state);
        refresh();
      }, 500);
    }
  };
  foeTimer = setTimeout(stepOnce, 700);
}

// After any successful player action, the board may have ended the duel.
function afterAction() {
  refresh();
}

bindInput(root, state, ui, { refresh, afterAction, endTurn });

// Deterministic screenshot / test scenes.
const shot = readShotParam();
if (shot === 'table') {
  applyTableScene(state);
} else if (shot === 'win') {
  applyEndScene(state, true);
} else if (shot === 'loss') {
  applyEndScene(state, false);
} else if (shot === 'play') {
  beginDuel(state);
  state.intent = planIntent(state);
}

refresh();

// Exposed for headless verification only; the game itself never reads it.
window.__emberfall = { getState: () => state, getUI: () => ui };
