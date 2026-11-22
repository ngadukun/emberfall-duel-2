// opponent.js — the rival duelist: a readable AI.
// Before it acts, planIntent() looks at its hand and board and declares
// what it means to do next; that intent is shown to the player as a
// banner, so the player can read it and counter it. takeTurn() then
// carries the plan out through the same rules functions the player uses.

import { defById } from './cards.js';
import { playCard, creatureAttack, cardCost } from './state.js';

// Decide and describe the rival's plan for its upcoming turn.
export function planIntent(state) {
  const foe = state.foe;
  const player = state.player;

  // Strongest affordable creature it could summon.
  let summon = null;
  for (const card of foe.hand) {
    const def = defById(card.defId);
    if (def.kind === 'creature' && cardCost(state, card) <= foe.emberMax + 1) {
      if (!summon || def.cost > defById(summon.defId).cost) summon = card;
    }
  }
  // A ready attacker and its favourite victim.
  const attacker = foe.board.filter((c) => !c.justPlayed)
    .sort((a, b) => b.attack - a.attack)[0];
  const victim = player.board.slice().sort((a, b) => a.health - b.health)[0];
  // A burn spell it could throw.
  const burn = foe.hand.find((c) => {
    const d = defById(c.defId);
    return d.kind === 'spell' && d.effect && d.effect.type === 'damage';
  });

  if (burn && victim && defById(burn.defId).effect.amount >= victim.health) {
    return { kind: 'burn', cardUid: burn.uid, targetUid: victim.uid, text: `Intent: burn your ${defById(victim.defId).name} with ${defById(burn.defId).name}` };
  }
  if (attacker && player.life <= attacker.attack + 3 && !victim) {
    return { kind: 'face', attackerUid: attacker.uid, text: `Intent: ${defById(attacker.defId).name} will strike YOUR LIFE` };
  }
  if (summon) {
    return { kind: 'summon', cardUid: summon.uid, text: `Intent: summon ${defById(summon.defId).name} (${defById(summon.defId).attack}/${defById(summon.defId).health})` };
  }
  if (attacker && victim) {
    return { kind: 'clash', attackerUid: attacker.uid, targetUid: victim.uid, text: `Intent: ${defById(attacker.defId).name} will clash with your ${defById(victim.defId).name}` };
  }
  if (attacker) {
    return { kind: 'face', attackerUid: attacker.uid, text: `Intent: ${defById(attacker.defId).name} will strike YOUR LIFE` };
  }
  return { kind: 'wait', text: 'Intent: gathering ember, holding its hand' };
}

// Play the rival's whole turn, step by step, so render can animate it.
// Returns a list of step functions; main.js runs them on a timer.
export function takeTurnSteps(state) {
  const steps = [];
  const foe = state.foe;

  // 1. Cast no-target spells it can afford (heal when hurt, draw, blast when ahead on board).
  for (const card of [...foe.hand]) {
    const def = defById(card.defId);
    if (def.kind !== 'spell' || def.effect.target !== 'none') continue;
    const useful =
      (def.effect.type === 'heal' && foe.life <= 12) ||
      def.effect.type === 'draw' ||
      (def.effect.type === 'blast' && state.player.board.length >= 2);
    if (useful) steps.push(() => playCard(state, 'foe', card.uid, null));
  }
  // 2. Summon creatures, biggest first, while ember lasts.
  const creatures = [...foe.hand]
    .filter((c) => defById(c.defId).kind === 'creature')
    .sort((a, b) => defById(b.defId).cost - defById(a.defId).cost);
  for (const card of creatures) steps.push(() => playCard(state, 'foe', card.uid, null));
  // 3. Buff its strongest creature if it holds a buff.
  for (const card of [...foe.hand]) {
    const def = defById(card.defId);
    if (def.kind === 'spell' && def.effect.target === 'ownCreature') {
      steps.push(() => {
        const best = [...state.foe.board].sort((a, b) => b.attack - a.attack)[0];
        if (best) playCard(state, 'foe', card.uid, { side: 'foe', uid: best.uid });
      });
    }
  }
  // 4. Burn spells: kill a creature it can finish, else singe the player.
  for (const card of [...foe.hand]) {
    const def = defById(card.defId);
    if (def.kind === 'spell' && def.effect.type === 'damage') {
      steps.push(() => {
        const killable = state.player.board.find((c) => c.health <= def.effect.amount);
        if (killable) playCard(state, 'foe', card.uid, { side: 'player', uid: killable.uid });
        else playCard(state, 'foe', card.uid, { face: 'player' });
      });
    }
  }
  // 5. Attacks: trade into a creature it can kill and survive, else go for life.
  steps.push(() => {
    for (const c of [...state.foe.board]) {
      if (!c.ready || state.screen !== 'table') continue;
      const prey = state.player.board.find((p) => p.health <= c.attack && p.attack < c.health);
      if (prey) creatureAttack(state, 'foe', c.uid, { side: 'player', uid: prey.uid });
      else if (state.player.board.length === 0 || c.attack >= 3) creatureAttack(state, 'foe', c.uid, { face: 'player' });
      else {
        const big = [...state.player.board].sort((a, b) => b.attack - a.attack)[0];
        if (big) creatureAttack(state, 'foe', c.uid, { side: 'player', uid: big.uid });
      }
    }
  });
  return steps;
}
