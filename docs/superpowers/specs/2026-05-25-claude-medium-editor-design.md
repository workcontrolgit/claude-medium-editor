# Design: claude-medium-editor Plugin

**Date:** 2026-05-25  
**Status:** Approved  
**Repo:** https://github.com/workcontrolgit/claude-medium-editor

---

## Overview

A Claude Code plugin that automates Medium.com article editing via the Playwright MCP browser. Writers can sync content from local markdown files, insert images, update series navigation links, and publish drafts — all from the terminal using slash commands.

No public Medium write API exists. The plugin automates the live browser editor DOM.

---

## Goals

- Replace existing draft body with fresh content from a local markdown file
- Insert images at specific anchor points in the article
- Update series navigation links across all parts
- Publish drafts to a publication with topics
- Work with zero browser setup after first login

---

## Non-Goals

- Does not support Substack, dev.to, Hashnode (future skills may)
- Does not manage Medium membership or payment settings
- Does not scrape or read published articles for archival
- Does not provide syntax-highlighted code blocks (Medium limitation)

---

## Repository Structure

```
claude-medium-editor/
├── .claude-plugin/
│   └── plugin.json            # name, description, author, version
├── .mcp.json                  # Playwright MCP server auto-config
├── LICENSE                    # MIT
├── README.md                  # install command, first-time setup, quick-start
├── templates/
│   └── medium-public-url.json # starter registry template for series writers
└── skills/
    └── medium-editor/
        ├── SKILL.md           # routing logic + key DOM facts (~150 lines)
        └── references/
            ├── update-article.md
            ├── create-new-article.md
            ├── insert-image.md
            ├── replace-text.md
            ├── update-series-links.md
            ├── publish-article.md
            ├── dom-facts.md
            └── troubleshooting.md
```

### Why this structure

- `SKILL.md` stays lean (~150 lines). Claude loads only the one reference file needed per operation — keeps per-invocation token cost low.
- `skills/` folder nesting allows a second skill (`dev-to-editor/`, `hashnode-editor/`) to slot in without restructuring the repo.
- `templates/` gives series writers a starter registry without adding a required config step.

---

## Installation

```bash
claude plugin install github:workcontrolgit/claude-medium-editor
```

This pulls the repo, registers the `medium-editor` skill, and configures the Playwright MCP server via `.mcp.json`. Writers who already have Playwright MCP installed get a no-op duplicate registration — harmless.

---

## Manifest Files

### `.claude-plugin/plugin.json`

```json
{
  "name": "claude-medium-editor",
  "description": "Automate Medium.com article editing — sync content from local markdown, insert images, update series links, and publish — using Claude Code and Playwright.",
  "author": {
    "name": "Fuji Nguyen",
    "url": "https://github.com/workcontrolgit"
  },
  "version": "1.0.0",
  "skills": [
    {
      "name": "medium-editor",
      "path": "skills/medium-editor/SKILL.md"
    }
  ]
}
```

### `.mcp.json`

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Bundles the Playwright MCP dependency — same pattern as the official Playwright plugin. No extra install step for writers.

---

## Article Registry Convention

The skill looks for `medium/medium-public-url.json` relative to wherever Claude Code is opened.

- Writers with a series copy `templates/medium-public-url.json` into their project's `medium/` folder and fill in their `editId` values.
- Writers doing one-off edits pass `editId` directly to the command — no registry needed.

`editId` is found in the Medium editor URL: `https://medium.com/p/{editId}/edit`

### Template schema

```json
[
  {
    "part": 1,
    "title": "Part 1: Your Article Title",
    "editId": "abc123def456",
    "editUrl": "https://medium.com/p/abc123def456/edit",
    "draftUrl": "https://medium.com/publication/your-slug-abc123def456"
  }
]
```

---

## SKILL.md Design

Routing + key DOM facts only. ~150 lines. Each operation delegates to a reference file.

**Sections:**
1. Invocation examples
2. Prerequisites check (Playwright tools available, Medium session active)
3. Key DOM facts (always apply regardless of operation)
4. Operations index table (operation name → reference file)
5. `list-drafts` inline (too short to need its own file)

---

## Operations

