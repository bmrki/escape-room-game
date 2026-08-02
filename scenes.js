// Per-room scenes: what the player actually sees and interacts with inside a room.
//
// game.js owns state, navigation and the shared scene chrome (title + Back to Map). This file
// owns the body of each room — the clickable props and puzzle logic. Rooms not listed in SCENES
// fall back to the "Puzzle coming soon" stub, so rooms can be built one at a time.
//
// A scene function receives the room and returns an element to drop into the scene body. It may
// call solvePuzzle() / findClue() from game.js to record progress.

// ---------------------------------------------------------------------------
// The dog
// ---------------------------------------------------------------------------

const DOG_LINES = {
  kitchen:
    "Zjawia się w chwili, gdy ktoś dotknie lodówki. Siada. Czeka. Podchodzi do tego z wyjątkową gracją.",
  herOffice:
    "Śpi twardo na dywaniku, dokładnie w tym jednym miejscu, w które najłatwiej wdepnąć.",
  hisOffice:
    "Uderza dwa razy ogonem o obudowę komputera, dając znać, że czas na zabawę.",
  bathroom:
    "Uszy zwinięte do tyłu. Cokolwiek ma się zaraz wydarzyć w tym pokoju, nie chce brać w tym udziału.",
  balcony:
    "Nos wciśnięty między pręty barierki, obserwuje ulicę jak najlepszy monitoring.",
  mainBedroom:
    "Zwinięty w kłębek na dywanie, zajmuje naprawdę imponującą jego część.",
};

function dogCloseUp(room) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--dog";

  const line = document.createElement("p");
  line.className = "dog-line";
  line.textContent = DOG_LINES[room.id] ?? "Zachwycony, że cię widzi, jak zawsze.";
  panel.appendChild(line);

  const caption = document.createElement("p");
  caption.className = "closeup__note";
  caption.textContent = "Drapiesz go za uchem. W ucieczce to nie pomaga.";
  panel.appendChild(caption);

  return panel;
}

// ---------------------------------------------------------------------------
// Shared feedback
// ---------------------------------------------------------------------------

// Flashes "that was wrong" on an element and then takes it back off, so a momentary mistake
// never becomes a permanent state. Deliberately timer-based rather than listening for
// animationend: `prefers-reduced-motion` disables these animations, and animationend would
// then never fire, leaving the element stuck in its wrong styling forever.
const WRONG_FLASH_MS = 420;

function showWrongFlash(element) {
  element.classList.remove("is-wrong");
  // Force a reflow so a repeated mistake replays the animation instead of doing nothing.
  void element.getBoundingClientRect();
  element.classList.add("is-wrong");
  window.setTimeout(() => element.classList.remove("is-wrong"), WRONG_FLASH_MS);
}

// ---------------------------------------------------------------------------
// Clickable props
//
// Most of what fills a room is there to be looked at, not solved. Anything that only has a
// line to say lives in ROOM_FLAVOUR; the handful that do something small and then deliberately
// lead nowhere live in ROOM_GADGETS. withProps() wires both up, so a scene only has to handle
// the props that are genuinely part of its puzzle.
//
// None of this records progress, and none of it hints at what does. A prop that lands on
// nothing says so plainly, in the same voice as the Balcony telescope — the player should
// never leave one wondering whether they missed something.
// ---------------------------------------------------------------------------

const ROOM_FLAVOUR = {
  livingRoom: {
    bookshelf:
      "Książki kucharskie, rząd kryminałów i półka tych „jak będzie czas”.",
    television:
      "Wyłączony. Pilota, jak zwykle, nigdzie nie ma. W kanapie zostało po nim wgniecenie.",
    cushions:
      "Za poduszkami znajdujesz dwie spinki do włosów, skuwkę od długopisu, garść drobnych " +
      "i coś, co bez wątpienia było kiedyś ciastkiem. Pilota brak.",
    window:
      "Głównie deszcz, jak to w Gdańsku. Kot sąsiadów siedzący " +
      "na środku ulicy, jakby był jej właścicielem.",
    lamp:
      "Wysoka lampa z abażurem w kolorze herbaty. Świeci ciepło i zupełnie za słabo, " +
      "żeby przy niej czytać.",
    sofa:
      "Wgniecenie po lewej stronie jest wyraźnie głębsze. Każde z nich ma tu swoją połowę " +
      "i nikt się o to nie kłóci.",
    paint:
      "Wiaderko farby, pędzel oparty o bok. Ściana za regałem została do pomalowania na inny weekend.",
    box:
      "Karton podpisany markerem: „SALON ????”. Znaki zapytania robią tu całą robotę.",
  },

  kitchen: {
    fridge:
      "Magnesy z trzech różnych wyjazdów i lista zakupów, na której " +
      "ktoś dopisał na dole „i coś dobrego”.",
    kettle:
      "Jeszcze ciepły. Woda była nastawiona i najwyraźniej nikt jej nie zdążył wypić.",
    shelf:
      "Słoiki podpisane taśmą malarską: „ryż”, „kasza”, „?”. Ten ostatni jest w połowie pusty.",
    sink:
      "Dwa kubki i talerz. Zmywanie przerwane, bo nie starczyło już sił.",
    cabinets:
      "Zapasowe talerze, waza, której nikt nigdy nie użył, i torba pełna innych toreb.",
    window:
      "Ogrody działkowe, zapach grilla i te dwa żule, których widać tam ZAWSZE.",
    sideTable:
      "Miska z owocami. Dwa jabłka, banan i coś, co jeszcze niedawno było mandarynką.",
    flatpack: "Szafka z IKEA czekająca na złożenie.",
  },

  herOffice: {
    lamp:
      "Zapalasz ją. Ciepły krąg światła pada dokładnie na środek blatu. Gasisz z powrotem.",
    notebook:
      "Cztery strony zapisane nierównomiernie, widać że ktoś trenował nowy podpis.",
    mug: "Barista",
    plant:
      "Rośnie mimo wszystko. Nikt już nie pamięta, kiedy była podlewana ostatni raz.",
    drawer:
      "Trzy kremy do rąk na wykończeniu, paczka bakali i kolekcja suplementów.",
  },

  hisOffice: {
    window:
      "Widok na to samo podwórko, co z kuchni, tylko pod nieco lepszym kątem.",
    keyboard:
      "Klawisze W, A, S i D są wytarte wyraźnie bardziej niż cała reszta.",
    mug:
      "Fusy po kawie ułożyły się w dziwny znak, ale na nic Ci się to nie przyda.",
    note:
      "Żółta karteczka przyklejona do biurka. Napisane na niej: „NIE ZAPOMNIJ”. Nic więcej.",
    tower:
      "Szumi cicho i miga zieloną diodą. Robi coś swojego i nie zamierza się tłumaczyć.",
    plant:
      "Sztuczna. Odkurzona zaskakująco niedawno.",
  },

  bathroom: {
    shower:
      "Odwieszona równo w uchwycie, wąż zwinięty pod nią. Na sitku została jeszcze kropla czy dwie.",
    towels:
      "Dwa ręczniki, każdy w innym kolorze.",
    sauna:
      "Przez szybę widać ławkę i kosz z kamieniami. Pachnie rozgrzaną sosną.",
    saunaHandle:
      "Drewniana i ciepła, chociaż sauna stoi wyłączona.",
  },

  mainBedroom: {
    window:
      "Noc, ogródki i jedno okno naprzeciwko, w którym ktoś jeszcze nie śpi.",
    bed:
      "Zasłane. Poduszki ułożone przez kogoś, kto naprawdę się starał.",
    lamp:
      "Klikasz włącznikiem. Nic. Kiedyś się naprawi.",
    rug:
      "Miękki. Zaglądasz pod niego. Podłoga.",
  },

  guestBedroom: {
    wardrobe:
      "Prawie pusta. Trzy wieszaki, zapasowa kołdra i mnóstwo półek, które dopiero się zapełnią.",
    bed:
      "Mnóstwo poduszek — Soma lubi to.",
    nightstand:
      "W szufladzie ładowarka do telefonu, którego już nikt w tym domu nie ma.",
    rug:
      "Jest tutaj, bo jeszcze nie wiadomo gdzie ma być.",
    ladder:
      "Rozstawiona na środku, bo tak jest szybciej, niż składać ją co wieczór.",
  },

  balcony: {
    panorama:
      "Panorama Gdańska, drzewa, na jednym siedzi ptak, który daje o sobie znać od 4 rano.",
    railing:
      "Niżej parking, na którym nic się nie dzieje.",
    table:
      "Mały stolik i kubek po kawie. Ktoś tu siedział całkiem niedawno.",
  },

  frontDoor: {
    umbrellas:
      "Dwa parasole. W tym mieście niezbędne.",
    doormat:
      "Zaglądasz pod wycieraczkę. Oczywiście, że zaglądasz. Nic tam nie ma.",
    transom:
      "Okienko nad drzwiami. Za małe, żeby się przez nie przecisnąć, i za wysoko, żeby próbować.",
    handle:
      "Klamka porusza się swobodnie, w obie strony, zupełnie bez oporu. Drzwi ani drgną.",
    box: "Pudło z rzeczami, które nie mają jeszcze swojego miejsca.",
  },
};

// Props that do something before they lead nowhere. Keyed "roomId.hotspotName". Each builds
// its own close-up; none of them touch state.
const ROOM_GADGETS = {
  "kitchen.stove": stoveGadget,
  "hisOffice.books": bookshelfGadget,
  "bathroom.tub": drippingTapGadget,
  "frontDoor.coats": coatPocketsGadget,
};

// Wraps a scene's hotspot handler so the props every room shares — the dog, the flavour props,
// the gadgets — behave identically everywhere. Anything the room itself owns falls through.
function withProps(body, room, handler) {
  return (name) => {
    if (name === "dog") {
      openCloseUp(body, dogCloseUp(room));
      return;
    }

    const gadget = ROOM_GADGETS[`${room.id}.${name}`];
    if (gadget) {
      openCloseUp(body, gadget());
      return;
    }

    const line = ROOM_FLAVOUR[room.id]?.[name];
    if (line) {
      openCloseUp(body, flavourCloseUp(line));
      return;
    }

    handler(name);
  };
}

function flavourCloseUp(text) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--dog";

  const line = document.createElement("p");
  line.className = "dog-line";
  line.textContent = text;
  panel.appendChild(line);

  return panel;
}

// ---------------------------------------------------------------------------
// Gadgets
//
// Four small things that respond to being fiddled with and then, quite openly, amount to
// nothing. They are here so that not every interactive prop turns out to be a puzzle — the
// flat is more fun to search when some of it just answers back.
//
// Each builds a close-up around the same three parts: a drawing, a running line of text, and
// a closing line once the player has exhausted it. None of them read or write state.
// ---------------------------------------------------------------------------

// Shared shell: a drawing on top, a line of text under it, and a final line that only appears
// once the thing is done with.
function gadgetPanel(drawing, opening) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--gadget";

  const stage = document.createElementNS(SVG_NS, "svg");
  stage.setAttribute("class", "gadget");
  stage.setAttribute("viewBox", drawing.viewBox);
  panel.appendChild(stage);

  const line = document.createElement("p");
  line.className = "gadget__line";
  line.textContent = opening;
  panel.appendChild(line);

  const done = document.createElement("p");
  done.className = "closeup__note";
  panel.appendChild(done);

  return { panel, stage, say: (text) => { line.textContent = text; }, finish: (text) => { done.textContent = text; } };
}

// Makes an SVG group clickable the same way a hotspot is, keyboard included.
function gadgetButton(markup, label, onPick) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "gadget__part");
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute("aria-label", label);
  group.innerHTML = markup;

  group.addEventListener("click", () => onPick(group));
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPick(group);
    }
  });

  return group;
}

// Kitchen: four stove knobs, none of them pointing the same way. Line them all up and the
// oven lights up, which is the entire reward.
const STOVE_START = [1, 3, 2, 1]; // quarter-turns off vertical, so it never starts solved

