// render.js — draws the whole game into the DOM from state.
// Cards are real DOM elements so CSS transitions can slide, flip and
// scale them. Faction marks are inline SVG shapes (triangle, droplet,
// leaf) in faction colours — never told apart by text alone.

import { FACTIONS, defById } from './cards.js';
import { cardCost } from './state.js';

export function factionMark(faction, size) {
  const f = FACTIONS[faction];
  const s = size || 22;
  if (f.shape === 'triangle') {
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L22 20 L2 20 Z" fill="${f.color}" stroke="#111" stroke-width="1.5"/></svg>`;
  }
  if (f.shape === 'drop') {
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 C12 2 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 2 12 2 Z" fill="${f.color}" stroke="#111" stroke-width="1.5"/></svg>`;
  }
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4 C10 4 4 10 4 20 C14 20 20 14 20 4 Z" fill="${f.color}" stroke="#111" stroke-width="1.5"/><path d="M4 20 C8 14 14 8 20 4" stroke="#0d2b0e" stroke-width="1.5" fill="none"/></svg>`;
}

function cardFaceHTML(state, card, owner) {
  const def = defById(card.defId);
  const f = FACTIONS[def.faction];
  const cost = cardCost(state, card);
  const stats = def.kind === 'creature'
    ? `<div class="card-stats"><span class="stat atk" title="Attack">${def.attack}</span><span class="stat hp" title="Health">${def.health}</span></div>`
    : `<div class="card-stats"><span class="stat spell">SPELL</span></div>`;
  return `
    <div class="card-top"><span class="cost" title="Ember cost">${cost}</span>${factionMark(def.faction)}</div>
    <div class="card-name">${def.name}</div>
    <div class="card-art" style="background: radial-gradient(circle at 50% 35%, ${f.color}, ${f.dark})">${factionMark(def.faction, 36)}</div>
    <div class="card-text">${def.text}</div>
    ${stats}`;
}

function boardCreatureHTML(state, c, owner, ui) {
  const def = defById(c.defId);
  const f = FACTIONS[def.faction];
  const cls = [
    'board-card',
    owner === 'player' && c.ready && state.active === 'player' ? 'can-attack' : '',
    ui.selectedAttacker === c.uid ? 'selected' : '',
    ui.targetMode && owner === 'foe' ? 'targetable' : '',
    c.justPlayed ? 'played-in' : '',
  ].join(' ');
  return `<div class="${cls}" data-board-uid="${c.uid}" data-owner="${owner}" tabindex="0" role="button"
      aria-label="${def.name}, ${c.attack} attack, ${c.health} health">
    <div class="card-top"><span class="cost small">${def.cost}</span>${factionMark(def.faction, 16)}</div>
    <div class="card-name small">${def.name}</div>
    <div class="card-art mini" style="background: radial-gradient(circle at 50% 35%, ${f.color}, ${f.dark})">${factionMark(def.faction, 30)}</div>
    <div class="card-stats"><span class="stat atk">${c.attack}</span><span class="stat hp">${c.health}</span></div>
  </div>`;
}

function portraitHTML(state, who, ui) {
  const side = state[who];
  const label = who === 'foe' ? 'RIVAL DUELIST' : 'YOU';
  const targetable = ui.targetMode === 'enemyAny' && who === 'foe' ? ' targetable' : '';
  const low = side.life <= 6 ? ' low-life' : '';
  return `<div class="portrait${targetable}${low}" data-portrait="${who}" tabindex="0" role="button" aria-label="${label}, ${side.life} life">
    <div class="portrait-face">${who === 'foe' ? '&#128293;' : '&#9876;'}</div>
    <div class="portrait-name">${label}</div>
    <div class="life">&#10084; ${side.life}</div>
    <div class="ember-pips" title="Ember">${emberPips(side)}</div>
  </div>`;
}

function emberPips(side) {
  let out = '';
  for (let i = 0; i < side.emberMax; i++) out += `<span class="pip${i < side.ember ? ' full' : ''}"></span>`;
  return out || '<span class="pip"></span>';
}

