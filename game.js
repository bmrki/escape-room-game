const SAVE_KEY = "escape-room-save";
const SVG_NS = "http://www.w3.org/2000/svg";

function defaultState() {
  return {
    currentView: "map",
    solved: {
      herOffice: false,
      hisOffice: false,
      guestBedroom: false,
      bathroom: false,
      mainBedroom: false,
    },
    found: { kitchen: false, balcony: false },
    clueValues: { favoriteNumber: null, meaningfulDate: null, meaningfulTime: null },
    letters: {},
    frontDoorSolved: false,
    introSeen: false,
  };
}

function loadState() {
  const base = defaultState();
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return base;
  try {
    const parsed = JSON.parse(saved);
    return {
      ...base,
      ...parsed,
      // The nested groups must be merged, not replaced. A save written before a key existed
      // would otherwise wipe that key back to undefined instead of leaving it at its default —
      // which breaks every time a new puzzle adds a clue value.
      solved: { ...base.solved, ...parsed.solved },
      found: { ...base.found, ...parsed.found },
      clueValues: { ...base.clueValues, ...parsed.clueValues },
      letters: { ...base.letters, ...parsed.letters },
    };
  } catch {
    return base;
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function goTo(viewId) {
  state.currentView = viewId;
  saveState();
  render();
}

function enterRoom(roomId) {
  const room = getRoom(roomId);
  // A clue room with a built scene marks itself found when the player actually finds the clue.
  // Ones still on the stub have nothing to interact with, so entering has to count instead.
  if (room.type === "clue" && !SCENES[roomId]) {
    state.found[roomId] = true;
  }
  goTo(roomId);
}

// Called by a scene when the player uncovers a clue value (a date, a number, a time).
function findClue(roomId, clueKey, value) {
  state.found[roomId] = true;
  state.clueValues[clueKey] = value;
  saveState();
}

// Which letter of the final word a room hands over. Null if the room yields no letter, or if
// finalWord is the wrong length — the scene turns that into a visible config error.
//
// The length check is against the whole word, not just this room's position, so a bad
// finalWord is reported by the first letter room the player walks into rather than lying in
// wait until the one whose position happens to fall off the end.
function letterForRoom(room) {
  if (!room.letterPosition) return null;
  const word = String(PERSONALIZATION.finalWord ?? "").toUpperCase();
  if (word.length !== letterRooms().length) return null;
  return word[room.letterPosition - 1] ?? null;
}

// The last thing that happens in the game.
function openFrontDoor() {
  state.frontDoorSolved = true;
  saveState();
}

// Wipes the save and starts again. Destructive, so every caller confirms first.
function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  render();
}

// Called by a scene when a puzzle room is solved. Most rooms hand over a letter fragment,
// recorded against its position in the final word. His Office hands over a clue value for a
// later room instead — hence both being optional.
function solvePuzzle(roomId, { letter, clue } = {}) {
  state.solved[roomId] = true;
  if (letter) {
    state.letters[letter.position] = letter.value;
  }
  if (clue) {
    state.clueValues[clue.key] = clue.value;
  }
  saveState();
}

// The Front Door only opens once every letter-yielding room is solved.
function frontDoorUnlocked() {
  return letterRooms().every((room) => state.solved[room.id]);
}

// What the map should show for a room: drives both the tint and the badge.
function roomStatus(room) {
  switch (room.type) {
    case "puzzle":
      return state.solved[room.id] ? "solved" : "unsolved";
    case "clue":
      return state.found[room.id] ? "found" : "unfound";
    case "final":
      return frontDoorUnlocked() ? "open" : "locked";
    default:
      return "neutral";
  }
}

// Every room is reachable from the start, so an unsolved puzzle room gets a question mark,
// not a padlock — nothing about it is locked, it just hasn't been worked out yet. The Front
// Door is the one genuine lock in the game: it refuses input until all four letters are in.
const BADGE_GLYPH = {
  solved: "✓", // check mark
  unsolved: "?",
  found: "✓",
  unfound: "?",
  open: "🚪", // door
  locked: "🔒", // padlock — the Front Door only
};

const STATUS_TEXT = {
  solved: "rozwiązane",
  unsolved: "jeszcze nierozwiązane",
  found: "wskazówka znaleziona",
  unfound: "jest tu coś do znalezienia",
  open: "otwarte",
  locked: "zamknięte",
  neutral: "",
};

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  if (state.currentView === "escaped") {
    app.appendChild(renderEndScreen());
    return;
  }
  if (state.currentView === "map") {
    app.appendChild(renderMap());
    return;
  }
  const room = getRoom(state.currentView);
  const scene = SCENES[room.id];
  app.appendChild(scene ? renderRoomScene(room, scene) : renderRoomStub(room.id));
}