function stoveGadget() {
  const { panel, stage, say, finish } = gadgetPanel(
    { viewBox: "0 0 320 190" },
    "Cztery pokrętła, każde ustawione inaczej."
  );

  stage.innerHTML =
    `<rect x="16" y="16" width="288" height="158" rx="10" fill="#e9dfd0" stroke="#a98a70" stroke-width="3"/>` +
    `<rect x="34" y="112" width="252" height="46" rx="6" fill="#b9a894" stroke="#a98a70" stroke-width="2.5"/>` +
    `<rect x="48" y="124" width="224" height="22" rx="4" fill="#8f8175"/>`;

  const glow = document.createElementNS(SVG_NS, "rect");
  glow.setAttribute("x", "48");
  glow.setAttribute("y", "124");
  glow.setAttribute("width", "224");
  glow.setAttribute("height", "22");
  glow.setAttribute("rx", "4");
  glow.setAttribute("fill", "#e6b45e");
  glow.setAttribute("opacity", "0");
  stage.appendChild(glow);

  const turns = [...STOVE_START];
  const knobs = [];

  const check = () => {
    if (!turns.every((quarter) => quarter % 4 === 0)) return;
    glow.setAttribute("opacity", "0.9");
    for (const knob of knobs) knob.removeAttribute("tabindex");
    say("Wszystkie cztery w pionie. W piekarniku zapala się światło.");
    finish("W środku jest pusto i bardzo czysto. Gasisz go i zamykasz drzwiczki.");
  };

  turns.forEach((_, index) => {
    const cx = 62 + index * 66;
    const knob = gadgetButton(
      `<circle cx="${cx}" cy="66" r="24" fill="#d8ccbb" stroke="#8a7263" stroke-width="3"/>` +
        `<g class="gadget__pointer"><path d="M ${cx} 66 V 48" stroke="#5c4b40" stroke-width="5" ` +
        `stroke-linecap="round"/></g>`,
      `Pokrętło ${index + 1} z 4`,
      (group) => {
        turns[index] += 1;
        group
          .querySelector(".gadget__pointer")
          .setAttribute("transform", `rotate(${turns[index] * 90} ${cx} 66)`);
        check();
      }
    );
    knob
      .querySelector(".gadget__pointer")
      .setAttribute("transform", `rotate(${turns[index] * 90} ${cx} 66)`);
    knobs.push(knob);
    stage.appendChild(knob);
  });

  return panel;
}

// His Office: six books, six spines, one of them hollow. Pulling all six out is the whole game.
const BOOK_SPINES = [
  { fill: "#7f96ad", line: "Podręcznik do chemii organicznej. Zamiast zakładki — bilet z kina." },
  { fill: "#a9846f", line: "Kryminał. Ktoś zagiął róg na dwunastej stronie i nigdy tu nie wrócił." },
  { fill: "#8fa88f", line: "Atlas świata z granicami, których od dawna już nie ma." },
  { fill: "#c19a6b", line: "Książka kucharska, otwierana wyłącznie na jednym przepisie." },
  { fill: "#8d7f9e", line: "Gruby tom o sieciach komputerowych. Grzbiet nietknięty." },
  { fill: "#cf7b52", line: "Ta jest wydrążona. W środku karta biblioteczna, przeterminowana o sześć lat." },
];

// Where the row of books stands. Kept as constants because the affordances — the pull notch,
// the raised "already read" position — all have to line up with the spines themselves.
const BOOK_SHELF_Y = 132;
const BOOK_WIDTH = 36;
const BOOK_GAP = 8;
const BOOK_FIRST_X = 22;
const BOOK_LIFT = 14; // how far a pulled book stands proud of the row

function bookshelfGadget() {
  const { panel, stage, say, finish } = gadgetPanel(
    { viewBox: "0 0 300 184" },
    "Sześć grzbietów. Każdy da się wyciągnąć."
  );

  // A back panel and a thick board, so the row reads as books in a bookcase rather than as a
  // row of coloured bars.
  stage.innerHTML =
    `<rect x="14" y="34" width="272" height="98" rx="4" fill="#e2d6c0" stroke="#8f7c62" ` +
    `stroke-width="2.5"/>` +
    `<rect x="14" y="${BOOK_SHELF_Y}" width="272" height="16" rx="4" fill="#b09a7c" ` +
    `stroke="#8f7c62" stroke-width="3"/>`;

  const pulled = new Set();

  BOOK_SPINES.forEach((book, index) => {
    const x = BOOK_FIRST_X + index * (BOOK_WIDTH + BOOK_GAP);
    const height = 66 + (index % 3) * 8;
    const top = BOOK_SHELF_Y - height;
    const mid = x + BOOK_WIDTH / 2;

    const spine = gadgetButton(
      `<rect x="${x}" y="${top}" width="${BOOK_WIDTH}" height="${height}" rx="3" ` +
        `fill="${book.fill}" stroke="#8f7c62" stroke-width="2"/>` +
        // A paper label across the spine, and a finger notch at the head of it — the two
        // things that make a drawn rectangle read as a book you are meant to pull out.
        `<rect x="${x + 6}" y="${top + 24}" width="${BOOK_WIDTH - 12}" height="20" rx="2" ` +
        `fill="#f2ece0" opacity="0.75"/>` +
        `<path d="M ${mid - 8} ${top + 4} a 8 6 0 0 0 16 0" fill="#00000022"/>`,
      `Książka ${index + 1} z 6`,
      (group) => {
        say(book.line);
        if (pulled.has(index)) return;
        pulled.add(index);
        // Leave it standing proud of the row, so it is obvious which ones are already read.
        group.setAttribute("transform", `translate(0 -${BOOK_LIFT})`);
        if (pulled.size < BOOK_SPINES.length) return;
        finish("Wszystkie sześć wraca na półkę. Żadna z nich nie otwiera drzwi.");
      }
    );
    stage.appendChild(spine);
  });

  return panel;
}

// Bathroom: a mixer tap that drips, steadily. Three turns of the lever and it stops.
//
// The copy here is deliberately flat and kind. An earlier version closed on "the only thing
// in this flat anyone managed to fix today", which is a dig at the friends' home — not what
// a gift should say about the place it is a gift for.
const TAP_TURNS = ["Kap.", "Kap.", "…kap."];

function drippingTapGadget() {
  const { panel, stage, say, finish } = gadgetPanel(
    { viewBox: "0 0 260 180" },
    "Bateria kapie. Miarowo, co kilka sekund."
  );

  stage.innerHTML =
    // the tub rim the tap is mounted on
    `<rect x="30" y="118" width="200" height="44" rx="14" fill="#f7fbfa" stroke="#8fa8a6" ` +
    `stroke-width="3"/>` +
    // escutcheon, body column, then the gooseneck spout with a highlight along its back
    `<rect x="132" y="102" width="32" height="18" rx="5" fill="#c9c2b6" stroke="#8fa8a6" ` +
    `stroke-width="2.5"/>` +
    `<rect x="138" y="54" width="20" height="50" rx="9" fill="#d5cfc4" stroke="#8fa8a6" ` +
    `stroke-width="2.5"/>` +
    `<path d="M 148 58 V 44 Q 148 30 126 30 H 104 V 48" fill="none" stroke="#b6a495" ` +
    `stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M 148 52 V 44 Q 148 35 126 35 H 108" fill="none" stroke="#d5cfc4" ` +
    `stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

  const drop = document.createElementNS(SVG_NS, "circle");
  drop.setAttribute("cx", "104");
  drop.setAttribute("cy", "60");
  drop.setAttribute("r", "5");
  drop.setAttribute("fill", "#8fbcd6");
  stage.appendChild(drop);

  let turned = 0;
  // A single lever, drawn as one filled shape so the whole of it is clickable.
  const lever = gadgetButton(
    `<rect x="146" y="58" width="40" height="13" rx="6.5" fill="#c9a55f" stroke="#8a7263" ` +
      `stroke-width="2.5"/>`,
    "Dźwignia baterii",
    (group) => {
      if (turned >= TAP_TURNS.length) return;
      say(TAP_TURNS[turned]);
      turned += 1;
      group.setAttribute("transform", `rotate(${turned * 22} 152 64.5)`);
      if (turned < TAP_TURNS.length) return;
      drop.setAttribute("opacity", "0");
      group.removeAttribute("tabindex");
      finish("Cisza. Bateria zakręcona do końca.");
    }
  );
  stage.appendChild(lever);

  return panel;
}

// Front Door: four coat pockets, four things in them, no keys. Shaped exactly like something
// that matters and quite deliberately isn't.
const COAT_POCKETS = [
  "Bilet autobusowy, skasowany, bez daty.",
  "Landrynka w papierku, stara jak świat.",
  "To tylko maseczka z czasów Covid.",
  "Paragon za karmę i dwie bułki.",
];

function coatPocketsGadget() {
  const { panel, stage, say, finish } = gadgetPanel(
    { viewBox: "0 0 280 190" },
    "Dwa płaszcze, cztery kieszenie."
  );

  stage.innerHTML =
    `<path d="M 62 24 l -34 28 l 10 122 h 50 l 8 -122 z" fill="#8fa88f" stroke="#a98a70" stroke-width="3" ` +
    `stroke-linejoin="round"/>` +
    `<path d="M 196 24 l -30 26 l 10 124 h 46 l 6 -124 z" fill="#cf7b52" stroke="#a98a70" stroke-width="3" ` +
    `stroke-linejoin="round"/>`;

  const searched = new Set();
  // Inset from each coat's own edges, so no pocket hangs off the cloth.
  const at = [
    { x: 38, y: 102 },
    { x: 68, y: 102 },
    { x: 172, y: 104 },
    { x: 198, y: 104 },
  ];

  COAT_POCKETS.forEach((found, index) => {
    const spot = at[index];
    const pocket = gadgetButton(
      // `fill="transparent"`, never `fill="none"` — with no fill only the dashed outline is
      // hit-testable, and the pocket has to be clickable right across its face.
      `<rect x="${spot.x}" y="${spot.y}" width="24" height="26" rx="4" fill="transparent" ` +
        `stroke="#6f6a5c" stroke-width="2.5" stroke-dasharray="5 4"/>`,
      `Kieszeń ${index + 1} z 4`,
      (group) => {
        say(found);
        if (searched.has(index)) return;
        searched.add(index);
        group.querySelector("rect").setAttribute("stroke-dasharray", "none");
        if (searched.size < COAT_POCKETS.length) return;
        finish("Cztery kieszenie, cztery znaleziska, zero kluczy.");
      }
    );
    stage.appendChild(pocket);
  });

  return panel;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

// Nominative — how a month is written at the top of a calendar page.
const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

// Genitive — the form Polish uses when a day comes first: "2 września 2023".
const MONTH_NAMES_OF = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];

// Monday-first, matching how the calendar would actually hang on their wall.
const WEEKDAY_INITIALS = ["P", "W", "Ś", "C", "P", "S", "N"];

// A fixed year so the grid never shifts around underneath the player, and a leap year so a
// 29 February date still lands on a real square.
// Which part of the meaningful date Her Office reads as an atomic number. Configurable rather
// than hardcoded because the date is fixed and the chemistry has to bend around it: their date
// falls on the 2nd, and element 2 is helium — a noble gas that forms nothing with hydrogen.
// The month (9) is fluorine, which makes a real acid. See PERSONALIZATION.atomicNumberFrom.
function atomicNumberFor(date) {
  return PERSONALIZATION.atomicNumberFrom === "month" ? date.month : date.day;
}

function atomicNumberSource() {
  return PERSONALIZATION.atomicNumberFrom === "month" ? "month" : "day";
}

// PERSONALIZATION.meaningfulDate is "MM-DD". Returns null if it isn't a real date, so the
// scene can say so plainly instead of rendering a broken calendar.
// PERSONALIZATION.meaningfulDate is "YYYY-MM-DD". ISO order on purpose: "02-09-2023" is
// genuinely ambiguous between 2 September and 9 February, and the difference used to decide
// which element Her Office wanted. Year-first can only be read one way.
function parseMonthDay(value) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(value ?? "").trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;

  // Days in that real month, so 29 February only passes in an actual leap year.
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;

  return { year, month, day, daysInMonth, monthName: MONTH_NAMES[month - 1] };
}

function formatMonthDay(date) {
  return `${date.day} ${MONTH_NAMES_OF[date.month - 1]} ${date.year}`;
}

// PERSONALIZATION.meaningfulTime is "HH:MM" on a 24-hour clock. A single-digit hour is
// tolerated ("9:05"), everything else is rejected so the scene can say so plainly.
function parseTimeOfDay(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? "").trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes, label: formatTimeOfDay(hours, minutes) };
}

function formatTimeOfDay(hours, minutes) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Kitchen — clue room: click the wall calendar to reveal a circled date.
// The day-of-month is later read as an atomic number in Her Office.
// ---------------------------------------------------------------------------

function kitchenScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const date = parseMonthDay(PERSONALIZATION.meaningfulDate);

  const art = renderSceneArt(room, {
    onHotspot: withProps(body, room, (name) => {
      if (name !== "calendar") return;
      if (date) {
        findClue(room.id, "meaningfulDate", PERSONALIZATION.meaningfulDate);
      }
      openCloseUp(body, calendarCloseUp(date));
    }),
  });
  body.appendChild(art);

  const hint = document.createElement("p");
  hint.className = "scene__hint";
  if (state.found[room.id] && date) {
    hint.innerHTML = `Na kalendarzu zakreślona jest data: <strong>${formatMonthDay(date)}</strong>.`;
  } else {
    hint.textContent = "Coś tutaj zasługuje na bliższe przyjrzenie się.";
  }
  body.appendChild(hint);

  return body;
}

// The close-up: a month page with one day ringed in red.
function calendarCloseUp(date) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--calendar";

  if (!date) {
    panel.appendChild(
      configError(
        `PERSONALIZATION.meaningfulDate is "${PERSONALIZATION.meaningfulDate}", which isn't a real date. ` +
          `Expected "MM-DD", for example "03-14".`
      )
    );
    return panel;
  }

  const sheet = document.createElement("div");
  sheet.className = "calendar";

  const month = document.createElement("div");
  month.className = "calendar__month";
  month.textContent = `${date.monthName} ${date.year}`;
  sheet.appendChild(month);

  const grid = document.createElement("div");
  grid.className = "calendar__grid";

  for (const initial of WEEKDAY_INITIALS) {
    const head = document.createElement("span");
    head.className = "calendar__dow";
    head.setAttribute("aria-hidden", "true");
    head.textContent = initial;
    grid.appendChild(head);
  }

  // getDay() is Sunday-based; shift so Monday starts the week.
  // The real year, so the weekday layout is genuinely that month's.
  const firstOfMonth = new Date(date.year, date.month - 1, 1).getDay();
  const leadingBlanks = (firstOfMonth + 6) % 7;
  for (let i = 0; i < leadingBlanks; i += 1) {
    const blank = document.createElement("span");
    blank.className = "calendar__blank";
    grid.appendChild(blank);
  }

  for (let day = 1; day <= date.daysInMonth; day += 1) {
    const cell = document.createElement("span");
    cell.className = "calendar__day";
    cell.textContent = day;
    if (day === date.day) {
      cell.classList.add("is-circled");
      cell.setAttribute("aria-label", `${formatMonthDay(date)} — zakreślona`);
    }
    grid.appendChild(cell);
  }

  sheet.appendChild(grid);
  panel.appendChild(sheet);

  const note = document.createElement("p");
  note.className = "closeup__note";
  note.textContent = "Jedna data zakreślona, raz za razem, czerwonym długopisem.";
  panel.appendChild(note);

  return panel;
}

