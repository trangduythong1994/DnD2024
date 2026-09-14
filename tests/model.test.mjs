import test from "node:test";
import assert from "node:assert/strict";
import {
  modifier,
  proficiency,
  bonus,
  freshCharacter,
  newEntry,
  parseBackup,
  totalWeight,
} from "../model.js";
test("ability modifiers include odd scores and negative rounding", () => {
  for (const [score, want] of [
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [15, 2],
    [20, 5],
    [30, 10],
  ])
    assert.equal(modifier(score), want);
});
test("PB changes exactly at level boundaries", () => {
  assert.deepEqual(
    [1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(proficiency),
    [2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
  );
});
test("proficiency and expertise use PB once or twice, with independent adjustment", () => {
  const c = freshCharacter();
  c.level = 5;
  c.abilities.dex = 16;
  assert.equal(bonus(c, "dex", 0, -1), 2);
  assert.equal(bonus(c, "dex", 1, 1), 7);
  assert.equal(bonus(c, "dex", 2, 1), 10);
  c.pbExtra = 1;
  assert.equal(bonus(c, "dex", 2, 1), 12);
});
test("spell attack and save DC use chosen ability and PB", () => {
  const c = freshCharacter();
  c.level = 9;
  c.abilities.wis = 18;
  assert.equal(bonus(c, "wis", 1, 2), 10);
  assert.equal(8 + bonus(c, "wis", 1, -1), 15);
});
test("round-trip includes customized items, slots, multiline text, all references", () => {
  const c = freshCharacter();
  c.name = "Người giữ đèn";
  c.biography = "Dòng một\nDòng hai";
  c.slots[0] = { max: 4, used: 2 };
  c.items.push({ ...newEntry(), name: "Đá", quantity: 3, weight: 1.5 });
  c.class = { ...newEntry(), name: "Wizard" };
  assert.deepEqual(parseBackup(JSON.stringify(c)), c);
  assert.equal(totalWeight(c), 4.5);
});
test("bad JSON and schema versions cannot replace current character", () => {
  assert.throws(() => parseBackup("{bad"), /cú pháp/);
  for (const data of [{}, null, { version: 2 }, []])
    assert.throws(() => parseBackup(JSON.stringify(data)));
});
test("reject incomplete, out-of-range, duplicate IDs, excessive slots and invalid types", () => {
  const changes = [
    (c) => delete c.combat,
    (c) => (c.level = 21),
    (c) => (c.abilities.str = 0),
    (c) => (c.saves.str.rank = 2),
    (c) => (c.skills.Arcana.rank = 3),
    (c) => (c.slots[0] = { max: 2, used: 3 }),
    (c) => (c.slots = []),
    (c) => (c.combat.hp = 1),
    (c) => (c.items = [{ ...newEntry(), name: "X", quantity: -1 }]),
    (c) => (c.coins.gp = "1"),
    (c) => (c.spellcasting.ability = "oops"),
    (c) => {
      const e = { ...newEntry(), name: "X" };
      c.items = [e, e];
    },
  ];
  for (const change of changes) {
    const c = freshCharacter();
    change(c);
    assert.throws(() => parseBackup(JSON.stringify(c)));
  }
});
test("HTML remains plain data and unknown keys are stripped", () => {
  const c = freshCharacter();
  c.name = "<img src=x onerror=alert(1)>";
  const parsed = parseBackup(
    JSON.stringify({ ...c, unknown: "discard", __proto__: { polluted: 1 } }),
  );
  assert.equal(parsed.name, c.name);
  assert.equal(parsed.unknown, undefined);
  assert.equal({}.polluted, undefined);
});