| Operation | Description | Reference |
|---|---|---|
| `update-article` | Replace draft body with fresh content from local markdown | `update-article.md` |
| `create-new-article` | Create a new Medium draft from a local markdown file | `create-new-article.md` |
| `insert-image` | Insert a local image after a specific anchor paragraph | `insert-image.md` |
| `replace-text` | Replace a specific phrase anywhere in the article | `replace-text.md` |
| `update-series-links` | Update all series navigation links to use Medium URLs | `update-series-links.md` |
| `publish-article` | Walk through the full publish flow with topics | `publish-article.md` |
| `list-drafts` | List all draft articles from the submissions outbox | inline in SKILL.md |

---

## Key DOM Facts (always apply)

- **Editor selector**: `.editor-inner[contenteditable="true"]` (not `.postArticle-content` — deprecated)
- **Title element**: `.graf--title`
- **Inline image menu button**: `[data-testid="editorAddButton"]`
- **Save status**: `div` or `span` with `textContent === 'Saved'`
- **Link update method**: `document.execCommand('createLink', false, url)` — reliable and proven
- **Clipboard copy**: temp div + `execCommand('copy')` — only reliable injection method
- **Plain text nodes**: series header text lives in raw text nodes, not `<strong>` — use TreeWalker

---

## Critical Behavioral Rules (from real-world testing)

These are non-obvious constraints discovered through live editor automation. They MUST be in `dom-facts.md` so Claude surfaces them at runtime.

1. **Never reload after a large paste.** Medium's OT system merges the stale server version with the local draft on reload, producing doubled content. All image insertions must happen in the same session as the paste, before any navigation.

2. **Ctrl+A → Ctrl+V for full replacement.** Include the article title as `<h3>` in the pasted HTML. This is the only approach that cleanly replaces all content without server-side merge artifacts.

3. **Cursor placement for paste.** Place cursor at the start of the subtitle `<p>` (not end of title `<h3>`) before Shift+Ctrl+End → Ctrl+V, OR use Ctrl+A → Ctrl+V with full HTML including the title. Placing cursor inside the title H3 causes the first pasted block to merge into the H3.

4. **Image insertion requires clean editor state.** The inline `+` menu works via `browser_click` on `[data-testid="editorAddButton"]` only when the editor state is not corrupted by programmatic `setRange()` calls. Always insert images after paste (not before), and use Selection API to set cursor position (not raw `document.createRange()` hacks that bypass Medium's internal state).

5. **List items need two Enter presses to exit.** When anchor text is inside a `<li>`, pressing Enter once creates a new list item. Press Enter twice (or Enter + Backspace) to exit the list and land on a blank `<p>` where the inline menu appears.

6. **`execCommand('delete')` on large ranges does not persist.** Medium's save API only persists changes made through its own editor input model. Use paste replacement instead of programmatic deletion for large content changes.

---

## Limitations

### Hard (no workaround at plugin level)

- **Cloudflare bot detection**: A fresh headless browser is blocked by Medium on first launch. Writer must log in manually once; session persists afterward.
- **No public Medium write API**: All automation goes through the live browser editor DOM. A Medium editor redesign can break selectors.
- **Large paste + reload = doubled content**: Covered in behavioral rules above.
- **Image session scope**: If the Playwright session resets between paste and image upload, images must be re-uploaded.
- **Separate Playwright process**: The bundled `.mcp.json` starts a new browser process. It does not share cookies with an existing Playwright session the writer may already have open.

### Soft (workarounds exist)

- **Windows path format**: `browser_file_upload` requires `C:\\absolute\\path\\to\\image.png`. macOS/Linux writers use forward slashes.
- **Code blocks render as plain paragraphs**: Medium doesn't parse `<pre><code>` from clipboard paste as syntax-highlighted blocks.
- **One article at a time**: No batch update across multiple drafts in a single session without navigating between them.
- **No rollback**: Medium's undo history clears on page reload. Local markdown is the source of truth.

---

## Onboarding Flow (README outline)

1. `claude plugin install github:workcontrolgit/claude-medium-editor`
2. Run `/medium-editor list-drafts` — browser opens
3. If redirected to login, sign in once manually
4. (Optional) Copy `templates/medium-public-url.json` → `medium/medium-public-url.json` in your project
5. Run `/medium-editor update-article <editId> <path/to/local.md>`

---

## Future Skills (same repo, new folders under `skills/`)

- `dev-to-editor/` — dev.to article automation
- `hashnode-editor/` — Hashnode article automation
- `linkedin-article/` — LinkedIn long-form article posting

Each would get its own `SKILL.md` + `references/` subfolder. The `plugin.json` skills array gets a new entry. No breaking changes to existing `medium-editor` skill.