function renderMap() {
  const wrapper = document.createElement("div");
  wrapper.className = "map";

  const plan = document.createElement("div");
  plan.className = "map__plan";

  // The artwork, straight from rooms/floorplan.svg.
  const art = document.createElement("img");
  art.className = "map__art";
  art.src = FLOORPLAN.src;
  art.alt = "Plan mieszkania";
  art.addEventListener("error", () => {
    plan.classList.add("is-missing-art");
    art.replaceWith(missingArtNotice(FLOORPLAN.src));
  });
  plan.appendChild(art);

  // A transparent overlay in the same coordinate space, holding everything interactive.
  // Both layers fill .map__plan, which is locked to the viewBox aspect ratio in style.css,
  // so overlay coordinates land exactly on the drawing underneath.
  const overlay = document.createElementNS(SVG_NS, "svg");
  overlay.setAttribute("class", "map__hits");
  overlay.setAttribute("viewBox", FLOORPLAN.viewBox);
  for (const room of ROOMS) {
    overlay.appendChild(renderRoomHit(room));
  }
  plan.appendChild(overlay);

  wrapper.appendChild(plan);
  wrapper.appendChild(renderProgress());
  wrapper.appendChild(renderResetControl());
  return wrapper;
}

// Erasing a save is not undoable, so the button arms itself first and asks.
function renderResetControl(label = "Zacznij od nowa") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button--quiet reset";
  button.textContent = label;

  let armed = false;
  let disarm = null;

  button.addEventListener("click", () => {
    if (armed) {
      window.clearTimeout(disarm);
      resetGame();
      return;
    }
    armed = true;
    button.textContent = "Skasować cały postęp?";
    button.classList.add("is-armed");
    disarm = window.setTimeout(() => {
      armed = false;
      button.textContent = label;
      button.classList.remove("is-armed");
    }, 5000);
  });

  return button;
}

// ---------------------------------------------------------------------------
// The ending
// ---------------------------------------------------------------------------

function renderEndScreen() {
  const wrapper = document.createElement("div");
  wrapper.className = "end";

  const heading = document.createElement("h2");
  heading.className = "end__title";
  heading.textContent = "Misja zakończona!";
  wrapper.appendChild(heading);

  // The door opens and the game hands the flat back as an ordinary place to live in — the lit
  // plan below does the warm part, so this line gets to be the joke.
  const arrival = document.createElement("p");
  arrival.className = "end__arrival";
  // The two questions sit on their own lines: they are the punchline, and running them
  // together reads as one long sentence instead of two.
  arrival.innerHTML =
    "Od teraz największą zagadką pozostaje tylko:<br>" +
    "„Co dziś na obiad?”<br>" +
    "„Kto wynosi śmieci?”";
  wrapper.appendChild(arrival);

  wrapper.appendChild(endScreenPlan());

  const word = String(PERSONALIZATION.finalWord ?? "").toUpperCase();
  const tiles = document.createElement("div");
  tiles.className = "tiles tiles--solved";
  for (const letter of word) {
    const tile = document.createElement("span");
    tile.className = "tiles__tile";
    tile.textContent = letter;
    tiles.appendChild(tile);
  }
  wrapper.appendChild(tiles);

  wrapper.appendChild(endScreenDog());

  const message = String(PERSONALIZATION.endMessage ?? "").trim();
  if (message) {
    const note = document.createElement("p");
    note.className = "end__message";
    note.textContent = message;
    wrapper.appendChild(note);
  }

  const actions = document.createElement("div");
  actions.className = "end__actions";

  const look = document.createElement("button");
  look.type = "button";
  look.className = "button";
  look.textContent = "Rozejrzyj się";
  look.addEventListener("click", () => goTo("map"));
  actions.appendChild(look);

  actions.appendChild(renderResetControl("Zagraj jeszcze raz"));
  wrapper.appendChild(actions);

  return wrapper;
}

