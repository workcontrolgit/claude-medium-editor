# publish-article

Walk through the full Medium publish flow for a draft, including setting topics and submitting to a publication.

## Parameters

- `editId` — the Medium post ID

## Steps

1. Navigate to `https://medium.com/p/{editId}/edit`
2. Wait for `.editor-inner[contenteditable="true"]`
3. Click the "Publish" button (top right of the editor)
4. Take a snapshot to see the publish panel
5. If prompted to add topics:
   - Click the topics/tags field
   - Type and select up to 5 relevant topics
6. If submitting to a publication:
   - Click "Add to publication"
   - Select the publication from the list
7. Review the publish preview panel with the user — ask them to confirm before submitting
8. Click "Publish now" (or "Submit for review" if publishing to a publication)
9. Wait for the confirmation page / success state
10. Report the published URL to the user

## Notes

- Always pause at step 7 and show the user a snapshot before clicking "Publish now". Publishing cannot be undone easily.
- If the article is being submitted to a publication rather than published directly, the button text may be "Submit for review" — the publication editor must approve it.
- The publish panel UI may vary slightly depending on whether the account has a publication set up.