// ---------------------------------------------------------------------------
// Her Office — puzzle room: read the Kitchen date's day-of-month as an atomic number,
// look the element up on the poster, then drop it and a Hydrogen jar into the beaker.
// Yields letter 1 of the final word.
// ---------------------------------------------------------------------------

// Which jars stand on the shelf: always Hydrogen and the answer, padded out with neighbours
// so the poster lookup is what tells you which one to reach for. Deterministic, and sorted
// by atomic number so the shelf reads like a shelf.
function shelfElements(target, count) {
  const chosen = new Map();
  chosen.set(1, getElementByNumber(1));
  chosen.set(target.number, target);

  for (let offset = 1; chosen.size < count && offset < ELEMENTS.length; offset += 1) {
    for (const candidate of [target.number - offset, target.number + offset]) {
      if (chosen.size >= count) break;
      const element = getElementByNumber(candidate);
      // Noble gases would be misleading decoys here — they make nothing with hydrogen.
      if (element && element.hydride && !chosen.has(element.number)) {
        chosen.set(element.number, element);
      }
    }
  }

  return [...chosen.values()].sort((a, b) => a.number - b.number);
}

function herOfficeScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const date = parseMonthDay(PERSONALIZATION.meaningfulDate);
  const letter = letterForRoom(room);

  // Everything below depends on the personalization values being usable, so check first and
  // say plainly what is wrong rather than rendering an unsolvable puzzle.
  if (!date) {
    body.appendChild(
      configError(
        `This puzzle reads the day-of-month from PERSONALIZATION.meaningfulDate, but that is ` +
          `"${PERSONALIZATION.meaningfulDate}", which isn't a real date. Expected "MM-DD".`
      )
    );
    return body;
  }

  const atomicNumber = atomicNumberFor(date);
  const target = getElementByNumber(atomicNumber);
  if (!target) {
    body.appendChild(
      configError(
        `No element has atomic number ${atomicNumber}. That came from the ` +
          `${atomicNumberSource()} of PERSONALIZATION.meaningfulDate.`
      )
    );
    return body;
  }
  if (!target.hydride) {
    body.appendChild(
      configError(
        `The ${atomicNumberSource()} of PERSONALIZATION.meaningfulDate is ${atomicNumber}, ` +
          `which is ${target.name} — a noble gas, and it forms nothing with hydrogen, so this ` +
          `puzzle has no answer. Don't change the date: switch ` +
          `PERSONALIZATION.atomicNumberFrom between "day" and "month" and see if the other ` +
          `one lands somewhere usable. 9 and 17 are the best (HF and HCl); 2, 10 and 18 are ` +
          `the noble gases to avoid.`
      )
    );
    return body;
  }
  if (!letter) {
    body.appendChild(
      configError(
        `This room yields letter ${room.letterPosition} of PERSONALIZATION.finalWord, but that ` +
          `is "${PERSONALIZATION.finalWord}" — it must be exactly ${letterRooms().length} ` +
          `letters, one per letter-yielding room.`
      )
    );
    return body;
  }

  const solved = state.solved[room.id];
  const beakerContents = [];

  const stage = renderSceneArt(room, {
    onHotspot: withProps(body, room, (name) => {
      if (name === "poster") openCloseUp(body, periodicTableCloseUp(target));
    }),
  });
  const overlay = stage.querySelector(".scene__hotspots");
  body.appendChild(stage);

  const hint = document.createElement("p");
  hint.className = "scene__hint";

  const setHint = (text) => {
    hint.textContent = text;
  };

  if (solved) {
    hint.innerHTML =
      `W zlewce wciąż czuć delikatnie ${target.hydride.name}, a karteczka z szuflady leży na ` +
      `biurku: <strong>${letter}</strong>.`;
    overlay.appendChild(drawLetterCard(letter, { x: 584, y: 304 }));
  } else {
    setHint("Do zlewki trafiają dwa słoiki. Plakat podpowiada które.");
  }

  // --- the beaker -----------------------------------------------------------
  const beaker = drawBeaker(room.scene.beaker);
  overlay.appendChild(beaker.group);

  const refreshBeaker = () => {
    beaker.setContents(beakerContents.map((element) => element.symbol));
  };

  // Once solved the beaker keeps the finished compound, matching what the hint says.
  if (solved) beaker.setContents([target.hydride.formula]);

  const addToBeaker = (element) => {
    if (solved || beakerContents.length >= 2) return;
    beakerContents.push(element);
    refreshBeaker();

    if (beakerContents.length < 2) {
      setHint(`${element.name} wpada do zlewki. Jeszcze jeden.`);
      return;
    }

    // Correct means the two jars are Hydrogen and the target, in either order. When the target
    // IS hydrogen (a date landing on the 1st) that means two Hydrogen jars, which still works.
    const poured = beakerContents.map((item) => item.number).sort((a, b) => a - b);
    const wanted = [1, target.number].sort((a, b) => a - b);
    const correct = poured[0] === wanted[0] && poured[1] === wanted[1];

    if (correct) {
      solvePuzzle(room.id, { letter: { position: room.letterPosition, value: letter } });
      openCloseUp(body, reactionCloseUp(target, letter, room.letterPosition));
      return;
    }

    beaker.shake();
    setHint("Mieszanina po prostu tam stoi. Nic się nie dzieje.");
    window.setTimeout(() => {
      beakerContents.length = 0;
      refreshBeaker();
    }, 700);
  };

  // --- the jars -------------------------------------------------------------
  if (!solved) {
    const shelf = room.scene.shelf;
    const jars = shelfElements(target, shelf.count);
    jars.forEach((element, index) => {
      const jar = drawJar(element, {
        x: shelf.x + index * shelf.spacing,
        y: shelf.y,
      });
      makeJarInteractive(jar, overlay, beaker, () => addToBeaker(element));
      overlay.appendChild(jar);
    });
  }

  body.appendChild(hint);
  return body;
}

// A labelled jar on the shelf. Returns an <g> positioned at its resting spot.
function drawJar(element, position) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "jar");
  group.setAttribute("transform", `translate(${position.x} ${position.y})`);
  group.dataset.home = `${position.x} ${position.y}`;
  group.dataset.symbol = element.symbol;
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute("aria-label", `Słoik: ${element.name}, ${element.symbol}`);

  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = `${element.name} (${element.symbol})`;
  group.appendChild(title);

  // An invisible grab area around the jar. The drawn jar is about 39x44 in scene units, which
  // on a phone lands at roughly 21x24 real pixels — half the 44px a fingertip needs. This
  // widens the target to just under the shelf spacing (64) without overlapping its neighbours.
  // `transparent`, never `none`: a shape with no fill is only hit-tested on its stroke.
  const grab = document.createElementNS(SVG_NS, "rect");
  grab.setAttribute("x", "-31");
  grab.setAttribute("y", "-58");
  grab.setAttribute("width", "62");
  grab.setAttribute("height", "70");
  grab.setAttribute("fill", "transparent");
  group.appendChild(grab);

  const lid = document.createElementNS(SVG_NS, "rect");
  lid.setAttribute("class", "jar__lid");
  lid.setAttribute("x", "-15");
  lid.setAttribute("y", "-46");
  lid.setAttribute("width", "30");
  lid.setAttribute("height", "9");
  lid.setAttribute("rx", "3");
  group.appendChild(lid);

  const glass = document.createElementNS(SVG_NS, "rect");
  glass.setAttribute("class", "jar__glass");
  glass.setAttribute("x", "-21");
  glass.setAttribute("y", "-38");
  glass.setAttribute("width", "42");
  glass.setAttribute("height", "40");
  glass.setAttribute("rx", "6");
  group.appendChild(glass);

  const label = document.createElementNS(SVG_NS, "rect");
  label.setAttribute("class", "jar__label");
  label.setAttribute("x", "-18");
  label.setAttribute("y", "-27");
  label.setAttribute("width", "36");
  label.setAttribute("height", "20");
  label.setAttribute("rx", "3");
  group.appendChild(label);

  const symbol = document.createElementNS(SVG_NS, "text");
  symbol.setAttribute("class", "jar__symbol");
  symbol.setAttribute("x", "0");
  symbol.setAttribute("y", "-17");
  symbol.textContent = element.symbol;
  group.appendChild(symbol);

  return group;
}

// The beaker on the desk: glass outline, a liquid level that rises as jars go in, and the
// symbols of whatever has been poured in so far.
function drawBeaker(position) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "beaker");
  group.setAttribute("transform", `translate(${position.x} ${position.y})`);

  const liquid = document.createElementNS(SVG_NS, "rect");
  liquid.setAttribute("class", "beaker__liquid");
  liquid.setAttribute("x", "-25");
  liquid.setAttribute("width", "50");
  group.appendChild(liquid);

  const glass = document.createElementNS(SVG_NS, "path");
  glass.setAttribute("class", "beaker__glass");
  glass.setAttribute("d", "M -31 -70 L -27 -8 Q -26 -2 -20 -2 H 20 Q 26 -2 27 -8 L 31 -70");
  group.appendChild(glass);

  const spout = document.createElementNS(SVG_NS, "path");
  spout.setAttribute("class", "beaker__rim");
  spout.setAttribute("d", "M -31 -70 H 31");
  group.appendChild(spout);

  const contents = document.createElementNS(SVG_NS, "text");
  contents.setAttribute("class", "beaker__contents");
  contents.setAttribute("x", "0");
  contents.setAttribute("y", "-22");
  group.appendChild(contents);

  return {
    group,
    setContents(symbols) {
      contents.textContent = symbols.join(" + ");
      const level = symbols.length * 22;
      liquid.setAttribute("y", `${-6 - level}`);
      liquid.setAttribute("height", `${level}`);
      group.classList.toggle("has-contents", symbols.length > 0);
    },
    shake() {
      showWrongFlash(group);
    },
    contains(point) {
      const box = group.getBBox();
      return (
        point.x >= position.x + box.x &&
        point.x <= position.x + box.x + box.width &&
        point.y >= position.y + box.y &&
        point.y <= position.y + box.y + box.height
      );
    },
  };
}

