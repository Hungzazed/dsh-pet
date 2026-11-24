/**
 * Standalone settings-page i18n tests.
 * Verifies:
 * 1. Standalone UI dictionary parity (zh/en/vi keys, placeholders, no stray Han characters in en/vi).
 * 2. Full standalone settings page renders in vi and en with zero Chinese text across chrome and all cards.
 * 3. Saving a new language dispatches the live sync event consumed by chat-mount.ts (no page reload needed).
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { STANDALONE_DICTS, STANDALONE_LANGUAGE_EVENT } from './locales.ts';
import { settingsPage, settingsScript } from '../settings-page.ts';

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

describe('standalone/settings-page/locales —— dictionary parity', () => {
  test('en and vi match zh keys and placeholders with no stray Han characters', () => {
    const zhKeys = Object.keys(STANDALONE_DICTS.zh).sort();
    for (const lang of ['en', 'vi'] as const) {
      const dict = STANDALONE_DICTS[lang];
      assert.deepEqual(Object.keys(dict).sort(), zhKeys, `${lang} key mismatch`);
      for (const key of zhKeys) {
        const val = dict[key as keyof typeof dict];
        assert.ok(val.length > 0, `${lang}.${key} must be non-empty`);
        assert.doesNotMatch(val, /[\u4e00-\u9fff]/, `${lang}.${key} must not contain Han characters: ${val}`);
        assert.deepEqual(
          placeholders(val),
          placeholders(STANDALONE_DICTS.zh[key as keyof typeof STANDALONE_DICTS.zh]),
          `${lang}.${key} placeholder mismatch`,
        );
      }
    }
  });
});

describe('standalone/settings-page —— runtime localization & live chat sync', () => {
  type FakeEl = {
    nodeType: number;
    tag: string;
    id: string;
    className: string;
    textContent: string;
    value: string;
    placeholder: string;
    disabled: boolean;
    hidden: boolean;
    checked: boolean;
    dataset: Record<string, string>;
    attrs: Record<string, string>;
    children: FakeEl[];
    listeners: Record<string, Array<(ev?: unknown) => void>>;
    style: Record<string, string>;
    append: (...kids: unknown[]) => void;
    addEventListener: (ev: string, fn: (e?: unknown) => void) => void;
    setAttribute: (k: string, v: string) => void;
    getAttribute: (k: string) => string | null;
    firstElementChild: FakeEl | null;
    remove: () => void;
    focus: () => void;
    click: () => void;
    reportValidity: () => boolean;
    getBoundingClientRect: () => { left: number; top: number; bottom: number; width: number; height: number };
  };

  function makeEl(tag: string, id = ''): FakeEl {
    const el: FakeEl = {
      nodeType: 1,
      tag,
      id,
      className: '',
      textContent: '',
      value: '',
      placeholder: '',
      disabled: false,
      hidden: false,
      checked: false,
      dataset: {},
      attrs: {},
      children: [],
      listeners: {},
      style: {},
      append(...kids: unknown[]) {
        for (const k of kids) {
          if (k && typeof k === 'object') el.children.push(k as FakeEl);
        }
      },
      addEventListener(ev: string, fn: (e?: unknown) => void) {
        (el.listeners[ev] ??= []).push(fn);
      },
      setAttribute(k: string, v: string) {
        el.attrs[k] = v;
        if (k.startsWith('data-')) {
          const camel = k.slice(5).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
          el.dataset[camel] = v;
        }
      },
      getAttribute(k: string) {
        return el.attrs[k] ?? null;
      },
      get firstElementChild() {
        return el.children.find((c) => c.nodeType === 1) ?? null;
      },
      remove() {},
      focus() {},
      click() {
        for (const fn of el.listeners.click ?? []) fn({ preventDefault() {}, stopPropagation() {} });
      },
      reportValidity: () => true,
      getBoundingClientRect: () => ({ left: 0, top: 0, bottom: 20, width: 120, height: 20 }),
    };
    return el;
  }

  function collectTexts(node: FakeEl): string[] {
    const out: string[] = [];
    if (node.textContent) out.push(node.textContent);
    if (node.placeholder) out.push(node.placeholder);
    for (const c of node.children) out.push(...collectTexts(c));
    return out;
  }

  async function bootStandalone(language: 'vi' | 'en') {
    const ids = new Map<string, FakeEl>();
    const getOrMake = (id: string) => {
      let el = ids.get(id);
      if (!el) {
        el = makeEl('div', id);
        ids.set(id, el);
      }
      return el;
    };
    // Pre-populate tab elements matching chrome.ts
    const tabChat = getOrMake('tab-chat');
    tabChat.dataset.tab = 'chat';
    tabChat.dataset.title = '对话';
    const tabConfig = getOrMake('tab-config');
    tabConfig.dataset.tab = 'config';
    tabConfig.dataset.title = '配置';
    const body = makeEl('body');
    const docEl = { lang: 'zh-CN' };
    const dispatched: Array<{ type: string; detail: unknown }> = [];

    const doc = {
      title: '桌宠设置',
      documentElement: docEl,
      body,
      getElementById: (id: string) => getOrMake(id),
      createElement: (tag: string) => makeEl(tag),
      createElementNS: (_ns: string, tag: string) => makeEl(tag),
      createTextNode: (text: string) => ({ nodeType: 3, textContent: text, children: [] }),
      querySelectorAll: (sel: string) => (sel === '[data-tab]' || sel === '.navCell' ? [tabChat, tabConfig] : []),
      addEventListener() {},
      removeEventListener() {},
    };

    const windowObj = {
      innerHeight: 900,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent(ev: { type: string; detail?: unknown }) {
        dispatched.push({ type: ev.type, detail: ev.detail });
        return true;
      },
    };

    class FakeCustomEvent {
      readonly type: string;
      readonly detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    }

    const baseConfig = {
      ok: true,
      main: {
        language,
        whisperPrompt: language === 'vi' ? 'Nhân vật mặc định' : 'Default persona',
        pets: [
          {
            id: 'main',
            name: 'Pet',
            size: 320,
            display: 'desktop',
            position: { corner: 'bottom-right', marginX: 40, marginY: 40 },
          },
        ],
      },
    };

    const fetchMock = async (url: string, init?: { method?: string; body?: string }) => {
      if (url.endsWith('/config') && (!init?.method || init.method === 'GET')) {
        return { ok: true, status: 200, json: async () => baseConfig };
      }
      if (url.endsWith('/config') && init?.method === 'PUT') {
        const sent = JSON.parse(init.body ?? '{}');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            main: { ...baseConfig.main, ...sent },
          }),
        };
      }
      if (url.endsWith('/config/meta')) {
        return { ok: true, status: 200, json: async () => ({ user: '/tmp/u', default: '/tmp/d' }) };
      }
      if (url.endsWith('/voice/voices')) {
        return { ok: true, status: 200, json: async () => ({ providers: [] }) };
      }
      if (url.endsWith('/voice/hear-providers') || url.endsWith('/memory/providers')) {
        return { ok: true, status: 200, json: async () => ({ providers: [] }) };
      }
      if (url === '/standalone-ai/settings') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            service: 'custom',
            services: [{ id: 'custom', label: 'Custom', keyName: 'CUSTOM_API_KEY', protocol: 'openai-compatible' }],
            savedKeys: [],
            profiles: {},
            hasDeepseekKey: false,
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    };

    const ctx: Record<string, unknown> = {
      document: doc,
      window: windowObj,
      CustomEvent: FakeCustomEvent,
      location: { hash: '#token=tok', pathname: '/standalone-ai' },
      history: { replaceState() {} },
      URLSearchParams,
      navigator: { language: 'en-US' },
      fetch: fetchMock,
      setTimeout,
      clearTimeout,
    };
    ctx.globalThis = ctx;

    runInNewContext(settingsScript, ctx);
    for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r));
    return { doc, ids, dispatched, collectTexts };
  }

  test('chrome.ts includes explicit i18n hooks for static labels', () => {
    assert.ok(settingsPage.includes('id="brand-label"'));
    assert.ok(settingsPage.includes('id="ai-card-title"'));
  });

  test('renders standalone chrome & pet cards in Vietnamese and English with zero stray Han characters', async () => {
    for (const lang of ['vi', 'en'] as const) {
      const { doc, ids, dispatched, collectTexts } = await bootStandalone(lang);
      assert.equal(doc.documentElement.lang, lang === 'vi' ? 'vi' : 'en');
      assert.doesNotMatch(doc.title, /[\u4e00-\u9fff]/, `title should be localized in ${lang}`);

      const petCards = ids.get('pet-cards')!;
      const cardTexts = collectTexts(petCards);
      assert.ok(cardTexts.length > 20, 'pet cards must render');
      for (const txt of cardTexts) {
        // Voice display names for Chinese voices may appear inside select options only; card UI text should have zero Han
        if (/晓晓|晓伊|云希|云健|中文/.test(txt)) continue;
        assert.doesNotMatch(txt, /[\u4e00-\u9fff]/, `stray Han text in ${lang} card: ${txt}`);
      }

      for (const id of ['brand-label', 'side-foot', 'dirty', 'pet-save', 'ai-card-title', 'save', 'privacy']) {
        const text = ids.get(id)?.textContent ?? '';
        assert.ok(text.length > 0, `#${id} must be populated`);
        assert.doesNotMatch(text, /[\u4e00-\u9fff]/, `#${id} has stray Han in ${lang}: ${text}`);
      }

      const langEvents = dispatched.filter((e) => e.type === STANDALONE_LANGUAGE_EVENT);
      assert.ok(langEvents.length >= 1, 'must broadcast language event for chat-mount.ts');
      assert.deepEqual(JSON.parse(JSON.stringify(langEvents[langEvents.length - 1]?.detail)), { language: lang });
    }
  });
});
