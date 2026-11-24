/**
 * 设置页脚本的公共层：令牌、请求封装、共享状态、多语言字典与 DOM 工具。
 *
 * 作为整页脚本的第一个片段被拼进同一个 IIFE，后续片段只调用这里导出的名字。
 * 令牌只放内存并随请求头送出，地址栏里的那一份读完即清；刷新后内存里没有令牌时，
 * 由首次访问换来的 HttpOnly cookie 继续认证，所以请求一律按同源凭据发出。
 * 片段里不许出现第二份枚举清单，取值一律由调用方注入。
 * @module dsh-pet/src/standalone/settings-page/script/core
 */
import { DEFAULT_VOICE_BY_LANGUAGE } from '../../../shared/i18n/defaults.ts';
import { STANDALONE_DICTS, STANDALONE_LANGUAGE_EVENT } from '../locales.ts';

/** 脚本片段需要的枚举与默认值，全部由装配入口从源码常量注入。 */
export interface ScriptConsts {
  /** 可选音色（来自语音注册表的内置实现，id 已是限定 id；provider 是分组标题）。 */
  readonly voices: readonly {
    readonly id: string;
    readonly name: string;
    readonly tag: string;
    readonly provider: string;
  }[];
  /** 出厂默认音色；配置里没写这一项时页面显示它。 */
  readonly defaultVoice: string;
  /** 字体预设 id（来自 shared/fonts.ts）。 */
  readonly fonts: readonly string[];
  /** 显示档（来自 shared/config.ts）。 */
  readonly displays: readonly string[];
  /** 停靠角落（来自 host/config/constants.ts）。 */
  readonly corners: readonly string[];
  /** 物理默认值（来自 shared/physics）。 */
  readonly physics: unknown;
  /** 字体默认值（来自 shared/fonts.ts）。 */
  readonly font: unknown;
  /** 动作频率默认值（来自 shared/weights.ts）。 */
  readonly weights: unknown;
  /** 内置 PowerContext 记忆实现的 id（来自 shared/memory.ts）。 */
  readonly powerContextProviderId: string;
}

const DEFAULT_LIMITED_VOICES = {
  vi: 'edge/' + DEFAULT_VOICE_BY_LANGUAGE.vi,
  en: 'edge/' + DEFAULT_VOICE_BY_LANGUAGE.en,
  zh: 'edge/' + DEFAULT_VOICE_BY_LANGUAGE.zh,
};

/**
 * 生成公共层片段。
 *
 * @param routePath - 插件 HTTP 前缀，取自 shared/constants 的 ROUTE_SEGMENT。
 * @param consts - 枚举与默认值。
 * @returns 可直接拼进整页脚本的源码。
 */