// Jars can be dragged into the beaker, or just clicked / Entered — the click path is what
// makes this work on a keyboard, and on a touchscreen that fumbles the drag.
function makeJarInteractive(jar, overlay, beaker, onUse) {
  let dragging = false;
  let moved = false;

  const toSvgPoint = (event) => {
    const ctm = overlay.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const point = overlay.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(ctm.inverse());
  };

  const goHome = () => {
    const [x, y] = jar.dataset.home.split(" ");
    jar.setAttribute("transform", `translate(${x} ${y})`);
    jar.classList.remove("is-dragging");
  };

  jar.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dragging = true;
    moved = false;
    jar.setPointerCapture(event.pointerId);
    jar.classList.add("is-dragging");
  });

  jar.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    moved = true;
    const point = toSvgPoint(event);
    jar.setAttribute("transform", `translate(${point.x} ${point.y})`);
    jar.classList.toggle("is-over-target", beaker.contains(point));
  });

  jar.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    dragging = false;
    const dropped = beaker.contains(toSvgPoint(event));
    jar.classList.remove("is-over-target");
    goHome();
    if (moved && dropped) onUse();
  });

  jar.addEventListener("lostpointercapture", () => {
    dragging = false;
    goHome();
  });

  // A click that wasn't a drag counts as "use this jar".
  jar.addEventListener("click", () => {
    if (!moved) onUse();
  });

  jar.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onUse();
    }
  });
}

// The found letter fragment, left lying on the desk so the room shows its own answer.
function drawLetterCard(letter, position) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "found-card");
  group.setAttribute("transform", `translate(${position.x} ${position.y})`);

  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = `Karteczka z literą ${letter}`;
  group.appendChild(title);

  const card = document.createElementNS(SVG_NS, "rect");
  card.setAttribute("class", "found-card__paper");
  card.setAttribute("x", "-27");
  card.setAttribute("y", "-13");
  card.setAttribute("width", "54");
  card.setAttribute("height", "26");
  card.setAttribute("rx", "3");
  group.appendChild(card);

  const glyph = document.createElementNS(SVG_NS, "text");
  glyph.setAttribute("class", "found-card__letter");
  glyph.setAttribute("x", "0");
  glyph.setAttribute("y", "0");
  glyph.textContent = letter;
  group.appendChild(glyph);

  return group;
}

// The poster, close up: a real periodic-table layout for the first 31 elements.
// `target` is the element the date points at. It is only used to decide whether the second
// scribble belongs on the poster — the table itself is always the full one.
function periodicTableCloseUp(target) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--poster";

  const heading = document.createElement("p");
  heading.className = "poster__heading";
  heading.textContent = "Pierwiastki";
  panel.appendChild(heading);

  const scroller = document.createElement("div");
  scroller.className = "poster__scroller";

  const table = document.createElement("div");
  table.className = "poster__table";
  for (const element of ELEMENTS) {
    const cell = document.createElement("div");
    cell.className = "poster__cell";
    cell.style.gridColumn = element.group;
    cell.style.gridRow = element.period;
    cell.innerHTML =
      `<span class="poster__number">${element.number}</span>` +
      `<span class="poster__symbol">${element.symbol}</span>` +
      `<span class="poster__name">${element.name}</span>`;
    table.appendChild(cell);
  }
  scroller.appendChild(table);
  panel.appendChild(scroller);

  // The only marginalia on the poster. It replaced a pencilled "H" beside hydrogen's own cell,
  // which said nothing the table did not already say — this one names the acid sideways, and
  // naming the acid names both jars.
  //
  // Shown only when the answer really is hydrofluoric acid: the compound follows
  // PERSONALIZATION, and the line would be a lie about any other one.
  if (target?.hydride?.formula === "HF") {
    const note = document.createElement("p");
    note.className = "closeup__note";
    note.textContent = "Wanna w Breaking Bad, tu nie ma zasad.";
    panel.appendChild(note);
  }

  return panel;
}

// The payoff: the reaction, then the drawer.
function reactionCloseUp(target, letter, position) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--reaction";

  const formula = document.createElement("p");
  formula.className = "reaction__formula";
  formula.textContent = `H + ${target.symbol} → ${target.hydride.formula}`;
  panel.appendChild(formula);

  const name = document.createElement("p");
  name.className = "reaction__name";
  name.textContent = target.hydride.name;
  panel.appendChild(name);

  const note = document.createElement("p");
  note.className = "closeup__note";
  note.textContent =
    "W zlewce coś syczy, pod biurkiem coś klika i wysuwa się szuflada.";
  panel.appendChild(note);

  const card = document.createElement("div");
  card.className = "letter-card";
  card.innerHTML =
    `<span class="letter-card__letter">${letter}</span>` +
    `<span class="letter-card__caption">jedna z czterech</span>`;
  panel.appendChild(card);

  return panel;
}

// ---------------------------------------------------------------------------
// His Office — puzzle room: a fake Windows console. List the folder with hidden files
// shown, find number.txt, read it. Yields clueValues.favoriteNumber (the Bathroom sauna
// dial target), not a letter of the final word.
//
// Note: 03 Rooms and Puzzles.md specifies a Linux command (`ls -la`). Changed to Windows
// cmd/PowerShell at the user's request — both shells are accepted, and the listing is
// rendered in whichever style the player used.
// ---------------------------------------------------------------------------

const TERMINAL_CWD = "C:\\LOCKED";

const TERMINAL_BANNER = [
  "Microsoft Windows [Wersja 10.0.22631.3737]",
  "(c) Microsoft Corporation. Wszelkie prawa zastrzeżone.",
  "",
  "SYSTEM ZABLOKOWANY.",
  "Jeden plik w tym folderze jest ukryty. Znajdź go, a potem odczytaj.",
  "Wpisz HELP, jeśli utkniesz.",
  "",
];

function terminalFiles(number) {
  return [
    {
      name: "readme.txt",
      size: 1204,
      date: "14/03/2019",
      time: "09:41",
      hidden: false,
      body: [
        "Nic ważnego tutaj nie ma.",
        "Wiesz, że nigdy nie zostawiam rzeczy na widoku.",
      ],
    },
    {
      name: "backup.bat",
      size: 512,
      date: "02/11/2021",
      time: "18:07",
      hidden: false,
      body: ["@echo off", "REM nic tu nie ma do oglądania", "echo Kopia zapasowa gotowa."],
    },
    {
      name: "number.txt",
      // +2 for the CRLF, so the byte count in the listing is honest.
      size: String(number).length + 2,
      date: "17/03/2024",
      time: "22:15",
      hidden: true,
      body: [String(number)],
    },
  ];
}

// DIR prints sizes with thousands separators.
function grouped(number) {
  return String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// cmd's DIR listing.
function cmdListing(files) {
  const lines = [
    " Wolumin w stacji C nie ma etykiety.",
    " Numer seryjny woluminu: 7A31-0C4E",
    "",
    ` Katalog: ${TERMINAL_CWD}`,
    "",
  ];
  let bytes = 0;
  for (const file of files) {
    bytes += file.size;
    lines.push(
      `${file.date}  ${file.time}    ${grouped(file.size).padStart(14, " ")} ${file.name}`
    );
  }
  lines.push(
    `${String(files.length).padStart(16, " ")} plik(ów) ${grouped(bytes).padStart(14, " ")} bajtów`
  );
  lines.push("               0 kat(ów)  38 114 304 000 bajtów wolnych");
  return lines;
}

// PowerShell's Get-ChildItem listing. The 'h' in the Mode column is the giveaway.
const PS_MODE_WIDTH = 21;
const PS_DATE_WIDTH = 21;
const PS_SIZE_WIDTH = 15;

function powershellRow(mode, when, length, name) {
  return (
    mode.padEnd(PS_MODE_WIDTH) +
    when.padStart(PS_DATE_WIDTH) +
    length.padStart(PS_SIZE_WIDTH) +
    ` ${name}`
  );
}

function powershellListing(files) {
  const lines = [
    "",
    `    Katalog: ${TERMINAL_CWD}`,
    "",
    "",
    powershellRow("Mode", "LastWriteTime", "Length", "Name"),
    powershellRow("----", "-------------", "------", "----"),
  ];
  for (const file of files) {
    lines.push(
      powershellRow(
        file.hidden ? "-a-h-" : "-a---",
        `${file.date}  ${file.time}`,
        String(file.size),
        file.name
      )
    );
  }
  return lines;
}

// Pure command interpreter, so the accepted-command set can be tested without a DOM.
// Returns { lines, revealedHidden, readNumber, cleared }.
function runWindowsCommand(raw, number) {
  const input = String(raw ?? "").trim();
  if (!input) return { lines: [], revealedHidden: false, readNumber: false };

  const tokens = input.split(/\s+/);
  const command = tokens[0].toLowerCase();
  const args = tokens.slice(1).map((token) => token.toLowerCase());
  const files = terminalFiles(number);

  const LIST_CMD = ["dir", "ls", "gci", "get-childitem", "gi", "childitem"];
  const READ_CMD = ["type", "more", "cat", "gc", "get-content"];
  // Whether to print the listing cmd-style or PowerShell-style.
  const powershellFlavour =
    ["ls", "gci", "get-childitem", "childitem"].includes(command) ||
    args.some((arg) => arg.startsWith("-"));

  if (command === "help") {
    return {
      lines: [
        "DIR            wyświetla pliki w tym folderze.",
        "TYPE <plik>    wypisuje zawartość pliku.",
        "",
        "Ukryte pliki nie pojawiają się na zwykłej liście — DIR potrzebuje do tego",
        "przełącznika. PowerShell też zadziała, jeśli wolisz.",
      ],
      revealedHidden: false,
      readNumber: false,
    };
  }

  if (command === "cls" || command === "clear") {
    return { lines: [], revealedHidden: false, readNumber: false, cleared: true };
  }

  if (LIST_CMD.includes(command)) {
    // cmd uses /A (also /A:H, /AH); PowerShell uses -Force (and -Hidden on newer versions).
    const wantsHidden = args.some(
      (arg) => /^\/a([:h].*)?$/.test(arg) || /^-(f|fo|for|forc|force|h|hi|hid|hidd|hidde|hidden)$/.test(arg)
    );

    // A Linux habit in a PowerShell alias: reproduce the real error, which is itself a nudge.
    const linuxish = args.find((arg) => /^-[a-z]*a[a-z]*$/.test(arg) && !/^-(f|h)/.test(arg));
    if (linuxish && ["ls", "gci", "get-childitem"].includes(command)) {
      return {
        lines: [
          `Get-ChildItem : Nie można odnaleźć parametru pasującego do nazwy „${linuxish.slice(1)}”.`,
          "To jest Windows. Spróbuj DIR /A albo Get-ChildItem -Force.",
        ],
        revealedHidden: false,
        readNumber: false,
      };
    }

    const visible = files.filter((file) => wantsHidden || !file.hidden);
    const lines = powershellFlavour ? powershellListing(visible) : cmdListing(visible);
    if (!wantsHidden) {
      lines.push("", "Dwa pliki. Żaden z nich nie wygląda podejrzanie.");
    }
    return { lines, revealedHidden: wantsHidden, readNumber: false };
  }

  if (READ_CMD.includes(command)) {
    const wanted = tokens.slice(1).filter((token) => !token.startsWith("-") && !token.startsWith("/"));
    if (wanted.length === 0) {
      return {
        lines: ["Składnia polecenia jest niepoprawna.", `Użycie: ${command.toUpperCase()} <plik>`],
        revealedHidden: false,
        readNumber: false,
      };
    }
    const name = wanted[0].replace(/^\.[\\/]/, "").toLowerCase();
    const file = files.find((candidate) => candidate.name.toLowerCase() === name);
    if (!file) {
      return {
        lines: [`Nie można odnaleźć określonego pliku.`],
        revealedHidden: false,
        readNumber: false,
      };
    }
    return {
      lines: [...file.body],
      revealedHidden: false,
      readNumber: file.name === "number.txt",
    };
  }

  return {
    lines: [
      `„${tokens[0]}” nie jest rozpoznawane jako polecenie wewnętrzne lub zewnętrzne,`,
      "program wykonywalny lub plik wsadowy.",
    ],
    revealedHidden: false,
    readNumber: false,
  };
}

function hisOfficeScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const number = PERSONALIZATION.favoriteNumber;
  if (!Number.isFinite(number)) {
    body.appendChild(
      configError(
        `This terminal reveals PERSONALIZATION.favoriteNumber, but that is ` +
          `"${PERSONALIZATION.favoriteNumber}", which isn't a number.`
      )
    );
    return body;
  }

  const solved = state.solved[room.id];

  const stage = renderSceneArt(room, {
    onHotspot: withProps(body, room, (name) => {
      if (name === "screen") {
        openCloseUp(body, terminalCloseUp(room, number, solved), { focus: ".terminal__input" });
      }
    }),
  });
  body.appendChild(stage);

  const hint = document.createElement("p");
  hint.className = "scene__hint";
  if (solved) {
    hint.innerHTML = `W pliku number.txt była jedna liczba: <strong>${number}</strong>.`;
  } else {
    hint.textContent = "Komputer wciąż chodzi, a coś wciąż jest zablokowane.";
  }
  body.appendChild(hint);

  return body;
}

