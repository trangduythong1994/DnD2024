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
} from "./model.js";
import { library, SRD, manualNotice, attribution } from "./rules.js";
const $ = (s) => document.querySelector(s);
const KEY = "dnd2024.character.v1",
  DRAFT_KEY = "dnd2024.editor-draft.v1";
let character = freshCharacter(),
  storageBlocked = false,
  leftTab = "overview",
  rightTab = "items",
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
  items: "Vật phẩm",
  spells: "Phép thuật",
  features: "Features",
  traits: "Traits",
  feats: "Feats",
  notes: "Ghi chú phiên / nhiệm vụ",
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
  if (storageBlocked) {
    $("#save-status").textContent = "Chưa lưu · xuất JSON để sao lưu";
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(character));
    $("#save-status").textContent = "● Đã lưu trên thiết bị";
  } catch {
    $("#save-status").textContent = "Không thể lưu";
    notify("Trình duyệt không lưu được. Hãy xuất JSON để giữ dữ liệu.");
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
} catch (error) {
  storageBlocked = true;
  queueMicrotask(() =>
    notify(
      "Bản lưu không đọc được. Dữ liệu cũ được giữ nguyên; nhập bản sao lưu hoặc tạo nhân vật mới.",
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
    pb = proficiency(c.level) + c.pbExtra,
    a = c.spellcasting.ability,
    m = modifier(c.abilities[a]);
  const descriptions = {
    "SPELL ATTACK": `${ABILITY_NAMES[a]} ${signed(m)} + PB ${pb} + bổ sung ${c.spellcasting.attackExtra} = ${signed(m + pb + c.spellcasting.attackExtra)}`,
    "SPELL SAVE DC": `8 + ${ABILITY_NAMES[a]} ${signed(m)} + PB ${pb} + bổ sung ${c.spellcasting.dcExtra} = ${8 + m + pb + c.spellcasting.dcExtra}`,
    INITIATIVE: `DEX ${signed(modifier(c.abilities.dex))} + bổ sung ${c.combat.initiativeExtra} = ${signed(modifier(c.abilities.dex) + c.combat.initiativeExtra)}. Alert chưa tự cộng PB.`,
    "PASSIVE PERCEPTION": `10 + WIS ${signed(modifier(c.abilities.wis))} + ${c.skills.Perception.rank} × PB ${pb} + bổ sung ${c.skills.Perception.extra} = ${10 + bonus(c, "wis", c.skills.Perception.rank, c.skills.Perception.extra)}.`,
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
  aside.hidden = !ref;
  document.body.classList.toggle("reference-open", Boolean(ref));
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
      el("p", {}, e.description || "Chưa có mô tả."),
    );
    if (ref.kind === "spells")
      content.append(
        el(
          "p",
          {},
          `Cấp ${e.level} · ${e.casting}\nTầm: ${e.range}\nThành phần: ${e.components}\nThời lượng: ${e.duration}`,
        ),
      );
    if (ref.kind === "items")
      content.append(
        el(
          "p",
          {},
          `${e.quantity} × ${e.weight} lb · ${e.equipped ? "Equipped" : "Chưa equipped"} · ${e.attuned ? "Attuned" : "Chưa attuned"}`,
        ),
      );
    content.append(el("p", { class: "muted" }, e.source || "Nguồn chưa ghi"));
    sourceLink(content, e);
    content.append(
      el(
        "p",
        {},
        button("Chỉnh sửa mục", () => openPicker(ref.kind, e), "primary"),
        button("Xóa mục", () => removeEntry(ref.kind, e.id), "danger"),
      ),
    );
  } else {
    content.append(el("h2", {}, ref.title), el("p", {}, ref.description));
    if (ref.path)
      content.append(
        button("Đến ô chỉnh sửa", () => {
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
    const page = e.source.match(/tr\. (\d+)/)?.[1];
    target.append(
      el(
        "a",
        {
          href: SRD + (page ? "#page=" + page : ""),
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "Đọc nguồn SRD ↗",
      ),
    );
  }
}
$("#close-reference").onclick = () => {
  ref = null;
  renderReference();
};
function choice(kind) {
  const entry = character[kind];
  return el(
    "div",
    { class: "choice" },
    el("label", {}, names[kind]),
    el(
      "div",
      { class: "choice-line" },
      button(entry?.name || "＋ Chọn", () => openPicker(kind), "", {
        "aria-label": "Chọn " + names[kind],
      }),
      entry
        ? button("ⓘ", () => showEntry(kind, entry.id), "text-button", {
            "aria-label": "Xem " + names[kind],
          })
        : null,
    ),
  );
}
function renderIdentity() {
  $("#identity-fields").replaceChildren(
    choice("class"),
    choice("subclass"),
    field("Level", "level", "number", { min: 1, max: 20 }),
    choice("species"),
    choice("background"),
    choice("originFeat"),
  );
  $("#character-name").value = character.name;
  document.querySelector('[data-path="player"]').value = character.player;
  $("#level-caption").textContent = "LEVEL " + character.level;
  const n = $("#review-notice");
  n.hidden = !character.reviewNeeded;
  n.replaceChildren(
    document.createTextNode(
      "Cần rà soát sau thay đổi origin/class. " + manualNotice,
    ),
    button("Đã rà soát", () => {
      character.reviewNeeded = false;
      save();
      render();
    }),
  );
}
const leftTabs = [
    ["overview", "Tổng quan"],
    ["combat", "Combat"],
    ["skills", "Skills"],
    ["features", "Đặc tính"],
    ["origin", "Origin"],
    ["story", "Tiểu sử"],
  ],
  rightTabs = [
    ["items", "Inventory"],
    ["spells", "Spellcasting"],
    ["notes", "Nhật ký"],
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
}
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
    pb = proficiency(c.level) + c.pbExtra;
  return [
    head("Chỉ số năng lực", el("span", { class: "badge" }, "ĐIỂM CUỐI")),
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
              `Modifier = floor((${c.abilities[a]} − 10) / 2) = ${signed(modifier(c.abilities[a]))}. Điểm nhập là điểm cuối, đã gồm background/feat.`,
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
            `Level ${c.level}: ${proficiency(c.level)} + bổ sung ${c.pbExtra} = ${proficiency(c.level) + c.pbExtra}. Level 1–4: +2; 5–8: +3; 9–12: +4; 13–16: +5; 17–20: +6.`,
          ),
        "text-button",
      ),
      el("strong", {}, signed(pb)),
    ),
    field("Điều chỉnh Proficiency Bonus", "pbExtra", "number", {
      min: -20,
      max: 20,
    }),
    el(
      "div",
      { class: "stats" },
      statCard(
        "ARMOR CLASS",
        c.combat.ac,
        "AC nhập thủ công, đã gồm giáp, shield và hiệu ứng.",
        "combat.ac",
      ),
      statCard(
        "INITIATIVE",
        signed(modifier(c.abilities.dex) + c.combat.initiativeExtra),
        `DEX ${signed(modifier(c.abilities.dex))} + bổ sung ${c.combat.initiativeExtra}. Alert chưa tự cộng PB.`,
        "combat.initiativeExtra",
      ),
      statCard(
        "PASSIVE PERCEPTION",
        10 +
          bonus(c, "wis", c.skills.Perception.rank, c.skills.Perception.extra),
        "10 + WIS modifier + proficiency/expertise + bổ sung Perception. Advantage/Disadvantage tình huống do GM xét.",
        "skills.Perception.extra",
      ),
    ),
    hint(
      "Nhập điểm cuối đã gồm background/feat. Thư viện chỉ lưu tham chiếu, không cộng bonus vào điểm số.",
    ),
  ];
}
function combat() {
  return [
    head("Sẵn sàng vào trận"),
    el(
      "div",
      { class: "grid three" },
      field("Armor Class (AC)", "combat.ac", "number", { min: 0, max: 99 }),
      field("Speed (ft)", "combat.speed", "number", { min: 0 }),
      field("Initiative bổ sung", "combat.initiativeExtra", "number"),
      field("HP hiện tại", "combat.hp", "number", {
        min: 0,
        max: character.combat.maxHp,
      }),
      field("HP tối đa", "combat.maxHp", "number", { min: 0 }),
      field("Temporary HP", "combat.tempHp", "number", { min: 0 }),
    ),
    el(
      "div",
      { class: "inspiration" },
      field("Heroic Inspiration", "combat.inspiration", "checkbox"),
      button("Cách dùng ↗", () =>
        showInfo(
          "Heroic Inspiration",
          "Tiêu hao để roll lại bất kỳ một die ngay sau khi roll; bắt buộc dùng kết quả mới. Chỉ giữ tối đa một. Nếu nhận thêm khi đã có, có thể trao cho nhân vật đồng đội chưa có. Human nhận khi kết thúc Long Rest (đánh dấu thủ công).\nSRD 5.2.1 · tr. 8",
          "combat.inspiration",
        ),
      ),
    ),
    el(
      "div",
      { class: "grid" },
      field("Hit Dice (vd. 3d10)", "combat.hitDice"),
      field("Số Hit Dice còn lại", "combat.hitDiceLeft", "number", { min: 0 }),
    ),
    el("h3", {}, "Death saves"),
    el(
      "div",
      { class: "grid" },
      select("Thành công", "combat.successes", [
        [0, "○ ○ ○"],
        [1, "● ○ ○"],
        [2, "● ● ○"],
        [3, "● ● ●"],
      ]),
      select("Thất bại", "combat.failures", [
        [0, "○ ○ ○"],
        [1, "● ○ ○"],
        [2, "● ● ○"],
        [3, "● ● ●"],
      ]),
    ),
    el(
      "p",
      { class: "muted" },
      "Theo dõi thủ công. Ba thành công: ổn định; ba thất bại: tử vong. Reset khi hồi HP hoặc trở nên ổn định.",
    ),
    field("Conditions & hiệu ứng đang có", "combat.conditions", "textarea"),
    hint(
      "AC, HP, Hit Dice, rest và lợi ích class/species được nhập thủ công. Temporary HP là một giá trị hiện tại, không tự cộng chồng.",
    ),
  ];
}
function skills() {
  const row = (name, ability, path, max) => {
    const v = get(path),
      total = bonus(character, ability, v.rank, v.extra);
    const choiceSelect = select("Mức thành thạo", path + ".rank", [
      [0, "Chưa proficient"],
      [1, "Proficiency"],
      ...(max === 2 ? [[2, "Expertise"]] : []),
    ]).lastChild;
    choiceSelect.setAttribute("aria-label", name + " proficiency");
    const extra = field("Bổ sung", path + ".extra", "number").lastChild;
    extra.setAttribute("aria-label", name + " bổ sung");
    return el(
      "div",
      { class: "skill-row" },
      button("", () =>
        showInfo(
          name,
          `${SKILLS.find((s) => s[0] === name)?.[2] || "Saving throw " + ABILITY_NAMES[ability] + "."}\n${ABILITY_NAMES[ability]} ${signed(modifier(character.abilities[ability]))} + ${v.rank} × PB ${proficiency(character.level) + character.pbExtra} + bổ sung ${v.extra} = ${signed(bonus(character, ability, v.rank, v.extra))}.\nSRD 5.2.1 · tr. 7–9`,
          path + ".extra",
        ),
      ).appendChild(document.createTextNode(name)).parentElement,
      choiceSelect,
      extra,
      el("output", { "aria-label": name + " bonus" }, signed(total)),
    );
  };
  return [
    head("Thành thạo & kỹ năng"),
    el(
      "p",
      { class: "muted" },
      "Mỗi dòng: mức thành thạo · bổ sung · tổng. Expertise = 2 × PB; saving throws chỉ có proficiency.",
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
      button("＋ Thêm", () => openPicker(kind), "", {
        "aria-label": "Thêm " + names[kind],
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
            kind === "items" ? "Hành trang còn trống" : "Chưa có mục nào",
          ),
          el(
            "p",
            {},
            "Chọn từ thư viện hoặc tự tạo nội dung phù hợp với nhân vật.",
          ),
          button("＋ Thêm " + names[kind], () => openPicker(kind), "primary"),
        ),
  ];
}
function itemCard(kind, e) {
  const at = character[kind].findIndex((x) => x.id === e.id),
    path = kind + "." + at;
  let meta = e.category || e.source;
  if (kind === "items")
    meta = `${e.weight} lb / món · ${(e.quantity * e.weight).toLocaleString("vi-VN")} lb tổng`;
  if (kind === "spells")
    meta = `${e.level === 0 ? "Cantrip" : "Cấp " + e.level} · ${e.category} · ${e.casting} · ${e.range}`;
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
        button("Sửa", () => openPicker(kind, e), "icon-button", {
          "aria-label": "Sửa " + e.name,
        }),
        button("×", () => removeEntry(kind, e.id), "icon-button danger", {
          "aria-label": "Xóa " + e.name,
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
    controls.append(field("Hoàn thành", path + ".done", "checkbox"));
  box.append(controls);
  return box;
}
async function removeEntry(kind, id) {
  if (
    !(await confirmAction(
      "Xóa mục này khỏi nhân vật? Bạn nên xuất JSON nếu muốn giữ bản sao.",
    ))
  )
    return;
  if (singles.includes(kind)) {
    character[kind] = null;
    character.reviewNeeded = true;
  } else character[kind] = character[kind].filter((x) => x.id !== id);
  save();
  render();
  renderReference();
  notify("Đã xóa mục.");
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
    ...listSection("items", "Trang bị & vật phẩm"),
    el(
      "div",
      { class: "stats" },
      statCard(
        "TRỌNG LƯỢNG",
        totalWeight(character).toLocaleString("vi-VN") + " lb",
        "Tổng số lượng × trọng lượng mỗi vật phẩm. Chưa tính tiền, sức chứa, hoặc hiệu ứng thay đổi trọng lượng.",
      ),
      statCard(
        "ATTUNEMENT",
        attuned + " / 3",
        "Thông thường tối đa 3 magic items attuned. Đánh dấu thủ công; ngoại lệ do feature cần tự đối chiếu.",
      ),
      statCard(
        "SỐ MỤC",
        character.items.length,
        "Số dòng vật phẩm trong hành trang.",
      ),
    ),
    attuned > 3
      ? el(
          "p",
          { class: "error" },
          "Đã vượt 3 mục attuned. Hãy kiểm tra ngoại lệ của nhân vật.",
        )
      : null,
  ];
}
function spells() {
  const c = character,
    a = c.spellcasting.ability,
    pb = proficiency(c.level) + c.pbExtra,
    m = modifier(c.abilities[a]);
  return [
    head(
      "Phép thuật",
      button("＋ Thêm phép", () => openPicker("spells")),
    ),
    el(
      "div",
      { class: "grid" },
      select(
        "Spellcasting ability",
        "spellcasting.ability",
        ABILITIES.map((a) => [a, ABILITY_NAMES[a]]),
      ),
      field(
        "Số prepared tối đa (tự nhập)",
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
        signed(m + pb + c.spellcasting.attackExtra),
        `${ABILITY_NAMES[a]} ${signed(m)} + PB ${pb} + bổ sung ${c.spellcasting.attackExtra} = ${signed(m + pb + c.spellcasting.attackExtra)}`,
        "spellcasting.attackExtra",
      ),
      statCard(
        "SPELL SAVE DC",
        8 + m + pb + c.spellcasting.dcExtra,
        `8 + ${ABILITY_NAMES[a]} ${signed(m)} + PB ${pb} + bổ sung ${c.spellcasting.dcExtra}`,
        "spellcasting.dcExtra",
      ),
      statCard(
        "PREPARED",
        c.spells.filter((s) => s.level > 0 && s.prepared).length +
          "/" +
          c.spellcasting.preparedLimit,
        "Chỉ đếm spell cấp 1+ được đánh dấu Prepared. Giới hạn và các phép luôn prepared do người chơi theo dõi.",
        "spellcasting.preparedLimit",
      ),
    ),
    el(
      "div",
      { class: "grid" },
      field("Spell attack bổ sung", "spellcasting.attackExtra", "number"),
      field("Spell DC bổ sung", "spellcasting.dcExtra", "number"),
    ),
    el("h3", {}, "Spell slots"),
    el(
      "div",
      { class: "slots" },
      c.slots.map((s, i) =>
        el(
          "div",
          { class: "slot" },
          el("span", {}, "Cấp " + (i + 1)),
          el(
            "div",
            { class: "slot-fields" },
            field("Tối đa", "slots." + i + ".max", "number", {
              min: 0,
              max: 99,
            }),
            field("Đã dùng", "slots." + i + ".used", "number", {
              min: 0,
              max: s.max,
            }),
          ),
          button(
            "Dùng 1 slot",
            () => {
              s.used++;
              save();
              render();
            },
            "",
            {
              disabled: s.used >= s.max,
              "aria-label": "Dùng slot cấp " + (i + 1),
            },
          ),
        ),
      ),
    ),
    el(
      "p",
      { class: "muted" },
      "Nhập slot theo class/level; giảm “Đã dùng” khi được hồi. Pact Magic và nguồn phép khác ghi riêng bên dưới.",
    ),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .filter((l) => c.spells.some((s) => s.level === l))
      .flatMap((l) => [
        el("h3", {}, l === 0 ? "Cantrips" : "Spell cấp " + l),
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
          "Chưa có phép. Dùng “Thêm phép” để tìm hoặc tự tạo.",
        )
      : null,
    el("h3", {}, "Nguồn phép khác / Pact Magic"),
    field(
      "Ghi rõ ability, attack/DC, số lần dùng hoặc slots riêng",
      "spellcasting.notes",
      "textarea",
    ),
  ];
}
function features() {
  return ["features", "traits", "feats"].flatMap((k) => [
    ...listSection(k),
    el("div", { style: "height:22px" }),
  ]);
}
function origin() {
  return [
    head("Nguồn gốc nhân vật"),
    el(
      "div",
      { class: "grid" },
      choice("species"),
      choice("background"),
      choice("originFeat"),
      field("Kích thước", "size"),
    ),
    hint(
      "Background 2024: tăng +2/+1 trong ba ability được liệt kê, hoặc +1 cả ba (tối đa 20); nhận Origin Feat, skill/tool proficiencies. Tự áp dụng vào điểm cuối và các mục tương ứng. Species không tự cộng ability score.",
    ),
    field("Ngôn ngữ", "languages"),
    el("h3", {}, "Lựa chọn & lợi ích đã áp dụng"),
    field(
      "Ghi rõ bonus, nguồn, skills, tools, lựa chọn species/feat",
      "originNotes",
      "textarea",
    ),
    hint(manualNotice),
  ];
}
function story() {
  return [
    head("Câu chuyện của bạn"),
    el(
      "div",
      { class: "grid" },
      field("XP", "xp", "number", { min: 0 }),
      field("Alignment", "alignment"),
    ),
    el(
      "div",
      { class: "text-stack" },
      field("Tiểu sử", "biography", "textarea"),
      field("Ngoại hình", "appearance", "textarea"),
      field(
        "Tính cách, lý tưởng, mối liên kết, khuyết điểm",
        "personality",
        "textarea",
      ),
      field("Ghi chú nhân vật", "characterNotes", "textarea"),
    ),
  ];
}
function render() {
  renderIdentity();
  renderTabs("left", leftTabs, leftTab);
  renderTabs("right", rightTabs, rightTab);
  $("#left-content").replaceChildren(
    ...{ overview, combat, skills, features, origin, story }
      [leftTab]()
      .filter(Boolean),
  );
  $("#right-content").replaceChildren(
    ...{
      items: inventory,
      spells,
      notes: () => listSection("notes", "Nhật ký hành trình"),
    }
      [rightTab]()
      .filter(Boolean),
  );
  if (ref?.kind) renderReference();
}
// Input changes save immediately, including the currently focused field. Only derived text is refreshed
// while typing; a completed change redraws controls without throwing away focus.
function refreshDerived() {
  const c = character,
    pb = proficiency(c.level) + c.pbExtra;
  document
    .querySelectorAll(".ability .modifier")
    .forEach(
      (n, i) => (n.textContent = signed(modifier(c.abilities[ABILITIES[i]]))),
    );
  const p = document.querySelector(".proficiency-line strong");
  if (p) p.textContent = signed(pb);
  $("#level-caption").textContent = "LEVEL " + c.level;
  const a = c.spellcasting.ability,
    m = modifier(c.abilities[a]);
  const values = {
    "ARMOR CLASS": c.combat.ac,
    INITIATIVE: signed(modifier(c.abilities.dex) + c.combat.initiativeExtra),
    "PASSIVE PERCEPTION":
      10 + bonus(c, "wis", c.skills.Perception.rank, c.skills.Perception.extra),
    "SPELL ATTACK": signed(m + pb + c.spellcasting.attackExtra),
    "SPELL SAVE DC": 8 + m + pb + c.spellcasting.dcExtra,
    PREPARED:
      c.spells.filter((s) => s.level > 0 && s.prepared).length +
      "/" +
      c.spellcasting.preparedLimit,
    "TRỌNG LƯỢNG": totalWeight(c).toLocaleString("vi-VN") + " lb",
    ATTUNEMENT: c.items.filter((e) => e.attuned).length + " / 3",
    "SỐ MỤC": c.items.length,
  };
  document.querySelectorAll(".stat").forEach((n) => {
    const label = n.querySelector("span")?.textContent;
    if (label in values) n.querySelector("strong").textContent = values[label];
  });
  document.querySelectorAll(".skill-row").forEach((row) => {
    const input = row.querySelector("input");
    const path = input.dataset.path.split(".");
    const v = c[path[0]][path[1]],
      ability =
        path[0] === "saves" ? path[1] : SKILLS.find((s) => s[0] === path[1])[1];
    row.querySelector("output").textContent = signed(
      bonus(c, ability, v.rank, v.extra),
    );
  });
  document.querySelectorAll(".slot").forEach((node, i) => {
    const s = c.slots[i];
    node.querySelector("button").disabled = s.used >= s.max;
    const used = node.querySelector('[data-path$=".used"]');
    used.max = s.max;
    if (used !== document.activeElement) used.value = s.used;
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
        `${item.weight} lb / món · ${(item.quantity * item.weight).toLocaleString("vi-VN")} lb tổng`;
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
  if (path === "combat.maxHp")
    character.combat.hp = Math.min(character.combat.hp, value);
  if (/^slots\.\d\.max$/.test(path)) {
    const i = Number(path.split(".")[1]);
    character.slots[i].used = Math.min(character.slots[i].used, value);
  }
  save();
  refreshDerived();
}
document.addEventListener("input", (e) => acceptInput(e.target));
document.addEventListener("change", (e) => {
  if (!e.target.dataset.path) return;
  acceptInput(e.target);
  if (!e.target.checkValidity()) {
    e.target.value = get(e.target.dataset.path);
    notify("Giá trị ngoài phạm vi; đã giữ giá trị hợp lệ trước đó.");
  }
});
function editorFields(kind, entry) {
  const simple = [
    ["Tên", "name", "text"],
    ["Loại / nhóm", "category", "text"],
    ["Mô tả / ghi chú", "description", "textarea"],
    ["Nguồn", "source", "text"],
  ];
  if (kind === "items")
    simple.push(
      ["Số lượng", "quantity", "number", 0, 99999],
      ["Trọng lượng mỗi món (lb)", "weight", "number", 0, 999999],
    );
  if (kind === "spells")
    simple.push(
      ["Cấp (0 = cantrip)", "level", "number", 0, 9],
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
  pickerContext = {
    kind,
    entry: entry ? { ...entry } : newEntry(),
    editing: Boolean(entry),
  };
  draftDirty = false;
  $("#picker-title").textContent =
    (entry ? "Chỉnh sửa · " : "Chọn · ") + names[kind];
  $("#search").value = "";
  $("#preview").replaceChildren(
    el("p", { class: "muted" }, "Chọn một mục để đọc thông tin."),
  );
  pickerSelected = null;
  editorFields(kind, pickerContext.entry);
  setMode(Boolean(entry));
  renderResults();
  const oldDelete = $("#editor-delete");
  if (oldDelete) oldDelete.remove();
  if (entry)
    $("#custom-form .dialog-actions").prepend(
      button(
        "Xóa mục",
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
    previous?.kind === kind &&
    previous.editing === Boolean(entry) &&
    (!entry || previous.entry?.id === entry.id) &&
    previous.entry?.name
  ) {
    if (
      await confirmAction(
        "Có bản nháp chưa lưu của " + names[kind] + ". Khôi phục để tiếp tục?",
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
  const q = $("#search").value.trim().toLocaleLowerCase("vi");
  const entries = (library[pickerContext.kind] || []).filter((e) =>
    e.name.toLocaleLowerCase("vi").includes(q),
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
                    `Cấp ${e.level} · ${e.casting} · ${e.range}\n${e.components} · ${e.duration}`,
                  ),
                );
              p.append(
                el(
                  "p",
                  {},
                  button(
                    pickerContext.editing
                      ? "Thay bằng mục này"
                      : "Thêm vào nhân vật",
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
            "Không có kết quả. Chuyển sang “Tự tạo / chỉnh sửa” để nhập mục mới.",
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
    notify("Đã giữ bản nháp. Mở lại cùng loại mục để khôi phục.");
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
  if (!entry.name.trim()) {
    notify("Hãy nhập tên mục.");
    return;
  }
  entry.name = entry.name.trim();
  if (
    singles.includes(kind) &&
    character[kind] &&
    !(await confirmAction("Thay " + names[kind] + " hiện tại? " + manualNotice))
  )
    return;
  if (
    !singles.includes(kind) &&
    !pickerContext.editing &&
    character[kind].some(
      (e) => e.name.toLowerCase() === entry.name.toLowerCase(),
    ) &&
    !(await confirmAction("Mục trùng tên đã tồn tại. Thêm một mục riêng nữa?"))
  )
    return;
  // Only the selected reference is replaced; no dependent statistic is modified.
  const safe = { ...newEntry() };
  for (const key of Object.keys(safe))
    if (entry[key] !== undefined) safe[key] = entry[key];
  if (singles.includes(kind)) {
    character[kind] = safe;
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
  notify("Đã lưu " + entry.name + ".");
}
$("#custom-form").onsubmit = (e) => {
  e.preventDefault();
  if ($("#custom-form").reportValidity()) commitEntry(readDraft());
};
$("#about").onclick = () =>
  showInfo(
    "Luật & cách sử dụng",
    "Bắt đầu bằng tên, class, origin và điểm ability cuối. Chọn tab độc lập ở hai khung. Bấm tên/chỉ số để xem; dùng Thêm hoặc Sửa để cập nhật.\n\nTự tính: modifiers, PB theo tổng level, skill/save bonus, Initiative theo DEX + bổ sung, passive Perception, spell attack/DC, tổng trọng lượng.\n\nNhập thủ công: AC, HP, Hit Dice, rest, skills được cấp, lợi ích background/species/class/feat, spell slots, prepared limit, Pact Magic và nguồn phép phụ. Không tự tạo nhân vật/multiclass.\n\nThư viện chỉ là tập con đã đối chiếu: 12 class và 12 subclass (tham chiếu), Human, 4 backgrounds, 5 feats (4 Origin), Potent Cantrip, Resourceful, Dagger, Club, Fire Bolt, Cure Wounds. Có thể tự tạo mọi loại mục. Bản dịch là bản tóm tắt; ưu tiên nguồn SRD tiếng Anh.\n\n" +
      attribution +
      "\n\nEscape đóng popup và giữ bản nháp chỉnh sửa. Xuất JSON thường xuyên; dữ liệu chỉ ở trình duyệt này.",
  );
$("#export").onclick = () => {
  const blob = new Blob([JSON.stringify(character, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob);
  const a = el("a", {
    href: url,
    download:
      (character.name || "nhan-vat").replace(/[^\p{L}\p{N}_-]/gu, "_") +
      "-dnd2024.json",
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  notify("Đã xuất bản sao JSON.");
};
$("#import").onclick = () => {
  $("#import-error").textContent = "";
  $("#backup-dialog").showModal();
};
$("#close-backup").onclick = () => $("#backup-dialog").close();
$("#import-file").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5000000) {
    $("#import-error").textContent = "File quá lớn (giới hạn 5 MB).";
    return;
  }
  try {
    $("#import-text").value = await file.text();
    $("#import-error").textContent =
      "Đã đọc file. Bấm Kiểm tra & nhập để tiếp tục.";
  } catch {
    $("#import-error").textContent = "Không đọc được file.";
  }
};
$("#validate-import").onclick = async () => {
  let next;
  try {
    next = parseBackup($("#import-text").value);
  } catch (error) {
    $("#import-error").textContent = error.message;
    return;
  }
  if (
    !(await confirmAction(
      "File hợp lệ: " +
        (next.name || "Nhân vật chưa đặt tên") +
        ", level " +
        next.level +
        ". Thay thế nhân vật hiện tại? Hãy xuất JSON trước nếu cần giữ bản cũ.",
    ))
  )
    return;
  character = next;
  storageBlocked = false;
  ref = null;
  $("#backup-dialog").close();
  renderReference();
  save();
  render();
  notify("Đã nhập nhân vật.");
};
$("#new").onclick = async () => {
  if (
    !(await confirmAction(
      "Tạo nhân vật mới sẽ thay thế nhân vật đang lưu trên thiết bị. Bạn đã xuất JSON nếu muốn giữ bản cũ?",
    ))
  )
    return;
  character = freshCharacter();
  storageBlocked = false;
  ref = null;
  renderReference();
  save();
  render();
  notify("Đã tạo nhân vật mới.");
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.querySelector("dialog[open]") && ref) {
    ref = null;
    renderReference();
  }
});
render();
