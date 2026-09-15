# Release verification

Verification date: 2026-09-14.

- All automated model tests pass, covering ability modifiers, proficiency-bonus thresholds, proficiency and expertise, spell attack/DC calculations, schema validation, range checks, duplicate IDs, and safe text handling.
- The complete user interface is in English.
- The page has no header, Player Name field, panel subtitles, final-score label, or Export/Import controls. The compact **New Character** button is to the right of the character name.
- The document and both sheets remain within one viewport with no page-level or panel-level scroll.
- Desktop panels use the A4 width-to-height ratio and sit side by side like two paper sheets.
- Active tab contents scale down only when their natural height exceeds the printable area, keeping all controls visible.
- Overview keeps Class, Subclass, Level, Species, and Background together on one row; mobile users can swipe that row horizontally.
- All six ability scores remain in one compact row; narrow screens can swipe the row horizontally.
- Combat contains spellcasting setup and derived values, while the right-side Spells tab contains slots and the spell list.
- Spell slots are derived from class and level: Cleric and Wizard use the full-caster table; Fighter and Rogue show no slots in the supported paths.
- No adjustment controls or Passive Perception values appear in the interface.
- Mobile displays one full-height Character or Gear panel at a time and uses a section dropdown instead of an overflowing tab strip.
- Editable controls have a tinted background and stronger border, while calculated cards use a neutral surface.
- Rules references open as a centered upper overlay without resizing the sheet and close when the backdrop is selected.
- Class selection contains only Cleric, Fighter, Rogue, and Wizard.
- Subclass selection is disabled below level 3 and is filtered to one matching option for the selected class.
- Feats appear in a left-side tab, support multiple simultaneous selections, and allow custom entries.
- The left and right tab groups operate independently. Arrow keys, Home, End, and Escape support keyboard navigation.
- Pickers support search, preview, custom entry creation where allowed, editing, deletion, and draft restoration.
- Character state persists across reloads through browser storage.
- The desktop layout uses side-by-side panels; the mobile layout stacks them without overflowing the viewport.
- The deployed GitHub Pages site loads without JavaScript console errors.

See `README.md` for calculation rules, manual fields, library scope, and deployment details.