export function coreScript(routePath: string, consts: ScriptConsts): string {
  return `
const TOKEN = new URLSearchParams(location.hash.slice(1)).get('token') || '';
history.replaceState(null, '', location.pathname);
const API = ${JSON.stringify(routePath)};
const VOICES = ${JSON.stringify(consts.voices)};
const DEFAULT_VOICE_ID = ${JSON.stringify(consts.defaultVoice)};
const DEFAULT_VOICE_BY_LANG = ${JSON.stringify(DEFAULT_LIMITED_VOICES)};
const DEFAULT_VOICE_SET = new Set(Object.values(DEFAULT_VOICE_BY_LANG));
const FONT_IDS = ${JSON.stringify(consts.fonts)};
const DISPLAYS = ${JSON.stringify(consts.displays)};
const CORNERS = ${JSON.stringify(consts.corners)};
const FALLBACK_PHYSICS = ${JSON.stringify(consts.physics)};
const FALLBACK_FONT = ${JSON.stringify(consts.font)};
const FALLBACK_WEIGHTS = ${JSON.stringify(consts.weights)};
const POWERCONTEXT_ID = ${JSON.stringify(consts.powerContextProviderId)};
const FALLBACK_INTERVAL_SEC = 300;
const I18N_DICTS = ${JSON.stringify(STANDALONE_DICTS)};
const LANG_EVENT_NAME = ${JSON.stringify(STANDALONE_LANGUAGE_EVENT)};
const state = { config: null, meta: null, globals: null, pets: {}, prompts: {}, entry: 'main', petIndex: 0, dirty: false, voiceOptions: null, speechProviders: null, memoryProviders: null, lang: 'zh', activeTab: 'chat', aiLoaded: false, hasDeepseekKey: false };

function resolveUiLang(setting) {
  if (setting === 'vi' || setting === 'en' || setting === 'zh') return setting;
  if (setting === 'auto') {
    const raw = (typeof navigator !== 'undefined' && navigator.language) ? String(navigator.language).toLowerCase() : 'en';
    if (raw.startsWith('vi')) return 'vi';
    if (raw.startsWith('zh')) return 'zh';
    return 'en';
  }
  return 'zh';
}


function tr(key, params) {
  const dict = I18N_DICTS[state.lang] || I18N_DICTS.zh;
  const raw = (dict && key in dict) ? dict[key] : (I18N_DICTS.zh[key] || key);
  if (!params) return raw;
  return raw.replace(/\\{(\\w+)\\}/g, function (_m, name) {
    return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : '';
  });
}

function setTextById(id, text) {
  const el = byId(id);
  if (el) el.textContent = text;
}

function setPlaceholderById(id, text) {
  const el = byId(id);
  if (el) el.placeholder = text;
}

function applyChromeTranslations() {
  const htmlLang = state.lang === 'vi' ? 'vi' : state.lang === 'en' ? 'en' : 'zh-CN';
  if (document.documentElement) document.documentElement.lang = htmlLang;
  document.title = tr('page.title');
  setTextById('brand-label', tr('brand.label'));
  const nav = byId('settings-nav');
  if (nav) nav.setAttribute('aria-label', tr('nav.aria'));
  const tabChat = byId('tab-chat');
  if (tabChat) tabChat.dataset.title = tr('nav.chat');
  const tabConfig = byId('tab-config');
  if (tabConfig) tabConfig.dataset.title = tr('nav.config');
  setTextById('nav-label-chat', tr('nav.chat'));
  setTextById('nav-label-config', tr('nav.config'));
  setTextById('side-foot', tr('side.foot'));
  setTextById('page-title', state.activeTab === 'config' ? tr('nav.config') : tr('nav.chat'));
  setTextById('dirty', tr('dirty.badge'));
  setTextById('pet-save', tr('btn.save'));
  setTextById('ai-card-title', tr('ai.cardTitle'));
  setTextById('ai-card-hint', tr('ai.cardHint'));
  setTextById('service-label', tr('ai.serviceLabel'));
  setTextById('service-note', tr('ai.serviceNote'));
  setTextById('protocol-label', tr('ai.protocolLabel'));
  setTextById('baseUrl-label', tr('ai.baseUrlLabel'));
  setTextById('endpoint-note', tr('ai.baseUrlNote'));
  setTextById('model-label', tr('ai.modelLabel'));
  setPlaceholderById('model', tr('ai.modelPlaceholder'));
  const modelToggle = byId('model-toggle');
  if (modelToggle) modelToggle.setAttribute('aria-label', tr('ai.modelToggleAria'));
  setTextById('model-note', tr('ai.modelNote'));
  setPlaceholderById('apiKey', tr('ai.keyPlaceholder'));
  setTextById('key-delete', tr('btn.deleteKey'));
  setTextById('key-note', tr('ai.keyNote'));
  setTextById('deepseek-key-label', tr('ai.voiceKeyLabel'));
  setPlaceholderById('deepseekApiKey', tr('ai.keyPlaceholder'));
  setTextById('deepseek-key-delete', tr('btn.deleteVoiceKey'));
  setTextById('deepseek-key-note', tr('ai.voiceKeyNote'));
  setTextById('balance-note', tr('ai.balanceNote'));
  setTextById('balance-btn', tr('btn.queryBalance'));
  setTextById('test-btn', tr('btn.testConn'));
  setTextById('privacy', tr('ai.privacy'));
  setTextById('save', tr('btn.save'));
  if (typeof protocolSelect !== 'undefined' && protocolSelect) {
    protocolSelect.setOptions([
      { value: 'openai-compatible', label: tr('ai.protocolOpenAI') },
      { value: 'anthropic', label: tr('ai.protocolAnthropic') },
    ]);
  }
  if (state.aiLoaded) {
    if (typeof paintServiceState === 'function') paintServiceState();
    setTextById('deepseek-key-state', state.hasDeepseekKey ? tr('ai.keyStateSaved') : tr('ai.keyStateUnset'));
    const aiStatus = byId('status');
    if (aiStatus && aiStatus.dataset.error !== 'true' && aiStatus.dataset.ok !== 'true') {
      aiStatus.textContent = tr('status.aiLocalOnly');
    }
  } else {
    setTextById('key-label', tr('ai.keyLabelDefault'));
    setTextById('key-state', tr('ai.keyStateUnread'));
    setTextById('deepseek-key-state', tr('ai.keyStateUnread'));
  }
}

function applyPageLanguage(setting, opts) {
  if (setting !== 'vi' && setting !== 'en' && setting !== 'zh' && setting !== 'auto') return;
  const resolved = resolveUiLang(setting);
  state.lang = resolved;
  applyChromeTranslations();
  if (opts && opts.broadcast && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent(LANG_EVENT_NAME, { detail: { language: setting } }));
  }
}

function byId(id) {
  return document.getElementById(id);
}

function make(tag, props, kids) {
  const node = document.createElement(tag);
  if (props) {
    for (const key of Object.keys(props)) {
      const value = props[key];
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'value') node.value = value;
      else if (key === 'checked' || key === 'disabled' || key === 'hidden') node[key] = value === true;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, String(value));
    }
  }
  if (kids) {
    for (const kid of kids) {
      if (kid === null || kid === undefined || kid === false) continue;
      node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
  }
  return node;
}

function setStatus(node, text, kind) {
  if (!node) return;
  node.textContent = text;
  node.dataset.error = kind === 'error' ? 'true' : 'false';
  node.dataset.ok = kind === 'ok' ? 'true' : 'false';
}

function markDirty(value) {
  state.dirty = value;
  const badge = byId('dirty');
  if (badge) badge.hidden = !value;
}

async function callApi(method, path, body) {
  const response = await fetch(API + path, {
    method: method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: body
      ? { 'X-DSH-Pet-Token': TOKEN, 'Content-Type': 'application/json' }
      : { 'X-DSH-Pet-Token': TOKEN },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 403) throw new Error(tr('err.tokenExpired'));
    if (response.status === 429) throw new Error(tr('err.rateLimit'));
    throw new Error((data && (data.message || data.error)) || tr('err.localApi'));
  }
  return data;
}
`;
}
