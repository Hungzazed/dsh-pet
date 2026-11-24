import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { bindPluginLocale, detectHostLocale } from './i18n-bind.ts';
import {
  getLanguageSetting,
  initClientLanguage,
  LANGUAGE_STORAGE_KEY,
  setActiveLanguage,
} from '../shared/i18n/core.ts';

const DICTS = {
  zh: { hello: '你好 {name}', plain: '中文' },
  en: { hello: 'Hello {name}', plain: 'English' },
  vi: { hello: 'Xin chào {name}', plain: 'Tiếng Việt' },
} as const;

describe('bindPluginLocale', () => {
  test('explicit vi/en/zh overrides host translator and interpolates params', () => {
    const prev = getLanguageSetting();
    try {
      const hostCalls: string[] = [];
      const hostT = (key: string) => {
        hostCalls.push(key);
        return 'HOST:' + key;
      };
      const t = bindPluginLocale(hostT, DICTS);

      setActiveLanguage('vi');
      assert.equal(t('hello', { name: 'Hung' }), 'Xin chào Hung');
      assert.equal(t('plain'), 'Tiếng Việt');
      assert.equal(hostCalls.length, 0);

      setActiveLanguage('en');
      assert.equal(t('hello', { name: 'Hung' }), 'Hello Hung');
      assert.equal(t('plain'), 'English');

      setActiveLanguage('zh');
      assert.equal(t('plain'), '中文');

      setActiveLanguage('auto');
      assert.equal(t('plain'), 'HOST:plain');
      assert.deepEqual(hostCalls, ['plain']);
    } finally {
      setActiveLanguage(prev);
    }
  });

  test('initClientLanguage defaults to auto before /config loads and restores cached preference from localStorage', () => {
    const prev = getLanguageSetting();
    const prevStorage = (globalThis as { localStorage?: unknown }).localStorage;
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    };
    try {
      setActiveLanguage('zh');
      const t = bindPluginLocale((k) => 'HOST:' + k, DICTS);
      assert.equal(initClientLanguage('en-US'), 'auto');
      assert.equal(getLanguageSetting(), 'auto');
      assert.equal(t('plain'), 'HOST:plain', 'before /config resolves, auto must delegate to DSH host translator');

      setActiveLanguage('vi', undefined, { persist: true });
      assert.equal(store.get(LANGUAGE_STORAGE_KEY), 'vi');

      setActiveLanguage('zh');
      assert.equal(initClientLanguage('en-US'), 'vi');
      assert.equal(t('plain'), 'Tiếng Việt');
    } finally {
      (globalThis as { localStorage?: unknown }).localStorage = prevStorage;
      setActiveLanguage(prev);
    }
  });

  test('detectHostLocale probes locale service fields cleanly', () => {
    assert.equal(detectHostLocale({ current: 'vi-VN' }), 'vi-VN');
    assert.equal(detectHostLocale({ getLocale: () => 'en-US' }), 'en-US');
    assert.equal(detectHostLocale({ language: 'zh-CN' }), 'zh-CN');
  });
});
