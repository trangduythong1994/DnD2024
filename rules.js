// Verified subset of SRD 5.2.1 (2024 rules). English descriptions are abridged adaptations.
// Choosing a library entry NEVER changes character statistics or grants dependent entries.
export const SRD =
  "https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf";
const entry = (name, description, page, extra = {}) => ({
  name,
  description,
  source: `SRD 5.2.1 · p. ${page}`,
  page,
  ...extra,
});
export const library = {
  class: [
    ["Cleric", 36],
    ["Fighter", 47],
    ["Rogue", 61],
    ["Wizard", 77],
  ].map(([name, p]) =>
    entry(
      name,
      `The 2024 ${name} class. Refer to the source class table to enter Hit Dice, proficiencies, features, spells, and level resources. This tool does not grant these benefits automatically.`,
      p,
    ),
  ),
  subclass: [
    ["Life Domain", "Cleric", 40],
    ["Champion", "Fighter", 49],
    ["Thief", "Rogue", 64],
    ["Evoker", "Wizard", 82],
  ].map(([name, cls, p]) =>
    entry(
      name,
      `A ${cls} subclass. Enter level-appropriate features from the source; bonuses are not applied automatically.`,
      p,
      { category: cls },
    ),
  ),
  species: [
    entry(
      "Human",
      "Humanoid; choose Small or Medium; Speed 30 ft. Resourceful: gain Heroic Inspiration when you finish a Long Rest. Skillful: gain proficiency in one skill of your choice. Versatile: gain one Origin Feat of your choice. Record choices and benefits manually.",
      86,
    ),
  ],
  background: [
    entry(
      "Acolyte",
      "Ability scores: INT, WIS, CHA. Origin Feat: Magic Initiate (Cleric). Skills: Insight, Religion. Tool: Calligrapher’s Supplies. Choose the source equipment package or 50 GP.",
      83,
    ),
    entry(
      "Criminal",
      "Ability scores: DEX, CON, INT. Origin Feat: Alert. Skills: Sleight of Hand, Stealth. Tool: Thieves’ Tools. Choose the source equipment package or 50 GP.",
      83,
    ),
    entry(
      "Sage",
      "Ability scores: CON, INT, WIS. Origin Feat: Magic Initiate (Wizard). Skills: Arcana, History. Tool: Calligrapher’s Supplies. Choose the source equipment package or 50 GP.",
      83,
    ),
    entry(
      "Soldier",
      "Ability scores: STR, DEX, CON. Origin Feat: Savage Attacker. Skills: Athletics, Intimidation. Tool: one Gaming Set. Choose the source equipment package or 50 GP.",
      83,
    ),
  ],
  feats: [
    entry(
      "Alert",
      "Origin Feat. Add your Proficiency Bonus to Initiative. Immediately after rolling Initiative, you can swap your result with a willing ally in the same combat if neither is Incapacitated. Track this feat benefit manually when Initiative is rolled.",
      87,
      { category: "Origin" },
    ),
    entry(
      "Magic Initiate",
      "Origin Feat. Choose Cleric, Druid, or Wizard: learn two cantrips and one 1st-level spell. Choose INT, WIS, or CHA as the spellcasting ability. The 1st-level spell is always prepared, can be cast once without a slot per Long Rest, and can also use slots. When gaining a level, one chosen spell can be replaced with a spell of the same level from the chosen list. The feat may be taken again with a different list. Record a separate ability or bonus if this spell source differs from the primary one.",
      87,
      { category: "Origin" },
    ),
    entry(
      "Savage Attacker",
      "Origin Feat. Once per turn when you hit with a weapon, roll the weapon’s damage dice twice and use either result.",
      87,
      { category: "Origin" },
    ),
    entry(
      "Skilled",
      "Origin Feat. Gain proficiency in any combination of three skills or tools. This feat may be taken more than once. Mark proficiencies manually.",
      87,
      { category: "Origin" },
    ),
    entry(
      "Ability Score Improvement",
      "General Feat; prerequisite: level 4+. Increase one ability by 2 or two abilities by 1, to a maximum of 20. This feat may be taken more than once. Enter final scores in Overview; the tool does not add them.",
      87,
      { category: "General" },
    ),
  ],
  features: [
    entry(
      "Potent Cantrip",
      "Evoker, level 3. When a damaging cantrip misses with an attack roll or a target succeeds on its saving throw, the target takes half damage, if any, but suffers no additional effect.",
      82,
      { category: "Wizard · Evoker 3" },
    ),
  ],
  traits: [
    entry(
      "Resourceful",
      "Human: gain Heroic Inspiration when you finish a Long Rest. Mark Heroic Inspiration manually; you cannot hold more than one.",
      86,
      { category: "Human" },
    ),
  ],
  items: [
    entry(
      "Dagger",
      "1d4 Piercing. Finesse, Light, Thrown (20/60 ft). Mastery: Nick (only when a feature allows it). Cost 2 GP. Equipping does not automatically update attack rolls or AC.",
      91,
      { weight: 1, category: "Simple melee weapon" },
    ),
    entry(
      "Club",
      "1d4 Bludgeoning. Light. Mastery: Slow (only when a feature allows it). Cost 1 SP.",
      91,
      { weight: 2, category: "Simple melee weapon" },
    ),
  ],
  spells: [
    entry(
      "Fire Bolt",
      "Make a ranged spell attack against a creature or object. On a hit, it takes 1d10 Fire damage. A flammable object that is not worn or carried starts burning. Damage increases to 2d10 at level 5, 3d10 at 11, and 4d10 at 17. Sorcerer, Wizard.",
      132,
      {
        level: 0,
        category: "Evocation",
        casting: "Action",
        range: "120 ft",
        components: "V, S",
        duration: "Instantaneous",
      },
    ),
    entry(
      "Cure Wounds",
      "A creature you touch regains 2d8 + your spellcasting ability modifier hit points. Healing increases by 2d8 for each spell slot level above 1. Bard, Cleric, Druid, Paladin, Ranger.",
      121,
      {
        level: 1,
        category: "Abjuration",
        casting: "Action",
        range: "Touch",
        components: "V, S",
        duration: "Instantaneous",
      },
    ),
  ],
  notes: [],
};
library.originFeat = library.feats.filter((f) => f.category === "Origin");
export const manualNotice =
  "Choices only store references. Review final ability scores, proficiencies, feats, traits, equipment, HP, and related spells yourself. No benefit is added, removed, or stacked automatically.";
export const attribution =
  "This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.";
