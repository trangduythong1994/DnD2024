export const VERSION = 1;
export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
export const ABILITY_NAMES = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};
export const SKILLS = [
  ["Acrobatics", "dex", "Balance, tumbling, and acrobatics."],
  ["Animal Handling", "wis", "Handle and control animals."],
  ["Arcana", "int", "Knowledge of magic."],
  ["Athletics", "str", "Climbing, jumping, and swimming."],
  ["Deception", "cha", "Conceal the truth or mislead."],
  ["History", "int", "Recall historical events."],
  ["Insight", "wis", "Read intentions and moods."],
  ["Intimidation", "cha", "Influence through threats."],
  ["Investigation", "int", "Draw conclusions from clues."],
  ["Medicine", "wis", "Medical knowledge."],
  ["Nature", "int", "Knowledge of the natural world."],
  ["Perception", "wis", "Notice the world around you."],
  ["Performance", "cha", "Perform for an audience."],
  ["Persuasion", "cha", "Persuade through reason or goodwill."],
  ["Religion", "int", "Knowledge of religion."],
  ["Sleight of Hand", "dex", "Fine manual manipulation."],
  ["Stealth", "dex", "Hide and move quietly."],
  ["Survival", "wis", "Track and survive in the wild."],
];
export const modifier = (score) => Math.floor((score - 10) / 2);
export const proficiency = (level) => 2 + Math.floor((level - 1) / 4);
export const signed = (n) => (n >= 0 ? "+" + n : String(n));
export function bonus(c, ability, rank = 0, extra = 0) {
  return (
    modifier(c.abilities[ability]) +
    rank * (proficiency(c.level) + c.pbExtra) +
    extra
  );
}
export function freshCharacter() {
  return {
    version: VERSION,
    name: "",
    player: "",
    level: 1,
    xp: 0,
    alignment: "",
    size: "Medium",
    languages: "Common",
    class: null,
    subclass: null,
    species: null,
    background: null,
    originFeat: null,
    abilities: Object.fromEntries(ABILITIES.map((a) => [a, 10])),
    pbExtra: 0,
    skills: Object.fromEntries(SKILLS.map(([s]) => [s, { rank: 0, extra: 0 }])),
    saves: Object.fromEntries(ABILITIES.map((a) => [a, { rank: 0, extra: 0 }])),
    combat: {
      ac: 10,
      initiativeExtra: 0,
      speed: 30,
      hp: 0,
      maxHp: 0,
      tempHp: 0,
      hitDice: "",
      hitDiceLeft: 0,
      successes: 0,
      failures: 0,
      inspiration: false,
      conditions: "",
    },
    spellcasting: {
      ability: "int",
      attackExtra: 0,
      dcExtra: 0,
      preparedLimit: 0,
      notes: "",
    },
    slots: Array.from({ length: 9 }, () => ({ max: 0, used: 0 })),
    coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    items: [],
    spells: [],
    features: [],
    traits: [],
    feats: [],
    notes: [],
    biography: "",
    appearance: "",
    personality: "",
    characterNotes: "",
    originNotes: "",
    reviewNeeded: false,
  };
}
export const ITEM_KINDS = [
  "class",
  "subclass",
  "species",
  "background",
  "originFeat",
  "items",
  "spells",
  "features",
  "traits",
  "feats",
  "notes",
];
export function newEntry() {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    source: "Custom",
    quantity: 1,
    weight: 0,
    equipped: false,
    attuned: false,
    level: 0,
    prepared: false,
    casting: "",
    range: "",
    components: "",
    duration: "",
    category: "",
    done: false,
  };
}
function fail(path) {
  throw new Error(
    "Invalid data at “" +
      path +
      "”. Import a file exported by this Character Sheet.",
  );
}
function checkShape(value, template, path) {
  if (typeof template === "number") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      Math.abs(value) > 1000000000
    )
      fail(path);
  } else if (typeof template === "string") {
    if (typeof value !== "string" || value.length > 100000) fail(path);
  } else if (typeof template === "boolean") {
    if (typeof value !== "boolean") fail(path);
  } else if (Array.isArray(template)) {
    if (!Array.isArray(value)) fail(path);
  } else if (template !== null) {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(path);
    for (const k of Object.keys(template))
      checkShape(value[k], template[k], path + "." + k);
  }
}
function inRange(n, min, max, path) {
  if (!Number.isInteger(n) || n < min || n > max) fail(path);
}
export function validateCharacter(input) {
  if (!input || input.version !== VERSION)
    throw new Error("Unsupported JSON version (version 1 is required).");
  const base = freshCharacter();
  checkShape(input, base, "character");
  inRange(input.level, 1, 20, "level");
  for (const a of ABILITIES) inRange(input.abilities[a], 1, 30, a);
  if (!ABILITIES.includes(input.spellcasting.ability))
    fail("spellcasting.ability");
  for (const [s, v] of Object.entries(input.skills)) {
    if (!base.skills[s]) fail(s);
    inRange(v.rank, 0, 2, s);
  }
  for (const [s, v] of Object.entries(input.saves)) {
    if (!ABILITIES.includes(s)) fail(s);
    inRange(v.rank, 0, 1, s);
  }
  for (const k of ["successes", "failures"]) inRange(input.combat[k], 0, 3, k);
  for (const k of ["ac", "speed", "hp", "maxHp", "tempHp", "hitDiceLeft"])
    if (input.combat[k] < 0) fail(k);
  if (input.combat.hp > input.combat.maxHp) fail("current HP > maximum HP");
  if (input.slots.length !== 9) fail("slots");
  input.slots.forEach((s, i) => {
    checkShape(s, { max: 0, used: 0 }, "slots");
    inRange(s.max, 0, 99, "slots.max");
    inRange(s.used, 0, s.max, "slots.used");
  });
  for (const n of Object.values(input.coins)) if (n < 0) fail("coins");
  const ids = new Set();
  for (const k of ITEM_KINDS) {
    const entries = [
      "class",
      "subclass",
      "species",
      "background",
      "originFeat",
    ].includes(k)
      ? input[k] === null
        ? []
        : [input[k]]
      : input[k];
    if (!Array.isArray(entries) || entries.length > 1000) fail(k);
    for (const entry of entries) {
      checkShape(entry, newEntry(), k);
      if (!entry.name.trim() || !entry.id || ids.has(entry.id))
        fail(k + ".name/id");
      ids.add(entry.id);
      inRange(entry.level, 0, 9, k + ".level");
      inRange(entry.quantity, 0, 99999, k + ".quantity");
      if (entry.weight < 0) fail(k + ".weight");
    }
  }
  // Rebuild known keys only; never merge arbitrary JSON into application prototypes.
  function clean(v, t) {
    if (t === null) return v === null ? null : clean(v, newEntry());
    if (Array.isArray(t)) return [];
    if (typeof t !== "object") return v;
    return Object.fromEntries(
      Object.keys(t).map((k) => [k, clean(v[k], t[k])]),
    );
  }
  const result = clean(input, base);
  result.slots = input.slots.map((s) => ({ max: s.max, used: s.used }));
  for (const k of ["items", "spells", "features", "traits", "feats", "notes"])
    result[k] = input[k].map((e) => clean(e, newEntry()));
  return result;
}
export function parseBackup(text) {
  if (text.length > 5000000)
    throw new Error("File is too large. The limit is 5 MB.");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "Invalid JSON syntax. Your current character has been kept.",
    );
  }
  return validateCharacter(parsed);
}
export function totalWeight(c) {
  return c.items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
}
