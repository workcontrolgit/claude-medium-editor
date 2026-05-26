# populate-registry

Populate `medium/medium-public-url.json` by scraping published articles from Medium, then filtering to a single series.

## When to use

Use before `update-series-links` when `medium/medium-public-url.json` doesn't exist or needs to be rebuilt from the live site.

Alternative: run `node scripts/fetch-articles.mjs <username>` for a quick API-based export (does not include pretty public URLs).

## Steps

### 1. Navigate to published stories

```
https://medium.com/me/stories?tab=posts-published
```

Take a snapshot and confirm the Published tab is active.

### 2. Extract articles from the page

For each row in the table, extract:
- **title** — from the heading link text
- **publication** — from the publication name link in the row (e.g. "Scrum and Coke", "Pickleball")
- **publicUrl** — the `href` of the title link, query string stripped
- **editId** — last hyphen-separated segment of `publicUrl`
- **editUrl** — `https://medium.com/p/{editId}/edit`

### 3. Scroll for more (if series spans multiple pages)

If the target series articles are not all visible, scroll down and re-snapshot until all series parts are captured.

### 3a. Also scrape drafts

Navigate to `https://medium.com/me/stories/drafts`, take a snapshot, and extract drafts using the same fields. For drafts:
- `publication` — use the publication name if shown, otherwise leave empty string `""`
- `publicUrl` — use `https://medium.com/p/{editId}` (short redirect form)

Add draft entries to the extracted list before filtering.

### 4. Confirm scope with user

Present the full extracted list (published + drafts) and ask:
"Should I include all articles, or filter to specific ones? (e.g. only Scrum and Coke, or only drafts)"

Include only the articles the user confirms.

### 5. Assign no extra fields

No `series` or `part` assignment needed. Each entry is written exactly as extracted:
`title`, `publication`, `editId`, `editUrl`, `publicUrl`.

For drafts with no publication: set `"publication": ""`.

### 6. Write the registry

Create `medium/` directory if it doesn't exist, then write `medium/medium-public-url.json`:

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

For unpublished drafts, use `"publicUrl": "https://medium.com/p/{editId}"` — never leave it empty.

### 7. Confirm

Report to the user: how many entries written, file path, and any entries using the short draft URL that will need updating after publishing.

## publicUrl lifecycle

| Stage | `publicUrl` value |
|---|---|
| Draft (not yet submitted) | `https://medium.com/p/{editId}` |
| Published to a publication | `https://medium.com/{publication}/{slug}-{editId}` |

**Pattern:** `https://medium.com/{publication-name}/{article-title-kebab-case}-{editId}`

Example: `https://medium.com/scrum-and-coke/part-1-the-net-agent-framework-ichatclient-and-mcp-clients-4b52cc179e26`

- Draft `publicUrl` is always `https://medium.com/p/{editId}` — never empty.
- Once published to a publication, update `publicUrl` to the full pretty URL: `https://medium.com/{publication-slug}/{article-slug}-{editId}`
- Never leave `publicUrl` empty. Medium limits publishing to 2 articles/day — pre-wiring all links lets you publish on a rolling schedule without breaking navigation.

## Notes

- The `editId` is the final 12-character hex segment of any Medium article URL (pretty or short).
- `editUrl` (`https://medium.com/p/{editId}/edit`) is used only to open the editor — not in series navigation.
- This operation only scrapes the current page view — Medium shows ~20 articles per load. Scroll or paginate if your series is buried further down.
