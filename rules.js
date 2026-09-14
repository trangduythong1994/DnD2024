// Verified subset of SRD 5.2.1 (2024 rules). Vietnamese descriptions are abridged adaptations.
// Choosing a library entry NEVER changes character statistics or grants dependent entries.
export const SRD =
  "https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf";
const entry = (name, description, page, extra = {}) => ({
  name,
  description,
  source: `SRD 5.2.1 · tr. ${page}`,
  page,
  ...extra,
});
export const library = {
  class: [
    ["Barbarian", 28],
    ["Bard", 31],
    ["Cleric", 36],
    ["Druid", 41],
    ["Fighter", 47],
    ["Monk", 49],
    ["Paladin", 53],
    ["Ranger", 57],
    ["Rogue", 61],
    ["Sorcerer", 64],
    ["Warlock", 70],
    ["Wizard", 77],
  ].map(([name, p]) =>
    entry(
      name,
      `Class ${name} trong luật 2024. Xem bảng class trong nguồn để nhập Hit Dice, proficiency, features, phép và tài nguyên theo level. Công cụ không tự cấp các lợi ích này.`,
      p,
    ),
  ),
  subclass: [
    ["Path of the Berserker", "Barbarian", 30],
    ["College of Lore", "Bard", 35],
    ["Life Domain", "Cleric", 40],
    ["Circle of the Land", "Druid", 46],
    ["Champion", "Fighter", 49],
    ["Warrior of the Open Hand", "Monk", 52],
    ["Oath of Devotion", "Paladin", 56],
    ["Hunter", "Ranger", 61],
    ["Thief", "Rogue", 64],
    ["Draconic Sorcery", "Sorcerer", 69],
    ["Fiend Patron", "Warlock", 76],
    ["Evoker", "Wizard", 82],
  ].map(([name, cls, p]) =>
    entry(
      name,
      `Subclass của ${cls}. Nhập các features theo level từ nguồn; không tự áp dụng bonus.`,
      p,
      { category: cls },
    ),
  ),
  species: [
    entry(
      "Human",
      "Humanoid; chọn Small hoặc Medium; Speed 30 ft. Resourceful: nhận Heroic Inspiration khi hoàn thành Long Rest. Skillful: proficiency một skill tùy chọn. Versatile: một Origin Feat tùy chọn. Nhập các lựa chọn và lợi ích thủ công.",
      86,
    ),
  ],
  background: [
    entry(
      "Acolyte",
      "Ability: INT, WIS, CHA. Origin Feat: Magic Initiate (Cleric). Skills: Insight, Religion. Tool: Calligrapher’s Supplies. Chọn gói trang bị trong nguồn hoặc 50 GP.",
      83,
    ),
    entry(
      "Criminal",
      "Ability: DEX, CON, INT. Origin Feat: Alert. Skills: Sleight of Hand, Stealth. Tool: Thieves’ Tools. Chọn gói trang bị trong nguồn hoặc 50 GP.",
      83,
    ),
    entry(
      "Sage",
      "Ability: CON, INT, WIS. Origin Feat: Magic Initiate (Wizard). Skills: Arcana, History. Tool: Calligrapher’s Supplies. Chọn gói trang bị trong nguồn hoặc 50 GP.",
      83,
    ),
    entry(
      "Soldier",
      "Ability: STR, DEX, CON. Origin Feat: Savage Attacker. Skills: Athletics, Intimidation. Tool: một Gaming Set. Chọn gói trang bị trong nguồn hoặc 50 GP.",
      83,
    ),
  ],
  feats: [
    entry(
      "Alert",
      "Origin Feat. Cộng Proficiency Bonus vào Initiative. Ngay sau khi roll Initiative, có thể đổi kết quả với một đồng minh tự nguyện trong cùng combat; cả hai không được Incapacitated. Nhập bonus vào ô bổ sung Initiative và cập nhật khi PB đổi.",
      87,
      { category: "Origin" },
    ),
    entry(
      "Magic Initiate",
      "Origin Feat. Chọn danh sách Cleric, Druid hoặc Wizard: học 2 cantrip và 1 spell cấp 1. Chọn INT/WIS/CHA làm ability. Spell cấp 1 luôn prepared, dùng miễn slot 1 lần mỗi Long Rest; cũng có thể dùng slot. Khi tăng level có thể đổi 1 phép sang phép cùng cấp trong danh sách đã chọn. Có thể lấy lại feat với danh sách khác. Ghi riêng ability/bonus của nguồn phép này nếu khác ability chính.",
      87,
      { category: "Origin" },
    ),
    entry(
      "Savage Attacker",
      "Origin Feat. Một lần mỗi turn khi đánh trúng bằng weapon, roll weapon damage dice hai lần và chọn một kết quả.",
      87,
      { category: "Origin" },
    ),
    entry(
      "Skilled",
      "Origin Feat. Nhận proficiency trong tổng cộng 3 skills hoặc tools tùy chọn. Có thể lấy feat nhiều lần. Đánh dấu proficiency thủ công.",
      87,
      { category: "Origin" },
    ),
    entry(
      "Ability Score Improvement",
      "General Feat; yêu cầu level 4+. Tăng một ability +2 hoặc hai ability +1, tối đa 20. Có thể lấy nhiều lần. Nhập điểm cuối ở Tổng quan; công cụ không cộng thêm.",
      87,
      { category: "General" },
    ),
  ],
  features: [
    entry(
      "Potent Cantrip",
      "Evoker, level 3. Khi damaging cantrip trượt attack hoặc mục tiêu thành công saving throw, mục tiêu vẫn nhận một nửa damage (nếu có), nhưng không nhận hiệu ứng bổ sung.",
      82,
      { category: "Wizard · Evoker 3" },
    ),
  ],
  traits: [
    entry(
      "Resourceful",
      "Human: nhận Heroic Inspiration khi hoàn thành Long Rest. Đánh dấu Heroic Inspiration thủ công; không tích trữ quá một.",
      86,
      { category: "Human" },
    ),
  ],
  items: [
    entry(
      "Dagger",
      "1d4 Piercing. Finesse, Light, Thrown (20/60 ft). Mastery: Nick (chỉ dùng khi có feature cho phép). Giá 2 GP. Trang bị không tự cập nhật attack hoặc AC.",
      91,
      { weight: 1, category: "Simple melee weapon" },
    ),
    entry(
      "Club",
      "1d4 Bludgeoning. Light. Mastery: Slow (cần feature cho phép). Giá 1 SP.",
      91,
      { weight: 2, category: "Simple melee weapon" },
    ),
  ],
  spells: [
    entry(
      "Fire Bolt",
      "Ranged spell attack vào một creature hoặc object; trúng gây 1d10 Fire. Vật dễ cháy không được mang/mặc sẽ bốc cháy. Damage tăng thành 2d10 ở level 5, 3d10 ở 11, 4d10 ở 17. Sorcerer, Wizard.",
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
      "Creature được chạm hồi 2d8 + spellcasting ability modifier HP. Mỗi spell slot level trên 1 tăng thêm 2d8 hồi máu. Bard, Cleric, Druid, Paladin, Ranger.",
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
  "Lựa chọn chỉ lưu tham chiếu. Hãy tự rà soát điểm cuối, proficiency, Origin Feat, traits, trang bị, HP và phép liên quan. Không có lợi ích nào tự thêm, xóa hay cộng dồn.";
export const attribution =
  "This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.";
