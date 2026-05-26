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
