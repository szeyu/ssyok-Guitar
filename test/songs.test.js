// Guards the hand-charted songs: every file in the songs folder, indexed or not, must validate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateSong } from '../app/src/engine/song.js';

const dir = new URL('../app/songs/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', dir)));
const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');

test('the index lists only files that exist', () => {
  assert.deepEqual(index.filter(f => !files.includes(f)), []);
});

for (const f of files) test(`${f} validates`, () => {
  assert.deepEqual(validateSong(JSON.parse(readFileSync(new URL(f, dir)))), []);
});
