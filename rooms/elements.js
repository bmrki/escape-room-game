// Data-only: the first 31 elements — everything a day-of-month can point at.
//
// Her Office reads the Kitchen date's day-of-month as an atomic number, so this table only
// needs to reach 31. `group`/`period` are the real periodic-table column and row, used to lay
// the poster out properly in the close-up.
//
// `hydride` is what the element makes with hydrogen. It is null for the noble gases, which
// form nothing — see the note in scenes.js: a date whose day-of-month is 2, 10 or 18 makes
// this puzzle unsolvable, and the game says so rather than pretending otherwise.
const ELEMENTS = [
  { number: 1,  symbol: "H",  name: "Wodór",   group: 1,  period: 1, hydride: { formula: "H₂",   name: "wodór cząsteczkowy" } },
  { number: 2,  symbol: "He", name: "Hel",     group: 18, period: 1, hydride: null },
  { number: 3,  symbol: "Li", name: "Lit",    group: 1,  period: 2, hydride: { formula: "LiH",  name: "wodorek litu" } },
  { number: 4,  symbol: "Be", name: "Beryl",  group: 2,  period: 2, hydride: { formula: "BeH₂", name: "wodorek berylu" } },
  { number: 5,  symbol: "B",  name: "Bor",      group: 13, period: 2, hydride: { formula: "BH₃",  name: "boran" } },
  { number: 6,  symbol: "C",  name: "Węgiel",     group: 14, period: 2, hydride: { formula: "CH₄",  name: "metan" } },
  { number: 7,  symbol: "N",  name: "Azot",   group: 15, period: 2, hydride: { formula: "NH₃",  name: "amoniak" } },
  { number: 8,  symbol: "O",  name: "Tlen",     group: 16, period: 2, hydride: { formula: "H₂O",  name: "woda" } },
  { number: 9,  symbol: "F",  name: "Fluor",   group: 17, period: 2, hydride: { formula: "HF",   name: "kwas fluorowodorowy" } },
  { number: 10, symbol: "Ne", name: "Neon",       group: 18, period: 2, hydride: null },
  { number: 11, symbol: "Na", name: "Sód",     group: 1,  period: 3, hydride: { formula: "NaH",  name: "wodorek sodu" } },
  { number: 12, symbol: "Mg", name: "Magnez",  group: 2,  period: 3, hydride: { formula: "MgH₂", name: "wodorek magnezu" } },
  { number: 13, symbol: "Al", name: "Glin",  group: 13, period: 3, hydride: { formula: "AlH₃", name: "wodorek glinu" } },
  { number: 14, symbol: "Si", name: "Krzem",    group: 14, period: 3, hydride: { formula: "SiH₄", name: "silan" } },
  { number: 15, symbol: "P",  name: "Fosfor", group: 15, period: 3, hydride: { formula: "PH₃",  name: "fosforowodór" } },
  { number: 16, symbol: "S",  name: "Siarka",     group: 16, period: 3, hydride: { formula: "H₂S",  name: "siarkowodór" } },
  { number: 17, symbol: "Cl", name: "Chlor",   group: 17, period: 3, hydride: { formula: "HCl",  name: "kwas solny" } },
  { number: 18, symbol: "Ar", name: "Argon",      group: 18, period: 3, hydride: null },
  { number: 19, symbol: "K",  name: "Potas",  group: 1,  period: 4, hydride: { formula: "KH",   name: "wodorek potasu" } },
  { number: 20, symbol: "Ca", name: "Wapń",    group: 2,  period: 4, hydride: { formula: "CaH₂", name: "wodorek wapnia" } },
  { number: 21, symbol: "Sc", name: "Skand",   group: 3,  period: 4, hydride: { formula: "ScH₂", name: "wodorek skandu" } },
  { number: 22, symbol: "Ti", name: "Tytan",   group: 4,  period: 4, hydride: { formula: "TiH₂", name: "wodorek tytanu" } },
  { number: 23, symbol: "V",  name: "Wanad",   group: 5,  period: 4, hydride: { formula: "VH₂",  name: "wodorek wanadu" } },
  { number: 24, symbol: "Cr", name: "Chrom",   group: 6,  period: 4, hydride: { formula: "CrH",  name: "wodorek chromu" } },
  { number: 25, symbol: "Mn", name: "Mangan",  group: 7,  period: 4, hydride: { formula: "MnH",  name: "wodorek manganu" } },
  { number: 26, symbol: "Fe", name: "Żelazo",       group: 8,  period: 4, hydride: { formula: "FeH",  name: "wodorek żelaza" } },
  { number: 27, symbol: "Co", name: "Kobalt",     group: 9,  period: 4, hydride: { formula: "CoH",  name: "wodorek kobaltu" } },
  { number: 28, symbol: "Ni", name: "Nikiel",     group: 10, period: 4, hydride: { formula: "NiH",  name: "wodorek niklu" } },
  { number: 29, symbol: "Cu", name: "Miedź",     group: 11, period: 4, hydride: { formula: "CuH",  name: "wodorek miedzi(I)" } },
  { number: 30, symbol: "Zn", name: "Cynk",       group: 12, period: 4, hydride: { formula: "ZnH₂", name: "wodorek cynku" } },
  { number: 31, symbol: "Ga", name: "Gal",    group: 13, period: 4, hydride: { formula: "GaH₃", name: "wodorek galu" } },
];

function getElementByNumber(number) {
  return ELEMENTS.find((element) => element.number === number) ?? null;
}
