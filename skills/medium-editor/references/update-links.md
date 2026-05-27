# update-links

Update hyperlinks in a Medium article to use the correct `publicUrl` from the registry, matched by title and publication.

## Prerequisites

`~/medium/medium-public-url.json` must exist.
Run `/medium-editor populate-registry` to build it if missing. The registry lives at `~/medium/medium-public-url.json` — shared across all repos.

## Invocation

```
/medium-editor update-links <editId>     ← update one article
/medium-editor update-links --all        ← batch update all articles in registry
```

## Steps

### 1. Load registry

Read `~/medium/medium-public-url.json`. Build a lookup map: `title → { publication, publicUrl }`.

### 2. Navigate to article

Navigate to `https://medium.com/p/<editId>/edit`. Wait for `.editor-inner[contenteditable="true"]`.

### 3. Extract all hyperlinks in the article

```js
const walker = document.createTreeWalker(
  document.querySelector('.editor-inner'),
  NodeFilter.SHOW_ELEMENT
);
const links = [];
let node;
while ((node = walker.nextNode())) {
  if (node.tagName === 'A' && node.href) {
    links.push({ el: node, text: node.textContent.trim(), href: node.href });
  }
}
links;
```

### 4. Match each link against registry

For each link:

**Case A — exactly one registry match (title exact match):**
Update the link URL silently using `execCommand`:
```js
const range = document.createRange();
range.selectNodeContents(linkElement);
const sel = window.getSelection();
sel.removeAllRanges();
sel.addRange(range);
document.execCommand('createLink', false, publicUrl);
```
Wait for `textContent === 'Saved'`.

**Case B — multiple registry matches (same title, different publications):**
Pause and present the user with a numbered list:
```
Found "<link text>" in multiple publications:
  1. Scrum and Coke  → https://medium.com/scrum-and-coke/...
  2. Pickleball      → https://medium.com/pickleball/...

Which should be used for this link? (1/2/skip)
```
Apply the chosen URL using `execCommand` as in Case A. If user chooses "skip", leave the link untouched.

**Case C — no registry match:**
Skip. Add to the unmatched list for the end-of-run report.

**Case D — external link (href does not contain `medium.com`):**
Leave untouched. Do not add to unmatched list.

### 5. Report

After processing all links in the article:

```
update-links complete for "<article title>":
  ✓ N links updated
  ⚠ N links skipped (no registry match): "Title A", "Title B"
```

## Batch mode (`--all`)

Iterate every entry in the registry that has an `editUrl`. Apply Steps 2–5 for each. Skip entries where `publicUrl` is still the short draft form `https://medium.com/p/{editId}` — these articles are not yet published, so their links cannot be verified. Report skipped drafts at the end.

## Notes

- `execCommand('createLink')` is the only reliable method for link updates in Medium's editor. Direct DOM manipulation of `<a>` href does not persist.
- Hyperlink text in Medium lives in `<a>` elements — use element walker, not text node walker.
- Collision choices are not persisted — the user is prompted fresh each run.
