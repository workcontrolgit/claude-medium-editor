// scripts/fetch-articles.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export function parseResponse(raw) {
  if (!raw.startsWith('])}while(1);</x>')) {
    throw new Error('Unexpected response format: missing JSONP prefix');
  }
  const json = JSON.parse(raw.replace(/^\]\)\}while\(1\);<\/x>/, ''));
  const posts = Object.values(json?.payload?.references?.Post ?? {});
  return posts;
}

export function mapToRegistry(posts) {
  return [...posts]
    .sort((a, b) => b.firstPublishedAt - a.firstPublishedAt)
    .map((post, i) => ({
      part: i + 1,
      title: post.title,
      editId: post.id,
      editUrl: `https://medium.com/p/${post.id}/edit`,
      draftUrl: `https://medium.com/p/${post.id}`,
    }));
}

export async function fetchMediumJson(username, fetchFn = fetch) {
  const url = `https://medium.com/@${username}?format=json`;
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.text();
}

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

const isMain = process.argv[1]?.endsWith('fetch-articles.mjs');
if (isMain) run();
