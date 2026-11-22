# Emberfall Duel

[![Bounty](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/ngadukun/emberfall-duel-2/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/ngadukun/emberfall-duel-2/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

A one-on-one card duel on a moody, ember-lit table. Two duelists, 20 life
each, one shrinking pile of cards — and a rival whose next move is written
on the wall for anyone sharp enough to read it.

## The game

Both duelists start at **20 life**. Each turn your **ember** (mana) refills
and grows by 1, up to 8, and you draw a card. Cards cost ember:

- **Creatures** — attack/health, they stay on the table. A creature can
  attack the turn after it arrives: strike an opposing creature (both deal
  damage) or hit the rival's life directly.
- **Spells** — immediate effects: burn damage, healing, card draw, a board
  wide nova, and creature buffs.

Three factions, told apart by **colour and shape**, never by text alone:
ember-red **triangles**, tide-blue **droplets**, thorn-green **leaves**.

### The rival's intent

Before the rival acts, an **INTENT banner** announces what it plans to do
next — summon a named creature, burn one of yours, or strike your life.
Read it and counter it: kill the planned attacker, heal out of range, or
race it down.

### Synergies

- The **Ember Knight** grows +1/+1 every time you cast a spell — hold your
  cheap spells until he is on the table.
- **Kindling Surge** costs 1 less ember whenever a creature has died this
  turn — trade first, then burn at a discount.
- Thorn Growth turns a small creature into a wall; Ember Nova clears a
  whole enemy line at once.

Win when the rival reaches 0 life. Lose when you do.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server). No network, no build step.

1. Press **PLAY** on the title screen.
2. Click a card in your hand to play it. Targeted spells ask you to click
   a target: an enemy creature, the rival's portrait, or one of your own
   creatures for a buff.
3. Click one of your ready (green-framed) creatures, then an enemy
   creature or the rival's portrait, to attack.
4. Press **END TURN** (or the `E` key) to hand over. `Esc` cancels a
   selection.
5. Win and loss screens offer an instant restart.

Deterministic scenes for screenshots and testing: `?shot=title`,
`?shot=table`, `?shot=win`, `?shot=loss`.

## Layout

- `main.ts` — the hand-in program (Node 22, stdlib only): copies `game/`
  and `screenshots/` to the output directory and writes `dossier.json`
  with `vendor/makefun-game.ts`.
- `game/index.html` + `game/style.css` — the page and the table's look.
- `game/src/cards.js` — every card definition and the three factions.
- `game/src/state.js` — game state and the rules that change it.
- `game/src/opponent.js` — the rival AI and its readable intent.
- `game/src/render.js` — DOM rendering, card faces, faction marks.
- `game/src/input.js` — mouse and keyboard control.
- `game/src/shots.js` — deterministic screenshot scenes.
- `game/src/main.js` — boot, screen flow, and the rival's turn timer.
- `screenshots/` — four real renders of the game: title, mid-game table,
  victory, defeat.

## License

MIT — see `LICENSE`.
