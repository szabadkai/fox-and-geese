# Fox & Geese

A dependency-free browser game with a carved stone board, animated ivory and amber pieces, optional synthesized sound, three AI levels, local two-player, turn-aware undo, and legal-move highlights.

## Run

`npm start` serves the game at http://localhost:4173. `npm test` runs the rules and AI checks. All deployed files are in `dist/`.

## Rules

The 33-point cross has 72 undirected horizontal, vertical and alternating diagonal connections. Rendering and move validation use the same graph. Fox starts at D4; geese occupy all of row 5 and the lower arm. Forward is toward row 1. Geese start. Capture chains can stop after any jump, and normal fox moves remain available when a capture exists. Five remaining geese immediately wins for the fox; no legal fox move or capture at its turn start wins for the geese.

The requested rules do not specify a result when the geese have no legal move. That rare state pauses with an explanation and allows undo/restart, rather than inventing a pass or a different win condition.

AI runs in a dedicated worker with iterative deepening, alpha-beta search, capture-chain enumeration, and positional evaluation. Difficulty changes search depth and candidate breadth; Gentle includes occasional weaker moves. Ruthless is a heuristic opponent, not a solved perfect-play engine.

WebMCP tools expose game read-back, legal human moves, and ending optional capture chains when supported by the browser. They share the visible interface's state and validation.

## Board reference

Traditional alternating diagonal layout: https://www.eliwhitney.org/sites/default/files/Fox%20and%20Geese.pdf . The game's movement and win rules follow the supplied specification, including optional captures and the five-geese threshold.
