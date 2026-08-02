// Data-only: where the apartment floor plan artwork lives, and the coordinate space it uses.
//
// The artwork itself is rooms/floorplan.svg — a real SVG file you can open in any vector
// editor. game.js loads it as an <img> and lays a transparent SVG overlay on top, which is
// where the clickable hit areas and state badges are drawn (generated from the `shape` /
// `badge` fields in rooms.js).
//
// Why an <img> overlay and not fetch() + inline: fetch is blocked on file:// URLs, so
// fetching would mean the game only ran from a web server. This way index.html still works
// when opened straight from the filesystem, which is how the game gets tested.
//
// `viewBox` MUST stay identical to the viewBox on the <svg> root in floorplan.svg — that is
// what keeps the hit areas lined up with the drawing. If you change one, change both.
const FLOORPLAN = {
  src: "rooms/floorplan.svg", // relative to index.html
  viewBox: "0 4 762 502",
  width: 762, // viewBox width/height, used for the aspect ratio in style.css
  height: 502,
};
