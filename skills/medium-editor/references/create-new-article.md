# create-new-article

Create a new Medium draft from a local markdown file.

## Parameters

- `path/to/local.md` — path to the local markdown file

## Steps

1. Read the local markdown file content
2. Extract the title from the first `# Heading` line
3. Navigate to `https://medium.com/new-story`
4. Wait for `.postArticle-content[contenteditable="true"]` to be present
5. Click the title area (`.graf--title`) and type the article title
6. Press Enter to move to the body
7. Convert the remaining markdown (everything after the title line) to HTML (same rules as `update-article`)
8. Copy HTML to clipboard and paste (same clipboard method as `update-article`)
9. Wait for `textContent === 'Saved'`
10. Take a snapshot to capture the new draft URL from the browser address bar
11. Report the new `editId` to the user (extracted from the URL `https://medium.com/p/{editId}/edit`)

## Notes

- The new draft is not published. Use `submit-article` to publish it.
- If the user wants to add images, use `insert-image` after this step — do not navigate away first.
