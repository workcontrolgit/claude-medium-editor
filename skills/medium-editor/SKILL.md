---
name: medium-editor
description: Use when automating Medium.com article editing — updating article content from local markdown, creating new articles, inserting images, replacing text, updating article links, or publishing articles via Playwright browser automation.
---

# medium-editor skill

Automate Medium.com article editing via the Playwright MCP browser.

## Invocation examples

```
/medium-editor list-drafts
/medium-editor populate-registry
/medium-editor update-article <editId> <path/to/local.md>
/medium-editor create-new-article <path/to/local.md>
/medium-editor insert-image <editId> "<anchor paragraph text>" <path/to/image.png>
/medium-editor replace-text <editId> "<old text>" "<new text>"
/medium-editor update-links <editId>
/medium-editor update-links --all
/medium-editor publish-article <editId>
```

`editId` is found in the Medium editor URL: `https://medium.com/p/{editId}/edit`

For `update-links`, the registry `medium/medium-public-url.json` must exist in the current working directory. Run `/medium-editor populate-registry` to build it if missing.

---

## Prerequisites check

Before starting any operation, verify:

1. Playwright MCP tools are available (`browser_navigate`, `browser_snapshot`, etc.)
2. If a Medium session is required: navigate to `https://medium.com` and confirm the user is logged in (no login redirect). If not logged in, ask the user to sign in manually and confirm before proceeding.

---

## Key DOM facts (always apply)

These apply to ALL operations. Never use deprecated selectors.

| Element | Selector |
|---|---|
| Editor body | `.editor-inner[contenteditable="true"]` |
| Article title | `.graf--title` |
| Inline image menu button | `[data-testid="editorAddButton"]` |
| Save status | `div` or `span` with `textContent === 'Saved'` |

- **Link updates**: use `document.execCommand('createLink', false, url)` — reliable and proven
- **Clipboard paste**: copy via temp div + `execCommand('copy')`, paste with Ctrl+V — only reliable injection method
- **Link element walking**: use element walker for `<A>` tags — do not use text node walker for link updates

---

## Operations index

| Operation | Reference file |
|---|---|
| `populate-registry` | `references/populate-registry.md` |
| `update-article` | `references/update-article.md` |
| `create-new-article` | `references/create-new-article.md` |
| `insert-image` | `references/insert-image.md` |
| `replace-text` | `references/replace-text.md` |
| `update-links` | `references/update-links.md` |
| `publish-article` | `references/publish-article.md` |
| DOM facts & selectors | `references/dom-facts.md` |
| Troubleshooting | `references/troubleshooting.md` |

Load only the reference file for the requested operation. Do not load all reference files at once.

---

## list-drafts (inline — no reference file needed)

1. Navigate to `https://medium.com/me/stories/drafts`
2. Take a snapshot
3. Extract all draft article titles and their edit URLs from the page
4. Present the list to the user as a numbered table: `| # | Title | Edit URL |`