export function renderTitle(root) {
  root.innerHTML = `
  <section class="screen title-screen">
    <div class="title-flames" aria-hidden="true">&#128293; &#128293; &#128293;</div>
    <h1 class="game-title">EMBERFALL<br>DUEL</h1>
    <p class="tagline">A one-on-one card duel on an ember-lit table.<br>First duelist to 0 life falls.</p>
    <button id="play-btn" class="big-btn">PLAY</button>
    <div class="howto">
      <h2>How to play</h2>
      <ul>
        <li>Each turn your <b>ember</b> refills and grows by 1 (max 8). Cards cost ember.</li>
        <li>Click a card in your hand to play it. Creatures stay and fight next turn.</li>
        <li>Click one of your ready creatures, then an enemy creature — or the rival's portrait — to attack.</li>
        <li>Spells strike at once: damage, healing, card draw, and creature buffs.</li>
        <li>Watch the rival's <b>INTENT</b> banner: it shows what they plan to do next. Counter it!</li>
        <li>Synergies: the Ember Knight grows whenever you cast a spell, and Kindling Surge costs 1 less after a creature dies.</li>
      </ul>
      <div class="faction-key">
        <span>${factionMark('ember')} Ember</span>
        <span>${factionMark('tide')} Tide</span>
        <span>${factionMark('thorn')} Thorn</span>
      </div>
    </div>
  </section>`;
}

export function renderTable(root, state, ui) {
  const p = state.player;
  const foe = state.foe;
  const foeHand = foe.hand.map(() => `<div class="card-back" aria-hidden="true">${factionMark('ember', 26)}</div>`).join('');
  const foeBoard = foe.board.map((c) => boardCreatureHTML(state, c, 'foe', ui)).join('') || '<div class="empty-row">No creatures</div>';
  const myBoard = p.board.map((c) => boardCreatureHTML(state, c, 'player', ui)).join('') || '<div class="empty-row">No creatures yet — play a card</div>';
  const myHand = p.hand.map((card) => {
    const def = defById(card.defId);
    const afford = p.ember >= cardCost(state, card) && state.active === 'player';
    const cls = ['hand-card', afford ? 'affordable' : 'too-costly', ui.selectedHand === card.uid ? 'selected' : ''].join(' ');
    return `<div class="${cls}" data-hand-uid="${card.uid}" tabindex="0" role="button" aria-label="${def.name}, costs ${cardCost(state, card)} ember">${cardFaceHTML(state, card, 'player')}</div>`;
  }).join('');
  const log = state.log.map((l) => `<div>${l}</div>`).join('');
  const hint = ui.hint || (state.active === 'player' ? 'Your move: play a card, attack, or end your turn.' : 'The rival is acting…');

  root.innerHTML = `
  <section class="screen table-screen">
    <div class="top-row">
      ${portraitHTML(state, 'foe', ui)}
      <div class="foe-hand" aria-label="Rival hand, ${foe.hand.length} cards">${foeHand}</div>
      <div class="deck-count">Rival deck: ${foe.deck.length}</div>
    </div>
    <div class="intent-banner" role="status">${state.intent ? state.intent.text : 'Intent: unknown'}</div>
    <div class="board foe-board">${foeBoard}</div>
    <div class="midline"><span class="turn-label">TURN ${state.turn}</span><span class="hint">${hint}</span>
      <button id="end-turn-btn" class="end-btn" ${state.active !== 'player' ? 'disabled' : ''}>END TURN &#9654;</button></div>
    <div class="board my-board">${myBoard}</div>
    <div class="bottom-row">
      ${portraitHTML(state, 'player', ui)}
      <div class="my-hand">${myHand}</div>
      <div class="deck-count">Your deck: ${p.deck.length}</div>
    </div>
    <div class="log" aria-label="Duel log">${log}</div>
  </section>`;
}

export function renderEnd(root, state) {
  const won = state.screen === 'win';
  root.innerHTML = `
  <section class="screen end-screen ${won ? 'win' : 'loss'}">
    <div class="end-emblem" aria-hidden="true">${won ? '&#127942;' : '&#128128;'}</div>
    <h1 class="end-title">${won ? 'VICTORY!' : 'DEFEAT'}</h1>
    <p class="end-line">${won
      ? 'The rival\'s flame gutters out. The Emberfall table is yours!'
      : 'Your flame fades into the ash. The rival takes the table — this time.'}</p>
    <p class="end-score">Final life — You: ${Math.max(0, state.player.life)} &nbsp;|&nbsp; Rival: ${Math.max(0, state.foe.life)} &nbsp;|&nbsp; Turns: ${state.turn}</p>
    <button id="restart-btn" class="big-btn">${won ? 'PLAY AGAIN' : 'TRY AGAIN'}</button>
  </section>`;
}