function terminalCloseUp(room, number, alreadySolved) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--terminal";

  const screen = document.createElement("div");
  screen.className = "terminal";

  const output = document.createElement("div");
  output.className = "terminal__output";
  output.setAttribute("role", "log");
  output.setAttribute("aria-live", "polite");
  screen.appendChild(output);

  const print = (lines) => {
    for (const line of lines) {
      const row = document.createElement("div");
      row.className = "terminal__line";
      // A blank line still needs to take up a row.
      row.textContent = line === "" ? "\u00a0" : line;
      output.appendChild(row);
    }
    screen.scrollTop = screen.scrollHeight;
  };

  print(TERMINAL_BANNER);
  if (alreadySolved) {
    print([`(number.txt został już odczytany. Była tam liczba ${number}.)`, ""]);
  }

  const form = document.createElement("form");
  form.className = "terminal__prompt";

  const label = document.createElement("span");
  label.className = "terminal__cwd";
  label.textContent = `${TERMINAL_CWD}>`;
  form.appendChild(label);

  const input = document.createElement("input");
  input.className = "terminal__input";
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "Polecenie terminala");
  form.appendChild(input);

  let misfires = 0;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const typed = input.value;
    input.value = "";
    if (!typed.trim()) return;

    print([`${TERMINAL_CWD}>${typed}`]);
    const result = runWindowsCommand(typed, number);

    if (result.cleared) {
      output.replaceChildren();
      return;
    }

    print([...result.lines, ""]);

    if (result.readNumber) {
      if (!state.solved[room.id]) {
        solvePuzzle(room.id, { clue: { key: "favoriteNumber", value: number } });
      }
      print([`>>> ${number}. Warto zapamiętać.`, ""]);
      misfires = 0;
      return;
    }

    // A gentle nudge if they are flailing, rather than letting them grind.
    misfires = result.revealedHidden ? 0 : misfires + 1;
    if (misfires === 4) {
      print(["(Spróbuj HELP.)", ""]);
      misfires = 0;
    }
  });

  screen.appendChild(form);
  screen.addEventListener("click", () => input.focus());
  panel.appendChild(screen);

  return panel;
}

// ---------------------------------------------------------------------------
// Bathroom — puzzle room: turn the sauna's temperature dial to the number the His Office
// terminal gave up. Yields letter 2 of the final word, from under a loose floor tile.
// ---------------------------------------------------------------------------

// A dial sweeps 270°, starting bottom-left and ending bottom-right, leaving the usual gap at
// the bottom. Angles are degrees clockwise from east, which is how SVG rotate() reads them.
const DIAL_START_ANGLE = 135;
const DIAL_SWEEP = 270;

function dialAngleForValue(value, { min, max }) {
  const fraction = (value - min) / (max - min);
  return DIAL_START_ANGLE + fraction * DIAL_SWEEP;
}

// Inverse of the above: where a point sits on the sweep. Points in the dead zone under the
// dial snap to whichever end they are nearer, so dragging past the end doesn't wrap around.
function dialValueForPoint(point, { cx, cy, min, max, step }) {
  const degrees = (Math.atan2(point.y - cy, point.x - cx) * 180) / Math.PI;
  const fromStart = (degrees - DIAL_START_ANGLE + 360) % 360;

  let travelled = fromStart;
  if (fromStart > DIAL_SWEEP) {
    travelled = fromStart < DIAL_SWEEP + (360 - DIAL_SWEEP) / 2 ? DIAL_SWEEP : 0;
  }

  const raw = min + (travelled / DIAL_SWEEP) * (max - min);
  const snapped = Math.round(raw / step) * step;
  return Math.min(max, Math.max(min, snapped));
}

function pointOnDial(angle, radius, { cx, cy }) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function drawDial(config, { onCommit, enabled }) {
  const { cx, cy, radius, min, max, step } = config;
  let value = min;

  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", `dial${enabled ? "" : " is-locked"}`);
  group.setAttribute("role", "slider");
  group.setAttribute("aria-label", "Pokrętło temperatury sauny");
  group.setAttribute("aria-valuemin", min);
  group.setAttribute("aria-valuemax", max);
  if (enabled) group.setAttribute("tabindex", "0");

  const face = document.createElementNS(SVG_NS, "circle");
  face.setAttribute("class", "dial__face");
  face.setAttribute("cx", cx);
  face.setAttribute("cy", cy);
  face.setAttribute("r", radius);
  group.appendChild(face);

  // Six labelled majors with minors between them reads cleanly at any range.
  const majorStep = (max - min) / 6;
  const minorStep = majorStep / 4;
  for (let mark = min; mark <= max + 1e-9; mark += minorStep) {
    const isMajor = Math.abs(mark / majorStep - Math.round(mark / majorStep)) < 1e-9;
    const angle = dialAngleForValue(mark, config);
    const outer = pointOnDial(angle, radius - 3, config);
    const inner = pointOnDial(angle, radius - (isMajor ? 13 : 8), config);

    const tick = document.createElementNS(SVG_NS, "line");
    tick.setAttribute("class", `dial__tick${isMajor ? " dial__tick--major" : ""}`);
    tick.setAttribute("x1", inner.x);
    tick.setAttribute("y1", inner.y);
    tick.setAttribute("x2", outer.x);
    tick.setAttribute("y2", outer.y);
    group.appendChild(tick);

    if (isMajor) {
      const at = pointOnDial(angle, radius + 12, config);
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("class", "dial__scale");
      label.setAttribute("x", at.x);
      label.setAttribute("y", at.y);
      label.textContent = Math.round(mark);
      group.appendChild(label);
    }
  }

  const knob = document.createElementNS(SVG_NS, "circle");
  knob.setAttribute("class", "dial__knob");
  knob.setAttribute("cx", cx);
  knob.setAttribute("cy", cy);
  knob.setAttribute("r", radius * 0.62);
  group.appendChild(knob);

  // Only the pointer rotates, so the readout stays upright.
  const pointer = document.createElementNS(SVG_NS, "line");
  pointer.setAttribute("class", "dial__pointer");
  pointer.setAttribute("x1", cx);
  pointer.setAttribute("y1", cy);
  pointer.setAttribute("x2", cx + radius * 0.88);
  pointer.setAttribute("y2", cy);
  group.appendChild(pointer);

  const readout = document.createElementNS(SVG_NS, "text");
  readout.setAttribute("class", "dial__readout");
  readout.setAttribute("x", cx);
  readout.setAttribute("y", cy - 2);
  group.appendChild(readout);

  const unit = document.createElementNS(SVG_NS, "text");
  unit.setAttribute("class", "dial__unit");
  unit.setAttribute("x", cx);
  unit.setAttribute("y", cy + 16);
  unit.textContent = "°C";
  group.appendChild(unit);

  const setValue = (next) => {
    value = Math.min(max, Math.max(min, next));
    readout.textContent = value;
    pointer.setAttribute("transform", `rotate(${dialAngleForValue(value, config)} ${cx} ${cy})`);
    group.setAttribute("aria-valuenow", value);
  };
  setValue(min);

  return {
    group,
    setValue,
    getValue: () => value,
    markSolved() {
      group.classList.add("is-solved");
      group.removeAttribute("tabindex");
    },
    // One step, committed — the same contract as an arrow key. The scene puts this behind
    // on-screen buttons: the dial is a comfortable size to touch, but landing on an exact
    // value out of 0-120 by rotating it with a fingertip needs about a degree of precision,
    // which is unreasonable. Drag to get close, then nudge.
    nudge(delta) {
      if (!enabled) return;
      setValue(Math.round((value + delta) / step) * step);
      onCommit(value);
    },
    // Wired up by the scene, which owns the overlay needed for coordinate conversion.
    attach(overlay) {
      if (!enabled) return;
      let dragging = false;

      const toSvgPoint = (event) => {
        const ctm = overlay.getScreenCTM();
        if (!ctm) return { x: cx, y: cy };
        const point = overlay.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(ctm.inverse());
      };

      group.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        dragging = true;
        group.setPointerCapture(event.pointerId);
        group.classList.add("is-turning");
        setValue(dialValueForPoint(toSvgPoint(event), config));
      });

      group.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        setValue(dialValueForPoint(toSvgPoint(event), config));
      });

      // Committed on release, so sweeping past the answer mid-drag doesn't trigger it.
      group.addEventListener("pointerup", () => {
        if (!dragging) return;
        dragging = false;
        group.classList.remove("is-turning");
        onCommit(value);
      });

      group.addEventListener("lostpointercapture", () => {
        dragging = false;
        group.classList.remove("is-turning");
      });

      // Keyboard steps are deliberate, so each one commits.
      group.addEventListener("keydown", (event) => {
        const jump = { PageUp: majorStep, PageDown: -majorStep };
        const nudge = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step };
        let next = null;
        if (event.key in nudge) next = value + nudge[event.key];
        else if (event.key in jump) next = value + jump[event.key];
        else if (event.key === "Home") next = min;
        else if (event.key === "End") next = max;
        if (next === null) return;
        event.preventDefault();
        setValue(Math.round(next / step) * step);
        onCommit(value);
      });
    },
  };
}

function bathroomScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const target = PERSONALIZATION.favoriteNumber;
  const letter = letterForRoom(room);
  const dialConfig = room.scene.dial;

  if (!Number.isFinite(target)) {
    body.appendChild(
      configError(
        `The dial has to be set to PERSONALIZATION.favoriteNumber, but that is ` +
          `"${PERSONALIZATION.favoriteNumber}", which isn't a number.`
      )
    );
    return body;
  }
  if (target < dialConfig.min || target > dialConfig.max) {
    body.appendChild(
      configError(
        `PERSONALIZATION.favoriteNumber is ${target}, but the sauna dial only goes from ` +
          `${dialConfig.min} to ${dialConfig.max} — the puzzle would have no answer. Either ` +
          `pick a number inside that range, or widen \`dial\` on the bathroom in rooms.js.`
      )
    );
    return body;
  }
  if (!letter) {
    body.appendChild(
      configError(
        `This room yields letter ${room.letterPosition} of PERSONALIZATION.finalWord, but that ` +
          `is "${PERSONALIZATION.finalWord}" — it must be exactly ${letterRooms().length} ` +
          `letters, one per letter-yielding room.`
      )
    );
    return body;
  }

  const solved = state.solved[room.id];
  const stage = renderSceneArt(room, { onHotspot: withProps(body, room, () => {}) });
  const overlay = stage.querySelector(".scene__hotspots");
  body.appendChild(stage);

  const hint = document.createElement("p");
  hint.className = "scene__hint";

  const dial = drawDial(dialConfig, {
    enabled: !solved,
    onCommit: (value) => {
      if (state.solved[room.id]) return;
      if (value !== target) {
        hint.textContent = `${value}°C. Płytka ani drgnie.`;
        return;
      }
      solvePuzzle(room.id, { letter: { position: room.letterPosition, value: letter } });
      dial.markSolved();
      openCloseUp(body, tileCloseUp(target, letter, room.letterPosition));
    },
  });

  if (solved) {
    dial.setValue(target);
    dial.markSolved();
    overlay.appendChild(drawLiftedTile(room.scene.tile));
    overlay.appendChild(
      drawLetterCard(letter, {
        x: room.scene.tile.x + room.scene.tile.width / 2,
        y: room.scene.tile.y + room.scene.tile.height / 2,
      })
    );
    hint.innerHTML =
      `Pokrętło wciąż stoi na <strong>${target}</strong>, a obok leży luźna płytka i ` +
      `karteczka, która pod nią była: <strong>${letter}</strong>.`;
  } else {
    hint.textContent = "Pokrętłem sauny da się kręcić. Coś pod podłogą grzechocze, gdy się rusza.";
  }

  dial.group.classList.add("dial--sauna");
  overlay.appendChild(dial.group);
  dial.attach(overlay);

  // Fine adjustment for anyone without a keyboard, which on a phone is everyone. Real
  // buttons, sized for a fingertip. Drag the dial to get near, then step onto the number.
  if (!solved) {
    const step = dialConfig.step ?? 1;
    const controls = document.createElement("div");
    controls.className = "dial-controls";

    const stepButton = (label, delta, ariaLabel) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button button--quiet dial-controls__step";
      button.textContent = label;
      button.setAttribute("aria-label", ariaLabel);
      button.addEventListener("click", () => dial.nudge(delta));
      return button;
    };

    controls.appendChild(stepButton("−", -step, "Mniej"));
    controls.appendChild(stepButton("+", step, "Więcej"));
    body.appendChild(controls);
  }

  body.appendChild(hint);
  return body;
}

