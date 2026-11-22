// shots.js — deterministic scenes for screenshots and quick testing.
// Open the game with ?shot=title|table|win|loss to jump straight to a
// fixed, scripted position (no randomness), so screenshots always show
// the same rich mid-game table and the real win/loss screens.

import { defById } from './cards.js';
import { beginDuel } from './state.js';

let shotUid = 900;

function handCard(defId) { return { uid: shotUid++, defId }; }

function boardCreature(defId, attack, health, ready) {
  const def = defById(defId);
  return {
    uid: shotUid++, defId,
    attack: attack != null ? attack : def.attack,
    health: health != null ? health : def.health,
    maxHealth: def.health,
    ready: !!ready, justPlayed: false,
  };
}

export function readShotParam() {
  const q = new URLSearchParams(location.search);
  return q.get('shot');
}

// Build the scripted mid-game position used by ?shot=table.
export function applyTableScene(state) {
  shotUid = 900;
  beginDuel(state);
  state.turn = 4;
  state.player.life = 14;
  state.foe.life = 11;
  state.player.emberMax = 4; state.player.ember = 3;
  state.foe.emberMax = 4; state.foe.ember = 2;
  state.player.hand = [handCard('ember-knight'), handCard('spark-bolt'), handCard('tide-insight'), handCard('thorn-stag')];
  state.foe.hand = [handCard('cinder-imp'), handCard('tide-warden'), handCard('kindling-surge')];
  state.player.board = [boardCreature('thorn-dryad', 2, 3, true), boardCreature('cinder-imp', 2, 1, true)];
  state.foe.board = [boardCreature('tide-warden', 2, 3, false), boardCreature('ash-phoenix', 5, 4, false)];
  state.log = ['Rival summons Ash Phoenix.', 'Your Thorn Dryad holds the line.', 'Turn 4. Your ember refills.'];
  state.intent = { kind: 'summon', text: 'Intent: summon Tide Warden (2/3)' };
}

export function applyEndScene(state, won) {
  applyTableScene(state);
  if (won) {
    state.foe.life = 0;
    state.player.life = 9;
    state.winner = 'player';
    state.screen = 'win';
  } else {
    state.player.life = 0;
    state.foe.life = 13;
    state.winner = 'foe';
    state.screen = 'loss';
  }
}
