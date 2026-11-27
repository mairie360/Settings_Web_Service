const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');
const { centredSquare, compressPhoto, MAX_PHOTO_BYTES, PHOTO_TOO_HEAVY, PHOTO_UNREADABLE } = requireSrc('lib/profile-photo.ts');

const webp = (size) => new Blob([new Uint8Array(size)], { type: 'image/webp' });

test('MAIR-1231 the photo keeps the centred square of a landscape or portrait image', () => {
  assert.deepEqual(centredSquare(1200, 800), { x: 200, y: 0, side: 800 });
  assert.deepEqual(centredSquare(600, 1001), { x: 0, y: 200, side: 600 });
  assert.deepEqual(centredSquare(256, 256), { x: 0, y: 0, side: 256 });
});

test('MAIR-1231 the photo is encoded at decreasing qualities until it weighs at most 100 KiB', async () => {
  const tried = [];
  const sizes = { 0.9: 300_000, 0.8: 150_000, 0.7: MAX_PHOTO_BYTES };
  const photo = await compressPhoto({ encode: async (quality) => { tried.push(quality); return webp(sizes[quality] ?? 1); } });
  assert.deepEqual(tried, [0.9, 0.8, 0.7]);
  assert.equal(photo.size, MAX_PHOTO_BYTES);
  assert.equal(photo.type, 'image/webp');
});

test('MAIR-1231 a photo still too heavy, or a browser that cannot encode WebP, is refused before any request', async () => {
  await assert.rejects(compressPhoto({ encode: async () => webp(MAX_PHOTO_BYTES + 1) }), { message: PHOTO_TOO_HEAVY });
  await assert.rejects(compressPhoto({ encode: async () => new Blob([new Uint8Array(10)], { type: 'image/png' }) }), { message: PHOTO_UNREADABLE });
  await assert.rejects(compressPhoto({ encode: async () => null }), { message: PHOTO_UNREADABLE });
});