// The same floor plan the map draws, but every room warm and lit and nothing clickable.
// During play the plan is mostly dark and lights up room by room as you solve; here it
// finishes the job — the flat, whole. The rooms fade in one after another (style.css stages
// them), which is the closest this game gets to handing over a set of keys.
function endScreenPlan() {
  const plan = document.createElement("div");
  plan.className = "map__plan end__plan";

  const art = document.createElement("img");
  art.className = "map__art";
  art.src = FLOORPLAN.src;
  art.alt = "Plan mieszkania, wszystkie pokoje rozświetlone";
  art.addEventListener("error", () => art.remove());
  plan.appendChild(art);

  const glow = document.createElementNS(SVG_NS, "svg");
  glow.setAttribute("class", "end__glow");
  glow.setAttribute("viewBox", FLOORPLAN.viewBox);
  glow.setAttribute("aria-hidden", "true");

  ROOMS.forEach((room, index) => {
    const lit = document.createElementNS(SVG_NS, "path");
    lit.setAttribute("class", "end__room");
    lit.setAttribute("d", room.shape);
    lit.style.animationDelay = `${index * 0.13}s`;
    glow.appendChild(lit);
  });

  plan.appendChild(glow);
  return plan;
}

// She gets the last word, sitting where the door used to be shut.
function endScreenDog() {
  const holder = document.createElement("div");
  holder.className = "end__dog";
  holder.innerHTML = `
    <svg viewBox="-50 -105 105 112" role="img" aria-label="Pies, czeka">
      <path d="M -22 -26 q -20 -2 -18 -22 q 1 -9 9 -9" fill="none" stroke="#2f2a28"
            stroke-width="9" stroke-linecap="round"/>
      <circle cx="-8" cy="-24" r="24" fill="#2f2a28"/>
      <path d="M 2 -66 q 22 2 22 30 q 0 22 -8 36 h -22 q -6 -30 -4 -46 z" fill="#332d2a"/>
      <rect x="4"  y="-26" width="11" height="26" rx="5.5" fill="#2f2a28"/>
      <rect x="17" y="-24" width="11" height="24" rx="5.5" fill="#3d3532"/>
      <ellipse cx="9.5" cy="-1" rx="7" ry="4" fill="#3d3532"/>
      <ellipse cx="22.5" cy="-1" rx="7" ry="4" fill="#463d39"/>
      <circle cx="16" cy="-78" r="18" fill="#332d2a"/>
      <path d="M 28 -82 q 20 -2 20 8 q 0 9 -14 9 q -12 0 -12 -8 z" fill="#3d3532"/>
      <circle cx="46" cy="-76" r="3.4" fill="#15110f"/>
      <path d="M 4 -92 q -12 -6 -14 8 q -2 14 12 15 z" fill="#241f1d"/>
      <path d="M 24 -94 q 10 -9 16 2 q 5 11 -6 14 z" fill="#241f1d"/>
      <circle cx="27" cy="-82" r="2.8" fill="#f3e6c8"/>
      <path d="M 3 -62 q 16 9 28 1" fill="none" stroke="#cf7b52" stroke-width="6" stroke-linecap="round"/>
      <circle cx="18" cy="-55" r="3.6" fill="#e6b45e"/>
    </svg>`;
  return holder;
}

// Shown instead of blank artwork if an SVG can't be loaded — a silently empty room would be
// a confusing thing to debug. Everything stays clickable underneath.
function missingArtNotice(src) {
  const notice = document.createElement("p");
  notice.className = "map__missing";
  notice.textContent = `Nie udało się wczytać ${src}. Wszystko tutaj nadal można klikać.`;
  return notice;
}

