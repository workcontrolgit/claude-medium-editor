# I Got Tired of Copy-Pasting to Medium. So I Built a Claude Code Plugin.

I write a lot. Specifically, I write a multi-part technical series called *AI Agents & MCP with .NET 10* on [Scrum and Coke](https://medium.com/scrum-and-coke). The series walks .NET developers through building a fully working AI-enabled backend from scratch — no Python, no hand-waving, just real code.

I use AI to help draft every article. Claude sits alongside me in VS Code, helps me structure arguments, writes first drafts of code explanations, and catches gaps in my reasoning. The drafting experience is genuinely great.

The publishing experience is not.

Here's what the old workflow looked like: finish a draft in markdown, open Medium, create a new story, copy the markdown, paste it, watch Medium mangle the formatting, spend ten minutes fixing headers and code blocks, then go back to every previous article in the series and manually update the navigation links to point to the new one. Part 4 links to Parts 1, 2, and 3. Part 5 links to 1, 2, 3, and 4. By Part 8, updating links meant opening eight browser tabs and making dozens of manual edits.

Every single time.

I kept looking for a better way. Every automation guide I found referenced the Medium API. So I went to look it up.

## The API That No Longer Exists

Medium launched a write API years ago. It let developers programmatically create and publish posts. Every integration tool, every third-party publisher, every "automate your Medium posting" tutorial was built on top of it.

It's gone now.

Medium deprecated the public write API and it is no longer available for new integrations. There is no official alternative. No webhook. No export/import pipeline that preserves formatting. If you want content on Medium, you put it there manually — one browser session at a time.

This isn't a tooling gap. It's a policy decision, and it's not going away.

I spent an afternoon looking for workarounds. Nothing worked. So I started thinking differently.

## What If the Browser Is the API?

Here's the insight that changed everything: I don't need Medium to give me an API. I already have one. It's called the browser.

[Playwright](https://playwright.dev/) is a browser automation library. It can open a real Chrome window, navigate to any URL, click buttons, type text, paste content, upload files — everything a human does, but programmatically. It's the same technology enterprises use for automated UI testing.

[Claude Code](https://claude.ai/code) is Anthropic's CLI for Claude. It's what I use to write code, draft content, and manage my projects from the terminal or directly inside VS Code. Claude Code supports something called MCP — Model Context Protocol — a standard that lets Claude use external tools as first-class capabilities. File reads. Shell commands. And yes, browsers.

When Playwright is connected to Claude Code as an MCP tool, Claude can see the Medium editor DOM. It can type. It can paste. It can click the publish button. It can do everything I was doing manually — and it does it without complaining.

That's the foundation of `claude-medium-editor`.

## Setup in Two Commands

You need two things installed: [Claude Code](https://claude.ai/code) and Node.js 18+. That's it.

Then, in any terminal:

```bash
claude plugin marketplace add workcontrolgit/claude-medium-editor
claude plugin install claude-medium-editor
```

The first command registers the plugin marketplace. The second installs the plugin — it registers the `medium-editor` skill in Claude Code and automatically configures the Playwright MCP server. No API keys. No OAuth dance. No config files to edit. (You will sign in to Medium once on first launch — more on that in a moment.)

**VS Code users:** Claude Code runs as a VS Code extension. If you already edit markdown in VS Code, you get this for free inside your existing editor. Open the Claude Code panel, type a command, watch the browser open.

**First run:** A browser window opens and navigates to Medium. If Cloudflare redirects you to a login page, sign in once manually. That's a Cloudflare anti-bot measure — it only happens the first time. After that, your session persists across restarts. You won't see a login page again unless you clear your browser data.

That's the entire setup.

## Your New Publishing Workflow

Here's what publishing looks like now for my .NET series.

I finish drafting `preface.md` in VS Code. Claude helped me write it. I open the Claude Code panel and type:

```
/medium-editor create-new-article ./preface.md
```

A browser window opens. Claude reads the markdown, converts it to the HTML format Medium expects, and pastes it into a new story. The title, headers, body, and code blocks are all placed correctly. The article appears in my Medium drafts, formatted and ready.

If I have an architecture diagram to add:

```
/medium-editor insert-image abc123 "Before we begin" ./architecture-diagram.png
```

Claude places the cursor after the paragraph that starts with "Before we begin" and inserts the image using Medium's inline upload flow.

Spot a placeholder I forgot to fill in:

```
/medium-editor replace-text abc123 "TBD" "see Part 3"
```

Done in seconds. No scrolling, no hunting.

Ready to publish:

```
/medium-editor publish-article abc123
```

Claude walks through the full publish flow — prompting me to confirm topics, presenting a generated subtitle for approval, then submitting to the Scrum and Coke publication once I give the final go-ahead. I watch it happen in the browser in real time.

That's the workflow. Five commands. No browser tab switching.

## The Series Writer's Secret Weapon: `update-links`

Everything above makes publishing faster. `update-links` makes a multi-part series manageable.

Here's the problem it solves. When I'm writing Part 4 of a series, I include navigation links to Parts 1, 2, and 3. In my local markdown, those links look like this:

```markdown
[Part 1: The Preface](./part-01-preface.md)
[Part 2: Project Setup](./part-02-setup.md)
[Part 3: First Agent](./part-03-agent.md)
```

On Medium, those need to be live URLs:

```
https://medium.com/scrum-and-coke/ai-agents-mcp-with-net-10-preface-64314313e3e7
https://medium.com/scrum-and-coke/ai-agents-mcp-with-net-10-project-setup-...
```

And every time a new part publishes, I need to go back and update the navigation links in every previous article. For a 10-part series, that's dozens of manual edits per release.

`update-links` does all of that in one command.

**Step 1: Build the registry.**

```
/medium-editor populate-registry
```

Claude opens your Medium stories dashboard and scrapes all tabs — drafts, published, scheduled, submissions. It writes a registry file to `~/medium/medium-public-url.json` that maps every article title to its live Medium URL and edit ID. This file lives outside any repo, so it works regardless of which project you're in.

**Step 2: Update links.**

```
/medium-editor update-links --all
```

Claude reads the registry, opens each article in the editor, finds every hyperlink whose text matches a title in the registry, and rewrites it to the correct Medium URL. It uses a browser-level editing command to update each link — the same mechanism Medium's own editor uses internally — so the links are indistinguishable from ones you set manually.

For the "AI Agents & MCP with .NET 10" series — 10+ articles, each with navigation links to all the others — running `update-links --all` after each new part goes live takes about two minutes and replaces what used to be an hour of clicking through tabs.

The registry schema is simple:

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

You can also update a single article: `/medium-editor update-links abc123`. The `--all` flag is for the full series sweep.

## Full Command Reference

| Command | What it does |
|---|---|
| `list-drafts` | List all draft articles |
| `list-published` | List published articles |
| `list-scheduled` | List scheduled articles |
| `list-submissions` | List pending publication submissions |
| `list-unlisted` | List unlisted (published but not indexed) articles |
| `populate-registry` | Scrape all tabs and build `~/medium/medium-public-url.json` |
| `update-article` | Replace an existing draft's body from a local markdown file |
| `create-new-article` | Create a new Medium draft from a local markdown file |
| `insert-image` | Insert a local image after a specific anchor paragraph |
| `replace-text` | Replace a phrase anywhere in the article |
| `update-links` | Rewrite cross-article links using the registry |
| `publish-article` | Walk the full publish flow: topics, subtitle, submit |

## Limitations Worth Knowing

This tool is honest about what it can't do.

**One manual login required.** Cloudflare blocks fresh headless browsers on first contact. You sign in once, the session persists. This is a real constraint — not something the tool can work around.

**DOM-dependent.** The plugin drives the live Medium editor by its DOM selectors. If Medium redesigns the editor, selectors may need updating. The plugin is [open source](https://github.com/workcontrolgit/claude-medium-editor) — when Medium breaks something, fixes land fast.

**No rollback.** Medium's undo history clears on page reload. Your local markdown file is always the source of truth. Never delete it. Never rely on Medium's editor as your backup.

**One article at a time.** You can't have multiple drafts open in parallel in a single session. `update-links --all` handles multi-article workflows by iterating sequentially.

**Code blocks paste as plain text.** Medium doesn't recognize `<pre><code>` from clipboard paste as syntax-highlighted blocks. Code appears correctly as a monospace block, but without syntax highlighting.

## You Just Read the Demo

This article was written in markdown in VS Code. Claude helped draft it. It was published to Medium using `/medium-editor create-new-article`. The navigation links back to the AI Agents & MCP series were updated with `/medium-editor update-links`.

No browser tabs. No copy-paste. No manual link hunting.

If you write on Medium and work in VS Code, it's two commands to install:

```bash
claude plugin marketplace add workcontrolgit/claude-medium-editor
claude plugin install claude-medium-editor
```

The plugin is open source at [workcontrolgit/claude-medium-editor](https://github.com/workcontrolgit/claude-medium-editor). If something breaks or you want a new command, contributions are welcome.

Write locally. Publish instantly. Let the browser do the clicking.
