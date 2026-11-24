/**
 * Core language state and resolution helpers shared across host, browser client, desktop helper, and standalone.
 *
 * Pure logic with zero Node-only imports so the same module bundles into client.js, index.js, standalone.js,
 * and Electron helper's shared-core.js (window.PetShared).
 * @module dsh-pet/src/shared/i18n/core
 */

/** Supported config values for the `language` field. */
export type PetLanguage = 'vi' | 'en' | 'zh' | 'auto';

/** Concrete UI / prompt language after resolving `auto`. */
export type ResolvedLanguage = 'vi' | 'en' | 'zh';

/** Allowed `language` values in config (whitelist for host validation and settings UI). */
export const PET_LANGUAGES: readonly PetLanguage[] = ['vi', 'en', 'zh', 'auto'];

/** Default language shipped in assets/config.jsonc. */
export const DEFAULT_LANGUAGE: PetLanguage = 'vi';

/** Check whether an unknown config value is a valid {@link PetLanguage}. */
export function isPetLanguage(value: unknown): value is PetLanguage {
  return value === 'vi' || value === 'en' || value === 'zh' || value === 'auto';
}

/**
 * Map a BCP-47 locale tag (e.g. `vi-VN`, `en-US`, `zh-CN`) to a supported {@link ResolvedLanguage}.
 *
 * @param tag - Locale string from DSH host, browser navigator, or runtime Intl.
 * @returns `'vi'` for Vietnamese tags, `'zh'` for Chinese tags, `'en'` for everything else.
 */
export function normalizeLanguageTag(tag: string | null | undefined): ResolvedLanguage {
  const norm = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
  if (norm === 'vi' || norm.startsWith('vi-') || norm.startsWith('vi_')) return 'vi';
  if (norm === 'zh' || norm.startsWith('zh-') || norm.startsWith('zh_')) return 'zh';
  return 'en';
}

/** Best-effort detection of browser/OS locale when `language` is `'auto'`. */
export function detectRuntimeLocale(): string {
  const nav = (globalThis as { navigator?: { language?: unknown } }).navigator;
  if (nav && typeof nav.language === 'string' && nav.language.trim() !== '') return nav.language;
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return 'en';
  }
}

/**
 * Resolve a configured `language` value into a concrete language.
 *
 * @param setting - Configured language value (`'vi' | 'en' | 'zh' | 'auto'`).
 * @param hostLocale - Optional host/OS locale hint used when `setting === 'auto'`.
 * @param fallback - Language used when `setting` is missing or invalid.
 * @returns Resolved concrete language.
 */
export function resolvePetLanguage(
  setting: unknown,
  hostLocale?: string | null,
  fallback: ResolvedLanguage = 'zh',
): ResolvedLanguage {
  if (setting === 'vi' || setting === 'en' || setting === 'zh') return setting;
  if (setting === 'auto') return normalizeLanguageTag(hostLocale ?? detectRuntimeLocale());
  return fallback;
}

/** LocalStorage key used by browser clients to avoid a startup flash before /config resolves. */
export const LANGUAGE_STORAGE_KEY = 'dsh-pet:language';

/** Module-level active setting (defaults to 'zh' for unit-test compatibility until client boot initializes it). */
let activeSetting: PetLanguage = 'zh';

function readStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void } | undefined {
  try {
    const ls = (globalThis as { localStorage?: unknown }).localStorage;
    if (
      ls &&
      typeof ls === 'object' &&
      typeof (ls as { getItem?: unknown }).getItem === 'function' &&
      typeof (ls as { setItem?: unknown }).setItem === 'function'
    ) {
      return ls as { getItem(k: string): string | null; setItem(k: string, v: string): void };
    }
  } catch {
    // Storage access can throw in restricted contexts; ignore safely.
  }
  return undefined;
}

/**
 * Read the last persisted client language preference from localStorage, if available and valid.
 *
 * @returns Valid cached {@link PetLanguage}, or `undefined` if absent/unreadable.
 */
export function readCachedLanguage(): PetLanguage | undefined {
  try {
    const raw = readStorage()?.getItem(LANGUAGE_STORAGE_KEY);
    return isPetLanguage(raw) ? raw : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Initialize browser client language synchronously before slots/chrome register.
 * Restores cached preference if available; otherwise starts in `auto` to follow the host locale
 * instead of forcing Chinese before `/config` finishes loading.
 *
 * @param hostLocale - Detected DSH/browser locale tag.
 * @returns Initialized language setting.
 */
export function initClientLanguage(hostLocale?: string): PetLanguage {
  const initial: PetLanguage = readCachedLanguage() ?? 'auto';
  setActiveLanguage(initial, hostLocale);
  return initial;
}
let activeHostLocale: string | undefined;
const languageListeners = new Set<() => void>();

function notifyLanguageListeners(): void {
  for (const listener of [...languageListeners]) {
    try {
      listener();
    } catch {
      // One subscriber failing must not block other UI surfaces from refreshing.
    }
  }
}

/** Current raw language setting (`'vi' | 'en' | 'zh' | 'auto'`). */
export function getLanguageSetting(): PetLanguage {
  return activeSetting;
}

/**
 * Current resolved language (`'vi' | 'en' | 'zh'`).
 *
 * @param override - Optional explicit language override (used by host functions passing config language).
 * @returns Active concrete language.
 */
export function getActiveLanguage(override?: ResolvedLanguage): ResolvedLanguage {
  if (override !== undefined) return override;
  return resolvePetLanguage(activeSetting, activeHostLocale, 'zh');
}

/**
 * Update the active language setting and notify subscribed UI surfaces if anything changed.
 *
 * @param setting - Configured language value.
 * @param hostLocale - Optional host locale hint for `'auto'`.
 */
export function setActiveLanguage(setting: unknown, hostLocale?: string, options?: { persist?: boolean }): void {
  const nextSetting: PetLanguage = isPetLanguage(setting) ? setting : DEFAULT_LANGUAGE;
  if (options?.persist === true) {
    try {
      readStorage()?.setItem(LANGUAGE_STORAGE_KEY, nextSetting);
    } catch {
      // Ignore storage quota/privacy errors.
    }
  }
  const prevResolved = getActiveLanguage();
  const prevSetting = activeSetting;
  activeSetting = nextSetting;
  if (hostLocale !== undefined) activeHostLocale = hostLocale;
  const nextResolved = getActiveLanguage();
  if (prevSetting !== nextSetting || prevResolved !== nextResolved) {
    notifyLanguageListeners();
  }
}

/**
 * Update only the host locale hint used when `language === 'auto'`.
 *
 * @param hostLocale - Current DSH/OS locale tag.
 */
export function setHostLocale(hostLocale: string | undefined): void {
  const prevResolved = getActiveLanguage();
  activeHostLocale = hostLocale;
  if (activeSetting === 'auto' && getActiveLanguage() !== prevResolved) {
    notifyLanguageListeners();
  }
}

/**
 * Subscribe to active language changes (used by React Settings / Sidebar Chat to re-render immediately).
 *
 * @param listener - Callback invoked whenever active language changes.
 * @returns Unsubscribe function.
 */
export function subscribeLanguage(listener: () => void): () => void {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}

/**
 * Replace `{key}` placeholders in a translated template.
 *
 * @param template - Message template.
 * @param params - Optional placeholder values.
 * @returns Interpolated message.
 */
export function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : '',
  );
}