function renderRoomHit(room) {
  const status = roomStatus(room);

  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", `hit hit--${room.type} is-${status}`);
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");

  const description = STATUS_TEXT[status]
    ? `${room.displayName} — ${STATUS_TEXT[status]}`
    : room.displayName;
  group.setAttribute("aria-label", description);

  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = description;
  group.appendChild(title);

  const area = document.createElementNS(SVG_NS, "path");
  area.setAttribute("class", "hit__area");
  area.setAttribute("d", room.shape);
  group.appendChild(area);

  if (room.label) {
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "hit__label");
    label.setAttribute("x", room.label.x);
    label.setAttribute("y", room.label.y);
    if (room.label.size) {
      // Inline style, not an attribute: the .hit__label rule in style.css would win otherwise.
      label.style.fontSize = `${room.label.size}px`;
    }
    if (room.label.rotate) {
      label.setAttribute(
        "transform",
        `rotate(${room.label.rotate} ${room.label.x} ${room.label.y})`
      );
    }
    label.textContent = room.displayName;
    group.appendChild(label);
  }

  if (room.badge) {
    const disc = document.createElementNS(SVG_NS, "circle");
    disc.setAttribute("class", "hit__badge");
    disc.setAttribute("cx", room.badge.x);
    disc.setAttribute("cy", room.badge.y);
    disc.setAttribute("r", "12");
    group.appendChild(disc);

    const glyph = document.createElementNS(SVG_NS, "text");
    glyph.setAttribute("class", "hit__glyph");
    glyph.setAttribute("x", room.badge.x);
    glyph.setAttribute("y", room.badge.y);
    glyph.textContent = BADGE_GLYPH[status] ?? "";
    group.appendChild(glyph);
  }

  group.addEventListener("click", () => enterRoom(room.id));
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      enterRoom(room.id);
    }
  });

  return group;
}

function renderProgress() {
  const rooms = letterRooms();
  const done = rooms.filter((room) => state.solved[room.id]).length;

  const bar = document.createElement("p");
  bar.className = "progress";
  bar.textContent = frontDoorUnlocked()
    ? `Wszystkie litery (${rooms.length}) znalezione — drzwi wejściowe się otworzą.`
    : `Znalezione litery: ${done} z ${rooms.length}.`;
  return bar;
}

// ---------------------------------------------------------------------------
// Room scenes
// ---------------------------------------------------------------------------

// Shared chrome around every built room: title, the scene's own body, Back to Map.
function renderRoomScene(room, scene) {
  const wrapper = document.createElement("div");
  wrapper.className = `scene scene--${room.id}`;

  const heading = document.createElement("h2");
  heading.className = "scene__title";
  heading.textContent = room.displayName;
  wrapper.appendChild(heading);

  wrapper.appendChild(scene(room));

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "button button--ghost scene__back";
  backButton.textContent = "Wróć do planu";
  backButton.addEventListener("click", () => goTo("map"));
  wrapper.appendChild(backButton);

  return wrapper;
}

// The room artwork plus a transparent hotspot overlay — the same two-layer trick the map uses,
// so scene SVGs stay plain files and all the interactivity lives here.
function renderSceneArt(room, { onHotspot }) {
  const stage = document.createElement("div");
  stage.className = "scene__stage";
  stage.style.setProperty("--scene-ratio", `${room.scene.width} / ${room.scene.height}`);

  const art = document.createElement("img");
  art.className = "scene__art";
  art.src = room.scene.src;
  art.alt = "";
  art.addEventListener("error", () => art.replaceWith(missingArtNotice(room.scene.src)));
  stage.appendChild(art);

  const overlay = document.createElementNS(SVG_NS, "svg");
  overlay.setAttribute("class", "scene__hotspots");
  overlay.setAttribute("viewBox", room.scene.viewBox);

  for (const [name, hotspot] of Object.entries(room.scene.hotspots ?? {})) {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "hotspot");
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.setAttribute("aria-label", hotspot.label);

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = hotspot.label;
    group.appendChild(title);

    const area = document.createElementNS(SVG_NS, "path");
    area.setAttribute("class", "hotspot__area");
    area.setAttribute("d", hotspot.shape);
    group.appendChild(area);

    group.addEventListener("click", () => onHotspot(name));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onHotspot(name);
      }
    });

    overlay.appendChild(group);
  }

  stage.appendChild(overlay);
  return stage;
}

