# update-series-links

Update all series navigation links across every article in the series registry to use the correct Medium URLs.

## Prerequisites

`medium/medium-public-url.json` must exist in the current working directory. Each entry must have a valid `editUrl` and `draftUrl`. Use `node scripts/fetch-articles.mjs <username>` or fill in the template manually if needed.

## Registry schema

```json
[
  {
    "part": 1,
    "title": "Part 1: Title",
    "editId": "abc123",
    "editUrl": "https://medium.com/p/abc123/edit",
    "draftUrl": "https://medium.com/publication/slug-abc123"
  }
]
```

## Steps

1. Read `medium/medium-public-url.json`
2. For each article in the registry:
   a. Navigate to its `editUrl`
   b. Wait for `.editor-inner[contenteditable="true"]`
   c. Use `browser_evaluate` with a TreeWalker to find series navigation text nodes:
      ```js
      // Series nav text is in raw text nodes, not <strong> — use TreeWalker
      const walker = document.createTreeWalker(
        document.querySelector('.editor-inner'),
        NodeFilter.SHOW_TEXT
      );
      const navNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent.match(/Part \d+:/)) {
          navNodes.push(node.parentElement);
        }
      }
      navNodes.length;
      ```
   d. For each navigation link found, select the link text and update with `execCommand('createLink', false, url)`:
      ```js
      const el = navNodes[i];
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('createLink', false, 'https://medium.com/p/EDIT_ID');
      ```
   e. Wait for `textContent === 'Saved'`
3. Report completion summary to user: how many articles updated, how many links updated per article

## Notes

- `execCommand('createLink')` is the only reliable method for link updates in Medium's editor. Direct DOM manipulation of `<a>` href does not persist.
- Series header text lives in raw text nodes, not `<strong>` elements — always use TreeWalker, not `querySelectorAll('strong')`.
