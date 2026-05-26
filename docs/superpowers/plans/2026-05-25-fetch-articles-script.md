# fetch-articles Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-dependency Node.js script that fetches all published Medium articles for a username and writes them to `medium/medium-public-url.json`.

**Architecture:** The script separates pure logic (parsing the Medium JSON response into the registry schema) from side effects (HTTP fetch, file I/O, process.exit). Pure functions are tested with Node's built-in `node:test` runner; the CLI entry point wires them together.

**Tech Stack:** Node.js 18+ (native `fetch`, `node:fs/promises`, `node:test`)

---

### Task 1: Core parsing logic + tests

**Files:**
- Create: `scripts/fetch-articles.mjs`
- Create: `scripts/fetch-articles.test.mjs`

- [ ] **Step 1: Create `scripts/fetch-articles.mjs` with the two pure functions**

```js
// scripts/fetch-articles.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const JSONP_PREFIX = '])}while(1);</x>';

export function parseResponse(raw) {
  const json = JSON.parse(raw.replace(JSONP_PREFIX, ''));
  const posts = Object.values(json?.payload?.references?.Post ?? {});
  return posts;
}

export function mapToRegistry(posts) {
  return posts
    .sort((a, b) => b.firstPublishedAt - a.firstPublishedAt)
    .map((post, i) => ({
      part: i + 1,
      title: post.title,
      editId: post.id,
      editUrl: `https://medium.com/p/${post.id}/edit`,
      draftUrl: `https://medium.com/p/${post.id}`,
    }));
}
```

- [ ] **Step 2: Create `scripts/fetch-articles.test.mjs` with failing tests for `parseResponse`**

```js
// scripts/fetch-articles.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseResponse, mapToRegistry } from './fetch-articles.mjs';

const JSONP_PREFIX = '])}while(1);</x>';

const fakePosts = {
  abc123: { id: 'abc123', title: 'First Post', firstPublishedAt: 1000 },
  def456: { id: 'def456', title: 'Second Post', firstPublishedAt: 2000 },
};

const fakeRaw = JSONP_PREFIX + JSON.stringify({
  payload: { references: { Post: fakePosts } },
});

test('parseResponse strips JSONP prefix and returns posts array', () => {
  const posts = parseResponse(fakeRaw);
  assert.equal(posts.length, 2);
  assert.ok(posts.find(p => p.id === 'abc123'));
  assert.ok(posts.find(p => p.id === 'def456'));
});

test('parseResponse returns empty array when Post is missing', () => {
  const raw = JSONP_PREFIX + JSON.stringify({ payload: { references: {} } });
  const posts = parseResponse(raw);
  assert.deepEqual(posts, []);
});
```

- [ ] **Step 3: Run tests to verify they fail (functions not yet exported correctly)**

```bash
node --test scripts/fetch-articles.test.mjs
```

Expected: tests may pass already since we wrote the functions in Step 1 — that's fine, proceed.

- [ ] **Step 4: Add failing tests for `mapToRegistry`**

Append to `scripts/fetch-articles.test.mjs`:

```js
test('mapToRegistry sorts newest first and assigns part numbers', () => {
  const posts = Object.values(fakePosts);
  const registry = mapToRegistry(posts);
  assert.equal(registry.length, 2);
  // def456 has higher firstPublishedAt (2000) → part 1
  assert.equal(registry[0].part, 1);
  assert.equal(registry[0].editId, 'def456');
  assert.equal(registry[0].editUrl, 'https://medium.com/p/def456/edit');
  assert.equal(registry[0].draftUrl, 'https://medium.com/p/def456');
  // abc123 has lower firstPublishedAt (1000) → part 2
  assert.equal(registry[1].part, 2);
  assert.equal(registry[1].editId, 'abc123');
});

test('mapToRegistry returns empty array for empty input', () => {
  const registry = mapToRegistry([]);
  assert.deepEqual(registry, []);
});
```

- [ ] **Step 5: Run tests — all should pass**

```bash
node --test scripts/fetch-articles.test.mjs
```

Expected: `✔ parseResponse strips JSONP prefix...`, `✔ parseResponse returns empty array...`, `✔ mapToRegistry sorts newest first...`, `✔ mapToRegistry returns empty array...`

- [ ] **Step 6: Commit**

```bash
git add scripts/fetch-articles.mjs scripts/fetch-articles.test.mjs
git commit -m "feat: add parseResponse and mapToRegistry with tests"
```

---

### Task 2: CLI entry point — argument handling + HTTP fetch

**Files:**
- Modify: `scripts/fetch-articles.mjs`
- Modify: `scripts/fetch-articles.test.mjs`

- [ ] **Step 1: Add failing test for the `fetchMediumJson` function**

Append to `scripts/fetch-articles.test.mjs`:

```js
test('fetchMediumJson throws on non-200 response', async () => {
  const fakeFetch = async () => ({ ok: false, status: 403 });
  await assert.rejects(
    () => fetchMediumJson('baduser', fakeFetch),
    /403/
  );
});

