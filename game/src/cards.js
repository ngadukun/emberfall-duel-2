// cards.js — every card definition for Emberfall Duel.
// Three factions, told apart by colour AND shape:
//   ember = ember-red, triangle mark
//   tide  = tide-blue, droplet mark
//   thorn = thorn-green, leaf mark
// A card is either a creature (attack/health, stays on the table)
// or a spell (an immediate effect, then it is gone).

export const FACTIONS = {
  ember: { name: 'Ember', color: '#e2483d', dark: '#7e1d16', shape: 'triangle' },
  tide: { name: 'Tide', color: '#3d8fe2', dark: '#173f6e', shape: 'drop' },
  thorn: { name: 'Thorn', color: '#4cb944', dark: '#1d5420', shape: 'leaf' },
};

// kind: 'creature' | 'spell'
// effect (spells): { type: 'damage'|'heal'|'draw'|'buff'|'blast', amount, target }
// target: 'enemyAny' (enemy creature or enemy duelist), 'ownCreature', 'none'
// synergy tags are read by state.js:
//   growOnSpell  — creature gains +1/+1 whenever its owner casts a spell
//   graveDiscount — spell costs 1 less ember if a creature died this turn
export const CARD_DEFS = [
  { id: 'cinder-imp', name: 'Cinder Imp', faction: 'ember', kind: 'creature', cost: 1, attack: 2, health: 1, text: 'A spark with teeth.' },
  { id: 'ember-knight', name: 'Ember Knight', faction: 'ember', kind: 'creature', cost: 3, attack: 3, health: 3, growOnSpell: true, text: 'Grows +1/+1 whenever you cast a spell.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', faction: 'ember', kind: 'creature', cost: 5, attack: 5, health: 4, text: 'It has burned before. It will burn again.' },
  { id: 'tide-sprite', name: 'Tide Sprite', faction: 'tide', kind: 'creature', cost: 1, attack: 1, health: 2, text: 'Small wave, sharp splash.' },
  { id: 'tide-warden', name: 'Tide Warden', faction: 'tide', kind: 'creature', cost: 2, attack: 2, health: 3, text: 'Holds the shoreline alone.' },
  { id: 'thorn-stag', name: 'Thorn Stag', faction: 'thorn', kind: 'creature', cost: 2, attack: 2, health: 2, text: 'Antlers of living bramble.' },
  { id: 'thorn-dryad', name: 'Thorn Dryad', faction: 'thorn', kind: 'creature', cost: 3, attack: 2, health: 4, text: 'The forest, walking.' },
  { id: 'bramble-giant', name: 'Bramble Giant', faction: 'thorn', kind: 'creature', cost: 4, attack: 4, health: 5, text: 'Slow. Patient. Enormous.' },
  { id: 'spark-bolt', name: 'Spark Bolt', faction: 'ember', kind: 'spell', cost: 1, effect: { type: 'damage', amount: 2, target: 'enemyAny' }, text: 'Deal 2 damage to an enemy creature or duelist.' },
  { id: 'kindling-surge', name: 'Kindling Surge', faction: 'ember', kind: 'spell', cost: 2, graveDiscount: true, effect: { type: 'damage', amount: 3, target: 'enemyAny' }, text: 'Deal 3 damage. Costs 1 less if a creature died this turn.' },
  { id: 'ember-nova', name: 'Ember Nova', faction: 'ember', kind: 'spell', cost: 4, effect: { type: 'blast', amount: 2, target: 'none' }, text: 'Deal 2 damage to ALL enemy creatures.' },
  { id: 'tide-mend', name: 'Tide Mend', faction: 'tide', kind: 'spell', cost: 2, effect: { type: 'heal', amount: 4, target: 'none' }, text: 'Restore 4 life to yourself.' },
  { id: 'tide-insight', name: 'Tide Insight', faction: 'tide', kind: 'spell', cost: 2, effect: { type: 'draw', amount: 2, target: 'none' }, text: 'Draw 2 cards.' },
  { id: 'thorn-growth', name: 'Thorn Growth', faction: 'thorn', kind: 'spell', cost: 2, effect: { type: 'buff', amount: 2, target: 'ownCreature' }, text: 'Give one of your creatures +2/+2.' },
];

// The duelling deck: two copies of most cards, one of the big finishers.
export function buildDeckList() {
  const list = [];
  for (const def of CARD_DEFS) {
    const copies = def.cost >= 5 ? 1 : 2;
    for (let i = 0; i < copies; i++) list.push(def.id);
  }
  return list;
}

export function defById(id) {
  return CARD_DEFS.find((d) => d.id === id);
}
