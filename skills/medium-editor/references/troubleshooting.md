# troubleshooting

Common issues and resolutions for Medium editor automation.

---

## Login / session issues

**Symptom:** Browser navigates to Medium login page instead of the editor.

**Cause:** The Playwright session does not have a valid Medium cookie.

**Fix:**
1. In the open browser window, sign in to Medium manually
2. Confirm login is successful (profile icon visible in top right)
3. Tell Claude you are logged in and ready to proceed
4. Claude will re-attempt the operation from the beginning

---

## Cloudflare bot detection

**Symptom:** Browser shows a Cloudflare challenge or "Just a moment..." page.

**Cause:** Cloudflare blocks fresh headless browsers on first launch.

**Fix:** The Playwright MCP browser is not fully headless — it opens a visible window. Complete the Cloudflare challenge manually if prompted, then proceed. This typically only happens once per new Playwright profile.

---

## Content doubled after reload

**Symptom:** The article body contains duplicated content after a paste operation.

**Cause:** The page was reloaded after a paste. Medium's OT sync merged the stale server state with the local paste, doubling all content.

**Fix:**
1. Press Ctrl+Z repeatedly to undo the reload merge (may not always work)
2. If undo fails: use `update-article` to re-paste from the local markdown file — this replaces all content cleanly
3. **Prevention:** Never reload after a paste. Do all image insertions in the same session before any navigation.

---

## Inline `+` menu does not appear

**Symptom:** After pressing Enter on a paragraph, the inline `[data-testid="editorAddButton"]` does not appear.

**Cause:** Either the cursor is not on a blank `<p>`, or the editor state is corrupted from programmatic range manipulation.

**Fix:**
1. Click directly in the editor to reset editor state
2. Use arrow keys to navigate to the target paragraph
3. Press End to go to the end of the line, then Enter to create a new blank paragraph
4. The `+` button should appear on the new blank line

---

## Image upload has no effect

**Symptom:** `browser_file_upload` completes but no image appears in the article.

**Cause:** The file upload dialog was not triggered correctly, or the path format is wrong.

**Fix:**
1. Confirm the inline `+` menu was clicked and the image option selected before uploading
2. Check path format:
   - Windows: `C:\\Users\\name\\images\\photo.png` (double backslashes)
   - macOS/Linux: `/Users/name/images/photo.png`
3. Ensure the file exists at the specified path
4. Re-run `insert-image` from the beginning — do not reload the page

---

## Save never completes

**Symptom:** Polling for `textContent === 'Saved'` times out after 15 seconds.

**Cause:** Medium's autosave may be delayed on slow connections, or the editor did not register the paste as a change.

**Fix:**
1. Wait an additional 10–15 seconds
2. Take a snapshot — if the article content looks correct, the save may have completed without the status indicator updating
3. If content is clearly wrong or empty, use `update-article` to re-paste

---

## `execCommand('createLink')` has no effect

**Symptom:** Link text is selected but `createLink` does not apply a hyperlink.

**Cause:** The selection was made programmatically and Medium's editor did not register it as a user selection.

**Fix:** Use `browser_evaluate` with `window.getSelection()` to verify the selection is active before calling `execCommand`. Re-select using the Selection API if needed.
