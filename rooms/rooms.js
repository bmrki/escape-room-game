// Data-only: room list, map geometry, and puzzle content.
//
// The personalization block below holds every value that makes this theirs. All of it is real
// now except `endMessage`. Each value is checked when its room is opened, so a mistake shows up
// as a plain message in that room rather than a silently broken puzzle.
const PERSONALIZATION = {
  // Circled on the Kitchen calendar. "YYYY-MM-DD" — year first on purpose, because "02-09-2023"
  // reads as either 2 September or 9 February depending on where you're from, and the two lead
  // to different chemistry in Her Office.
  meaningfulDate: "2023-09-02",

  // Which part of that date Her Office reads as an atomic number. It is the month here because
  // the day is the 2nd, and element 2 is helium — a noble gas that makes nothing with hydrogen.
  // The month, 9, is fluorine: H + F = HF, hydrofluoric acid. Only change this if the date does.
  atomicNumberFrom: "month", // "day" | "month"
  favoriteNumber: 23, // revealed by the His Office terminal, set on the Bathroom sauna dial
  meaningfulTime: "03:14", // found on the Balcony note, typed into the Main Bedroom alarm clock
  // Guest Bedroom memory game: eight cards on the wall, matched in pairs. The two cards in a
  // pair are not identical — they belong together (a flask and a periodic table; a guitar
  // and a metronome). Each is one of the two of them, the dog, or the move itself.
  //
  // Card names must be drawings the game knows. Currently available:
  //   beaker, periodicTable, guitar, metronome, dog, bone, home, keys
  // Adding another means adding a drawing to MEMO_ICONS in scenes.js.
  //
  // `id` just links a pair together; it is never shown to the player.
  memoPairs: [
    { id: "her", cards: ["beaker", "periodicTable"] },
    { id: "him", cards: ["guitar", "metronome"] },
    { id: "dog", cards: ["dog", "bone"] },
    { id: "them", cards: ["home", "keys"] },
  ],
  finalWord: "Soma", // the 4-letter word typed at the Front Door
  // TBD — a personal sign-off shown on the end screen once they escape. Set to "" for none.
  // A personal sign-off on the end screen. Empty renders nothing, which is the choice here.
  endMessage: "",
};

