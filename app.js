import {
  ABILITIES,
  ABILITY_NAMES,
  SKILLS,
  modifier,
  proficiency,
  signed,
  bonus,
  freshCharacter,
  newEntry,
  parseBackup,
  totalWeight,
} from "./model.js?v=5";
import { library, SRD, manualNotice, attribution } from "./rules.js?v=5";
const $ = (s) => document.querySelector(s);
const KEY = "dnd2024.character.v1",
  DRAFT_KEY = "dnd2024.editor-draft.v1";
let character = freshCharacter(),
  storageBlocked = false,
  leftTab = "overview",
  rightTab = "items",
  mobilePanel = "character",
  ref = null,
  pickerContext = null,
  pickerSelected = null,
  draftDirty = false,
  toastTimer;
const names = {
  class: "Class",
  subclass: "Subclass",
  species: "Species",
  background: "Background",
  originFeat: "Origin Feat",
  items: "Items",
  spells: "Spells",
  features: "Features",
  traits: "Traits",
  feats: "Feats",
  notes: "Session / quest notes",
};
const singles = ["class", "subclass", "species", "background", "originFeat"];
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === "class") node.className = val;
    else if (key === "text") node.textContent = val;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), val);
    else if (key === "checked" || key === "hidden" || key === "disabled")
      node[key] = val;
    else node.setAttribute(key, val);
  }
  for (const child of children.flat()) {
    if (child !== null && child !== undefined)
      node.append(
        child instanceof Node ? child : document.createTextNode(String(child)),
      );
  }
  return node;
}
function button(text, fn, cls = "", attrs = {}) {
  return el(
    "button",
    { type: "button", class: cls, onclick: fn, ...attrs },
    text,
  );
}
function get(path) {
  return path.split(".").reduce((o, k) => o[k], character);
}
function set(path, value) {
  const keys = path.split("."),
    last = keys.pop();
  keys.reduce((o, k) => o[k], character)[last] = value;
}
function field(label, path, type = "text", opts = {}) {
  const control = el(type === "textarea" ? "textarea" : "input", {
    "data-path": path,
    ...(path.startsWith("abilities.")
      ? { "aria-label": ABILITY_NAMES[path.split(".")[1]] + " Score" }
      : {}),
    ...(type === "textarea" ? { rows: 5 } : { type }),
    ...opts,
  });
  if (type === "checkbox") control.checked = get(path);
  else control.value = get(path);
  return el(
    "label",
    { class: type === "checkbox" ? "check" : "" },
    type === "checkbox" ? control : label,
    type === "checkbox" ? label : control,
  );
}
function select(label, path, options) {
  const control = el(
    "select",
    { "data-path": path },
    options.map(([value, text]) => el("option", { value }, text)),
  );
  control.value = get(path);
  return el("label", {}, label, control);
}
function hint(text) {
  return el("p", { class: "hint" }, text);
}
function head(title, action) {
  return el("div", { class: "section-head" }, el("h2", {}, title), action);
}
function notify(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 5000);
}
function save() {
  if (storageBlocked) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(character));
  } catch {
    notify("Your browser could not save this character.");
  }
}
function confirmAction(message) {
  return new Promise((resolve) => {
    const d = $("#confirm-dialog");
    $("#confirm-message").textContent = message;
    const finish = (answer) => {
      d.close();
      d.oncancel = null;
      resolve(answer);
    };
    $("#accept-confirm").onclick = () => finish(true);
    $("#cancel-confirm").onclick = () => finish(false);
    d.oncancel = (e) => {
      e.preventDefault();
      finish(false);
    };
    d.showModal();
    $("#cancel-confirm").focus();
  });
}
try {
  const raw = localStorage.getItem(KEY);
  if (raw) character = parseBackup(raw);
  let migrated = false;
  if (character.originFeat) {
    if (!character.feats.some((feat) => feat.name === character.originFeat.name)) {
      character.feats.push(character.originFeat);
    }
    character.originFeat = null;
    migrated = true;
  }
  if (migrated) save();
} catch (error) {
  storageBlocked = true;
  queueMicrotask(() =>
    notify(
      "The saved character could not be read. Existing data was kept; create a new character to continue.",
    ),
  );
}
function stat(label, value, description, path) {
  return button(
    [label, value].join(" "),
    () => showInfo(label, description, path),
    "stat",
  );
}
function calculatedDescription(label, fallback) {
  const c = character,
    pb = proficiency(c.level),
    a = c.spellcasting.ability,
    m = modifier(c.abilities[a]);
  const descriptions = {
    "SPELL ATTACK": `${ABILITY_NAMES[a]} ${signed(m)} + PB ${pb} = ${signed(m + pb)}`,
    "SPELL SAVE DC": `8 + ${ABILITY_NAMES[a]} ${signed(m)} + PB ${pb} = ${8 + m + pb}`,
  };
  return descriptions[label] || fallback;
}
function statCard(label, value, description, path) {
  const b = button(
    "",
    () => showInfo(label, calculatedDescription(label, description), path),
    "stat",
  );
  b.append(el("span", {}, label), el("strong", {}, value));
  return b;
}
function showInfo(title, description, path = null) {
  ref = { title, description, path };
  renderReference();
}
function showEntry(kind, id) {
  const entry = singles.includes(kind)
    ? character[kind]
    : character[kind].find((e) => e.id === id);
  if (entry) {
    ref = { kind, id };
    renderReference();
  }
}
function renderReference() {
  const aside = $("#reference");
  $("#reference-backdrop").hidden = !ref;
  if (!ref) return;
  const content = $("#reference-content");
  content.replaceChildren();
  if (ref.kind) {
    const e = singles.includes(ref.kind)
      ? character[ref.kind]
      : character[ref.kind].find((x) => x.id === ref.id);
    if (!e) {
      ref = null;
      renderReference();
      return;
    }
    content.append(
      el("h2", {}, e.name),
      el(
        "p",
        { class: "muted" },
        [names[ref.kind], e.category].filter(Boolean).join(" · "),
      ),
      el("p", {}, e.description || "No description yet."),
    );
    if (ref.kind === "spells")
      content.append(
        el(
          "p",
          {},
          `Level ${e.level} · ${e.casting}\nRange: ${e.range}\nComponents: ${e.components}\nDuration: ${e.duration}`,
        ),
      );
    if (ref.kind === "items")
      content.append(
        el(
          "p",
          {},
          `${e.quantity} × ${e.weight} lb · ${e.equipped ? "Equipped" : "Not equipped"} · ${e.attuned ? "Attuned" : "Not attuned"}`,
        ),
      );
    content.append(el("p", { class: "muted" }, e.source || "No source listed"));
    sourceLink(content, e);
    content.append(
      el(
        "p",
        {},
        button("Edit entry", () => openPicker(ref.kind, e), "primary"),
        button("Delete entry", () => removeEntry(ref.kind, e.id), "danger"),
      ),
    );
  } else {
    content.append(el("h2", {}, ref.title), el("p", {}, ref.description));
    if (ref.path)
      content.append(
        button("Go to field", () => {
          const p = ref.path;
          ref = null;
          renderReference();
          if (p.startsWith("abilities")) leftTab = "overview";
          else if (p.startsWith("combat")) leftTab = "combat";
          else if (p.startsWith("skills") || p.startsWith("saves"))
            leftTab = "skills";
          else if (p.startsWith("spellcasting")) rightTab = "spells";
          render();
          document.querySelector(`[data-path="${p}"]`)?.focus();
        }),
      );
  }
}
function sourceLink(target, e) {
  if (e.source.startsWith("SRD 5.2.1")) {
    const page = e.source.match(/p\.\s*(\d+)/)?.[1];
    target.append(
      el(
        "a",
        {
          href: SRD + (page ? "#page=" + page : ""),
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "Read SRD source ↗",
      ),
    );
  }
}
$("#close-reference").onclick = () => {
  ref = null;
  renderReference();
};
$("#reference-backdrop").onclick = (event) => {
  if (event.target !== event.currentTarget) return;
  ref = null;
  renderReference();
};
function choice(kind) {
  const entry = character[kind];
  const subclassLocked =
    kind === "subclass" && (character.level < 3 || !character.class);
  return el(
    "div",
    { class: "choice" },
    el("label", {}, names[kind]),
    el(
      "div",
      { class: "choice-line" },
      button(
        entry?.name || (subclassLocked ? "Available at level 3" : "＋ Choose"),
        () => openPicker(kind),
        "editable-choice",
        {
          "aria-label": "Choose " + names[kind],
          disabled: subclassLocked,
        },
      ),
      entry
        ? button("ⓘ", () => showEntry(kind, entry.id), "text-button", {
            "aria-label": "View " + names[kind],
          })
        : null,
    ),
  );
}
function renderIdentity() {
  $("#character-name").value = character.name;
  const n = $("#review-notice");
  n.hidden = !character.reviewNeeded;
  n.replaceChildren(
    document.createTextNode("Review affected values after changing origin or class."),
    button("Done", () => {
      character.reviewNeeded = false;
      save();
      render();
    }),
  );
}
const leftTabs = [
    ["overview", "Overview"],
    ["combat", "Combat"],
    ["skills", "Skills"],
    ["features", "Features"],
    ["feats", "Feats"],
    ["origin", "Origin"],
    ["story", "Biography"],
  ],
  rightTabs = [
    ["items", "Inventory"],
    ["spells", "Spells"],
    ["notes", "Journal"],
  ];
function renderTabs(side, tabs, active) {
  const nav = $("#" + side + "-tabs");
  nav.replaceChildren(
    ...tabs.map(([id, label]) =>
      button(
        label,
        () => {
          if (side === "left") leftTab = id;
          else rightTab = id;
          render();
          $("#" + side + "-tab-" + id).focus();
        },
        "",
        {
          id: side + "-tab-" + id,
          role: "tab",
          "aria-selected": String(id === active),
          "aria-controls": side + "-content",
          tabindex: id === active ? "0" : "-1",
        },
      ),
    ),
  );
  $("#" + side + "-content").setAttribute(
    "aria-labelledby",
    side + "-tab-" + active,
  );
  const mobileSelect = $("#" + side + "-mobile-tabs");
  mobileSelect.replaceChildren(
    ...tabs.map(([id, label]) => el("option", { value: id }, label)),
  );
  mobileSelect.value = active;
  mobileSelect.onchange = () => {
    if (side === "left") leftTab = mobileSelect.value;
    else rightTab = mobileSelect.value;
    render();
  };
}
function renderMobilePanel() {
  $(".workspace").dataset.mobilePanel = mobilePanel;
  $("#show-character").setAttribute(
    "aria-pressed",
    String(mobilePanel === "character"),
  );
  $("#show-gear").setAttribute("aria-pressed", String(mobilePanel === "gear"));
}
$("#show-character").onclick = () => {
  mobilePanel = "character";
  renderMobilePanel();
};
$("#show-gear").onclick = () => {
  mobilePanel = "gear";
  renderMobilePanel();
};
for (const side of ["left", "right"])
  $("#" + side + "-tabs").addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const tabs = side === "left" ? leftTabs : rightTabs;
    let i = tabs.findIndex(
      ([id]) => id === (side === "left" ? leftTab : rightTab),
    );
    i =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? tabs.length - 1
          : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    if (side === "left") leftTab = tabs[i][0];
    else rightTab = tabs[i][0];
    render();
    $("#" + side + "-tab-" + tabs[i][0]).focus();
  });