// The floor tile, prised up and leaning against its own hole.
function drawLiftedTile(tile) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "lifted-tile");

  const hole = document.createElementNS(SVG_NS, "rect");
  hole.setAttribute("class", "lifted-tile__hole");
  hole.setAttribute("x", tile.x);
  hole.setAttribute("y", tile.y);
  hole.setAttribute("width", tile.width);
  hole.setAttribute("height", tile.height);
  hole.setAttribute("rx", "3");
  group.appendChild(hole);

  const slab = document.createElementNS(SVG_NS, "rect");
  slab.setAttribute("class", "lifted-tile__slab");
  slab.setAttribute("x", tile.x + tile.width + 8);
  slab.setAttribute("y", tile.y - 4);
  slab.setAttribute("width", tile.width);
  slab.setAttribute("height", tile.height);
  slab.setAttribute("rx", "3");
  slab.setAttribute(
    "transform",
    `rotate(-9 ${tile.x + tile.width + 8 + tile.width / 2} ${tile.y - 4 + tile.height / 2})`
  );
  group.appendChild(slab);

  return group;
}

function tileCloseUp(temperature, letter, position) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--reaction";

  const reading = document.createElement("p");
  reading.className = "reaction__formula";
  reading.textContent = `${temperature}°C`;
  panel.appendChild(reading);

  const note = document.createElement("p");
  note.className = "closeup__note";
  note.textContent =
    "Piec cyka, coś pod podłogą puszcza i jedna płytka unosi się ponad pozostałe.";
  panel.appendChild(note);

  const card = document.createElement("div");
  card.className = "letter-card";
  card.innerHTML =
    `<span class="letter-card__letter">${letter}</span>` +
    `<span class="letter-card__caption">jedna z czterech</span>`;
  panel.appendChild(card);

  return panel;
}

// ---------------------------------------------------------------------------
// Balcony — clue room: a note folded under the plant pot gives a time. The telescope is
// there to be picked up and put down again; it holds nothing.
// ---------------------------------------------------------------------------

function balconyScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const time = parseTimeOfDay(PERSONALIZATION.meaningfulTime);

  const art = renderSceneArt(room, {
    onHotspot: withProps(body, room, (name) => {
      if (name === "telescope") {
        openCloseUp(body, telescopeCloseUp());
        return;
      }
      if (name !== "plant") return;
      if (time) {
        findClue(room.id, "meaningfulTime", PERSONALIZATION.meaningfulTime);
      }
      openCloseUp(body, noteCloseUp(time));
    }),
  });
  body.appendChild(art);

  const hint = document.createElement("p");
  hint.className = "scene__hint";
  if (state.found[room.id] && time) {
    hint.innerHTML = `Na karteczce spod doniczki jest napisane <strong>${time.label}</strong>.`;
  } else {
    hint.textContent = "Zimno tu. Pod jedną z doniczek coś jasnego wystaje spod spodu.";
  }
  body.appendChild(hint);

  return body;
}

function noteCloseUp(time) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--note";

  if (!time) {
    panel.appendChild(
      configError(
        `PERSONALIZATION.meaningfulTime is "${PERSONALIZATION.meaningfulTime}", which isn't a ` +
          `real time. Expected 24-hour "HH:MM", for example "20:15".`
      )
    );
    return panel;
  }

  const note = document.createElement("div");
  note.className = "note";
  note.innerHTML =
    `<span class="note__time">${time.label}</span>` +
    `<span class="note__hand">nie spóźnij się</span>`;
  panel.appendChild(note);

  const caption = document.createElement("p");
  caption.className = "closeup__note";
  caption.textContent = "Złożona na pół dwa razy i zmiękła od stania na dworze.";
  panel.appendChild(caption);

  return panel;
}

function telescopeCloseUp() {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--telescope";

  const view = document.createElement("div");
  view.className = "telescope-view";
  view.innerHTML = `<span class="telescope-view__dot"></span>`;
  panel.appendChild(view);

  const caption = document.createElement("p");
  caption.className = "closeup__note";
  caption.textContent =
    "Dachy, antena satelitarna i ktoś dwie ulice dalej zmywający naczynia. " +
    "Nic przydatnego.";
  panel.appendChild(caption);

  return panel;
}

// ---------------------------------------------------------------------------
// Main Bedroom — puzzle room: set the alarm clock to the time from the Balcony note.
// Yields letter 3, from the nightstand drawer.
// ---------------------------------------------------------------------------

function mainBedroomScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const target = parseTimeOfDay(PERSONALIZATION.meaningfulTime);
  const letter = letterForRoom(room);

  if (!target) {
    body.appendChild(
      configError(
        `The alarm has to be set to PERSONALIZATION.meaningfulTime, but that is ` +
          `"${PERSONALIZATION.meaningfulTime}", which isn't a real time. Expected 24-hour ` +
          `"HH:MM", for example "20:15".`
      )
    );
    return body;
  }
  if (!letter) {
    body.appendChild(
      configError(
        `This room yields letter ${room.letterPosition} of PERSONALIZATION.finalWord, but that ` +
          `is "${PERSONALIZATION.finalWord}" — it must be exactly ${letterRooms().length} ` +
          `letters, one per letter-yielding room.`
      )
    );
    return body;
  }

  const solved = state.solved[room.id];

  const stage = renderSceneArt(room, {
    onHotspot: withProps(body, room, (name) => {
      if (name !== "clock") return;
      openCloseUp(body, alarmClockCloseUp(room, target, letter, solved), {
        focus: ".alarm__field",
      });
    }),
  });
  const overlay = stage.querySelector(".scene__hotspots");
  body.appendChild(stage);

  const hint = document.createElement("p");
  hint.className = "scene__hint";
  if (solved) {
    overlay.appendChild(drawLetterCard(letter, room.scene.card));
    hint.innerHTML =
      `Budzik jest nastawiony na <strong>${target.label}</strong>, a w szufladzie, którą to ` +
      `otworzyło, leżała karteczka: <strong>${letter}</strong>.`;
  } else {
    hint.textContent = "Stary budzik i szuflada nocnej szafki, która nie chce się otworzyć.";
  }
  body.appendChild(hint);

  return body;
}

function alarmClockCloseUp(room, target, letter, alreadySolved) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--alarm";

  const face = document.createElement("div");
  face.className = "alarm";

  const hours = document.createElement("input");
  const minutes = document.createElement("input");
  for (const [field, label, max] of [
    [hours, "Godziny", 23],
    [minutes, "Minuty", 59],
  ]) {
    field.className = "alarm__field";
    field.type = "text";
    field.inputMode = "numeric";
    field.maxLength = 2;
    field.autocomplete = "off";
    field.placeholder = "--";
    field.setAttribute("aria-label", label);
    field.dataset.max = max;
  }

  face.appendChild(hours);
  const colon = document.createElement("span");
  colon.className = "alarm__colon";
  colon.textContent = ":";
  face.appendChild(colon);
  face.appendChild(minutes);
  panel.appendChild(face);

  const message = document.createElement("p");
  message.className = "closeup__note";
  message.textContent = alreadySolved
    ? "Już nastawiony. Szuflada jest otwarta."
    : "Nastaw budzik.";
  panel.appendChild(message);

  // Digits only, and typing two into the hours box moves you along to the minutes.
  hours.addEventListener("input", () => {
    hours.value = hours.value.replace(/\D/g, "");
    if (hours.value.length === 2) minutes.focus();
  });
  minutes.addEventListener("input", () => {
    minutes.value = minutes.value.replace(/\D/g, "");
  });

  const form = document.createElement("form");
  form.className = "alarm__form";
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "button";
  submit.textContent = "Nastaw";
  form.appendChild(submit);
  panel.appendChild(form);

  if (alreadySolved) {
    hours.value = String(target.hours).padStart(2, "0");
    minutes.value = String(target.minutes).padStart(2, "0");
    hours.disabled = true;
    minutes.disabled = true;
    submit.disabled = true;
    return panel;
  }

  const reject = (text) => {
    showWrongFlash(face);
    message.textContent = text;
  };

  const check = () => {
    const typedHours = hours.value.trim();
    const typedMinutes = minutes.value.trim();
    if (!typedHours || !typedMinutes) {
      reject("Oba pola, proszę. Godziny 00-23, minuty 00-59.");
      return;
    }

    const entered = parseTimeOfDay(
      `${typedHours.padStart(2, "0")}:${typedMinutes.padStart(2, "0")}`
    );
    if (!entered) {
      reject("To nie jest godzina. Godziny 00-23, minuty 00-59.");
      return;
    }
    if (entered.label !== target.label) {
      reject(`${entered.label}. Szuflada pozostaje zamknięta.`);
      return;
    }

    solvePuzzle(room.id, { letter: { position: room.letterPosition, value: letter } });
    // Swap out the clock but leave the Close button openCloseUp appended to this panel.
    face.remove();
    form.remove();
    message.remove();
    panel.insertBefore(drawerOpened(target, letter, room.letterPosition), panel.firstChild);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    check();
  });
  // Enter from either field submits, which is what a clock's set button would do.
  for (const field of [hours, minutes]) {
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        check();
      }
    });
  }

  return panel;
}

function drawerOpened(target, letter, position) {
  const fragment = document.createDocumentFragment();

  const time = document.createElement("p");
  time.className = "reaction__formula";
  time.textContent = target.label;
  fragment.appendChild(time);

  const note = document.createElement("p");
  note.className = "closeup__note";
  note.textContent =
    "Budzik brzęczy raz, krótko, coś puszcza w środku szafki i szuflada wysuwa się " +
    "do przodu.";
  fragment.appendChild(note);

  const card = document.createElement("div");
  card.className = "letter-card";
  card.innerHTML =
    `<span class="letter-card__letter">${letter}</span>` +
    `<span class="letter-card__caption">jedna z czterech</span>`;
  fragment.appendChild(card);

  return fragment;
}

// ---------------------------------------------------------------------------
// Guest Bedroom — puzzle room: a memory game of cards hanging on the wall. Pairs are matched
// by association, not by being identical — each pair is one of the two of them, the dog, or
// the move. Self-contained; nothing else feeds it. Yields letter 2, from the keepsake box.
// ---------------------------------------------------------------------------

// Interleaves a list so partners never end up next to each other. Also used by the Living
// Room's coffee table to keep the found letters out of word order.
function hangingOrder(sorted) {
  const odd = sorted.filter((_, index) => index % 2 === 1);
  const even = sorted.filter((_, index) => index % 2 === 0);
  return [...odd, ...even];
}

// Where each of the eight cards hangs. Fixed rather than random so the wall looks the same
// every time the room is entered, and so leaving mid-game does not reshuffle it. Chosen to
// keep every pair well apart on a 4x2 wall.
const MEMO_LAYOUT = [0, 3, 5, 6, 2, 7, 1, 4];

// How long a mismatched pair stays face up before turning back.
const MEMO_PEEK_MS = 900;

function svgIcon(markup) {
  const group = document.createElementNS(SVG_NS, "g");
  group.innerHTML = markup;
  return group;
}

// What a turned-over card announces to a screen reader. Keyed by icon name, which is a code
// identifier and never shown on screen.
const MEMO_ICON_LABELS = {
  beaker: "kolba laboratoryjna",
  periodicTable: "układ okresowy",
  guitar: "gitara",
  metronome: "metronom",
  dog: "pies",
  bone: "kość",
  home: "dom",
  keys: "klucze",
};

