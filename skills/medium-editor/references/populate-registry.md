# populate-registry

Populate `medium/medium-public-url.json` by scraping articles from Medium across multiple tabs, then confirming scope with the user.

## When to use

Use when `medium/medium-public-url.json` doesn't exist or needs to be rebuilt from the live site.

Alternative: run `node scripts/fetch-articles.mjs <username>` for a quick API-based export (does not include pretty public URLs).

## Steps

### 1. Ask the user which publications to include

Before navigating, ask:

> "Which publications should I include? (e.g. 'Scrum and Coke', 'Pickleball', or 'all'). I'll also always include your drafts and scheduled articles."

This scopes the scrape and allows early-stop on large tabs.

### 2. Scrape Drafts tab

Navigate to `https://medium.com/me/stories/drafts`. Extract all rows:

```js
const rows = document.querySelectorAll('table tbody tr');
Array.from(rows).map(row => {
  const link = row.querySelector('a');
  const title = row.querySelector('h2, h3');
  const cleanUrl = link ? link.href.split('?')[0] : '';
  const editId = cleanUrl.split('-').pop();
  return {
    title: title ? title.textContent.trim() : '',
    publication: '',
    editId,
    editUrl: `https://medium.com/p/${editId}/edit`,
    publicUrl: `https://medium.com/p/${editId}`
  };
});
```

For drafts: `publication` = `""`, `publicUrl` = short redirect form.

### 3. Scrape Scheduled tab

Navigate to `https://medium.com/me/stories?tab=scheduled`. Extract using the same JS as Step 2. For scheduled articles without a publication shown, set `publication: ""`.

### 4. Scrape Submissions tab

Navigate to `https://medium.com/me/stories?tab=submissions-outbox`. Extract rows:

```js
const rows = document.querySelectorAll('table tbody tr');
Array.from(rows).map(row => {
  const link = row.querySelector('a');
  const title = row.querySelector('h2, h3');
  const cleanUrl = link ? link.href.split('?')[0] : '';
  const editId = cleanUrl.split('-').pop();
  const pub = row.querySelector('[data-testid="storyPublicationName"]') || null;
  return {
    title: title ? title.textContent.trim() : '',
    publication: pub ? pub.textContent.trim() : '',
    editId,
    editUrl: `https://medium.com/p/${editId}/edit`,
    publicUrl: `https://medium.com/p/${editId}`
  };
});
```

Submissions are awaiting publication approval — use the short `publicUrl` form until published.

### 5. Scrape Published tab (with early-stop)

Navigate to `https://medium.com/me/stories?tab=posts-published`.

Extract the first page. After each scroll pass:
- Filter rows to only those matching the user's target publications
- Stop scrolling when all target-publication articles appear stable (two consecutive scrolls yield no new matching rows)
- Ask the user before each additional scroll if count is already large (>40 rows)

Extract fields:

```js
const rows = document.querySelectorAll('table tbody tr');
Array.from(rows).map(row => {
  const link = row.querySelector('a');
  const title = row.querySelector('h2, h3');
  const pub = row.querySelector('[data-testid="storyPublicationName"], .storyCard__publication a') || null;
  const cleanUrl = link ? link.href.split('?')[0] : '';
  const editId = cleanUrl.split('-').pop();
  return {
    title: title ? title.textContent.trim() : '',
    publication: pub ? pub.textContent.trim() : '',
    editId,
    editUrl: `https://medium.com/p/${editId}/edit`,
    publicUrl: cleanUrl || `https://medium.com/p/${editId}`
  };
});
```

For published articles: `publicUrl` = the full pretty URL (already in `cleanUrl`).

### 6. Confirm scope with user

Present the combined list (drafts + scheduled + submissions + published) grouped by tab. Ask:

> "Found N articles total across tabs. Should I include all, or filter to specific ones?"

Include only the articles the user confirms.

### 7. Assign no extra fields

Each entry is written exactly as extracted:
`title`, `publication`, `editId`, `editUrl`, `publicUrl`.

- Drafts / Scheduled / Submissions: `publicUrl` = `https://medium.com/p/{editId}`
- Published: `publicUrl` = full pretty URL

### 8. Write the registry

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

### 9. Confirm

Report: how many entries written, breakdown by tab, and any entries using the short draft URL that will need updating after publishing.

## publicUrl lifecycle

| Stage | `publicUrl` value |
|---|---|
| Draft / Scheduled / Submission | `https://medium.com/p/{editId}` |
| Published to a publication | `https://medium.com/{publication}/{slug}-{editId}` |

- Never leave `publicUrl` empty.
- Once an article is published to a publication, update `publicUrl` to the full pretty URL.
- Medium limits publishing to 2 articles/day — pre-wiring all links lets you publish on a rolling schedule without breaking navigation.

## Notes

- The `editId` is the final 12-character hex segment. Always strip `?source=...` from URLs before extracting: `link.href.split('?')[0]`.
- `editUrl` is used only to open the editor — it is not the public-facing URL.
- Published tab may have 300+ articles — always use early-stop and ask the user before excessive scrolling.
