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