// The faces. Each draws centred on (0,0) and fits inside roughly 56x56. Add a new one here
// and it becomes available to PERSONALIZATION.memoPairs by its key.
const MEMO_ICONS = {
  beaker: () =>
    svgIcon(`
      <path d="M -3.5 -19 V -8 L -14.5 13 Q -16.5 17.5 -11 17.5 H 11 Q 16.5 17.5 14.5 13
               L 3.5 -8 V -19 Z"
            fill="#e8f4f2"/>
      <path d="M -10.3 5 L -14.5 13 Q -16.5 17.5 -11 17.5 H 11 Q 16.5 17.5 14.5 13 L 10.3 5 Z"
            fill="#7fb8b0"/>
      <path d="M -3.5 -19 V -8 L -14.5 13 Q -16.5 17.5 -11 17.5 H 11 Q 16.5 17.5 14.5 13
               L 3.5 -8 V -19 Z"
            fill="none" stroke="#5f8a86" stroke-width="3" stroke-linejoin="round"/>
      <path d="M -6.5 -20.5 H 6.5" stroke="#5f8a86" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M -7.5 -0.5 L -10 4" stroke="#8fbdb7" stroke-width="2" stroke-linecap="round"/>
      <circle cx="-3.5" cy="11" r="2.2" fill="#dff0ee"/>
      <circle cx="4" cy="14" r="1.6" fill="#dff0ee"/>
      <circle cx="0.5" cy="8" r="1.3" fill="#dff0ee"/>
    `),

  periodicTable: () =>
    svgIcon(`
      <g fill="#c8dbcd" stroke="#5f8a86" stroke-width="1.6">
        <rect x="-21" y="-17" width="8" height="8" rx="1.5"/>
        <rect x="13"  y="-17" width="8" height="8" rx="1.5"/>
        <rect x="-21" y="-6" width="8" height="8" rx="1.5"/>
        <rect x="-11" y="-6" width="8" height="8" rx="1.5"/>
        <rect x="3"   y="-6" width="8" height="8" rx="1.5"/>
        <rect x="13"  y="-6" width="8" height="8" rx="1.5"/>
        <rect x="-21" y="5" width="8" height="8" rx="1.5"/>
        <rect x="-11" y="5" width="8" height="8" rx="1.5"/>
        <rect x="-1"  y="5" width="8" height="8" rx="1.5"/>
        <rect x="9"   y="5" width="8" height="8" rx="1.5"/>
      </g>
      <rect x="-21" y="-6" width="8" height="8" rx="1.5" fill="#e4a08a" stroke="#b8341f" stroke-width="2"/>
    `),

  guitar: () =>
    svgIcon(`
      <rect x="-4" y="-30" width="8" height="22" fill="#8a5a34" stroke="#6b4523" stroke-width="2.5"/>
      <rect x="-7" y="-34" width="14" height="7" rx="2" fill="#6b4523"/>
      <path d="M 0 -10 C 8 -10 12 -5 11 0 C 10 4 15 6 15 12 C 15 19 8 24 0 24
               C -8 24 -15 19 -15 12 C -15 6 -10 4 -11 0 C -12 -5 -8 -10 0 -10 Z"
            fill="#cf7b52" stroke="#8a5a34" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="0" cy="9" r="4.5" fill="#7a4520"/>
      <path d="M -6 18 H 6" stroke="#8a5a34" stroke-width="2.5" stroke-linecap="round"/>
    `),

  metronome: () =>
    svgIcon(`
      <rect x="-17" y="16" width="34" height="6" rx="2.5" fill="#8a5a34"/>
      <path d="M -14 17 L -6 -21 H 6 L 14 17 Z" fill="#cf7b52" stroke="#8a5a34"
            stroke-width="3" stroke-linejoin="round"/>
      <path d="M -7 13 L -3.2 -16 H 3.2 L 7 13 Z" fill="#f0e2c8" stroke="#a9713c"
            stroke-width="2" stroke-linejoin="round"/>
      <path d="M -4.2 -7 H -1.4 M -4.8 -1 H -2 M -5.4 5 H -2.6"
            stroke="#a9713c" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M 0 14 L 6 -25" fill="none" stroke="#6b4523" stroke-width="3.2"
            stroke-linecap="round"/>
      <rect x="-1" y="-14.5" width="10" height="7" rx="1.8" fill="#e6b45e" stroke="#a9713c"
            stroke-width="2"/>
      <circle cx="0" cy="14" r="2.6" fill="#6b4523"/>
    `),

  dog: () =>
    svgIcon(`
      <g transform="translate(-3 17) scale(0.36)">
        <path d="M -22 -26 q -20 -2 -18 -22 q 1 -9 9 -9" fill="none" stroke="#2f2a28"
              stroke-width="9" stroke-linecap="round"/>
        <circle cx="-8" cy="-24" r="24" fill="#2f2a28"/>
        <path d="M 2 -66 q 22 2 22 30 q 0 22 -8 36 h -22 q -6 -30 -4 -46 z" fill="#332d2a"/>
        <rect x="4"  y="-26" width="11" height="26" rx="5.5" fill="#2f2a28"/>
        <rect x="17" y="-24" width="11" height="24" rx="5.5" fill="#3d3532"/>
        <circle cx="16" cy="-78" r="18" fill="#332d2a"/>
        <path d="M 28 -82 q 20 -2 20 8 q 0 9 -14 9 q -12 0 -12 -8 z" fill="#3d3532"/>
        <circle cx="46" cy="-76" r="3.4" fill="#15110f"/>
        <path d="M 4 -92 q -12 -6 -14 8 q -2 14 12 15 z" fill="#241f1d"/>
        <path d="M 24 -94 q 10 -9 16 2 q 5 11 -6 14 z" fill="#241f1d"/>
        <circle cx="27" cy="-82" r="2.8" fill="#f3e6c8"/>
        <path d="M 3 -62 q 16 9 28 1" fill="none" stroke="#cf7b52" stroke-width="6"
              stroke-linecap="round"/>
      </g>
    `),

  // Drawn twice — once thickly stroked, once filled on top — so the four knuckles and the
  // shaft merge into one clean outline instead of showing the seams where they overlap.
  bone: () =>
    svgIcon(`
      <g transform="rotate(-18)">
        <g stroke="#a9846f" stroke-width="3.5" stroke-linejoin="round" fill="#a9846f">
          <rect x="-13" y="-4" width="26" height="8" rx="4"/>
          <circle cx="-13" cy="-5.5" r="6"/><circle cx="-13" cy="5.5" r="6"/>
          <circle cx="13" cy="-5.5" r="6"/><circle cx="13" cy="5.5" r="6"/>
        </g>
        <g fill="#f2e7d3">
          <rect x="-13" y="-4" width="26" height="8" rx="4"/>
          <circle cx="-13" cy="-5.5" r="6"/><circle cx="-13" cy="5.5" r="6"/>
          <circle cx="13" cy="-5.5" r="6"/><circle cx="13" cy="5.5" r="6"/>
        </g>
        <path d="M -7 2 H 7" stroke="#ded0b6" stroke-width="2.6" stroke-linecap="round"/>
      </g>
    `),

  home: () =>
    svgIcon(`
      <rect x="8" y="-24" width="6.5" height="14" rx="1" fill="#a9713c" stroke="#8a5a34"
            stroke-width="2"/>
      <rect x="-16" y="-4" width="32" height="20" rx="1.5" fill="#efe4cd" stroke="#8a6a3a"
            stroke-width="3"/>
      <path d="M -22 -3 L 0 -22 L 22 -3 Z" fill="#cf7b52" stroke="#a9713c" stroke-width="3"
            stroke-linejoin="round"/>
      <path d="M -3 16 V 4.5 H 7 V 16 Z" fill="#8a5a34" stroke="#6b4523" stroke-width="2"
            stroke-linejoin="round"/>
      <circle cx="5" cy="10.5" r="1.4" fill="#e6b45e"/>
      <rect x="-12" y="1" width="8" height="8" rx="1" fill="#cfe3e0" stroke="#8a6a3a"
            stroke-width="2"/>
      <path d="M -8 1 V 9 M -12 5 H -4" stroke="#8a6a3a" stroke-width="1.4"/>
    `),

  keys: () =>
    svgIcon(`
      <circle cx="-9" cy="-11" r="8" fill="none" stroke="#b6a495" stroke-width="4"/>
      <path d="M -4 -6 L 10 10" stroke="#c9a55f" stroke-width="5" stroke-linecap="round"/>
      <path d="M 4 4 L 9 -1 M 10 10 L 15 5" stroke="#c9a55f" stroke-width="4"
            stroke-linecap="round"/>
      <path d="M -10 -3 L -18 12" stroke="#a9846f" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M -15 6 L -19 3" stroke="#a9846f" stroke-width="3.5" stroke-linecap="round"/>
    `),
};

// Turns PERSONALIZATION.memoPairs into eight cards, or explains what is wrong with it.
function readMemoPairs(raw) {
  if (!Array.isArray(raw) || raw.length < 2) {
    return { error: "PERSONALIZATION.memoPairs needs to be a list of at least 2 pairs." };
  }

  const cards = [];
  for (const pair of raw) {
    if (!Array.isArray(pair?.cards) || pair.cards.length !== 2) {
      return {
        error:
          `Every entry in PERSONALIZATION.memoPairs needs exactly 2 cards. ` +
          `"${pair?.id ?? "(unnamed)"}" does not.`,
      };
    }
    for (const icon of pair.cards) {
      if (!MEMO_ICONS[icon]) {
        return {
          error:
            `PERSONALIZATION.memoPairs asks for a card called "${icon}", which isn't a ` +
            `drawing this game knows. Available: ${Object.keys(MEMO_ICONS).join(", ")}.`,
        };
      }
      cards.push({ pairId: pair.id, icon });
    }
  }

  // Hang them in a fixed scramble so partners are never side by side.
  const order = MEMO_LAYOUT.filter((index) => index < cards.length);
  const hung = order.length === cards.length ? order.map((i) => cards[i]) : hangingOrder(cards);
  return { cards, hung };
}

function guestBedroomScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const pairs = readMemoPairs(PERSONALIZATION.memoPairs);
  const letter = letterForRoom(room);

  if (pairs.error) {
    body.appendChild(configError(pairs.error));
    return body;
  }
  if (!letter) {
    body.appendChild(
      configError(
        `This room yields letter ${room.letterPosition} of PERSONALIZATION.finalWord, but that ` +
          `is "${PERSONALIZATION.finalWord}" — it must be exactly ${letterRooms().length} ` +
          `letters, one per letter-yielding room.`
      )
    );
    return body;
  }

  const solved = state.solved[room.id];
  const layout = room.scene.memo;
  const totalPairs = PERSONALIZATION.memoPairs.length;

  const stage = renderSceneArt(room, { onHotspot: withProps(body, room, () => {}) });
  const overlay = stage.querySelector(".scene__hotspots");
  body.appendChild(stage);

  const hint = document.createElement("p");
  hint.className = "scene__hint";

  const cards = [];
  let faceUp = [];
  let matched = 0;
  let busy = false;

  const onFlip = (card) => {
    if (busy || solved || card.isMatched() || card.isFaceUp()) return;

    card.turnUp();
    faceUp.push(card);
    if (faceUp.length < 2) return;

    const [first, second] = faceUp;
    if (first.pairId === second.pairId) {
      first.markMatched();
      second.markMatched();
      faceUp = [];
      matched += 1;

      if (matched < totalPairs) {
        hint.textContent = `${matched} z ${totalPairs}. Te dwie należą do siebie.`;
        return;
      }

      solvePuzzle(room.id, { letter: { position: room.letterPosition, value: letter } });
      openCloseUp(body, memoCloseUp(letter));
      return;
    }

    // Not a pair — leave them up long enough to be read, then turn them back.
    busy = true;
    hint.textContent = "Nie te dwie.";
    window.setTimeout(() => {
      for (const turned of faceUp) turned.turnDown();
      faceUp = [];
      busy = false;
    }, MEMO_PEEK_MS);
  };

  pairs.hung.forEach((card, index) => {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    const drawn = drawMemoCard(card, {
      x: layout.x + column * (layout.cardWidth + layout.gap),
      y: layout.y + row * (layout.cardHeight + layout.gap),
      width: layout.cardWidth,
      height: layout.cardHeight,
      enabled: !solved,
      onFlip: () => onFlip(drawn),
    });
    cards.push(drawn);
    overlay.appendChild(drawn.group);
  });

  if (solved) {
    // Leave the whole set face up: the point of the room is seeing all four of them at once.
    for (const card of cards) {
      card.turnUp();
      card.markMatched();
    }
    overlay.appendChild(drawLetterCard(letter, room.scene.card));
    hint.innerHTML =
      `Wszystko odkryte, na ścianie. W pudełku z pamiątkami leżała karteczka: ` +
      `<strong>${letter}</strong>.`;
  } else {
    hint.textContent = "Osiem kart, cztery pary. Po dwie naraz.";
  }

  body.appendChild(hint);
  return body;
}

