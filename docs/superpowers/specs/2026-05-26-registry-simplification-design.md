# Registry Simplification — Design Spec

**Date:** 2026-05-26  
**Status:** Approved

## Problem

The `medium/medium-public-url.json` registry has two manually-assigned fields — `series` and `part` — that are not sourced from Medium, not used by any skill logic, and create friction for non-technical editors who shouldn't need to edit JSON at all.

## Goal

Simplify the registry to a flat, auto-populated lookup table. Editors never touch JSON. `update-links` works per article using title + publication matching.

---

## Section 1: Registry Schema

Remove `series` and `part`. Add `publication`.

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
    "title": "Skip the Spreadsheet: A Faster Way to Run Pickleball Round Robin Games",
    "publication": "Pickleball",
    "editId": "f1650baeaf92",
    "editUrl": "https://medium.com/p/f1650baeaf92/edit",
    "publicUrl": "https://medium.com/pickleball/skip-the-spreadsheet-a-faster-way-to-run-pickleball-round-robin-games-f1650baeaf92"
  }
]
```

- `publication` is scraped automatically from the Medium stories page by `populate-registry`
- Standalone articles appear in the registry identically to series articles — they are simply never referenced by other articles' links, so they cause no harm
- For drafts: `publicUrl` = `https://medium.com/p/{editId}` (pre-wired redirect, updated to pretty URL after publishing to a publication)

---

## Section 2: `populate-registry` Changes

- **Drop** `series` and `part` from scraped output
- **Add** `publication` field scraped from the stories page (already visible in the Medium UI)
- **Also scrape drafts** in addition to published articles — drafts use the short `publicUrl` form
- No change to the invocation: `/medium-editor populate-registry`
- Output: `medium/medium-public-url.json` (git-ignored)

---

## Section 3: `update-links` Operation

Replaces `update-series-links`. New invocation:

```
/medium-editor update-links <editId>     ← update one article
/medium-editor update-links --all        ← batch update all articles in registry
```

### Matching logic

For each hyperlinked text node in the article being updated:

1. Look up `title` in the registry — exact match
2. If exactly one match found → update `href` to `publicUrl` silently
3. If multiple matches (same title, different publications) → pause and prompt:

```
Found "Part 1 — Introduction" in multiple publications:
  1. Scrum and Coke  → https://medium.com/scrum-and-coke/part-1-...-abc123
  2. Pickleball      → https://medium.com/pickleball/part-1-...-def456

Which should be used for this link? (1/2/skip)
```

4. If no match → skip silently, include in end-of-run report
5. External links (non-Medium) → leave untouched

Choices are **not persisted** — prompted fresh each run.

### Matching summary

| Scenario | Action |
|---|---|
| Title matches exactly one publication | Update silently |
| Title matches multiple publications | Pause, prompt user |
| Title matches none | Skip, report at end |
| External / non-registry link | Leave untouched |

### End-of-run report

```
update-links complete for <title>:
  ✓ 3 links updated
  ⚠ 1 link skipped (no registry match): "Further Reading"
```

### Batch mode (`--all`)

- Iterates every article in the registry that has a valid `editUrl`
- Applies the same per-article logic
- Skips articles whose `publicUrl` is still the short draft form (optional warning)

---

## Section 4: Migration

### Files to update

| File | Change |
|---|---|
| `medium/medium-public-url.json` | Strip `series`/`part`, add `publication` to all 18 entries |
| `templates/medium-public-url.json` | Update example schema |
| `skills/medium-editor/SKILL.md` | Rename `update-series-links` → `update-links` in examples + operations index |
| `skills/medium-editor/references/update-series-links.md` | Rename to `update-links.md`, rewrite logic |
| `skills/medium-editor/references/populate-registry.md` | Remove `series`/`part`, add `publication` |
| `README.md` | Update commands table + registry schema example |
| Cache copies | All above synced to plugin cache |

### Migration of `medium/medium-public-url.json`

Run `populate-registry` to rebuild the file from the live site — this is faster and more accurate than manually editing the existing 18 entries.

---

## Out of Scope

- Fuzzy title matching (exact match only for now)
- Persisting user choices for collision resolution
- Any UI for the editor to manage the registry outside of `populate-registry`