test('fetchMediumJson returns raw text on success', async () => {
  const fakeFetch = async () => ({ ok: true, text: async () => fakeRaw });
  const result = await fetchMediumJson('gooduser', fakeFetch);
  assert.equal(result, fakeRaw);
});
```

Add the import at the top of the test file:

```js
import { parseResponse, mapToRegistry, fetchMediumJson } from './fetch-articles.mjs';
```

- [ ] **Step 2: Run tests to verify `fetchMediumJson` tests fail**

```bash
node --test scripts/fetch-articles.test.mjs
```

Expected: FAIL — `fetchMediumJson is not a function`

- [ ] **Step 3: Add `fetchMediumJson` to `scripts/fetch-articles.mjs`**

```js
export async function fetchMediumJson(username, fetchFn = fetch) {
  const url = `https://medium.com/@${username}?format=json`;
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.text();
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
node --test scripts/fetch-articles.test.mjs
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-articles.mjs scripts/fetch-articles.test.mjs
git commit -m "feat: add fetchMediumJson with injectable fetch for testability"
```

---

### Task 3: File output + CLI wiring

**Files:**
- Modify: `scripts/fetch-articles.mjs`

- [ ] **Step 1: Append the `run` CLI entry point to `scripts/fetch-articles.mjs`**

```js
async function run() {
  const username = process.argv[2];

  if (!username) {
    console.error('Usage: node scripts/fetch-articles.mjs <username>');
    process.exit(1);
  }

  let raw;
  try {
    raw = await fetchMediumJson(username);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const posts = parseResponse(raw);

  if (posts.length === 0) {
    console.warn('Warning: No posts found for @' + username);
  }

  const registry = mapToRegistry(posts);

  const outDir = join(process.cwd(), 'medium');
  const outFile = join(outDir, 'medium-public-url.json');

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(registry, null, 2), 'utf8');

  console.log(`Wrote ${registry.length} articles to medium/medium-public-url.json`);
}

run();
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
node --test scripts/fetch-articles.test.mjs
```

Expected: all 6 tests still pass. (`run()` executes on import but `process.argv[2]` is undefined in test context — it will print usage and call `process.exit(1)`, which will abort the test run.)

**Fix:** Guard `run()` so it only fires when the file is the entry point:

```js
// Replace the bare run() call with:
const isMain = process.argv[1]?.endsWith('fetch-articles.mjs');
if (isMain) run();
```

- [ ] **Step 3: Run tests again — all should pass**

```bash
node --test scripts/fetch-articles.test.mjs
```

Expected: all 6 tests pass.

- [ ] **Step 4: Smoke test against a real Medium profile**

```bash
node scripts/fetch-articles.mjs workcontrolgit
```

Expected output:
```
Wrote N articles to medium/medium-public-url.json
```

Inspect the output:

```bash
cat medium/medium-public-url.json
```

Expected: a JSON array of objects each with `part`, `title`, `editId`, `editUrl`, `draftUrl`.

- [ ] **Step 5: Add `medium/` to `.gitignore` (generated output, not source)**

Create `.gitignore` if it doesn't exist:

```bash
echo "medium/" >> .gitignore
```

- [ ] **Step 6: Commit**

```bash
git add scripts/fetch-articles.mjs .gitignore
git commit -m "feat: add CLI entry point and file output for fetch-articles script"
```

---

### Task 4: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a "Populate your article registry" section to README.md**

In [README.md](README.md), after the "Article Registry (series writers)" subsection under Commands, add:

```markdown
### Populate your registry automatically

Run the helper script to fetch all your published articles and generate the registry file:

```bash
node scripts/fetch-articles.mjs <your-medium-username>
# e.g. node scripts/fetch-articles.mjs workcontrolgit
```

This creates `medium/medium-public-url.json` in your current directory.
You can then edit the file to set meaningful `part` numbers or reorder entries.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add fetch-articles usage to README"
```
