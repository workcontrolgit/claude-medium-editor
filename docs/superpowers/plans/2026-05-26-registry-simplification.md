# Registry Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `series` and `part` fields from the registry, add `publication`, rename `update-series-links` → `update-links` with title+publication matching and collision prompting.

**Architecture:** Pure documentation changes — no production code. All changes are to skill reference files (markdown), the template JSON, and README. Cache copies are synced after each skill file change.

**Tech Stack:** Markdown skill files, JSON registry, Claude Code plugin system

---

## File Map

| File | Action |
|---|---|
| `templates/medium-public-url.json` | Update schema — remove `series`/`part`, add `publication` |
| `skills/medium-editor/references/populate-registry.md` | Remove `series`/`part` from schema, add `publication`, add draft scraping |
| `skills/medium-editor/references/update-series-links.md` | Delete — replaced by `update-links.md` |
| `skills/medium-editor/references/update-links.md` | Create — new reference with title+publication matching + collision logic |
| `skills/medium-editor/SKILL.md` | Rename `update-series-links` → `update-links` in invocation examples + operations index |
| `README.md` | Update commands table, schema example, architecture diagram |
| Cache: `...cache/claude-medium-editor/.../references/populate-registry.md` | Sync |
| Cache: `...cache/claude-medium-editor/.../references/update-series-links.md` | Delete |
| Cache: `...cache/claude-medium-editor/.../references/update-links.md` | Create (same as source) |
| Cache: `...cache/claude-medium-editor/.../skills/medium-editor/SKILL.md` | Sync |

---

### Task 1: Update `templates/medium-public-url.json`

**Files:**
- Modify: `templates/medium-public-url.json`

- [ ] **Step 1: Replace template content**

Write the following to `templates/medium-public-url.json`:

```json
[
  {
    "title": "Part 1: Your Article Title",
    "publication": "Your Publication Name",
    "editId": "abc123def456",
    "editUrl": "https://medium.com/p/abc123def456/edit",
    "publicUrl": "https://medium.com/your-publication/your-slug-abc123def456"
  },
  {
    "title": "Part 2: Your Article Title",
    "publication": "Your Publication Name",
    "editId": "def456ghi789",
    "editUrl": "https://medium.com/p/def456ghi789/edit",
    "publicUrl": "https://medium.com/p/def456ghi789"
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add templates/medium-public-url.json
git commit -m "chore: update registry template — remove series/part, add publication"
```

---

### Task 2: Update `populate-registry.md`

**Files:**
- Modify: `skills/medium-editor/references/populate-registry.md`
- Modify: `C:\Users\Fuji Nguyen\.claude\plugins\cache\claude-medium-editor\claude-medium-editor\1.0.0\skills\medium-editor\references\populate-registry.md`

- [ ] **Step 1: Update Step 2 (Extract articles) — add `publication` field**

In the "Extract articles from the page" section, replace the bullet list with:

```markdown
For each row in the table, extract:
- **title** — from the heading link text
- **publication** — from the publication name link in the row (e.g. "Scrum and Coke", "Pickleball")
- **publicUrl** — the `href` of the title link, query string stripped
- **editId** — last hyphen-separated segment of `publicUrl`
- **editUrl** — `https://medium.com/p/{editId}/edit`
```

- [ ] **Step 2: Update Step 3 — add draft scraping**

After the "Scroll for more" section, add a new step before "Filter to the target series":

```markdown
### 3a. Also scrape drafts

Navigate to `https://medium.com/me/stories/drafts`, take a snapshot, and extract drafts using the same fields. For drafts:
- `publication` — use the publication name if shown, otherwise leave empty string `""`
- `publicUrl` — use `https://medium.com/p/{editId}` (short redirect form)

Add draft entries to the extracted list before filtering.
```

- [ ] **Step 3: Update Step 4 — remove series filter question, simplify**

Replace "Filter to the target series" section with:

```markdown
### 4. Confirm scope with user

Present the full extracted list (published + drafts) and ask:
"Should I include all articles, or filter to specific ones? (e.g. only Scrum and Coke, or only drafts)"

Include only the articles the user confirms.
```

- [ ] **Step 4: Update Step 5 — remove `part` assignment**

Replace the "Assign part numbers" section with:

```markdown
### 5. Assign no extra fields

No `series` or `part` assignment needed. Each entry is written exactly as extracted:
`title`, `publication`, `editId`, `editUrl`, `publicUrl`.

For drafts with no publication: set `"publication": ""`.
```

- [ ] **Step 5: Update Step 6 schema example**

Replace the JSON example in "Write the registry" with:

```json
[
  {
    "title": "Part 1 — The .NET Agent Framework: IChatClient and MCP Clients",
    "publication": "Scrum and Coke",
    "editId": "4b52cc179e26",
    "editUrl": "https://medium.com/p/4b52cc179e26/edit",
    "publicUrl": "https://medium.com/scrum-and-coke/part-1-the-net-agent-framework-ichatclient-and-mcp-clients-4b52cc179e26"
  },
  {
    "title": "From Ollama to Azure Foundry: LLM Setup for .NET MCP",
    "publication": "Scrum and Coke",
    "editId": "6e7a2e06f64f",
    "editUrl": "https://medium.com/p/6e7a2e06f64f/edit",
    "publicUrl": "https://medium.com/p/6e7a2e06f64f"
  }
]
```

- [ ] **Step 6: Update the `publicUrl lifecycle` table — remove draft-only note about empty string**

Replace the lifecycle table note with:

```markdown
- Draft `publicUrl` is always `https://medium.com/p/{editId}` — never empty.
- Once published to a publication, update `publicUrl` to the full pretty URL: `https://medium.com/{publication-slug}/{article-slug}-{editId}`
```

- [ ] **Step 7: Sync cache copy**

Write the updated file content to:
`C:\Users\Fuji Nguyen\.claude\plugins\cache\claude-medium-editor\claude-medium-editor\1.0.0\skills\medium-editor\references\populate-registry.md`

- [ ] **Step 8: Commit**

```bash
git add skills/medium-editor/references/populate-registry.md
git commit -m "feat: populate-registry — add publication field, scrape drafts, remove series/part"
```

---

### Task 3: Create `update-links.md`, delete `update-series-links.md`

**Files:**
- Create: `skills/medium-editor/references/update-links.md`
- Delete: `skills/medium-editor/references/update-series-links.md`
- Create: `C:\Users\Fuji Nguyen\.claude\plugins\cache\claude-medium-editor\claude-medium-editor\1.0.0\skills\medium-editor\references\update-links.md`
- Delete: `C:\Users\Fuji Nguyen\.claude\plugins\cache\claude-medium-editor\claude-medium-editor\1.0.0\skills\medium-editor\references\update-series-links.md`

- [ ] **Step 1: Create `skills/medium-editor/references/update-links.md`**

```markdown
# update-links

