# insert-image

Insert a local image after a specific anchor paragraph in an existing Medium draft.

## Parameters

- `editId` — the Medium post ID
- `anchor text` — exact text of the paragraph after which the image should be inserted
- `path/to/image.png` — absolute path to the local image file

## Steps

1. Navigate to `https://medium.com/p/{editId}/edit` (or confirm already on the page from a previous paste operation)
2. Wait for `.postArticle-content[contenteditable="true"]`
3. Use `browser_evaluate` to locate the anchor paragraph and place the cursor after it:
   ```js
   // Find the paragraph containing the anchor text
   const walker = document.createTreeWalker(
     document.querySelector('.postArticle-content'),
     NodeFilter.SHOW_TEXT
   );
   let node;
   while ((node = walker.nextNode())) {
     if (node.textContent.includes('ANCHOR_TEXT')) {
       const range = document.createRange();
       range.setStartAfter(node.parentElement);
       range.collapse(true);
       const sel = window.getSelection();
       sel.removeAllRanges();
       sel.addRange(range);
       break;
     }
   }
   ```
4. Press End key to ensure cursor is at end of the anchor paragraph: `browser_press_key` with `End`
5. Press Enter to create a new paragraph: `browser_press_key` with `Enter`
   - If anchor is inside a `<li>`: press Enter twice (or Enter + Backspace) to exit the list
6. Wait briefly for the inline `+` menu to appear
7. Click the inline add button: `browser_click` on `[data-testid="editorAddButton"]`
8. Click the image/photo option in the menu that appears
9. Upload the file: `browser_file_upload` with the absolute path to the image
   - Windows path format: `C:\\absolute\\path\\to\\image.png`
   - macOS/Linux: `/absolute/path/to/image.png`
10. Wait for the image to upload and for `textContent === 'Saved'`
11. Confirm success to user

## Critical rules

- **Insert images after paste, never before.** The editor state must be clean from a paste operation, not corrupted by programmatic range manipulation.
- **Use Selection API for cursor placement** — do not use raw `document.createRange()` hacks that bypass Medium's internal editor state.
- **Never reload between paste and image insertion.** The Playwright session must remain open from the paste step.
- **List items need two Enter presses.** If the anchor is inside a `<li>`, pressing Enter once creates another list item. Press Enter twice or Enter + Backspace to exit the list.
