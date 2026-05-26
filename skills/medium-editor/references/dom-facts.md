# dom-facts

Critical DOM facts and behavioral constraints for Medium's editor. These were discovered through live editor testing — violating them causes content corruption or failed saves.

## Selectors

| Element | Selector | Notes |
|---|---|---|
| Editor body | `.editor-inner[contenteditable="true"]` | Use this, NOT `.postArticle-content` (deprecated) |
| Article title | `.graf--title` | First block in editor |
| Inline image menu | `[data-testid="editorAddButton"]` | Appears when cursor is on a blank `<p>` |
| Save status | `div`/`span` with `textContent === 'Saved'` | Poll up to 15s after changes |
| Publish button | Button with text "Publish" in top-right toolbar | |

## Content injection

- **Clipboard paste is the only reliable injection method.** Copy via temp div + `execCommand('copy')`, paste with Ctrl+V.
- **`execCommand('delete')` on large ranges does not persist.** Medium's save API only persists changes made through its own editor input model. Use paste replacement for large content changes.
- **Link updates**: `document.execCommand('createLink', false, url)` — reliable and proven. Direct DOM `href` manipulation does not persist.

## Behavioral constraints

1. **Never reload after a large paste.** Medium's OT system merges the stale server version with the local draft on reload, producing doubled content. Insert all images in the same browser session as the paste, before any navigation.

2. **Ctrl+A → Ctrl+V for full article replacement.** Include the article title as `<h3>` in the pasted HTML. Placing cursor inside the title `<h3>` before paste causes the first pasted block to merge into it.

3. **Image insertion requires clean editor state.** The inline `+` menu (`[data-testid="editorAddButton"]`) works via `browser_click` only when the editor state is not corrupted by programmatic `setRange()` calls. Always insert images after paste, not before.

4. **Use Selection API for cursor placement.** Do not use raw `document.createRange()` hacks that bypass Medium's internal editor state — use `window.getSelection().addRange(range)` via `browser_evaluate`.

5. **List items need two Enter presses to exit.** When the cursor is inside a `<li>`, pressing Enter once creates a new list item. Press Enter twice (or Enter + Backspace) to exit the list and land on a blank `<p>` where the inline menu appears.

6. **Series header text is in raw text nodes.** Navigation links like "Part 1:" live in raw text nodes, not `<strong>` elements. Always use TreeWalker with `NodeFilter.SHOW_TEXT` to locate them.

## Session scope

- The bundled `.mcp.json` starts a new Playwright browser process. It does not share cookies with an existing Playwright session.
- After manual login, the session cookie persists across Claude Code restarts as long as the Playwright profile directory is not cleared.
- If the Playwright session resets between paste and image upload, images must be re-uploaded.