function drawMemoCard(card, options) {
  const { x, y, width, height, enabled, onFlip } = options;

  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "memo");
  if (enabled) {
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
  }
  group.setAttribute("aria-label", "Karta odwrócona rewersem");

  // The nail it hangs from.
  const nail = document.createElementNS(SVG_NS, "circle");
  nail.setAttribute("class", "memo__nail");
  nail.setAttribute("cx", x + width / 2);
  nail.setAttribute("cy", y - 7);
  nail.setAttribute("r", "3");
  group.appendChild(nail);

  const face = document.createElementNS(SVG_NS, "rect");
  face.setAttribute("class", "memo__card");
  face.setAttribute("x", x);
  face.setAttribute("y", y);
  face.setAttribute("width", width);
  face.setAttribute("height", height);
  face.setAttribute("rx", "6");
  group.appendChild(face);

  // The back pattern, hidden once the card is turned over.
  const back = document.createElementNS(SVG_NS, "g");
  back.setAttribute("class", "memo__back");
  const cx = x + width / 2;
  const cy = y + height / 2;
  back.innerHTML =
    `<circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke="#a9846f" stroke-width="3"/>` +
    `<circle cx="${cx}" cy="${cy}" r="6" fill="#a9846f"/>`;
  group.appendChild(back);

  const front = document.createElementNS(SVG_NS, "g");
  front.setAttribute("class", "memo__front");
  front.setAttribute("transform", `translate(${cx} ${cy})`);
  front.appendChild(MEMO_ICONS[card.icon]());
  group.appendChild(front);

  let up = false;
  let done = false;

  if (enabled) {
    group.addEventListener("click", onFlip);
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onFlip();
      }
    });
  }

  return {
    group,
    pairId: card.pairId,
    isFaceUp: () => up,
    isMatched: () => done,
    turnUp() {
      up = true;
      group.classList.add("is-up");
      group.setAttribute("aria-label", `Karta: ${MEMO_ICON_LABELS[card.icon] ?? card.icon}`);
    },
    turnDown() {
      up = false;
      group.classList.remove("is-up");
      group.setAttribute("aria-label", "Karta odwrócona rewersem");
    },
    markMatched() {
      done = true;
      group.classList.add("is-matched");
      group.removeAttribute("tabindex");
    },
  };
}

function memoCloseUp(letter) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--reaction";

  const note = document.createElement("p");
  note.className = "closeup__note";
  note.textContent =
    "Każda karta znalazła swoją drugą połowę. Coś puszcza w pudełku z pamiątkami na " +
    "szafce nocnej i wieczko się unosi.";
  panel.appendChild(note);

  const card = document.createElement("div");
  card.className = "letter-card";
  card.innerHTML =
    `<span class="letter-card__letter">${letter}</span>` +
    `<span class="letter-card__caption">jedna z czterech</span>`;
  panel.appendChild(card);

  return panel;
}
// ---------------------------------------------------------------------------
// Living Room — the hub. No puzzle here by design (see 01 Game Design.md): it orients the
// player and keeps the cards they have found so far on the coffee table.
// ---------------------------------------------------------------------------

// What the notebook keeps track of: the clue values, in the order they'd have been written
// down. Never the letters — those live on the table, scrambled, and stay that way.
const NOTEBOOK_ENTRIES = [
  {
    key: "meaningfulDate",
    label: "Data, zakreślona na kalendarzu",
    format: (value) => {
      const date = parseMonthDay(value);
      return date ? formatMonthDay(date) : String(value);
    },
  },
  {
    key: "favoriteNumber",
    label: "Liczba, w ukrytym pliku",
    format: (value) => String(value),
  },
  {
    key: "meaningfulTime",
    label: "Godzina, na złożonej karteczce",
    format: (value) => {
      const time = parseTimeOfDay(value);
      return time ? time.label : String(value);
    },
  },
];

// Only ever lists clues the player has already written down. An entry for something not yet
// found would give away that it exists and where it came from — "a number, in a hidden file"
// tells you there is a hidden file — so unfound entries are omitted entirely, not blanked.
function notebookCloseUp() {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--notebook";

  const hasClue = (key) =>
    state.clueValues[key] !== null && state.clueValues[key] !== undefined;
  const written = NOTEBOOK_ENTRIES.filter((entry) => hasClue(entry.key));

  if (written.length === 0) {
    const empty = document.createElement("p");
    empty.className = "closeup__note";
    empty.textContent = "Pusty, nie licząc listy zakupów sprzed roku.";
    panel.appendChild(empty);
    return panel;
  }

  const list = document.createElement("dl");
  list.className = "notebook";
  for (const entry of written) {
    const term = document.createElement("dt");
    term.className = "notebook__label";
    term.textContent = entry.label;
    list.appendChild(term);

    const detail = document.createElement("dd");
    detail.className = "notebook__value";
    detail.textContent = entry.format(state.clueValues[entry.key]);
    list.appendChild(detail);
  }
  panel.appendChild(list);

  // Says there is more to come without hinting at what, or where it is.
  if (written.length < NOTEBOOK_ENTRIES.length) {
    const rest = document.createElement("p");
    rest.className = "closeup__note";
    rest.textContent = "Reszta strony jest pusta.";
    panel.appendChild(rest);
  }

  return panel;
}

// The order cards are laid out on the table. Deliberately not by position — the table must
// never spell the answer out while you are still collecting.
function tableSlotOrder() {
  return hangingOrder(letterRooms().map((room) => room.letterPosition));
}

function livingRoomScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const stage = renderSceneArt(room, {
    onHotspot: withProps(body, room, (name) => {
      if (name === "notebook") openCloseUp(body, notebookCloseUp());
    }),
  });
  const overlay = stage.querySelector(".scene__hotspots");
  body.appendChild(stage);

  const table = room.scene.table;
  const slots = tableSlotOrder();
  let found = 0;

  slots.forEach((position, index) => {
    const at = { x: table.x + index * table.spacing, y: table.y };
    const letter = state.letters[position];
    if (letter) {
      found += 1;
      overlay.appendChild(drawLetterCard(letter, at));
    } else {
      overlay.appendChild(drawEmptySlot(at));
    }
  });

  // Four dashed rectangles don't explain themselves — say what they are. Sits on the table's
  // front lip, below the cards, where there is a plain surface to read against.
  const caption = document.createElementNS(SVG_NS, "text");
  caption.setAttribute("class", "table-caption");
  caption.setAttribute("x", table.x + ((slots.length - 1) * table.spacing) / 2);
  caption.setAttribute("y", table.y + 24);
  caption.textContent = `karteczki: ${found} z ${slots.length}`;
  overlay.appendChild(caption);

  const hint = document.createElement("p");
  hint.className = "scene__hint";
  if (found === 0) {
    hint.textContent =
      "Drzwi wejściowe są zamknięte, a to, co je otwiera, nie jest w jednym kawałku.";
  } else if (found < slots.length) {
    hint.textContent = `${found} z ${slots.length}. To, co dotąd znalezione, leży na stoliku.`;
  } else {
    hint.textContent =
      "Cztery karteczki, cztery litery, ułożone bez ładu. Muszą jakoś do siebie pasować.";
  }
  body.appendChild(hint);

  return body;
}

// A card-shaped gap on the table, so it is obvious how many are still missing.
function drawEmptySlot(position) {
  const slot = document.createElementNS(SVG_NS, "rect");
  slot.setAttribute("class", "empty-slot");
  slot.setAttribute("x", position.x - 27);
  slot.setAttribute("y", position.y - 13);
  slot.setAttribute("width", "54");
  slot.setAttribute("height", "26");
  slot.setAttribute("rx", "3");
  return slot;
}

// A plain "you looked at a thing" panel, for props that hold nothing.
function flavourCloseUp(text) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--dog";

  const line = document.createElement("p");
  line.className = "dog-line";
  line.textContent = text;
  panel.appendChild(line);

  return panel;
}

// ---------------------------------------------------------------------------
// Front Door — the final puzzle: type the word the four letters make.
//
// The lock shows the letters found so far as loose tiles in a scrambled order — never in
// word order. Working out the arrangement is the last thing the player does, so the lock must
// not do it for them.
// ---------------------------------------------------------------------------

function frontDoorScene(room) {
  const body = document.createElement("div");
  body.className = "scene__body";

  const word = String(PERSONALIZATION.finalWord ?? "");
  if (word.length !== letterRooms().length) {
    body.appendChild(
      configError(
        `PERSONALIZATION.finalWord is "${PERSONALIZATION.finalWord}" — it must be exactly ` +
          `${letterRooms().length} letters, one per letter-yielding room.`
      )
    );
    return body;
  }

  const stage = renderSceneArt(room, {
    onHotspot: withProps(body, room, (name) => {
      if (name === "lock") openCloseUp(body, lockCloseUp(word), { focus: ".lock__input" });
    }),
  });
  body.appendChild(stage);

  const held = letterRooms().filter((r) => state.letters[r.letterPosition]).length;

  const hint = document.createElement("p");
  hint.className = "scene__hint";
  if (state.frontDoorSolved) {
    hint.textContent = "Drzwi stoją otworem.";
  } else if (!frontDoorUnlocked()) {
    hint.textContent = `Zamek czeka na słowo. Masz ${held} z ${word.length} części.`;
  } else {
    hint.textContent = "Wszystkie części są. Zamek czeka na słowo.";
  }
  body.appendChild(hint);

  return body;
}

function lockCloseUp(word) {
  const panel = document.createElement("div");
  panel.className = "closeup__panel closeup__panel--lock";

  // The pieces, in the same deliberately scrambled order the coffee table uses.
  const tiles = document.createElement("div");
  tiles.className = "tiles";
  for (const position of tableSlotOrder()) {
    const tile = document.createElement("span");
    const letter = state.letters[position];
    tile.className = letter ? "tiles__tile" : "tiles__tile is-blank";
    tile.textContent = letter ?? "";
    tiles.appendChild(tile);
  }
  panel.appendChild(tiles);

  const message = document.createElement("p");
  message.className = "closeup__note";
  panel.appendChild(message);

  if (state.frontDoorSolved) {
    message.textContent = "Już otwarte.";
    return panel;
  }

  if (!frontDoorUnlocked()) {
    const missing = letterRooms().filter((r) => !state.letters[r.letterPosition]).length;
    message.textContent =
      `Brakuje jeszcze: ${missing}. Zamek nie ustąpi przed zgadywaniem.`;
    return panel;
  }

  message.textContent = "Te same litery, inna kolejność.";

  const form = document.createElement("form");
  form.className = "lock__form";

  const input = document.createElement("input");
  input.className = "lock__input";
  input.type = "text";
  input.maxLength = word.length;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "Słowo");
  // The box sizes itself from the word's length; style.css does the arithmetic. A fixed
  // width in `ch` was too narrow, because `ch` measures a digit and this input renders bold
  // uppercase — a four-letter word with an M or a W in it did not fit.
  input.style.setProperty("--lock-letters", String(word.length));
  form.appendChild(input);

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "button";
  submit.textContent = "Przekręć zamek";
  form.appendChild(submit);
  panel.appendChild(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const typed = input.value.trim();

    if (typed.toUpperCase() !== word.toUpperCase()) {
      showWrongFlash(tiles);
      message.textContent = typed
        ? "Zamek ani drgnie."
        : "Wpisz słowo.";
      input.select();
      return;
    }

    openFrontDoor();
    goTo("escaped");
  });

  return panel;
}

// ---------------------------------------------------------------------------

const SCENES = {
  livingRoom: livingRoomScene,
  frontDoor: frontDoorScene,
  kitchen: kitchenScene,
  herOffice: herOfficeScene,
  hisOffice: hisOfficeScene,
  bathroom: bathroomScene,
  balcony: balconyScene,
  mainBedroom: mainBedroomScene,
  guestBedroom: guestBedroomScene,
};
