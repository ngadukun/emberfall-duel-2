// input.js — mouse and keyboard control for the table.
// Click flow:
//   1. Click a hand card: creatures and no-target spells play at once;
//      targeted spells arm a target mode (hint tells you to pick a target).
//   2. Click one of your ready creatures to select it as the attacker,
//      then click an enemy creature or the rival portrait to strike.
//   3. Esc cancels a selection. Enter/Space activates a focused element,
//      E ends the turn.

import { defById } from './cards.js';
import { playCard, creatureAttack, needsTarget } from './state.js';

export function createUI() {
  return { selectedHand: null, selectedAttacker: null, targetMode: null, hint: '' };
}

export function bindInput(root, state, ui, hooks) {
  const refresh = () => hooks.refresh();

  function clearSelection() {
    ui.selectedHand = null;
    ui.selectedAttacker = null;
    ui.targetMode = null;
    ui.hint = '';
  }

  function tryPlayHand(uid) {
    if (state.active !== 'player' || state.screen !== 'table') return;
    const card = state.player.hand.find((c) => c.uid === uid);
    if (!card) return;
    const target = needsTarget(card);
    if (target && target !== 'none') {
      ui.selectedHand = uid;
      ui.selectedAttacker = null;
      ui.targetMode = target;
      ui.hint = target === 'ownCreature'
        ? `Choose one of YOUR creatures for ${defById(card.defId).name}.`
        : `Choose a target for ${defById(card.defId).name}: an enemy creature or the rival portrait.`;
      refresh();
      return;
    }
    if (playCard(state, 'player', uid, null)) { clearSelection(); hooks.afterAction(); }
    else { ui.hint = 'Not enough ember, or the board is full.'; refresh(); }
  }

  root.addEventListener('click', (ev) => {
    const handEl = ev.target.closest('[data-hand-uid]');
    if (handEl) { tryPlayHand(Number(handEl.dataset.handUid)); return; }

    const boardEl = ev.target.closest('[data-board-uid]');
    const portraitEl = ev.target.closest('[data-portrait]');

    // A targeted spell is waiting: resolve it against the click.
    if (ui.targetMode && ui.selectedHand != null) {
      if (ui.targetMode === 'enemyAny') {
        if (boardEl && boardEl.dataset.owner === 'foe') {
          if (playCard(state, 'player', ui.selectedHand, { side: 'foe', uid: Number(boardEl.dataset.boardUid) })) { clearSelection(); hooks.afterAction(); return; }
        }
        if (portraitEl && portraitEl.dataset.portrait === 'foe') {
          if (playCard(state, 'player', ui.selectedHand, { face: 'foe' })) { clearSelection(); hooks.afterAction(); return; }
        }
      }
      if (ui.targetMode === 'ownCreature' && boardEl && boardEl.dataset.owner === 'player') {
        if (playCard(state, 'player', ui.selectedHand, { side: 'player', uid: Number(boardEl.dataset.boardUid) })) { clearSelection(); hooks.afterAction(); return; }
      }
      clearSelection(); refresh(); return;
    }

    if (state.active !== 'player' || state.screen !== 'table') return;

    // Select an attacker.
    if (boardEl && boardEl.dataset.owner === 'player' && ui.selectedAttacker == null) {
      const c = state.player.board.find((x) => x.uid === Number(boardEl.dataset.boardUid));
      if (c && c.ready) {
        ui.selectedAttacker = c.uid;
        ui.hint = `${defById(c.defId).name} is ready: click an enemy creature or the rival portrait to strike.`;
      } else {
        ui.hint = 'That creature just arrived — it can attack next turn.';
      }
      refresh(); return;
    }
    // Strike with the selected attacker.
    if (ui.selectedAttacker != null) {
      if (boardEl && boardEl.dataset.owner === 'foe') {
        if (creatureAttack(state, 'player', ui.selectedAttacker, { side: 'foe', uid: Number(boardEl.dataset.boardUid) })) { clearSelection(); hooks.afterAction(); return; }
      }
      if (portraitEl && portraitEl.dataset.portrait === 'foe') {
        if (creatureAttack(state, 'player', ui.selectedAttacker, { face: 'foe' })) { clearSelection(); hooks.afterAction(); return; }
      }
      clearSelection(); refresh();
    }
  });

  root.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { clearSelection(); refresh(); }
    if ((ev.key === 'e' || ev.key === 'E') && state.screen === 'table' && state.active === 'player') hooks.endTurn();
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target instanceof HTMLElement && ev.target.dataset) {
      const d = ev.target.dataset;
      if (d.handUid) { ev.preventDefault(); tryPlayHand(Number(d.handUid)); }
    }
  });
}