// Each room's `shape` is an SVG path in the coordinate space of rooms/floorplan.svg, tracing that
// room's real walls. game.js draws these as invisible hit areas on the overlay above the artwork,
// so clicking anywhere inside a room enters it. `label` / `badge` are where the room name and the
// locked/solved marker are drawn — both picked to sit in empty floor space, clear of the furniture.
//
// If a wall moves in floorplan.svg, the matching shape here has to move with it.
//
// `letterPosition` is which letter of PERSONALIZATION.finalWord a room yields (1-4). His Office
// has none: it yields the number for the Bathroom sauna dial instead.
//
// These values are intentional and order-sensitive. Do not renumber them.
const ROOMS = [
  {
    id: "livingRoom",
    displayName: "Salon",
    type: "start",
    shape: "M60,90 H161 L209,214 H420 V262 H397 V360 H309 V490 H60 Z",
    label: { x: 205, y: 460 },
    scene: {
      src: "rooms/living-room.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      hotspots: {
        dog: { shape: "M289,289 H379 V332 H289 Z", label: "Pies" },
        bookshelf: { shape: "M544,106 H696 V376 H544 Z", label: "Regał z książkami" },
        television: { shape: "M420,220 H540 V322 H420 Z", label: "Telewizor" },
        window: { shape: "M22,36 H212 V174 H22 Z", label: "Okno" },
        cushions: { shape: "M140,262 H285 V352 H140 Z", label: "Poduszki na kanapie" },
        notebook: { shape: "M388,384 H440 V424 H388 Z", label: "Notes" },
        sofa: { shape: "M287,262 H404 V356 H287 Z", label: "Kanapa" },
        lamp: { shape: "M46,196 H106 V378 H46 Z", label: "Lampa stojąca" },
        paint: { shape: "M548,392 H622 V456 H548 Z", label: "Farba i pędzel" },
        box: { shape: "M628,382 H706 V456 H628 Z", label: "Karton" },
      },
      // The coffee table top, where found letter cards are laid out.
      table: { x: 190, y: 408, spacing: 56, slots: 4 },
    },
  },
  {
    id: "kitchen",
    displayName: "Kuchnia",
    type: "clue",
    shape: "M280,90 H420 V214 H280 Z",
    label: { x: 348, y: 120 },
    badge: { x: 295, y: 112 },
    // Scene artwork + the clickable things inside it. Same pattern as FLOORPLAN: the SVG is a
    // real file, `viewBox` must match its <svg> root, and hotspot paths are in that same
    // coordinate space. The calendar box in kitchen.svg is x 545..675, y 158..288.
    scene: {
      src: "rooms/kitchen.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      hotspots: {
        calendar: {
          shape: "M539,144 H681 V294 H539 Z",
          label: "Kalendarz na ścianie",
        },
        dog: { shape: "M172,368 H254 V454 H172 Z", label: "Pies" },
        fridge: { shape: "M21,106 H149 V400 H21 Z", label: "Lodówka" },
        cabinets: { shape: "M161,44 H319 V156 H161 Z", label: "Szafki wiszące" },
        shelf: { shape: "M331,96 H489 V142 H331 Z", label: "Otwarta półka" },
        sink: { shape: "M170,200 H272 V266 H170 Z", label: "Zlew" },
        // The stove: the oven door and the four knobs above it.
        stove: { shape: "M311,266 H429 V398 H311 Z", label: "Kuchenka" },
        kettle: { shape: "M432,204 H482 V252 H432 Z", label: "Czajnik" },
        window: { shape: "M533,24 H687 V122 H533 Z", label: "Okno" },
        sideTable: { shape: "M541,304 H681 V400 H541 Z", label: "Stolik z owocami" },
        // Stops at x=538 so it never covers the calendar's hit area, which starts at 539.
        flatpack: { shape: "M488,232 H538 V402 H488 Z", label: "Płaskie pudło pod ścianą" },
      },
    },
  },
  {
    id: "herOffice",
    displayName: "Jej gabinet",
    type: "puzzle",
    letterPosition: 3,
    shape: "M161,90 H280 V214 H209 Z",
    label: { x: 242, y: 190, size: 12 }, // small room with a diagonal wall — needs the smaller size
    badge: { x: 218, y: 150 },
    // The poster is the lookup step; the jars and the beaker are drawn by scenes.js so they can
    // be dragged and filled. The desk area x 455..550 / y 240..316 in her-office.svg is left
    // empty for the beaker.
    scene: {
      src: "rooms/her-office.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      hotspots: {
        poster: {
          shape: "M32,52 H268 V236 H32 Z",
          label: "Plakat z układem okresowym",
        },
        dog: { shape: "M164,404 H266 V450 H164 Z", label: "Pies" },
        lamp: { shape: "M616,242 H676 V322 H616 Z", label: "Lampka na biurku" },
        notebook: { shape: "M312,292 H392 V320 H312 Z", label: "Zeszyt" },
        mug: { shape: "M398,288 H444 V322 H398 Z", label: "Kubek" },
        plant: { shape: "M106,300 H182 V398 H106 Z", label: "Roślina" },
        // The desk front, below the worktop the jars and beaker sit on.
        drawer: { shape: "M306,334 H686 V396 H306 Z", label: "Szuflada biurka" },
      },
      // Jar anchor is its base, so y matches the shelf board's top edge (212 in her-office.svg).
      shelf: { x: 322, y: 210, spacing: 64, count: 6 },
      beaker: { x: 502, y: 316 }, // bottom-centre of the beaker, standing on the desk
    },
  },
  {
    id: "hisOffice",
    displayName: "Jego gabinet",
    type: "puzzle",
    // no letterPosition: His Office feeds the Bathroom dial instead of the final word.
    shape: "M585,90 H750 V261 H585 Z",
    label: { x: 640, y: 152 },
    badge: { x: 628, y: 192 },
    scene: {
      src: "rooms/his-office.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      hotspots: {
        screen: {
          shape: "M270,146 H454 V258 H270 Z",
          label: "Ekran komputera",
        },
        dog: { shape: "M565,377 H642 V456 H565 Z", label: "Pies" },
        // The row of spines on the shelf above the desk.
        books: { shape: "M494,44 H700 V110 H494 Z", label: "Półka z książkami" },
        window: { shape: "M40,50 H204 V171 H40 Z", label: "Okno" },
        keyboard: { shape: "M466,282 H630 V308 H466 Z", label: "Klawiatura i myszka" },
        mug: { shape: "M194,272 H234 V306 H194 Z", label: "Kubek" },
        note: { shape: "M234,284 H262 V306 H234 Z", label: "Żółta karteczka" },
        tower: { shape: "M642,244 H706 V398 H642 Z", label: "Komputer" },
        plant: { shape: "M66,308 H140 V398 H66 Z", label: "Roślina" },
      },
    },
  },
  {
    id: "guestBedroom",
    displayName: "Pokój gościnny",
    type: "puzzle",
    letterPosition: 2,
    shape: "M420,90 H585 V261 H420 Z",
    label: { x: 484, y: 242 },
    badge: { x: 565, y: 236 },
    scene: {
      src: "rooms/guest-bedroom.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      hotspots: {
        dog: { shape: "M190,404 H292 V450 H190 Z", label: "Pies" },
        wardrobe: { shape: "M20,146 H144 V398 H20 Z", label: "Szafa" },
        bed: { shape: "M388,208 H704 V398 H388 Z", label: "Łóżko" },
        // The drawers only — the keepsake box and the letter card sit above them.
        nightstand: { shape: "M298,340 H386 V398 H298 Z", label: "Szuflada szafki nocnej" },
        rug: { shape: "M296,406 H390 V454 H296 Z", label: "Dywanik" },
        ladder: { shape: "M166,228 H256 V400 H166 Z", label: "Drabina" },
      },
      // The memory cards, hung by scenes.js across the clear wall strip in guest-bedroom.svg.
      // Four across, two down: x 200..588, y 32..204, which clears the wardrobe on the left
      // and the bed's headboard below.
      memo: { x: 200, y: 32, columns: 4, cardWidth: 88, cardHeight: 80, gap: 12 },
      // Where the letter card ends up, on the nightstand beside the keepsake box.
      card: { x: 342, y: 322 },
    },
  },
  {
    id: "bathroom",
    displayName: "Łazienka",
    type: "puzzle",
    letterPosition: 1,
    shape: "M397,316 H547 V490 H397 Z",
    label: { x: 506, y: 442, size: 13 }, // must clear the sauna on the left and the wall on the right
    badge: { x: 519, y: 470 },
    scene: {
      src: "rooms/bathroom.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      // The dial mounts in the recess drawn on the sauna control plate in bathroom.svg —
      // move one and move the other. `min`/`max` bound what the dial can be set to, so
      // PERSONALIZATION.favoriteNumber has to land inside this range; widen it here if their
      // number is bigger than a sauna would plausibly go.
      dial: { cx: 613, cy: 225, radius: 56, min: 0, max: 120, step: 1 },
      // Where the lifted tile and the letter card end up once it is solved.
      tile: { x: 372, y: 410, width: 72, height: 40 },
      hotspots: {
        dog: { shape: "M239,382 H311 V456 H239 Z", label: "Pies" },
        // The tub, taking in the tap at its far end.
        tub: { shape: "M20,244 H244 V396 H20 Z", label: "Wanna" },
        shower: { shape: "M70,90 H174 V198 H70 Z", label: "Słuchawka prysznicowa" },
        towels: { shape: "M250,170 H300 V248 H250 Z", label: "Ręczniki" },
        // The glass door, not the control plate — the dial mounts to the right of this.
        sauna: { shape: "M336,120 H500 V394 H336 Z", label: "Drzwi sauny" },
        saunaHandle: { shape: "M498,222 H524 V282 H498 Z", label: "Klamka od sauny" },
      },
    },
  },
  {
    id: "mainBedroom",
    displayName: "Sypialnia",
    type: "puzzle",
    letterPosition: 4,
    shape: "M547,316 H750 V490 H547 Z",
    label: { x: 662, y: 472 },
    badge: { x: 600, y: 352 },
    scene: {
      src: "rooms/main-bedroom.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      hotspots: {
        clock: {
          shape: "M190,226 H280 V292 H190 Z",
          label: "Budzik",
        },
        dog: { shape: "M433,401 H536 V448 H433 Z", label: "Pies" },
        window: { shape: "M20,34 H220 V182 H20 Z", label: "Okno" },
        bed: { shape: "M296,142 H650 V398 H296 Z", label: "Łóżko" },
        lamp: { shape: "M652,226 H714 V398 H652 Z", label: "Lampa stojąca" },
        rug: { shape: "M226,404 H430 V454 H226 Z", label: "Dywan" },
      },
      // Where the letter card ends up once the nightstand drawer opens.
      card: { x: 234, y: 324 },
    },
  },
  {
    id: "balcony",
    displayName: "Balkon",
    type: "clue",
    shape: "M12,18 H345 V90 H60 V486 H12 Z",
    label: { x: 34, y: 316, rotate: -90 },
    badge: { x: 34, y: 200 },
    scene: {
      src: "rooms/balcony.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      hotspots: {
        plant: {
          shape: "M88,268 H196 V420 H88 Z",
          label: "Duża roślina w doniczce",
        },
        telescope: {
          shape: "M442,256 H562 V424 H442 Z",
          label: "Teleskop",
        },
        dog: { shape: "M322,349 H424 V426 H322 Z", label: "Pies" },
        // The skyline above the railing, and the railing itself. Both stop short of the
        // telescope so it keeps its own hit area.
        panorama: { shape: "M0,150 H438 V244 H0 Z", label: "Widok z balkonu" },
        // Two segments, so the gap leaves the plant's own hit area untouched.
        railing: { shape: "M0,244 H84 V324 H0 Z M200,244 H438 V324 H200 Z", label: "Barierka" },
        table: { shape: "M212,314 H332 V424 H212 Z", label: "Stolik" },
      },
    },
  },
  {
    id: "frontDoor",
    displayName: "Drzwi wejściowe",
    type: "final",
    shape: "M309,360 H397 V490 H309 Z",
    label: null, // the doorway itself is the label
    badge: { x: 355, y: 428 },
    scene: {
      src: "rooms/front-door.svg",
      viewBox: "0 0 720 460",
      width: 720,
      height: 460,
      // The handle is declared before the lock because their boxes touch, and later hotspots
      // paint on top: the lock must keep every pixel of its own hit area.
      hotspots: {
        handle: { shape: "M438,196 H472 V250 H438 Z", label: "Klamka" },
        lock: { shape: "M266,192 H454 V284 H266 Z", label: "Zamek" },
        dog: { shape: "M112,326 H196 V408 H112 Z", label: "Pies" },
        coats: { shape: "M52,110 H202 V266 H52 Z", label: "Płaszcze na wieszaku" },
        umbrellas: { shape: "M550,248 H616 V400 H550 Z", label: "Stojak na parasole" },
        doormat: { shape: "M262,406 H458 V452 H262 Z", label: "Wycieraczka" },
        transom: { shape: "M244,8 H476 V46 H244 Z", label: "Okienko nad drzwiami" },
        box: { shape: "M620,300 H706 V400 H620 Z", label: "Karton przy drzwiach" },
      },
    },
  },
];

function getRoom(roomId) {
  return ROOMS.find((room) => room.id === roomId);
}

// The four rooms that must be solved before the Front Door can be opened, in word order.
function letterRooms() {
  return ROOMS.filter((room) => room.letterPosition).sort(
    (a, b) => a.letterPosition - b.letterPosition
  );
}
