# Escape Room

A small browser game: one apartment, a few locked-away puzzles, and a way out.
Built as a housewarming present. **The interface is in Polish.**

## Playing it

Open `index.html` in a browser. That is the whole setup — no build step, no
dependencies, no server needed. It also works fine served over HTTP, which is how
it is deployed.

Progress is saved to `localStorage` under `escape-room-save`, so the tab can be
closed and picked up later. There is a quiet *Zacznij od nowa* button under the
map that wipes it and starts again.

Rooms can be tackled in any order. There is no timer and no penalty for guessing.

## What is here

| Path | What it is |
| ---- | ---------- |
| `index.html` | the page; loads everything below, in order |
| `style.css` | all styling, including the small-screen rules |
| `game.js` | state, saving, navigation, the map, and the chrome around each room |
| `scenes.js` | what is inside each room — the props and the puzzle logic |
| `rooms/rooms.js` | room data: map geometry, hotspot shapes, and the values that make this personal |
| `rooms/elements.js` | a small reference table of chemical elements |
| `rooms/floorplan.js` | where the floor plan artwork lives and how big it is |
| `rooms/*.svg` | the artwork — the floor plan, plus one drawing per room |

Plain HTML, CSS and JavaScript. No framework, no bundler, nothing to install.

## How it fits together

The map and every room use the same two-layer trick: the artwork is an `<img>`,
with a transparent SVG overlay on top holding everything interactive. Both share
one `viewBox`, so hit areas land exactly on the drawing underneath. Keeping the
artwork as a real `.svg` file (rather than inlining it) means it stays editable in
any vector editor, and the game still runs when opened straight off disk.

Rooms are data. Adding or moving a prop is a shape and a line of text in
`rooms/rooms.js`, not new code.

## Accessibility

Everything is reachable from the keyboard: rooms, props, the drag interactions and
the puzzle inputs all take focus and respond to Enter or the arrow keys. Focus
rings are deliberately kept even though hover highlights are not — finding things
is meant to be part of the game, but the game should not require a mouse.
Animations respect `prefers-reduced-motion`.

## Licence

None. It is a present, not a product.
