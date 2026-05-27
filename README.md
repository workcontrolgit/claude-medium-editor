# claude-medium-editor

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Claude%20Code-blueviolet)

A Claude Code plugin that automates Medium.com article editing from your terminal. Sync content from local markdown files, insert images, update series navigation links, and publish drafts — no browser clicking required.

> Medium has no public write API. This plugin automates the live Medium editor via the [Playwright MCP](https://github.com/microsoft/playwright-mcp) browser.

---

## Quick Start

### Prerequisites

- [VS Code](https://code.visualstudio.com/) — where you write and manage your markdown files
- A Claude subscription — required to run Claude Code ([claude.ai](https://claude.ai))
- [Claude Code](https://claude.ai/code) — installed as a VS Code extension or standalone CLI
- Node.js 18+ — runtime for the Playwright MCP server
- Playwright MCP — configured automatically during plugin install (see below)

### Playwright MCP

This plugin controls the Medium editor through a real browser using the [Playwright MCP server](https://github.com/microsoft/playwright-mcp). The MCP server exposes browser actions (navigate, click, type, file upload, evaluate JS) as Claude tools.

**You do not need to install Playwright manually.** Running `claude plugin install claude-medium-editor` writes the MCP server configuration to `.mcp.json` in your project automatically. Claude Code picks it up on the next launch.

If you want to verify or manually configure it, the entry in `.mcp.json` looks like this:

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

Node.js 18+ must be on your `PATH` for `npx` to resolve the package.

### Install

**Step 1 — Register the marketplace (one-time setup):**

```bash
claude plugin marketplace add workcontrolgit/claude-medium-editor
```

This tells Claude Code where to find the plugin — pointing it at the GitHub repository `workcontrolgit/claude-medium-editor` as a source.

**Step 2 — Install the plugin:**

```bash
claude plugin install claude-medium-editor
```

This registers the `medium-editor` skill and writes the Playwright MCP server configuration to `.mcp.json` automatically. Restart Claude Code after install to activate the MCP server.

### First Run

1. Open Claude Code in your project directory
2. Run `/medium-editor list-drafts` — a browser window opens
3. If redirected to Medium's login page, sign in once manually
4. Your session persists — you won't need to log in again
5. *(Optional)* Copy the article registry template into your project:

```bash
cp <plugin-dir>/templates/medium-public-url.json ~/medium/medium-public-url.json
# Fill in your editId values
```

The `editId` is in your Medium editor URL: `https://medium.com/p/{editId}/edit`

---

## Commands

All commands are invoked as `/medium-editor <operation> [args]`.

| Operation | Description | Example |
|---|---|---|
| `list-drafts` | List all draft articles | `/medium-editor list-drafts` |
| `list-published` | List published articles (paginated) | `/medium-editor list-published` |
| `list-scheduled` | List scheduled articles | `/medium-editor list-scheduled` |
| `list-submissions` | List articles submitted to a publication, pending approval | `/medium-editor list-submissions` |
| `list-unlisted` | List unlisted (published but not indexed) articles | `/medium-editor list-unlisted` |
| `populate-registry` | Scrape all tabs and build `~/medium/medium-public-url.json` | `/medium-editor populate-registry` |
| `update-article` | Replace draft body with content from a local markdown file | `/medium-editor update-article abc123 ./post.md` |
| `create-new-article` | Create a new Medium draft from a local markdown file | `/medium-editor create-new-article ./post.md` |
| `insert-image` | Insert a local image after a specific anchor paragraph | `/medium-editor insert-image abc123 "Anchor text" ./img.png` |
| `replace-text` | Replace a specific phrase anywhere in the article | `/medium-editor replace-text abc123 "old text" "new text"` |
| `update-links` | Update hyperlinks in an article using the registry (title + publication match) | `/medium-editor update-links abc123` or `/medium-editor update-links --all` |
| `submit-article` | Walk through the full publish flow with topics | `/medium-editor submit-article abc123` |

### Article Registry (series writers)

Build the registry at `~/medium/medium-public-url.json` using the `populate-registry` command or the helper script. Commands like `update-links` use this registry to resolve URLs by title and publication. For one-off edits, pass `editId` directly — no registry needed.

Registry schema:

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

**`publicUrl` lifecycle:**

| Stage | Value |
|---|---|
| Draft (not yet submitted) | `https://medium.com/p/{editId}` |
| Published to a publication | `https://medium.com/{publication}/{slug}-{editId}` |

Use the short form for all drafts — Medium redirects it to the pretty URL once published, so series navigation links resolve correctly even before an article goes live. Once an article is submitted to a publication and published, update `publicUrl` to the full pretty URL. Never leave it empty. This matters because **Medium limits publishing to 2 articles per day** — pre-wiring all links lets you publish a long series on a rolling schedule without breaking navigation.

### Populate your registry automatically

**Option A — browser scrape** (includes pretty public URLs, supports multi-series):

```
/medium-editor populate-registry
```

**Option B — API script** (faster, but uses short redirect URLs only):

```bash
node scripts/fetch-articles.mjs <your-medium-username>
# e.g. node scripts/fetch-articles.mjs workcontrolgit
```

Both write to `~/medium/medium-public-url.json`. This location is outside any repo — no git-ignore needed, and it works regardless of which project you're working in.

---

## Disclaimer

This plugin automates the cut-and-paste workflow — it pushes your content to Medium as a draft and can submit it to a publication for review. It does **not** publish directly. Final publishing still requires you to approve and click Publish in the Medium editor.

Use this tool at your own risk. Browser automation interacts with a live editor and can corrupt articles in unexpected ways. Always keep your local markdown file as the source of truth. **Test with a small, throwaway draft before using it on articles you care about.**

## Limitations

### Hard (no workaround)

- **Cloudflare bot detection** — A fresh headless browser is blocked by Medium on first launch. Sign in once manually; the session persists afterward.
- **No public Medium write API** — All automation goes through the live browser editor DOM. A Medium editor redesign could break selectors.
- **Large paste + reload = doubled content** — Medium's OT sync merges the stale server version with your local draft on reload. Never reload after a large paste.
- **No rollback** — Medium's undo history clears on page reload. Your local markdown file is the source of truth.

### Soft (workarounds exist)

- **Windows paths** — `browser_file_upload` requires `C:\\absolute\\path\\to\\image.png`. macOS/Linux use forward slashes.
- **Code blocks render as plain paragraphs** — Medium doesn't parse `<pre><code>` from clipboard paste as syntax-highlighted blocks.
- **One article at a time** — No batch update across multiple drafts in a single session.

---

## How It Works

### Why browser automation

Medium provides no public write API. The plugin controls the live Medium editor in a real browser using the [Playwright MCP server](https://github.com/microsoft/playwright-mcp), which exposes browser actions (click, type, file upload, evaluate JS) as Claude tools.

### Architecture

```
/medium-editor <operation>
       │
       ▼
  SKILL.md          ← routing logic + DOM facts
       │
       ▼
  references/       ← one file per operation, loaded on demand
  ├── list-stories.md        list-drafts, list-published, list-scheduled,
  │                          list-submissions, list-unlisted
  ├── populate-registry.md   populate-registry
  ├── update-article.md      update-article
  ├── create-new-article.md  create-new-article
  ├── insert-image.md        insert-image
  ├── replace-text.md        replace-text
  ├── update-links.md        update-links, update-links --all
  ├── submit-article.md     submit-article
  ├── dom-facts.md           shared DOM selectors reference
  └── troubleshooting.md     shared troubleshooting guide
       │
       ▼
  Playwright MCP     ← browser automation tools
       │
       ▼
  Medium Editor DOM
```

`SKILL.md` stays lean so Claude loads only the one reference file needed per operation — keeping per-invocation token cost low.

### Repository Structure

```
claude-medium-editor/
├── .claude-plugin/
│   └── plugin.json            # name, description, author, version
├── .mcp.json                  # Playwright MCP server auto-config
├── LICENSE
├── README.md
├── templates/
│   └── medium-public-url.json # starter registry template for series writers
└── skills/
    └── medium-editor/
        ├── SKILL.md           # routing logic + key DOM facts
        └── references/
            ├── list-stories.md        # list-drafts/published/scheduled/submissions/unlisted
            ├── populate-registry.md   # populate-registry
            ├── update-article.md      # update-article
            ├── create-new-article.md  # create-new-article
            ├── insert-image.md        # insert-image
            ├── replace-text.md        # replace-text
            ├── update-links.md        # update-links, update-links --all
            ├── submit-article.md     # submit-article
            ├── dom-facts.md           # shared DOM selectors reference
            └── troubleshooting.md     # shared troubleshooting guide
```

### Key DOM Selectors

| Element | Selector |
|---|---|
| Editor body | `.editor-inner[contenteditable="true"]` |
| Article title | `.graf--title` |
| Inline image menu | `[data-testid="editorAddButton"]` |
| Save status | `div`/`span` with `textContent === 'Saved'` |

### Critical Behavioral Rules

These constraints were discovered through live editor testing. Violating them causes content corruption or failed saves.

1. **Never reload after a large paste.** Medium's OT system merges the stale server version with the local draft on reload, producing doubled content. Insert all images in the same session as the paste, before any navigation.

2. **Ctrl+A → Ctrl+V for full replacement.** Include the article title as `<h3>` in the pasted HTML. This is the only approach that cleanly replaces all content without server-side merge artifacts.

3. **Cursor placement matters.** Place the cursor at the start of the subtitle `<p>` (not inside the title `<h3>`) before selecting and pasting. Placing the cursor inside the title causes the first pasted block to merge into it.

4. **Image insertion requires clean editor state.** The inline `+` menu works only when the editor state is not corrupted by programmatic `setRange()` calls. Always insert images after paste, and use the Selection API (not raw `document.createRange()` hacks) to set cursor position.

5. **List items need two Enter presses to exit.** When the anchor text is inside a `<li>`, pressing Enter once creates a new list item. Press Enter twice (or Enter + Backspace) to exit and land on a blank `<p>` where the inline menu appears.

6. **`execCommand('delete')` on large ranges does not persist.** Medium's save API only persists changes made through its own editor input model. Use paste replacement instead of programmatic deletion for large content changes.

---

## Reporting Issues

Found a bug or a broken selector after a Medium editor update? Open an issue on GitHub:

👉 [github.com/workcontrolgit/claude-medium-editor/issues](https://github.com/workcontrolgit/claude-medium-editor/issues)

Please include:
- The command you ran (e.g. `create-new-article`, `update-links`)
- What happened vs. what you expected
- Any error messages from the Claude Code panel or browser console

Medium occasionally redesigns its editor, which can break DOM selectors. Issues like these are usually quick fixes — a clear report helps a lot.

## Contributing

Pull requests are welcome. To contribute:

1. Fork the repo and create a branch from `main`
2. Make your changes — for selector fixes, update the relevant file in `skills/medium-editor/references/`
3. Test against a real Medium draft before submitting
4. Open a pull request with a description of what changed and why

### Adding a New Platform Skill

The repo is structured to support additional platforms without breaking the existing `medium-editor` skill:

1. Create `skills/<platform>-editor/SKILL.md` + `references/` subfolder
2. Skills are auto-discovered from the `skills/` directory — no changes to `plugin.json` needed

### Roadmap

| Skill | Platform |
|---|---|
| `dev-to-editor` | dev.to article automation |
| `hashnode-editor` | Hashnode article automation |
| `linkedin-article` | LinkedIn long-form article posting |

---

## License

MIT — see [LICENSE](LICENSE)
