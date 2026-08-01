# Sim’s Cosy Corner

Sim’s Cosy Corner is a private Lab preview at `/lab/sim-cosy-corner`. It is an original, local-first hobby scrapbook for Sim: part cosy desk, colouring journal, pastel palette tool and Pokémon Pokopia concept notebook. It inherits the existing shared Lab gate and is lazy-loaded as Experiment 007. It adds no runtime dependency, backend, external image or API call.

## Visual identity

The default theme is **Lavender Daydream**. Warm cream paper and deep plum ink provide the readable base; soft lavender and dusty lilac lead the identity; blush, peach, butter yellow, powder blue and sage distinguish individual scrapbook objects. The CSS tokens live at the top of `sim-cosy-corner.css`. The corresponding content-level token map and reserved future mood names live in `simCosyContent.js`.

The landing page is an illustrated creative desk made entirely with HTML and CSS. Its colouring book, pinned note, build plan, marker cup and lavender plant are real controls. Paper texture, tape, sticky notes, irregular frames, marker swatches and hand-drawn plan views are original rather than downloaded artwork.

## Structure

- `SimCosyCorner.jsx` owns the section router, landing desk, section-visit badge and Lab exit.
- `components/ScrapbookNavigation.jsx` provides desktop journal tabs and mobile bottom navigation.
- `components/HobbyShelf.jsx` renders the flexible hobby collection.
- `components/ColouringStudio.jsx` contains the technique library, interactive mug lesson, palette builder, saved palettes and gallery dialog.
- `components/PokopiaBuildBook.jsx` contains research disclosure, inspiration plans, material planner, tutorial and personal journal.
- `simCosyContent.js` is the single editable content and theme configuration.
- `cosyUtils.js` contains deterministic palette, validation, material and versioned-persistence helpers.
- `useCosyStorage.js` is the narrow React adapter for safe `localStorage` use.
- `sim-cosy-corner.css` contains the scoped visual system and responsive layouts.
- `tests/sim-cosy-corner.test.mjs` covers routing, theme tokens, palette behaviour, persistence recovery, planner calculations, content and accessibility hooks.

## Updating Sim’s content

Edit only `simCosyContent.js` for ordinary content changes:

1. Change `simCosyContent.lab.intro` and `currentInterests` for the landing copy.
2. Add a hobby object to `hobbies`; reuse an existing accent token such as `lilac`, `sage`, `peach`, `blue` or `butter`.
3. Add a technique to `colouringTechniques`. Keep at least three ordered steps, include a plain-language tip and mistake, and replace the clearly marked example note with Sim’s own note.
4. Add a gallery item to `colouringGallery`. The current `art` values select an original CSS placeholder. For a real image, extend the gallery component with an imported, optimised local asset, write useful alternative text and retain the metadata fields.
5. Add or update a build in `pokopiaBuilds`. Keep `status: "Concept"` unless a specific claim has been checked against an official source or directly in-game. Do not present estimated quantities as verified.
6. Add verified factual references to `externalSources` and briefly state exactly which claim each source supports.

To adjust the theme, change the `--cosy-*` custom properties at the top of `sim-cosy-corner.css`, then keep `cosyTheme.tokens` in sync. Deep plum should remain the default text colour; pale pastel text on pale surfaces is intentionally avoided.

## Local persistence

Saved palettes, material counts, tutorial position, journal entries and the two small scrapbook badges use versioned JSON envelopes in `localStorage`. Every collection is validated before it is accepted. Missing, malformed or older-version values fall back to safe empty state without throwing. The current keys are:

- `sim-cosy-palettes`
- `sim-cosy-materials`
- `sim-cosy-tutorials`
- `sim-cosy-journal`
- `sim-cosy-achievements`

This adapter is intentionally small so a later repository or authenticated cloud service can replace it without rewriting the presentation components.

## Pokopia facts and concepts

Verified seed facts are deliberately limited to official public information:

- [Nintendo UK: Pokémon Pokopia](https://www.nintendo.com/en-gb/Games/Nintendo-Switch-2-games/Pokemon-Pokopia-2915161.html) — Nintendo Switch 2 platform and release information; the crafting, creating, building and gardening focus; and official examples of Leafage, Rock Smash, Surf and Glide.
- [Official Pokémon Pokopia site](https://pokopia.pokemon.com/en-us) — the Ditto premise, building alongside Pokémon friends, and official Leafage and Water Gun examples.

All five starter builds, every layout sketch, material name, quantity, footprint, time estimate and tutorial instruction in this prototype are original **Concept** content. They are inspiration only and must be confirmed in-game. No Pokémon artwork, logo, screenshot, map, game icon or copied community tutorial is included.

## Accessibility and responsive behaviour

All navigation and interactive illustrations are buttons with labels. Selected and active states include text, borders or shape changes rather than colour alone. Focus rings use deep violet, progress controls expose accessible values, the gallery dialog moves focus to its close button and closes with Escape, and reduced-motion preferences remove decorative transitions. Narrow screens use a touch-friendly fixed bottom journal bar, horizontally scrollable build/tutorial rails and single-column editor forms. Print styles isolate the material checklist.

## Known limitations and future path

This preview has no image-upload UI, content editor, authentication of its own, cross-device sync or cloud backup. Technique notes typed into the example textareas are illustrative and are not persisted; curated notes should currently be changed in `simCosyContent.js`. Gallery frames are original abstract placeholders. Material lists intentionally use generic categories until Sim confirms real items in-game.

Before moving to Sim’s own domain, replace placeholder copy and gallery frames with her approved content, test the terminology and quantities against her current game, run an accessibility audit with real images, and decide whether the existing local-only model is enough. The cleanest next architecture would keep this content schema and swap the storage adapter for a small authenticated content service only when editing or cross-device sync becomes genuinely useful.
