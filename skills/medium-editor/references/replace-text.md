# replace-text

Replace a specific phrase anywhere in an existing Medium draft.

## Parameters

- `editId` — the Medium post ID
- `old text` — the exact phrase to find and replace
- `new text` — the replacement phrase

## Steps

1. Navigate to `https://medium.com/p/{editId}/edit`
2. Wait for `.editor-inner[contenteditable="true"]`
3. Use `browser_evaluate` to locate the text node and replace it:
   ```js
   const walker = document.createTreeWalker(
     document.querySelector('.editor-inner'),
     NodeFilter.SHOW_TEXT
   );
   let replaced = false;
   let node;
   while ((node = walker.nextNode())) {
     if (node.textContent.includes('OLD_TEXT')) {
       // Select the text
       const range = document.createRange();
       const start = node.textContent.indexOf('OLD_TEXT');
       range.setStart(node, start);
       range.setEnd(node, start + 'OLD_TEXT'.length);
       const sel = window.getSelection();
       sel.removeAllRanges();
       sel.addRange(range);
       replaced = true;
       break;
     }
   }
   replaced;
   ```
4. If `replaced` is `true`, type the new text: `browser_type` with the replacement string
5. Wait for `textContent === 'Saved'`
6. Confirm success to user, or report if the text was not found

## Notes

- For replacing URLs or links, use `update-series-links` instead — it handles the full series registry.
- For large content replacement (full article body), use `update-article` instead — `execCommand('delete')` on large ranges does not persist through Medium's save API.
- If the phrase appears multiple times, this replaces only the first occurrence. Run the command again for subsequent occurrences.
