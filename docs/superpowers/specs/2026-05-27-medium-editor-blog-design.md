---
name: medium-editor-blog
description: Design spec for a Medium blog post about claude-medium-editor — story-first confession arc, meta publish angle, targeting both devs and non-dev AI writers
type: project
---

# Blog Post Design: claude-medium-editor

**Date:** 2026-05-27
**Author:** Fuji Nguyen
**Target Publication:** Medium / Scrum and Coke
**Status:** Approved for implementation

---

## Overview

A Medium blog post that tells the story of why `claude-medium-editor` was built and how it works. The post uses a confession-arc narrative, is accessible to both technical and non-technical AI writers, and closes with a meta reveal: the article itself was written in markdown and published using the tool it describes.

The "AI Agents & MCP with .NET 10" series (*Scrum and Coke*) is the real-world example woven throughout — it's a multi-part .NET developer series where every article needs navigation links to all the others, which is exactly the pain that drove the tool's creation.

---

## Target Audience

Both:
- Developers who write technical blogs and are comfortable with VS Code / CLI
- Non-developer writers who use AI (Claude, ChatGPT) to draft content locally

The post is hosted on a technical publication but written accessibly enough that a non-dev can follow the setup.

---

## Tone & Style

- **Voice:** First-person confession arc — personal frustration → discovery → solution
- **Depth:** Medium — install commands shown, Playwright MCP explained in one plain-English paragraph, no architecture deep-dives
- **Meta angle:** Centerpiece — the post is itself written in markdown and published using `claude-medium-editor`

---

## Article Structure

### Title
> *I Got Tired of Copy-Pasting to Medium. So I Built a Claude Code Plugin.*

### Subtitle (auto-generated, ~140 chars)
> *The Medium write API is gone. Here's how Playwright and Claude Code fill the gap — and publish this very article.*

---

### Section 1 — The Frustration (~200 words)

Personal story using the real series as the example. Writing "AI Agents & MCP with .NET 10" — a multi-part series on *Scrum and Coke*. AI drafts the content in markdown. But publishing to Medium is a grind:

- Copy markdown → paste into Medium editor → fix broken formatting
- Each part needs navigation links to every other part
- Every time a new part goes live, go back and manually update links in all previous parts
- Medium killed its public write API. No automation tools work anymore.

The frustration is real and specific. The reader should recognize their own pain.

---

### Section 2 — The Dead API Problem (~150 words)

Brief factual context:
- Medium had a write API. It was deprecated and shut down (no longer publicly available).
- Every "automate Medium publishing" guide online is outdated — they all reference the API.
- This is a policy gap that left writers with no programmatic option.
- The problem isn't going away. Medium has no plans to reopen the API.

Keep this factual and short — it validates the problem without dwelling.

---

### Section 3 — The Insight: What If the Browser Is the API? (~150 words)

The pivot moment:
- Playwright can drive a real browser — click, type, paste, upload files.
- Claude Code can use Playwright as an MCP (Model Context Protocol) tool.
- If Claude can see the Medium editor DOM, it can interact with it exactly like a human — but without the tedium.
- This isn't a hack. It's the same approach used by enterprise test automation, just applied to content publishing.

One plain-English explanation of what MCP is: a standard that lets Claude Code use external tools (like a browser) as first-class capabilities, the same way it uses file read/write.

---

### Section 4 — Setup in Two Commands (~200 words)

Prerequisites: Claude Code installed. Node.js 18+.

```bash
claude plugin marketplace add workcontrolgit/claude-medium-editor
claude plugin install claude-medium-editor
```

What happens: the `medium-editor` skill is registered and the Playwright MCP server is configured automatically.

First run: a browser window opens. If Medium redirects to login, sign in once manually. Session persists — Cloudflare blocks headless browsers on first contact, but a real login session survives restarts.

That's the entire setup. No API keys. No OAuth. No config files.

Note the VS Code angle: Claude Code runs as a CLI or as a VS Code extension. Writers who already use VS Code to edit markdown get this for free inside their existing editor.

---

### Section 5 — Your New Publishing Workflow (~250 words)

Walk through a real session using the .NET series as the example:

1. Draft `preface.md` in VS Code. AI (Claude) helps write it.
2. `/medium-editor create-new-article ./preface.md` — article appears in Medium editor, formatted correctly.
3. `/medium-editor insert-image abc123 "Before we begin" ./architecture-diagram.png` — image inserted after the anchor paragraph.
4. `/medium-editor replace-text abc123 "TBD" "see Part 3"` — quick in-place text fix.
5. `/medium-editor publish-article abc123` — Claude walks through the publish flow: topics, subtitle auto-generated, submit to publication.