Update hyperlinks in a Medium article to use the correct `publicUrl` from the registry, matched by title and publication.

## Prerequisites

`medium/medium-public-url.json` must exist in the current working directory.
Run `/medium-editor populate-registry` to build it if missing.

## Invocation

```
/medium-editor update-links <editId>     ← update one article
/medium-editor update-links --all        ← batch update all articles in registry
```

## Steps

### 1. Load registry

Read `medium/medium-public-url.json`. Build a lookup map: `title → { publication, publicUrl }`.

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

**Case A — exactly one registry match (title + publication):**
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
```

- [ ] **Step 2: Delete `skills/medium-editor/references/update-series-links.md`**

```bash
git rm skills/medium-editor/references/update-series-links.md
```

- [ ] **Step 3: Create cache copy of `update-links.md`**

Write the same content as Step 1 to:
`C:\Users\Fuji Nguyen\.claude\plugins\cache\claude-medium-editor\claude-medium-editor\1.0.0\skills\medium-editor\references\update-links.md`

- [ ] **Step 4: Delete cache copy of `update-series-links.md`**

Delete:
`C:\Users\Fuji Nguyen\.claude\plugins\cache\claude-medium-editor\claude-medium-editor\1.0.0\skills\medium-editor\references\update-series-links.md`

- [ ] **Step 5: Commit**

```bash
git add skills/medium-editor/references/update-links.md
git commit -m "feat: add update-links reference — title+publication matching, collision prompting"
```

---

### Task 4: Update `SKILL.md`

**Files:**
- Modify: `skills/medium-editor/SKILL.md`
- Modify: `C:\Users\Fuji Nguyen\.claude\plugins\cache\claude-medium-editor\claude-medium-editor\1.0.0\skills\medium-editor\SKILL.md`

- [ ] **Step 1: Update invocation examples**

Replace:
```
/medium-editor update-series-links
```
With:
```
/medium-editor update-links <editId>
/medium-editor update-links --all
```

- [ ] **Step 2: Update operations index table**

Replace:
```
| `update-series-links` | `references/update-series-links.md` |
```
With:
```
| `update-links` | `references/update-links.md` |
```

- [ ] **Step 3: Update the prerequisite note below the invocation block**

Replace:
```
For `update-series-links`, the registry `medium/medium-public-url.json` must exist...
```
With:
```
For `update-links`, the registry `medium/medium-public-url.json` must exist in the current working directory. Run `/medium-editor populate-registry` to build it if missing.
```

- [ ] **Step 4: Sync cache copy**

Apply the same three edits to:
`C:\Users\Fuji Nguyen\.claude\plugins\cache\claude-medium-editor\claude-medium-editor\1.0.0\skills\medium-editor\SKILL.md`

- [ ] **Step 5: Commit**

```bash
git add skills/medium-editor/SKILL.md
git commit -m "feat: rename update-series-links to update-links in SKILL.md"
```

---

### Task 5: Update `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update commands table**

Replace:
```
| `update-series-links` | Update all series navigation links to use Medium URLs | `/medium-editor update-series-links` |
```
With:
```
| `update-links` | Update hyperlinks in an article using the registry (title + publication match) | `/medium-editor update-links abc123` or `/medium-editor update-links --all` |
```

- [ ] **Step 2: Update registry schema example**

Replace the JSON block in the "Article Registry" section with:

```json
[
  {
    "title": "Part 1: Your Article Title",
    "publication": "Your Publication Name",
    "editId": "abc123def456",
    "editUrl": "https://medium.com/p/abc123def456/edit",
    "publicUrl": "https://medium.com/your-publication/your-slug-abc123def456"
  }
]
```

- [ ] **Step 3: Update architecture diagram references listing**

Replace `update-series-links.md` with `update-links.md` in both the architecture code block and the repository structure code block.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README — rename update-series-links to update-links, new schema"
```

---

### Task 6: Rebuild `medium/medium-public-url.json`

**Files:**
- Rebuild: `medium/medium-public-url.json` (git-ignored, rebuilt from live site)

- [ ] **Step 1: Run populate-registry**

Invoke `/medium-editor populate-registry`. When prompted, select all articles (both series + standalones). This produces a fresh registry with `publication` field and no `series`/`part`.

- [ ] **Step 2: Verify output**

Confirm `medium/medium-public-url.json` contains entries with shape:
```json
{ "title": "...", "publication": "...", "editId": "...", "editUrl": "...", "publicUrl": "..." }
```

Confirm no `series` or `part` fields are present.

- [ ] **Step 3: Note**

`medium/` is git-ignored — no commit needed for this file.
