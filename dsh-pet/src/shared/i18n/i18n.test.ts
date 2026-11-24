/**
 * Contract and unit tests for src/shared/i18n.
 *
 * Verifies:
 * 1. Language validation, BCP-47 tag normalization, and reactive subscription store.
 * 2. Complete zh/en/vi UI dictionaries with matching placeholders and zero stray Han characters in en/vi.
 * 3. 100% display-label coverage for all built-in categories, animations, and memes in assets/config.jsonc.
 * 4. Built-in default text resolvers swap built-in defaults by language while preserving custom user text.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ANIMATION_LABELS,
  CATEGORY_LABELS,
  DEFAULT_SLEEP_END_TEXTS,
  DEFAULT_SLEEP_REFUSE_TEXTS,
  DEFAULT_SLEEP_START_TEXTS,
  DEFAULT_WHISPER_PROMPTS,
  DEFAULT_WORK_STATUS_TEXTS,
  MEME_LABELS,
  UI_DICTS,
  formatMessage,
  getActiveLanguage,
  getLanguageSetting,
  isPetLanguage,
  localizeWeatherSummary,
  normalizeLanguageTag,
  resolveBuiltinSleepTexts,
  resolveBuiltinWhisperPrompt,
  resolveBuiltinWorkStatusTexts,
  resolvePetLanguage,
  setActiveLanguage,
  setHostLocale,
  subscribeLanguage,
  translateAnimationLabel,
  translateCategoryLabel,
  translateMemeLabel,
  translateMoreItemLabel,
  uiText,
  wmoLabel,
} from './index.ts';
import { readJsonc } from '../../host/config/jsonc.ts';

const CJK = /[\u4e00-\u9fff]/;
const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('shared/i18n —— core language resolution & store', () => {
  test('isPetLanguage accepts only vi / en / zh / auto', () => {
    for (const ok of ['vi', 'en', 'zh', 'auto']) assert.equal(isPetLanguage(ok), true);
    for (const bad of ['', 'ja', 'VI', null, undefined, 123, {}]) assert.equal(isPetLanguage(bad), false);
  });

  test('normalizeLanguageTag maps vi* -> vi, zh* -> zh, others -> en', () => {
    assert.equal(normalizeLanguageTag('vi'), 'vi');
    assert.equal(normalizeLanguageTag('vi-VN'), 'vi');
    assert.equal(normalizeLanguageTag('VI_vn'), 'vi');
    assert.equal(normalizeLanguageTag('zh'), 'zh');
    assert.equal(normalizeLanguageTag('zh-CN'), 'zh');
    assert.equal(normalizeLanguageTag('en-US'), 'en');
    assert.equal(normalizeLanguageTag('fr-FR'), 'en');
    assert.equal(normalizeLanguageTag(undefined), 'en');
  });

  test('resolvePetLanguage handles explicit languages, auto, and fallback', () => {
    assert.equal(resolvePetLanguage('vi'), 'vi');
    assert.equal(resolvePetLanguage('en'), 'en');
    assert.equal(resolvePetLanguage('zh'), 'zh');
    assert.equal(resolvePetLanguage('auto', 'vi-VN'), 'vi');
    assert.equal(resolvePetLanguage('auto', 'en-US'), 'en');
    assert.equal(resolvePetLanguage('auto', 'zh-Hans'), 'zh');
    assert.equal(resolvePetLanguage(undefined, undefined, 'vi'), 'vi');
  });

  test('setActiveLanguage & subscribeLanguage notify listeners on changes', () => {
    const prevSetting = getLanguageSetting();
    let calls = 0;
    const unsub = subscribeLanguage(() => {
      calls += 1;
    });
    try {
      setActiveLanguage('vi');
      assert.equal(getLanguageSetting(), 'vi');
      assert.equal(getActiveLanguage(), 'vi');
      const afterVi = calls;
      setActiveLanguage('vi');
      assert.equal(calls, afterVi, 'duplicate setActiveLanguage should not re-notify');
      setActiveLanguage('en');
      assert.equal(getActiveLanguage(), 'en');
      assert.equal(calls, afterVi + 1);
      setActiveLanguage('auto', 'vi-VN');
      assert.equal(getActiveLanguage(), 'vi');
      setHostLocale('en-US');
      assert.equal(getActiveLanguage(), 'en');
    } finally {
      unsub();
      setActiveLanguage(prevSetting);
      setHostLocale(undefined);
    }
  });

  test('formatMessage interpolates known keys and strips missing ones', () => {
    assert.equal(formatMessage('Hello {name} ({n})', { name: 'Maid', n: 3 }), 'Hello Maid (3)');
    assert.equal(formatMessage('Value: {missing}', {}), 'Value: ');
  });
});

describe('shared/i18n —— UI dictionaries contract', () => {
  test('en and vi have identical key sets and placeholders as zh, with no stray Han characters', () => {
    const zhKeys = Object.keys(UI_DICTS.zh).sort();
    for (const lang of ['en', 'vi'] as const) {
      const dict = UI_DICTS[lang];
      assert.deepEqual(Object.keys(dict).sort(), zhKeys, `${lang} key set must match zh`);
      for (const key of zhKeys as Array<keyof typeof UI_DICTS.zh>) {
        const value = dict[key];
        assert.ok(value.trim().length > 0, `${lang}.${key} must not be empty`);
        assert.ok(!CJK.test(value), `${lang}.${key} still contains Han characters: ${value}`);
        assert.deepEqual(
          placeholders(value),
          placeholders(UI_DICTS.zh[key]),
          `${lang}.${key} placeholders must match zh`,
        );
      }
    }
  });

  test('uiText, wmoLabel, and localizeWeatherSummary respect language override', () => {
    assert.equal(uiText('menu.chat', undefined, 'vi'), 'Trò chuyện');
    assert.equal(uiText('menu.chat', undefined, 'en'), 'Chat');
    assert.equal(uiText('menu.chat', undefined, 'zh'), '对话');
    assert.equal(wmoLabel(0, 'vi'), 'Trời quang');
    assert.equal(wmoLabel(0, 'en'), 'Clear sky');
    assert.equal(localizeWeatherSummary(0, '晴', 'vi'), 'Trời quang');
    assert.equal(localizeWeatherSummary(0, '晴', 'en'), 'Clear sky');
    assert.equal(localizeWeatherSummary(0, '晴', 'zh'), '晴');
  });
});

describe('shared/i18n —— built-in defaults & asset label coverage', () => {
  test('all built-in categories, animations, and memes in assets/config.jsonc have en and vi display labels', () => {
    const configPath = fileURLToPath(new URL('../../../assets/config.jsonc', import.meta.url));
    const conf = readJsonc(configPath) as {
      animations: { categories: Array<{ id: string; actions: string[] }> };
      memes: Record<string, string>;
    };
    for (const cat of conf.animations.categories) {
      assert.ok(CATEGORY_LABELS[cat.id], `missing category label for ${cat.id}`);
      assert.ok(!CJK.test(translateCategoryLabel(cat.id, 'vi')), `vi category ${cat.id} contains Han`);
      assert.ok(!CJK.test(translateCategoryLabel(cat.id, 'en')), `en category ${cat.id} contains Han`);
      for (const anim of cat.actions) {
        assert.ok(ANIMATION_LABELS[anim], `missing animation label for ${anim}`);
        assert.ok(!CJK.test(translateAnimationLabel(anim, 'vi')), `vi anim ${anim} contains Han`);
        assert.ok(!CJK.test(translateAnimationLabel(anim, 'en')), `en anim ${anim} contains Han`);
      }
    }
    for (const meme of Object.keys(conf.memes)) {
      assert.ok(MEME_LABELS[meme], `missing meme label for ${meme}`);
      assert.ok(!CJK.test(translateMemeLabel(meme, 'vi')), `vi meme ${meme} contains Han`);
      assert.ok(!CJK.test(translateMemeLabel(meme, 'en')), `en meme ${meme} contains Han`);
    }
    // Custom names pass through untouched
    assert.equal(translateAnimationLabel('custom_dance', 'vi'), 'custom_dance');
    assert.equal(translateMoreItemLabel('dsh-pet-baifan', '吃白饭', 'vi'), 'Ăn cơm trắng');
    assert.equal(translateMoreItemLabel('dsh-pet-baifan', '吃白饭', 'en'), 'Rice Feast');
  });

  test('built-in default resolvers switch defaults by language while keeping custom user values untouched', () => {
    assert.equal(resolveBuiltinWhisperPrompt(DEFAULT_WHISPER_PROMPTS.zh, 'vi'), DEFAULT_WHISPER_PROMPTS.vi);
    assert.equal(resolveBuiltinWhisperPrompt(DEFAULT_WHISPER_PROMPTS.vi, 'en'), DEFAULT_WHISPER_PROMPTS.en);
    assert.equal(resolveBuiltinWhisperPrompt('Custom maid persona', 'vi'), 'Custom maid persona');

    assert.deepEqual(resolveBuiltinSleepTexts('refuse', [...DEFAULT_SLEEP_REFUSE_TEXTS.zh], 'en'), [
      ...DEFAULT_SLEEP_REFUSE_TEXTS.en,
    ]);
    assert.deepEqual(resolveBuiltinSleepTexts('start', [...DEFAULT_SLEEP_START_TEXTS.vi], 'en'), [
      ...DEFAULT_SLEEP_START_TEXTS.en,
    ]);
    assert.deepEqual(resolveBuiltinSleepTexts('end', [...DEFAULT_SLEEP_END_TEXTS.en], 'vi'), [
      ...DEFAULT_SLEEP_END_TEXTS.vi,
    ]);
    assert.deepEqual(resolveBuiltinSleepTexts('refuse', ['My custom refusal'], 'en'), ['My custom refusal']);

    assert.deepEqual(
      resolveBuiltinWorkStatusTexts(
        DEFAULT_WORK_STATUS_TEXTS.zh.map((g) => [...g]),
        'vi',
      ),
      DEFAULT_WORK_STATUS_TEXTS.vi.map((g) => [...g]),
    );
    assert.deepEqual(resolveBuiltinWorkStatusTexts([['Custom status']], 'en'), [['Custom status']]);
  });
});
