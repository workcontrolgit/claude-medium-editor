# Design: fetch-articles Script

**Date:** 2026-05-25  
**Status:** Approved  
**Repo:** https://github.com/workcontrolgit/claude-medium-editor

---

## Overview

A Node.js script (`scripts/fetch-articles.mjs`) that fetches all published articles from a Medium profile and writes them to `medium/medium-public-url.json` — the registry format expected by the `medium-editor` plugin.

---

## Usage

```bash
node scripts/fetch-articles.mjs <username>
# e.g. node scripts/fetch-articles.mjs workcontrolgit
```

---

## Behavior

1. Fetch `https://medium.com/@<username>?format=json`
2. Strip the JSONP prefix `])}while(1);</x>`
3. Parse JSON and extract `payload.references.Post`
4. Sort posts by `firstPublishedAt` descending (newest first)
5. Map each post to the registry schema (see below)
6. Create `medium/` directory if it does not exist
7. Write output to `medium/medium-public-url.json`
8. Print: `Wrote N articles to medium/medium-public-url.json`

---

## Output Schema

```json
[
  {
    "part": 1,
    "title": "Post Title",
    "editId": "abc123def456",
    "editUrl": "https://medium.com/p/abc123def456/edit",
    "draftUrl": "https://medium.com/p/abc123def456"
  }
]
```

`part` is assigned by index (1-based), newest article = part 1.

---

## Error Handling

| Condition | Behavior |
|---|---|
| No username argument | Print usage string, exit 1 |
| HTTP non-200 response | Print error with status code, exit 1 |
| Network failure | Print error message, exit 1 |
| No posts in response | Warn "No posts found", write empty array `[]` |

---

## Constraints

- Node 18+ native `fetch` only — no npm dependencies
- Single file: `scripts/fetch-articles.mjs`
- Output path is always `medium/medium-public-url.json` relative to cwd