// A "zoom in on the prop" panel. Escape or the Close button dismisses it; focus moves in and
// back out again so it works without a mouse. `options.focus` is a selector for what should
// take focus instead of the Close button — a terminal wants the caret in its input.
function openCloseUp(host, content, options = {}) {
  const previouslyFocused = document.activeElement;

  const backdrop = document.createElement("div");
  backdrop.className = "closeup";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-label", "Z bliska");
  backdrop.tabIndex = -1;

  const close = () => {
    backdrop.remove();
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    // Re-render so anything the close-up unlocked (found state, hints) is reflected.
    render();
  };

  backdrop.appendChild(content);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "button";
  closeButton.textContent = "Zamknij";
  closeButton.addEventListener("click", close);
  content.appendChild(closeButton);

  backdrop.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close();
  });

  host.appendChild(backdrop);
  const preferred = options.focus ? content.querySelector(options.focus) : null;
  (preferred ?? closeButton).focus();
}

// Surfaces a bad PERSONALIZATION value in the game itself, so swapping in a real one and
// mistyping it doesn't just silently produce a broken puzzle.
function configError(message) {
  const box = document.createElement("p");
  box.className = "config-error";
  box.textContent = message;
  return box;
}

function renderRoomStub(roomId) {
  const room = getRoom(roomId);
  const wrapper = document.createElement("div");
  wrapper.className = "room-stub";

  const heading = document.createElement("h2");
  heading.textContent = room.displayName;
  wrapper.appendChild(heading);

  const message = document.createElement("p");
  if (room.type === "final" && !frontDoorUnlocked()) {
    message.textContent = "Drzwi są zamknięte. Najpierw znajdź wszystkie cztery litery.";
  } else {
    message.textContent = "Zagadka wkrótce.";
  }
  wrapper.appendChild(message);

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "button";
  backButton.textContent = "Wróć do planu";
  backButton.addEventListener("click", () => goTo("map"));
  wrapper.appendChild(backButton);

  return wrapper;
}

// ---------------------------------------------------------------------------
// How to play
//
// Shown once on a fresh save, and reopenable from the "?" button. Kept deliberately spare:
// it sets the goal and gets out of the way. Working out what is interactive is left to the
// player — no prop is outlined, and the popup does not explain the controls.
// ---------------------------------------------------------------------------

const INTRO_PARAGRAPHS = [
  "Ktoś zamknął cię w mieszkaniu. Gdzieś tu ukryte są cztery litery — znajdź wszystkie, ułóż z nich słowo, a drzwi wejściowe się otworzą.",
  "Wszystkie pokoje są otwarte od początku i można je rozwiązywać w dowolnej kolejności, więc jeśli w jednym utkniesz, po prostu zajrzyj do innego.",
  "Nie ma czasomierza ani kary za zgadywanie. Najlepiej gra się we dwoje.",
];

function openIntro({ firstTime }) {
  // Never stack a second copy on top of one that is already open.
  if (document.querySelector(".modal")) return;

  const previouslyFocused = document.activeElement;

  const backdrop = document.createElement("div");
  backdrop.className = "modal";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-label", "Jak grać");

  const panel = document.createElement("div");
  panel.className = "modal__panel";

  const heading = document.createElement("h2");
  heading.className = "modal__title";
  heading.textContent = "Witaj.";
  panel.appendChild(heading);

  for (const text of INTRO_PARAGRAPHS) {
    const paragraph = document.createElement("p");
    paragraph.className = "modal__text";
    paragraph.innerHTML = text;
    panel.appendChild(paragraph);
  }

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "button";
  dismiss.textContent = "Jasne";
  panel.appendChild(dismiss);

  const close = () => {
    backdrop.remove();
    if (firstTime && !state.introSeen) {
      state.introSeen = true;
      saveState();
    }
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  };

  dismiss.addEventListener("click", close);
  backdrop.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close();
  });

  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);
  dismiss.focus();
}

// The "?" lives outside #app so it survives every re-render.
function mountHelpButton() {
  const help = document.createElement("button");
  help.type = "button";
  help.className = "help";
  help.textContent = "?";
  help.setAttribute("aria-label", "Jak grać");
  help.addEventListener("click", () => openIntro({ firstTime: false }));
  document.body.appendChild(help);
}

render();
mountHelpButton();
if (!state.introSeen) openIntro({ firstTime: true });
