# publish-article

Walk through the full Medium publish flow for a draft — setting the story preview, adding topics/tags, optionally submitting to a publication, and publishing.

## Parameters

- `editId` — the Medium post ID

## Steps

### 1. Navigate to the editor

Navigate to `https://medium.com/p/{editId}/edit`. Wait for `.editor-inner[contenteditable="true"]`.

### 2. Click the Publish button

```js
document.querySelector('.js-publishButton').click();
```

This navigates to the submission page:
`https://medium.com/p/{editId}/submission?...`

Wait for the page to load. Confirm the three sections are visible: **Story preview**, **Topics**, **Publication**.

### 3. Set story preview

#### Preview subtitle (auto-generate)

Before navigating to the submission page, read the article body from `.editor-inner[contenteditable="true"]`:

```js
document.querySelector('.editor-inner[contenteditable="true"]').innerText.trim().substring(0, 2000);
```

Use the article text to write a concise, compelling subtitle — max 140 characters. The subtitle should summarise the article's key value or finding in plain language, suitable as a teaser for readers browsing Medium.

**Rules:**
- Max 140 characters (enforced by Medium)
- Do not start with "In this article" or "This post"
- Write as a sentence fragment or short sentence — no trailing period needed
- Prefer concrete over vague: "Build a .NET MCP server with 5 tools in under an hour" > "Learn about MCP servers"

Present the generated subtitle to the user for approval before filling it in. If they want a revision, generate an alternative.

Once approved, fill in the subtitle field:

```js
const subtitleBox = document.querySelector('textarea[placeholder*="preview subtitle"], input[placeholder*="preview subtitle"]')
  || Array.from(document.querySelectorAll('div[contenteditable="true"], textarea')).find(el => el.closest('[aria-label*="subtitle"]'));
```

Or target by placeholder text via `browser_fill_form` / `browser_click` + `browser_type` on the `textbox "Story preview subtitle"` element.

#### Preview title (optional)

The preview title defaults to the article title. Only change it if the user asks.

- Preview title: `textbox` with placeholder `"Write a preview title"` — select all and type new value

### 4. Add topics/tags

Topics input selector: `input[placeholder="Add a topic..."]`

```js
// Click the topics input
document.querySelector('input[placeholder="Add a topic..."]').click();
```

Then use `browser_type` to type a topic. Medium shows an autocomplete dropdown — use `browser_press_key` with `ArrowDown` + `Enter` to select a suggestion, or `Enter` to add freeform text.

Repeat for up to 5 topics. Ask the user which topics to add before typing.

### 5. Submit to a publication (optional)

Under the **Publication** heading there is a `button` with text `"Submit"`:

```js
Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Submit').click();
```

This opens a publication selection panel. Take a snapshot, then click the target publication from the list.

After selecting, the button text changes to `"Submit to [Publication Name]"` — confirm with the user before proceeding.

### 6. Review and confirm

Take a snapshot of the full submission page. Show the user:
- Preview title and subtitle
- Selected topics
- Publication (if any)
- Paywall checkbox state
- Notify subscribers checkbox state

**Always ask for explicit confirmation before publishing. Publishing cannot be easily undone.**

### 7. Publish

Click the **Publish** button (not "Submit" — that's for publication submission):

```js
Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Publish').click();
```

If submitting to a publication for review instead of publishing directly, the button text may be `"Submit for review"` — click that instead. The article will be live only after the publication editor approves it.

### 8. Confirm success

Wait for a confirmation page or success state. Take a snapshot. Report the result to the user including the article URL if available.

## Button reference

All buttons on the submission page use class names only — no `data-testid`. Use text content to locate them:

| Button text | Purpose |
|---|---|
| `Submit` | Open publication selection panel |
| `Publish` | Publish the article immediately |
| `Schedule for later` | Open scheduling picker |
| `Submit for review` | Submit to a publication (appears after publication is selected) |

## Notes

- The submission page URL is `https://medium.com/p/{editId}/submission?redirectUrl=...` — do not navigate here directly; always enter via the `.js-publishButton` click from the editor.
- Medium limits publishing to **2 articles per day**. Submitting to a publication for review does not count against this limit until the editor approves.
- Paywall and notify-subscribers checkboxes are checked by default. Ask the user if they want to uncheck either.
