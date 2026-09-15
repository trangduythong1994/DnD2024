# DnD2024 Character Sheet

An English, browser-based character sheet for the 2024 Dungeons & Dragons rules. It is a static website with no account, backend, or cloud sync.

Live site: https://trangduythong1994.github.io/DnD2024/

## Using the sheet

1. Enter the character name, level, class, subclass, species, and background.
2. In Overview, choose Class, Subclass, Level, Species, and Background, then enter final ability scores.
3. Use the left and right tab groups independently. Select names and scores to open their rules references.
4. Select any number of feats from the Feats tab, or add custom feats.
5. Record proficiencies, combat values, equipment, and prepared spells. Spell slots follow the selected supported class and level.

Every valid change is saved to this browser. **New Character** clears the current sheet after confirmation. Clearing browser data can remove the character permanently.

The page stays within the browser viewport. On desktop, the Character and Gear panels scroll independently. On mobile, a Character/Gear switch gives the selected panel the available height, and a section dropdown replaces the crowded horizontal tab row. Editable fields use a tinted background and stronger border. Rules references open as a centered overlay and close when you select the backdrop, the close button, or Escape.

## Rules behavior

The sheet calculates ability modifiers, proficiency bonus for levels 1–20, saving throw and skill bonuses, Initiative, spell attack bonus, spell save DC, class-level spell slots, and total equipment weight. Expertise is available for skills.

AC, HP, Hit Dice, death saves, Heroic Inspiration, rests, conditions, class/species/background/feat benefits, tool proficiencies, languages, prepared-spell limits, used spell slots, and additional spell sources are recorded manually. Equipment and attunement do not change AC or ability scores automatically.

Class choices are limited to Cleric, Fighter, Rogue, and Wizard. Each has one matching subclass in the library: Life Domain, Champion, Thief, and Evoker. Subclasses become available at level 3 and are filtered by the selected class.

## Included rules library

This project contains an abridged subset of **SRD 5.2.1**, checked against the official source at https://www.dndbeyond.com/srd:

- Classes: Cleric, Fighter, Rogue, Wizard.
- Subclasses: Life Domain, Champion, Thief, Evoker.
- Species: Human.
- Backgrounds: Acolyte, Criminal, Sage, Soldier.
- Feats: Alert, Magic Initiate, Savage Attacker, Skilled, Ability Score Improvement.
- Features and traits: Potent Cantrip, Resourceful.
- Equipment: Dagger and Club, including their 2024 Mastery properties.
- Spells: Fire Bolt and Cure Wounds.

The library is intentionally limited. Most collections support custom entries. Class and subclass choices remain restricted to the four supported options so subclass filtering stays reliable.

## Run locally

Use a modern Node.js release. No packages need to be installed.

```sh
npm start
# Open http://127.0.0.1:4173/DnD2024/
npm test
```

- `index.html`: page structure and dialogs.
- `styles.css`: layout, typography, and responsive styles.
- `app.js`: interface, pickers, references, and browser storage.
- `model.js`: schema validation and calculations.
- `rules.js`: rules-library data and attribution.
- `tests/model.test.mjs`: model and validation tests.

JavaScript modules require HTTP, so do not open the page with a `file://` URL. Relative asset paths allow the site to run under `/DnD2024/` on GitHub Pages.

## Deployment

GitHub Pages deploys from the root of the `main` branch. Each push to `main` triggers a Pages build. `.nojekyll` keeps the static assets unchanged.

## Data and security

The character is stored under the `localStorage` key `dnd2024.character.v1`; editor drafts use a separate key. Stored data is validated against schema version 1. User-entered content is rendered as text and cannot execute HTML.

## Attribution

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Rules descriptions are abridged adaptations. This is an independent character-sheet tool.
