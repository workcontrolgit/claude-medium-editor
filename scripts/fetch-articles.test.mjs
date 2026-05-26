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
