# Phantom Heist

A complete heist game: reach the vault at the top right without being seen by the museum's guards. Plays in a desktop browser from its own files, offline.

[![make.fun: Best Heist Game](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounties/best-heist-game-20261122-0559)
[![make.fun: leaderboard rank](manuuuDEV/heist-game/rank.svg)](https://make.fun/bounties/best-heist-game-20261122-0559)
[![make.fun: reward](manuuuDEV/heist-game/reward.svg)](https://make.fun/bounties/best-heist-game-20261122-0559)

## The job

You are the phantom, a thief in the museum. Walk through the halls and reach the vault at the top right before the guards notice you.

- **Controls**: WASD or the arrow keys to move, Space to wait, Esc to pause, Enter to start on the title screen.
- **Stealth**: guards patrol with vision cones, cameras watch the room and an alarm meter fills when anyone watches you. If you are seen, the alarm sounds; reaching the vault unseen opens it ("The vault is open!"). Get close while alerted and the game ends ("Alarm!").

## Play

Open `game/index.html` in any desktop browser. No network, no build, no install.

## The entry

The repository is the entry for the "Make the best heist game" bounty. It holds:

- `main.ts` — the packaging program: copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with make.fun's `buildDossier` (`vendor/makefun-game.ts`).
- `vendor/makefun-game.ts` — the kit's copy of the scorer, unchanged.
- `game/index.html`, `game/game.js` — the game.
- `screenshots/` — 3 or 4 real renders of the game: the title screen, in play, the vault open, and the alarm.
- `LICENSE` — MIT, at the root.

Entered with referral code **07px145t** on [make.fun](https://make.fun).
