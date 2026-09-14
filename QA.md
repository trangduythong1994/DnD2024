# Release verification

Verification date: 2026-09-14.

- All automated model tests pass, covering ability modifiers, proficiency-bonus thresholds, proficiency and expertise, additional modifiers, spell attack/DC calculations, schema validation, range checks, duplicate IDs, and safe text handling.
- The complete user interface is in English.
- The page has no header or Export/Import controls. The compact **New Character** button is beside **Your Character**.
- Class selection contains only Cleric, Fighter, Rogue, and Wizard.
- Subclass selection is disabled below level 3 and is filtered to one matching option for the selected class.
- Feats appear in a left-side tab, support multiple simultaneous selections, and allow custom entries.
- The left and right tab groups operate independently. Arrow keys, Home, End, and Escape support keyboard navigation.
- Pickers support search, preview, custom entry creation where allowed, editing, deletion, and draft restoration.
- Character state persists across reloads through browser storage.
- The desktop layout uses side-by-side panels; the mobile layout stacks them without overflowing the viewport.
- The deployed GitHub Pages site loads without JavaScript console errors.

See `README.md` for calculation rules, manual fields, library scope, and deployment details.
