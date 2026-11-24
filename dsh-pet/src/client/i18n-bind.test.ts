import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { bindPluginLocale, detectHostLocale } from './i18n-bind.ts';
import { getLanguageSetting, setActiveLanguage } from '../shared/i18n/core.ts';

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

  test('detectHostLocale probes locale service fields cleanly', () => {
    assert.equal(detectHostLocale({ current: 'vi-VN' }), 'vi-VN');
    assert.equal(detectHostLocale({ getLocale: () => 'en-US' }), 'en-US');
    assert.equal(detectHostLocale({ language: 'zh-CN' }), 'zh-CN');
  });
});