Contrast with the old workflow (explicit before/after). Five commands vs. 20 minutes of browser clicking.

---

### Section 6 — The Series Writer's Secret Weapon: `update-links` (~300 words, own H2 section)

This gets its own section because it's the feature that turns the tool from "useful" to "essential" for series writers.

**The problem it solves:**
Writing a 10-part series. Every article links to the others. In local markdown, links point to `./part-02.md`, `./part-03.md`, etc. On Medium, those need to be live URLs like `https://medium.com/scrum-and-coke/ai-agents-mcp-...`. Every time a new part publishes, you have to go back and update links in all the previous parts manually.

**How it works:**
1. Run `/medium-editor populate-registry` — Claude opens your Medium stories dashboard, scrapes all tabs (drafts, published, scheduled), and writes `~/medium/medium-public-url.json`.
2. The registry maps article titles to their live Medium URLs.
3. Run `/medium-editor update-links abc123` for one article, or `/medium-editor update-links --all` to rewrite links across every article in your registry.
4. Claude matches links by title + publication, updates each `<a>` tag in the live editor using the proven `document.execCommand('createLink')` approach.

**The payoff:**
For the "AI Agents & MCP with .NET 10" series — 10+ articles, each with navigation links to all others — `update-links --all` replaces what would otherwise be an hour of clicking through tabs and pasting URLs. Run it once after each new part publishes. Done.

**Registry schema (brief):**
```json
[
  {
    "title": "AI Agents & MCP with .NET 10 — Preface",
    "publication": "Scrum and Coke",
    "editId": "64314313e3e7",
    "publicUrl": "https://medium.com/scrum-and-coke/ai-agents-mcp-with-net-10-preface-64314313e3e7"
  }
]
```

---

### Section 7 — Full Feature Reference (table)

All commands in a clean two-column table:

| Command | What it does |
|---|---|
| `list-drafts` | List all draft articles |
| `list-published` | List published articles |
| `list-scheduled` | List scheduled articles |
| `list-submissions` | List pending publication submissions |
| `list-unlisted` | List unlisted (published but not indexed) articles |
| `populate-registry` | Scrape all tabs and build the article registry |
| `update-article` | Replace draft body from a local markdown file |
| `create-new-article` | Create a new Medium draft from a local markdown file |
| `insert-image` | Insert a local image after a specific anchor paragraph |
| `replace-text` | Replace a phrase anywhere in the article |
| `update-links` | Rewrite cross-article links using the registry |
| `publish-article` | Walk the full publish flow: topics, subtitle, submit |

---

### Section 8 — Limitations Worth Knowing (~150 words)

Honest about hard constraints — this builds trust:

- **One manual login required.** Cloudflare blocks fresh headless browsers. Sign in once; the session persists.
- **DOM-dependent.** If Medium redesigns its editor, selectors may need updating. The plugin is open source — fixes are fast.
- **No rollback.** Medium's undo history clears on page reload. Your local markdown file is always the source of truth — never delete it.
- **One article at a time.** No batch updates across multiple open drafts in a single session (though `update-links --all` iterates through articles sequentially).
- **Code blocks paste as plain text.** Medium doesn't parse `<pre><code>` from clipboard as syntax-highlighted blocks.

---

### Section 9 — The Meta Close (~100 words)

The reveal. This article — the one you just read — was:
- Written in markdown in VS Code
- Drafted with AI assistance
- Published to Medium using `/medium-editor create-new-article`
- Series navigation links updated with `/medium-editor update-links`

No browser tab switching. No copy-paste. No manual link hunting. Just a terminal, a skill, and the same workflow described above.

The plugin is open source: `workcontrolgit/claude-medium-editor`. If you write on Medium and work in VS Code, it's two commands to install.

---

## Implementation Notes

- The blog post itself is the deliverable — it will be written as a `.md` file and published using `claude-medium-editor`
- No code changes to the plugin are needed for this blog post
- The design doc captures the narrative arc and section-level content spec; actual prose is written during implementation
- Word count target: ~1,700 words total

---

## Out of Scope

- Architecture diagram (blog post only, not a deep technical reference)
- Video walkthrough
- Changes to the plugin codebase
