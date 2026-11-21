/**
 * Contract tests for the English menu-label maps (decision D3).
 *
 * The Chinese animation, meme and category identifiers stay as-is (config keys and asset file
 * names); these maps are the only place that turns them into English menu text. The tests keep the
 * maps honest without restating them: coverage is derived from the asset directories and the
 * bundled config, so adding or removing an asset fails the suite until the map is updated.
 * Run with: node --experimental-strip-types --import ./scripts/test-register.mjs --test src/shared/menu/labels.test.ts
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import { ANIMATION_LABELS, CATEGORY_LABELS, MEME_LABELS, animationLabel, categoryLabel, memeLabel } from './labels.ts';

/** CJK ideographs and compatibility blocks; menu labels must not contain any (D3). */
const CJK_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

/** Asset file names in a bundled asset directory, extension stripped, sorted for stable diffs. */
function assetNames(directory: string, extension: string): string[] {
  return readdirSync(new URL('../../../assets/' + directory, import.meta.url))
    .filter((name) => name.endsWith(extension))
    .map((name) => name.slice(0, -extension.length))
    .sort();
}

/** Category ids from the bundled config; the categories block is read as text, comments and all. */
function configCategoryIds(): string[] {
  const text = readFileSync(new URL('../../../assets/config.jsonc', import.meta.url), 'utf8');
  const start = text.indexOf('"categories"');
  assert.notEqual(start, -1, 'assets/config.jsonc must define animations.categories');
  const end = text.indexOf('"events"', start);
  const block = text.slice(start, end === -1 ? undefined : end);
  const ids = [...block.matchAll(/"id"\s*:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(ids.length > 0, 'animations.categories must declare at least one id');
  return ids.sort();
}

const ANIMATION_FILES = assetNames('webm', '.webm');
const MEME_FILES = assetNames('memes', '.png');

describe('ANIMATION_LABELS', () => {
  test('covers every bundled .webm exactly once', () => {
    assert.equal(ANIMATION_FILES.length, 114, 'bundled animation count changed; update the label map');
    assert.deepEqual(Object.keys(ANIMATION_LABELS).sort(), ANIMATION_FILES);
  });

  test('every animation label is a non-empty English string', () => {
    for (const [name, label] of Object.entries(ANIMATION_LABELS)) {
      assert.equal(typeof label, 'string', name + ' must map to a string');
      assert.ok(label.trim() !== '', name + ' must map to a non-empty label');
      assert.equal(CJK_RE.test(label), false, name + ' label must be English: ' + label);
    }
  });
});

describe('MEME_LABELS', () => {
  test('covers every bundled .png exactly once', () => {
    assert.equal(MEME_FILES.length, 27, 'bundled meme count changed; update the label map');
    assert.deepEqual(Object.keys(MEME_LABELS).sort(), MEME_FILES);
  });

  test('every meme label is a non-empty English string', () => {
    for (const [name, label] of Object.entries(MEME_LABELS)) {
      assert.equal(typeof label, 'string', name + ' must map to a string');
      assert.ok(label.trim() !== '', name + ' must map to a non-empty label');
      assert.equal(CJK_RE.test(label), false, name + ' label must be English: ' + label);
    }
  });
});

describe('CATEGORY_LABELS', () => {
  test('covers exactly the category ids declared in the bundled config', () => {
    const ids = configCategoryIds();
    assert.deepEqual(Object.keys(CATEGORY_LABELS).sort(), ids);
  });

  test('every category label is a non-empty English string', () => {
    for (const [id, label] of Object.entries(CATEGORY_LABELS)) {
      assert.ok(label.trim() !== '', id + ' must map to a non-empty label');
      assert.equal(CJK_RE.test(label), false, id + ' label must be English: ' + label);
    }
  });
});

describe('unknown identifiers', () => {
  test('fall back to the identifier itself, never throw', () => {
    assert.equal(animationLabel('unknown-animation'), 'unknown-animation');
    assert.equal(memeLabel('unknown-meme'), 'unknown-meme');
    assert.equal(categoryLabel('unknown-category'), 'unknown-category');
  });

  test('known identifiers resolve to their English labels', () => {
    assert.equal(animationLabel('待机呼吸休闲'), 'Idle breathing');
    assert.equal(animationLabel('东张西望'), 'Looking around');
    assert.equal(memeLabel('Ciallo'), 'Peace-sign hello');
    assert.equal(categoryLabel('小动作'), 'Small actions');
  });
});
