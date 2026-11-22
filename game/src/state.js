// state.js — the game state and the rules that change it.
// Pure logic: no DOM here. render.js draws this, input.js calls into it,
// opponent.js drives the rival side through the same functions.

import { buildDeckList, defById } from './cards.js';

export const START_LIFE = 20;
export const MAX_BOARD = 5;
export const MAX_EMBER = 8;

let uidCounter = 1;

export function shuffledDeck(rng) {
  const ids = buildDeckList();
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

function makeSide(deck) {
  return {
    life: START_LIFE,
    ember: 0,
    emberMax: 0,
    deck,
    hand: [], // card instance ids are objects: { uid, defId }
    board: [], // creature instances: { uid, defId, attack, health, maxHealth, ready, justPlayed }
  };
}

function drawCards(side, n) {
  for (let i = 0; i < n; i++) {
    if (side.deck.length === 0) return;
    if (side.hand.length >= 9) return;
    side.hand.push({ uid: uidCounter++, defId: side.deck.pop() });
  }
}

export function createGame(rng) {
  uidCounter = 1;
  const state = {
    screen: 'title', // 'title' | 'table' | 'win' | 'loss'
    turn: 1,
    active: 'player', // whose turn it is
    player: makeSide(shuffledDeck(rng)),
    foe: makeSide(shuffledDeck(rng)),
    diedThisTurn: false,
    log: [],
    intent: null, // filled by opponent.js: { kind, text }
    winner: null,
  };
  drawCards(state.player, 4);
  drawCards(state.foe, 4);
  return state;
}

export function noteLog(state, line) {
  state.log.push(line);
  if (state.log.length > 6) state.log.shift();
}

// Effective cost, after the grave-discount synergy.
export function cardCost(state, card) {
  const def = defById(card.defId);
  let cost = def.cost;
  if (def.graveDiscount && state.diedThisTurn) cost = Math.max(0, cost - 1);
  return cost;
}

export function canAfford(state, side, card) {
  return side.ember >= cardCost(state, card);
}

function startTurn(state, who) {
  const side = state[who];
  side.emberMax = Math.min(MAX_EMBER, side.emberMax + 1);
  side.ember = side.emberMax;
  state.diedThisTurn = false;
  for (const c of side.board) { c.ready = true; c.justPlayed = false; }
  drawCards(side, 1);
}

export function beginDuel(state) {
  state.screen = 'table';
  state.player.emberMax = 1;
  state.player.ember = 1;
  noteLog(state, 'The duel begins. You move first.');
}

export function endPlayerTurn(state) {
  state.active = 'foe';
}

export function beginFoeTurn(state) {
  startTurn(state, 'foe');
}

export function beginPlayerTurn(state) {
  state.turn += 1;
  state.active = 'player';
  startTurn(state, 'player');
  noteLog(state, `Turn ${state.turn}. Your ember refills.`);
}

function removeDead(state) {
  for (const who of ['player', 'foe']) {
    const side = state[who];
    const before = side.board.length;
    side.board = side.board.filter((c) => c.health > 0);
    if (side.board.length < before) state.diedThisTurn = true;
  }
}

function checkEnd(state) {
  if (state.foe.life <= 0 && state.player.life > 0) { state.winner = 'player'; state.screen = 'win'; }
  else if (state.player.life <= 0) { state.winner = 'foe'; state.screen = 'loss'; }
}

// Grow-on-spell synergy: every friendly grower gains +1/+1.
function growFriendlyCasters(state, who) {
  for (const c of state[who].board) {
    if (defById(c.defId).growOnSpell) {
      c.attack += 1; c.health += 1; c.maxHealth += 1;
      noteLog(state, `${defById(c.defId).name} grows from the spell!`);
    }
  }
}

// Play a card from a side's hand. target: { side:'player'|'foe', uid } or { face:'player'|'foe' } or null.
// Returns true when the play was legal and happened.
export function playCard(state, who, handUid, target) {
  const side = state[who];
  const foeKey = who === 'player' ? 'foe' : 'player';
  const idx = side.hand.findIndex((c) => c.uid === handUid);
  if (idx < 0) return false;
  const card = side.hand[idx];
  const def = defById(card.defId);
  if (!canAfford(state, side, card)) return false;

  if (def.kind === 'creature') {
    if (side.board.length >= MAX_BOARD) return false;
    side.ember -= cardCost(state, card);
    side.hand.splice(idx, 1);
    side.board.push({
      uid: card.uid, defId: def.id,
      attack: def.attack, health: def.health, maxHealth: def.health,
      ready: false, justPlayed: true,
    });
    noteLog(state, `${who === 'player' ? 'You summon' : 'Rival summons'} ${def.name}.`);
    return true;
  }

  // Spells resolve at once.
  const fx = def.effect;
  side.ember -= cardCost(state, card);
  side.hand.splice(idx, 1);
  if (fx.type === 'damage') {
    if (target && target.face) {
      state[target.face].life -= fx.amount;
      noteLog(state, `${def.name} burns the ${target.face === 'foe' ? 'rival' : 'you'} for ${fx.amount}.`);
    } else if (target) {
      const t = state[target.side].board.find((c) => c.uid === target.uid);
      if (t) { t.health -= fx.amount; noteLog(state, `${def.name} hits ${defById(t.defId).name} for ${fx.amount}.`); }
    }
  } else if (fx.type === 'blast') {
    for (const c of state[foeKey].board) c.health -= fx.amount;
    noteLog(state, `${def.name} scorches the whole rival line!`);
  } else if (fx.type === 'heal') {
    side.life = Math.min(START_LIFE + 10, side.life + fx.amount);
    noteLog(state, `${def.name} restores ${fx.amount} life.`);
  } else if (fx.type === 'draw') {
    drawCards(side, fx.amount);
    noteLog(state, `${def.name} draws ${fx.amount} cards.`);
  } else if (fx.type === 'buff' && target) {
    const t = side.board.find((c) => c.uid === target.uid);
    if (t) { t.attack += fx.amount; t.health += fx.amount; t.maxHealth += fx.amount; noteLog(state, `${def.name} strengthens ${defById(t.defId).name}.`); }
  }
  growFriendlyCasters(state, who);
  removeDead(state);
  checkEnd(state);
  return true;
}

// A ready creature strikes a target creature or the opposing duelist.
export function creatureAttack(state, who, attackerUid, target) {
  const side = state[who];
  const foeKey = who === 'player' ? 'foe' : 'player';
  const atk = side.board.find((c) => c.uid === attackerUid);
  if (!atk || !atk.ready) return false;
  atk.ready = false;
  if (target && target.face) {
    state[foeKey].life -= atk.attack;
    noteLog(state, `${defById(atk.defId).name} strikes the ${foeKey === 'foe' ? 'rival' : 'you'} for ${atk.attack}.`);
  } else if (target) {
    const def = state[foeKey].board.find((c) => c.uid === target.uid);
    if (!def) { atk.ready = true; return false; }
    def.health -= atk.attack;
    atk.health -= def.attack;
    noteLog(state, `${defById(atk.defId).name} clashes with ${defById(def.defId).name}.`);
  } else {
    atk.ready = true;
    return false;
  }
  removeDead(state);
  checkEnd(state);
  return true;
}

export function needsTarget(card) {
  const def = defById(card.defId);
  if (def.kind !== 'spell') return null;
  return def.effect.target; // 'enemyAny' | 'ownCreature' | 'none'
}
