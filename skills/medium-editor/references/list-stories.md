# list-stories

List articles from a specific Medium stories tab.

## Invocation

```
/medium-editor list-drafts
/medium-editor list-published
/medium-editor list-scheduled
/medium-editor list-submissions
/medium-editor list-unlisted
```

## Tab URLs

| Operation | URL |
|---|---|
| `list-drafts` | `https://medium.com/me/stories/drafts` |
| `list-published` | `https://medium.com/me/stories?tab=posts-published` |
| `list-scheduled` | `https://medium.com/me/stories?tab=scheduled` |
| `list-submissions` | `https://medium.com/me/stories?tab=submissions-outbox` |
| `list-unlisted` | `https://medium.com/me/stories?tab=unlisted` |

## Steps

### 1. Navigate to the correct tab URL

Use the table above to find the URL for the requested operation. Navigate to it.

### 2. Extract articles via JS

```js
const rows = document.querySelectorAll('table tbody tr');
Array.from(rows).map(row => {
  const link = row.querySelector('a');
  const title = row.querySelector('h2, h3');
  const cleanUrl = link ? link.href.split('?')[0] : '';
  const editId = cleanUrl.split('-').pop();
  const pubSlug = cleanUrl.match(/medium\.com\/([^/]+)\//)?.[1] || '';
  return {
    title: title ? title.textContent.trim() : (link ? link.textContent.trim() : ''),
    publication: pubSlug,
    editId,
    editUrl: `https://medium.com/p/${editId}/edit`,
    publicUrl: cleanUrl
  };
});
```

**Note:** Publication is derived from the URL slug (e.g. `scrum-and-coke`). For drafts, `cleanUrl` is the edit URL — set `publicUrl` to `https://medium.com/p/${editId}` instead.

### 3. For `list-published` — handle pagination

Published articles may number in the hundreds. After the initial extract:

- Ask the user: "Found N articles. Do you want to scroll for more, or is this enough?"
- If they want more: scroll down (`window.scrollTo(0, document.body.scrollHeight)`), wait 1–2s, re-run the extract JS, deduplicate by `editUrl`, repeat until no new articles appear or the user stops.

### 4. Present results

Present as a numbered table:

```
| # | Title | Publication | Edit URL |
|---|---|---|---|
| 1 | Article Title | Scrum and Coke | https://medium.com/p/abc123/edit |
```

For `list-drafts` and `list-scheduled`: omit the Publication column if it's empty for all rows.

For `list-submissions`: add a Status column if status values are available.

## Notes

- `list-published` with 300+ articles: always ask before scrolling further — one scroll loads ~20 more articles.
- Edit URLs: always strip `?source=...` query params — use `link.href.split('?')[0]`.
- The Submissions tab shows articles pending publication approval, not yet live. Their `publicUrl` is still the short form `https://medium.com/p/{editId}`.
