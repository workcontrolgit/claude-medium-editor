# update-article

Replace the full body of an existing Medium draft with content from a local markdown file.

## Parameters

- `editId` — the Medium post ID (from `https://medium.com/p/{editId}/edit`)
- `path/to/local.md` — path to the local markdown file to use as the new content

## Steps

1. Read the local markdown file content
2. Convert markdown to HTML:
   - `# Heading` → `<h3>` (Medium uses h3 for article titles in paste)
   - `## Heading` → `<h4>`
   - `**bold**` → `<strong>`
   - `*italic*` → `<em>`
   - `` `code` `` → `<code>`
   - Paragraphs → `<p>`
   - Lists → `<ul><li>` or `<ol><li>`
   - Include the article title as the first `<h3>`
3. Navigate to `https://medium.com/p/{editId}/edit`
4. Wait for `.editor-inner[contenteditable="true"]` to be present
5. Copy HTML to clipboard via `browser_evaluate`:
   ```js
   const div = document.createElement('div');
   div.innerHTML = `<h3>Article Title</h3><p>...</p>`;
   document.body.appendChild(div);
   const range = document.createRange();
   range.selectNodeContents(div);
   const sel = window.getSelection();
   sel.removeAllRanges();
   sel.addRange(range);
   document.execCommand('copy');
   document.body.removeChild(div);
   ```
6. Select all content: `browser_press_key` with `ctrl+a`
7. Paste: `browser_press_key` with `ctrl+v`
8. Wait for save: poll for element with `textContent === 'Saved'` (up to 15s)
9. Confirm success to user

## Critical rules

- **Never reload after paste.** Medium's OT sync doubles content on reload. All image insertions must happen in the same session, before any navigation.
- **Include the title as `<h3>` in the pasted HTML.** Ctrl+A + Ctrl+V replaces everything including the existing title.
- **Do not place cursor inside the title `<h3>`.** Place cursor at start of subtitle `<p>` or use Ctrl+A to select all.