function overview() {
  const c = character,
    pb = proficiency(c.level);
  return [
    head("Character details"),
    el(
      "div",
      { class: "overview-identity-grid" },
      choice("class"),
      choice("subclass"),
      field("Level", "level", "number", { min: 1, max: 20 }),
      choice("species"),
      choice("background"),
    ),
    head("Ability scores"),
    el(
      "div",
      { class: "abilities" },
      ABILITIES.map((a) =>
        el(
          "div",
          { class: "ability" },
          button(ABILITY_NAMES[a].toUpperCase(), () =>
            showInfo(
              ABILITY_NAMES[a],
              `Modifier = floor((${c.abilities[a]} − 10) / 2) = ${signed(modifier(c.abilities[a]))}. Enter final scores, including background and feat changes.`,
              "abilities." + a,
            ),
          ),
          el("span", { class: "modifier" }, signed(modifier(c.abilities[a]))),
          field("Score", "abilities." + a, "number", { min: 1, max: 30 }),
        ),
      ),
    ),
    el(
      "div",
      { class: "proficiency-line" },
      button(
        "Proficiency Bonus ⓘ",
        () =>
          showInfo(
            "Proficiency Bonus",
            `Level ${c.level}: ${proficiency(c.level)}. Levels 1–4: +2; 5–8: +3; 9–12: +4; 13–16: +5; 17–20: +6.`,
          ),
        "text-button",
      ),
      el("strong", {}, signed(pb)),
    ),
    hint(
      "Enter final scores, including background and feat changes. The library stores references only and does not add bonuses to scores.",
    ),
  ];
}
function combat() {
  return [
    head("Ready for combat"),
    el(
      "div",
      { class: "grid three" },
      field("Armor Class (AC)", "combat.ac", "number", { min: 0, max: 99 }),
      field("Speed (ft)", "combat.speed", "number", { min: 0 }),
      statCard(
        "INITIATIVE",
        signed(modifier(character.abilities.dex)),
        `DEX modifier: ${signed(modifier(character.abilities.dex))}.`,
      ),
      field("Current HP", "combat.hp", "number", {
        min: 0,
        max: character.combat.maxHp,
      }),
      field("Maximum HP", "combat.maxHp", "number", { min: 0 }),
      field("Temporary HP", "combat.tempHp", "number", { min: 0 }),
    ),
    el(
      "div",
      { class: "inspiration" },
      field("Heroic Inspiration", "combat.inspiration", "checkbox"),
      button("How it works ↗", () =>
        showInfo(
          "Heroic Inspiration",
          "Spend it to reroll any die immediately after rolling it; you must use the new result. You can hold only one. If you gain another while already holding one, you can give it to a party character who lacks it. Humans gain it after a Long Rest; mark this manually.\nSRD 5.2.1 · p. 8",
          "combat.inspiration",
        ),
      ),
    ),
    el(
      "div",
      { class: "grid" },
      field("Hit Dice (vd. 3d10)", "combat.hitDice"),
      field("Hit Dice remaining", "combat.hitDiceLeft", "number", { min: 0 }),
    ),
    el("h3", {}, "Death saves"),
    el(
      "div",
      { class: "grid" },
      select("Successes", "combat.successes", [
        [0, "○ ○ ○"],
        [1, "● ○ ○"],
        [2, "● ● ○"],
        [3, "● ● ●"],
      ]),
      select("Failures", "combat.failures", [
        [0, "○ ○ ○"],
        [1, "● ○ ○"],
        [2, "● ● ○"],
        [3, "● ● ●"],
      ]),
    ),
    el(
      "p",
      { class: "muted" },
      "Track manually. Three successes stabilize you; three failures kill you. Reset when you regain HP or become stable.",
    ),
    field("Current conditions & effects", "combat.conditions", "textarea"),
    ...spellcastingSummary(),
    hint(
      "Enter AC, HP, Hit Dice, rests, and class or species benefits manually. Temporary HP is one current value and does not stack automatically.",
    ),
  ];
}
function skills() {
  const row = (name, ability, path, max) => {
    const v = get(path),
      total = bonus(character, ability, v.rank);
    const choiceSelect = select("Proficiency level", path + ".rank", [
      [0, "Not proficient"],
      [1, "Proficiency"],
      ...(max === 2 ? [[2, "Expertise"]] : []),
    ]).lastChild;
    choiceSelect.setAttribute("aria-label", name + " proficiency");
    return el(
      "div",
      { class: "skill-row" },
      button("", () =>
        showInfo(
          name,
          `${SKILLS.find((s) => s[0] === name)?.[2] || "Saving throw: " + ABILITY_NAMES[ability] + "."}\n${ABILITY_NAMES[ability]} ${signed(modifier(character.abilities[ability]))} + ${v.rank} × PB ${proficiency(character.level)} = ${signed(bonus(character, ability, v.rank))}.\nSRD 5.2.1 · pp. 7–9`,
        ),
      ).appendChild(document.createTextNode(name)).parentElement,
      choiceSelect,
      el("output", { "aria-label": name + " bonus" }, signed(total)),
    );
  };
  return [
    head("Proficiencies & skills"),
    el(
      "p",
      { class: "muted" },
      "Each row shows proficiency level and total. Expertise = 2 × PB; saving throws can only be proficient.",
    ),
    el("h3", {}, "Saving throws"),
    ...ABILITIES.map((a) => row(ABILITY_NAMES[a], a, "saves." + a, 1)),
    el("h3", {}, "Skills"),
    ...SKILLS.map(([s, a]) => row(s, a, "skills." + s, 2)),
  ];
}
function listSection(kind, title = names[kind]) {
  return [
    head(
      title,
      button("＋ Add", () => openPicker(kind), "", {
        "aria-label": "Add " + names[kind],
      }),
    ),
    character[kind].length
      ? el(
          "div",
          { class: "list" },
          character[kind].map((e) => itemCard(kind, e)),
        )
      : el(
          "div",
          { class: "empty" },
          el(
            "div",
            { class: "empty-icon" },
            kind === "items" ? "◇" : kind === "spells" ? "✧" : "＋",
          ),
          el(
            "h3",
            {},
            kind === "items" ? "Your inventory is empty" : "No entries yet",
          ),
          el(
            "p",
            {},
            "Choose from the library or create an entry for this character.",
          ),
          button("＋ Add " + names[kind], () => openPicker(kind), "primary"),
        ),
  ];
}
function itemCard(kind, e) {
  const at = character[kind].findIndex((x) => x.id === e.id),
    path = kind + "." + at;
  let meta = e.category || e.source;
  if (kind === "items")
    meta = `${e.weight} lb each · ${(e.quantity * e.weight).toLocaleString("en-US")} lb total`;
  if (kind === "spells")
    meta = `${e.level === 0 ? "Cantrip" : "Level " + e.level} · ${e.category} · ${e.casting} · ${e.range}`;
  const box = el(
    "article",
    { class: "item" },
    el(
      "div",
      { class: "item-top" },
      button(e.name, () => showEntry(kind, e.id), "item-title"),
      el(
        "div",
        {},
        button("Edit", () => openPicker(kind, e), "icon-button", {
          "aria-label": "Edit " + e.name,
        }),
        button("×", () => removeEntry(kind, e.id), "icon-button danger", {
          "aria-label": "Delete " + e.name,
        }),
      ),
    ),
    el("p", { class: "item-meta" }, meta),
  );
  const controls = el("div", { class: "item-controls" });
  if (kind === "items")
    controls.append(
      field("SL", path + ".quantity", "number", { min: 0, max: 99999 }),
      field("Equipped", path + ".equipped", "checkbox"),
      field("Attuned", path + ".attuned", "checkbox"),
    );
  if (kind === "spells" && e.level > 0)
    controls.append(field("Prepared", path + ".prepared", "checkbox"));
  if (kind === "notes")
    controls.append(field("Complete", path + ".done", "checkbox"));
  box.append(controls);
  return box;
}
async function removeEntry(kind, id) {
  if (!(await confirmAction("Delete this entry from the character?"))) return;
  if (singles.includes(kind)) {
    character[kind] = null;
    if (kind === "class") character.subclass = null;
    character.reviewNeeded = true;
  } else character[kind] = character[kind].filter((x) => x.id !== id);
  save();
  render();
  renderReference();
  notify("Entry deleted.");
}
function inventory() {
  const attuned = character.items.filter((e) => e.attuned).length;
  return [
    el(
      "div",
      { class: "coins" },
      Object.keys(character.coins).map((k) =>
        field(k.toUpperCase(), "coins." + k, "number", { min: 0 }),
      ),
    ),
    ...listSection("items", "Equipment & items"),
    el(
      "div",
      { class: "stats" },
      statCard(
        "WEIGHT",
        totalWeight(character).toLocaleString("vi-VN") + " lb",
        "Total quantity × weight per item. Coins, carrying capacity, and weight-changing effects are not included.",
      ),
      statCard(
        "ATTUNEMENT",
        attuned + " / 3",
        "Usually, no more than three magic items can be attuned. Track manually and check any feature exceptions.",
      ),
      statCard(
        "ITEMS",
        character.items.length,
        "The number of entries in your inventory.",
      ),
    ),
    attuned > 3
      ? el(
          "p",
          { class: "error" },
          "More than three items are attuned. Check whether your character has an exception.",
        )
      : null,
  ];
}
const FULL_CASTER_SLOTS = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
function slotMaximums() {
  return ["Cleric", "Wizard"].includes(character.class?.name)
    ? FULL_CASTER_SLOTS[character.level - 1]
    : [];
}
function syncSpellSlots() {
  const maxima = slotMaximums();
  let changed = false;
  character.slots.forEach((slot, index) => {
    const max = maxima[index] || 0;
    const used = Math.min(slot.used, max);
    if (slot.max !== max || slot.used !== used) changed = true;
    slot.max = max;
    slot.used = used;
  });
  if (changed) save();
}
function spellcastingSummary() {
  const c = character,
    a = c.spellcasting.ability,
    pb = proficiency(c.level),
    m = modifier(c.abilities[a]);
  return [
    head("Spellcasting"),
    el(
      "div",
      { class: "grid" },
      select(
        "Spellcasting ability",
        "spellcasting.ability",
        ABILITIES.map((a) => [a, ABILITY_NAMES[a]]),
      ),
      field(
        "Prepared spell limit (manual)",
        "spellcasting.preparedLimit",
        "number",
        { min: 0 },
      ),
    ),
    el(
      "div",
      { class: "stats" },
      statCard(
        "SPELL ATTACK",
        signed(m + pb),
        `${ABILITY_NAMES[a]} ${signed(m)} + PB ${pb} = ${signed(m + pb)}`,
      ),
      statCard(
        "SPELL SAVE DC",
        8 + m + pb,
        `8 + ${ABILITY_NAMES[a]} ${signed(m)} + PB ${pb} = ${8 + m + pb}`,
      ),
      statCard(
        "PREPARED",
        c.spells.filter((s) => s.level > 0 && s.prepared).length +
          "/" +
          c.spellcasting.preparedLimit,
        "Counts only prepared spells of level 1+. Track your limit and always-prepared spells manually.",
        "spellcasting.preparedLimit",
      ),
    ),
    field(
      "Other spell sources / Pact Magic",
      "spellcasting.notes",
      "textarea",
    ),
  ];
}
function spells() {
  const c = character,
    maxima = slotMaximums();
  return [
    head("Spells", button("＋ Add spell", () => openPicker("spells"))),
    el("h3", {}, "Spell slots"),
    maxima.length
      ? el(
          "div",
          { class: "slots compact-slots" },
          maxima.map((max, i) => {
            const s = c.slots[i];
            return el(
              "div",
              { class: "slot compact-slot" },
              el(
                "div",
                { class: "slot-summary" },
                el("span", {}, "Level " + (i + 1)),
                el("strong", {}, max - s.used + " / " + max),
                el("small", {}, "remaining"),
              ),
              el(
                "div",
                { class: "slot-actions" },
                button(
                  "−",
                  () => {
                    s.used++;
                    save();
                    render();
                  },
                  "",
                  {
                    disabled: s.used >= max,
                    "aria-label": "Use level " + (i + 1) + " slot",
                  },
                ),
                button(
                  "+",
                  () => {
                    s.used = Math.max(0, s.used - 1);
                    save();
                    render();
                  },
                  "",
                  {
                    disabled: s.used === 0,
                    "aria-label": "Restore level " + (i + 1) + " slot",
                  },
                ),
              ),
            );
          }),
        )
      : el(
          "p",
          { class: "hint" },
          character.class
            ? `${character.class.name} does not have spell slots in the supported class path.`
            : "Choose a class and level to display its spell slots.",
        ),
    el(
      "p",
      { class: "muted" },
      "Slot maximums follow the selected supported class and character level. Use − to spend a slot and + to restore one.",
    ),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .filter((l) => c.spells.some((s) => s.level === l))
      .flatMap((l) => [
        el("h3", {}, l === 0 ? "Cantrips" : "Level " + l + " spells"),
        el(
          "div",
          { class: "list" },
          c.spells
            .filter((s) => s.level === l)
            .map((s) => itemCard("spells", s)),
        ),
      ]),
    !c.spells.length
      ? el(
          "p",
          { class: "hint" },
          "No spells yet. Use “Add spell” to search or create one.",
        )
      : null,
  ];
}
function features() {
  return ["features", "traits"].flatMap((k) => [
    ...listSection(k),
    el("div", { style: "height:22px" }),
  ]);
}
function feats() {
  return [
    head("Feats"),
    hint("Select any number of library feats. Benefits are applied manually."),
    el(
      "div",
      { class: "grid" },
      library.feats.map((entry) => {
        const input = el("input", {
          type: "checkbox",
          checked: character.feats.some((f) => f.name === entry.name),
          onchange: () => {
            if (input.checked)
              character.feats.push({ ...newEntry(), ...entry });
            else
              character.feats = character.feats.filter(
                (f) => f.name !== entry.name,
              );
            save();
            render();
          },
        });
        return el("label", { class: "check" }, input, entry.name);
      }),
    ),
    ...listSection("feats", "Selected & custom feats"),
  ];
}
function origin() {
  return [
    head("Character origin"),
    el(
      "div",
      { class: "grid" },
      choice("species"),
      choice("background"),
      field("Size", "size"),
    ),
    hint(
      "2024 backgrounds: increase one listed ability by 2 and another by 1, or increase all three by 1, to a maximum of 20. They grant an Origin Feat and skill/tool proficiencies. Apply these to final scores and relevant entries yourself. Species do not automatically increase ability scores.",
    ),
    field("Languages", "languages"),
    el("h3", {}, "Applied choices & benefits"),
    field(
      "Record bonuses, source, skills, tools, and species or feat choices",
      "originNotes",
      "textarea",
    ),
    hint(manualNotice),
  ];
}
function story() {
  return [
    head("Your story"),
    el(
      "div",
      { class: "grid" },
      field("XP", "xp", "number", { min: 0 }),
      field("Alignment", "alignment"),
    ),
    el(
      "div",
      { class: "text-stack" },
      field("Biography", "biography", "textarea"),
      field("Appearance", "appearance", "textarea"),
      field("Personality, ideals, bonds, flaws", "personality", "textarea"),
      field("Character notes", "characterNotes", "textarea"),
    ),
  ];
}
function fitPage(target) {
  const content = target.firstElementChild;
  if (!content) return;
  content.style.transform = "none";
  content.style.width = "100%";
  const available = target.clientHeight;
  if (available <= 0) return;
  let scale = Math.min(1, available / content.scrollHeight);
  for (let i = 0; i < 2 && scale < 1; i++) {
    content.style.width = 100 / scale + "%";
    scale = Math.min(1, available / content.scrollHeight);
  }
  content.style.width = scale < 1 ? 100 / scale + "%" : "100%";
  content.style.transform = `scale(${scale})`;
  target.dataset.scale = scale.toFixed(3);
}
function fitPages() {
  fitPage($("#left-content"));
  fitPage($("#right-content"));
}
function render() {
  syncSpellSlots();
  renderIdentity();
  renderMobilePanel();
  renderTabs("left", leftTabs, leftTab);
  renderTabs("right", rightTabs, rightTab);
  const left = $("#left-content"),
    right = $("#right-content");
  left.dataset.tab = leftTab;
  right.dataset.tab = rightTab;
  left.replaceChildren(
    el(
      "div",
      { class: "page-content" },
      ...{ overview, combat, skills, features, feats, origin, story }
        [leftTab]()
        .filter(Boolean),
    ),
  );
  right.replaceChildren(
    el(
      "div",
      { class: "page-content" },
      ...{
        items: inventory,
        spells,
        notes: () => listSection("notes", "Adventure journal"),
      }
        [rightTab]()
        .filter(Boolean),
    ),
  );
  requestAnimationFrame(fitPages);
  if (ref?.kind) renderReference();
}
window.addEventListener("resize", () => requestAnimationFrame(fitPages));
// Input changes save immediately, including the currently focused field. Only derived text is refreshed
// while typing; a completed change redraws controls without throwing away focus.
function refreshDerived() {
  const c = character,
    pb = proficiency(c.level);
  document
    .querySelectorAll(".ability .modifier")
    .forEach(
      (n, i) => (n.textContent = signed(modifier(c.abilities[ABILITIES[i]]))),
    );
  const p = document.querySelector(".proficiency-line strong");
  if (p) p.textContent = signed(pb);
  const a = c.spellcasting.ability,
    m = modifier(c.abilities[a]);
  const values = {
    "ARMOR CLASS": c.combat.ac,
    INITIATIVE: signed(modifier(c.abilities.dex)),
    "SPELL ATTACK": signed(m + pb),
    "SPELL SAVE DC": 8 + m + pb,
    PREPARED:
      c.spells.filter((s) => s.level > 0 && s.prepared).length +
      "/" +
      c.spellcasting.preparedLimit,
    WEIGHT: totalWeight(c).toLocaleString("en-US") + " lb",
    ATTUNEMENT: c.items.filter((e) => e.attuned).length + " / 3",
    ITEMS: c.items.length,
  };
  document.querySelectorAll(".stat").forEach((n) => {
    const label = n.querySelector("span")?.textContent;
    if (label in values) n.querySelector("strong").textContent = values[label];
  });
  document.querySelectorAll(".skill-row").forEach((row) => {
    const control = row.querySelector("select");
    const path = control.dataset.path.split(".");
    const v = c[path[0]][path[1]],
      ability =
        path[0] === "saves" ? path[1] : SKILLS.find((s) => s[0] === path[1])[1];
    row.querySelector("output").textContent = signed(
      bonus(c, ability, v.rank),
    );
  });
  const hp = document.querySelector('[data-path="combat.hp"]');
  if (hp) {
    hp.max = c.combat.maxHp;
    if (hp !== document.activeElement) hp.value = c.combat.hp;
  }
  if (rightTab === "items")
    document.querySelectorAll("#right-content .item").forEach((n, i) => {
      const item = c.items[i];
      n.querySelector(".item-meta").textContent =
        `${item.weight} lb each · ${(item.quantity * item.weight).toLocaleString("en-US")} lb total`;
    });
}
function acceptInput(target) {
  const path = target.dataset.path;
  if (!path) return;
  const old = get(path),
    value =
      target.type === "checkbox"
        ? target.checked
        : typeof old === "number"
          ? target.tagName === "SELECT"
            ? Number(target.value)
            : target.valueAsNumber
          : target.value;
  if (
    typeof old === "number" &&
    (!Number.isFinite(value) || !target.checkValidity())
  )
    return;
  set(path, value);
  if (path === "level") {
    if (value < 3) character.subclass = null;
    const control = document.querySelector('[aria-label="Choose Subclass"]');
    control.disabled = value < 3 || !character.class;
    control.textContent =
      character.subclass?.name ||
      (value < 3 ? "Available at level 3" : "＋ Choose");
  }
  if (path === "combat.maxHp")
    character.combat.hp = Math.min(character.combat.hp, value);
  save();
  refreshDerived();
}
document.addEventListener("input", (e) => acceptInput(e.target));
document.addEventListener("change", (e) => {
  if (!e.target.dataset.path) return;
  const path = e.target.dataset.path;
  acceptInput(e.target);
  if (!e.target.checkValidity()) {
    e.target.value = get(path);
    notify("Value is out of range; the previous valid value was kept.");
  }
  if (path === "level") render();
});
function editorFields(kind, entry) {
  const simple = [
    ["Name", "name", "text"],
    ["Type / category", "category", "text"],
    ["Description / notes", "description", "textarea"],
    ["Source", "source", "text"],
  ];
  if (kind === "items")
    simple.push(
      ["Quantity", "quantity", "number", 0, 99999],
      ["Weight per item (lb)", "weight", "number", 0, 999999],
    );
  if (kind === "spells")
    simple.push(
      ["Level (0 = cantrip)", "level", "number", 0, 9],
      ["Casting time", "casting", "text"],
      ["Range", "range", "text"],
      ["Components", "components", "text"],
      ["Duration / Concentration", "duration", "text"],
    );
  const target = $("#custom-fields");
  target.replaceChildren(
    ...simple.map(([label, key, type, min, max]) => {
      const input = el(type === "textarea" ? "textarea" : "input", {
        name: key,
        ...(type === "textarea" ? { rows: 6 } : { type }),
        ...(min !== undefined ? { min, max } : {}),
        ...(key === "weight" ? { step: "any" } : {}),
        ...(key === "name"
          ? { required: "", maxlength: 200 }
          : { maxlength: 100000 }),
      });
      input.value = entry[key];
      input.oninput = () => {
        draftDirty = true;
        saveDraft();
      };
      return el("label", {}, label, input);
    }),
  );
}
function readDraft() {
  const d = { ...pickerContext.entry };
  for (const input of $("#custom-fields").querySelectorAll("[name]"))
    d[input.name] = input.type === "number" ? Number(input.value) : input.value;
  return d;
}
function draftKey() {
  return `${DRAFT_KEY}:${pickerContext.kind}:${pickerContext.editing ? pickerContext.entry.id : "new"}`;
}
function saveDraft() {
  try {
    localStorage.setItem(
      draftKey(),
      JSON.stringify({
        kind: pickerContext.kind,
        entry: readDraft(),
        editing: pickerContext.editing,
      }),
    );
  } catch {
    /* Draft remains in the open form. */
  }
}
function setMode(custom) {
  $("#custom-form").hidden = !custom;
  $("#library-view").hidden = custom;
  $("#library-mode").setAttribute("aria-pressed", String(!custom));
  $("#custom-mode").setAttribute("aria-pressed", String(custom));
}
async function openPicker(kind, entry = null) {
  if (kind === "subclass" && (character.level < 3 || !character.class)) {
    notify("Subclass choices become available at level 3.");
    return;
  }
  pickerContext = {
    kind,
    entry: entry ? { ...entry } : newEntry(),
    editing: Boolean(entry),
  };
  draftDirty = false;
  $("#picker-title").textContent =
    (entry ? "Edit · " : "Choose · ") + names[kind];
  $("#search").value = "";
  $("#preview").replaceChildren(
    el("p", { class: "muted" }, "Choose an entry to view its details."),
  );
  pickerSelected = null;
  editorFields(kind, pickerContext.entry);
  const restricted = kind === "class" || kind === "subclass";
  $("#custom-mode").hidden = restricted;
  setMode(Boolean(entry) && !restricted);
  renderResults();
  const oldDelete = $("#editor-delete");
  if (oldDelete) oldDelete.remove();
  if (entry)
    $("#custom-form .dialog-actions").prepend(
      button(
        "Delete entry",
        async () => {
          await removeEntry(kind, entry.id);
          const remains = singles.includes(kind)
            ? character[kind]
            : character[kind].find((x) => x.id === entry.id);
          if (!remains) {
            draftDirty = false;
            $("#picker").close();
          }
        },
        "danger",
        { id: "editor-delete" },
      ),
    );
  $("#picker").showModal();
  (entry ? $("#custom-fields input") : $("#search")).focus();
  let previous;
  try {
    previous = JSON.parse(localStorage.getItem(draftKey()));
  } catch {}
  if (
    !restricted &&
    previous?.kind === kind &&
    previous.editing === Boolean(entry) &&
    (!entry || previous.entry?.id === entry.id) &&
    previous.entry?.name
  ) {
    if (
      await confirmAction(
        "There is an unsaved draft for " +
          names[kind] +
          ". Restore it to continue?",
      )
    ) {
      pickerContext.entry = { ...pickerContext.entry, ...previous.entry };
      editorFields(kind, pickerContext.entry);
      draftDirty = true;
      setMode(true);
    }
  }
}
function renderResults() {
  const q = $("#search").value.trim().toLocaleLowerCase("en");
  const entries = (library[pickerContext.kind] || [])
    .filter((e) => e.name.toLocaleLowerCase("en").includes(q))
    .filter(
      (e) =>
        pickerContext.kind !== "subclass" ||
        e.category === character.class?.name,
    );
  $("#results").replaceChildren(
    ...(entries.length
      ? entries.map((e) =>
          button(
            e.name,
            () => {
              pickerSelected = e;
              renderResults();
              const p = $("#preview");
              p.replaceChildren(
                el("h3", {}, e.name),
                el("p", {}, e.description),
                el("p", { class: "muted" }, e.source),
              );
              sourceLink(p, e);
              if (pickerContext.kind === "spells")
                p.append(
                  el(
                    "p",
                    {},
                    `Level ${e.level} · ${e.casting} · ${e.range}\n${e.components} · ${e.duration}`,
                  ),
                );
              p.append(
                el(
                  "p",
                  {},
                  button(
                    pickerContext.editing
                      ? "Replace with this entry"
                      : "Add to character",
                    () => commitEntry({ ...pickerContext.entry, ...e }),
                    "primary",
                  ),
                ),
              );
            },
            "",
            { "aria-pressed": String(pickerSelected === e) },
          ),
        )
      : [
          el(
            "p",
            { class: "muted" },
            "No results. Switch to “Create / edit” to enter a new item.",
          ),
        ]),
  );
}
$("#search").oninput = renderResults;
$("#library-mode").onclick = () => setMode(false);
$("#custom-mode").onclick = () => {
  setMode(true);
  $("#custom-fields input").focus();
};
async function closePicker() {
  // Keep unfinished text locally; Escape never silently discards the draft.
  if (draftDirty) {
    saveDraft();
    notify("Draft saved. Open the same entry type to restore it.");
  }
  $("#picker").close();
}
$("#close-picker").onclick = closePicker;
$("#picker").oncancel = (e) => {
  e.preventDefault();
  closePicker();
};
async function commitEntry(entry) {
  const kind = pickerContext.kind;
  if (kind === "class" && !library.class.some((e) => e.name === entry.name))
    return;
  if (
    kind === "subclass" &&
    (character.level < 3 ||
      !library.subclass.some(
        (e) => e.name === entry.name && e.category === character.class?.name,
      ))
  )
    return;
  if (!entry.name.trim()) {
    notify("Enter an entry name.");
    return;
  }
  entry.name = entry.name.trim();
  if (
    singles.includes(kind) &&
    character[kind] &&
    !(await confirmAction(
      "Replace the current " + names[kind] + "? " + manualNotice,
    ))
  )
    return;
  if (
    !singles.includes(kind) &&
    !pickerContext.editing &&
    character[kind].some(
      (e) => e.name.toLowerCase() === entry.name.toLowerCase(),
    ) &&
    !(await confirmAction(
      "An entry with this name already exists. Add another separate entry?",
    ))
  )
    return;
  // Only the selected reference is replaced; no dependent statistic is modified.
  const safe = { ...newEntry() };
  for (const key of Object.keys(safe))
    if (entry[key] !== undefined) safe[key] = entry[key];
  if (singles.includes(kind)) {
    character[kind] = safe;
    if (kind === "class" && character.subclass?.category !== safe.name)
      character.subclass = null;
    character.reviewNeeded = true;
  } else if (pickerContext.editing) {
    const i = character[kind].findIndex((e) => e.id === entry.id);
    if (i >= 0) character[kind][i] = safe;
  } else character[kind].push(safe);
  draftDirty = false;
  try {
    localStorage.removeItem(draftKey());
  } catch {}
  $("#picker").close();
  save();
  render();
  notify(entry.name + " saved.");
}
$("#custom-form").onsubmit = (e) => {
  e.preventDefault();
  if ($("#custom-form").reportValidity()) commitEntry(readDraft());
};
$("#about").onclick = () =>
  showInfo(
    "Rules & guide",
    "Start with a name, then use Overview for class, subclass, level, species, background, and final ability scores. Subclasses unlock at level 3 and are filtered by class. The two panels have independent tabs. Select a name or statistic to view its reference; use Add or Edit to update entries.\n\nCalculated: ability modifiers, PB by total level, skill/save bonuses, Initiative from DEX, spell attack/DC, class-and-level spell slots, and total item weight.\n\nManual: AC, HP, Hit Dice, rests, granted skills, background/species/class/feat benefits, prepared limit, Pact Magic, and secondary spell sources. There is no automatic character builder or multiclassing.\n\nThe verified SRD subset contains Cleric, Fighter, Rogue, Wizard and one subclass for each; Human; four backgrounds; five feats; Potent Cantrip; Resourceful; Dagger; Club; Fire Bolt; and Cure Wounds. Most categories support custom entries. The English SRD source takes priority.\n\n" +
      attribution +
      "\n\nEscape closes dialogs and keeps editing drafts. Data is stored only in this browser.",
  );
$("#new").onclick = async () => {
  if (
    !(await confirmAction(
      "Creating a new character will replace the one saved on this device.",
    ))
  )
    return;
  character = freshCharacter();
  storageBlocked = false;
  ref = null;
  renderReference();
  save();
  render();
  notify("New character created.");
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.querySelector("dialog[open]") && ref) {
    ref = null;
    renderReference();
  }
});
render();
