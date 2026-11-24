/**
 * Plugin-level locale binding wrapper that honors `dsh-pet`'s configured `language` setting
 * (`vi` / `en` / `zh`) even when DSH host itself runs in another language (or lacks a `vi` UI locale),
 * while delegating directly to DSH's `ctx.locale.bind(...)` when configured as `auto`.
 * @module dsh-pet/src/client/i18n-bind
 */
import { formatMessage, getLanguageSetting, type ResolvedLanguage } from '../shared/i18n/core.ts';

/** Minimal shape of DSH's injected locale service used for host locale probing. */
export interface HostLocaleLike {
  readonly current?: unknown;
  readonly language?: unknown;
  readonly lang?: unknown;
  readonly locale?: unknown;
  getLocale?: () => unknown;
}

/**
 * Best-effort probe of the host's active locale tag (for `language: "auto"`).
 *
 * @param localeService - Optional `ctx.locale` service from DSH.
 * @returns BCP-47 locale tag if detectable, otherwise `undefined`.
 */
export function detectHostLocale(localeService?: HostLocaleLike | null): string | undefined {
  if (localeService && typeof localeService === 'object') {
    for (const candidate of [
      typeof localeService.getLocale === 'function' ? localeService.getLocale() : undefined,
      localeService.current,
      localeService.language,
      localeService.lang,
      localeService.locale,
    ]) {
      if (typeof candidate === 'string' && candidate.trim() !== '') return candidate.trim();
    }
  }
  const docLang = (globalThis as { document?: { documentElement?: { lang?: unknown } } }).document?.documentElement
    ?.lang;
  if (typeof docLang === 'string' && docLang.trim() !== '') return docLang.trim();
  const navLang = (globalThis as { navigator?: { language?: unknown } }).navigator?.language;
  if (typeof navLang === 'string' && navLang.trim() !== '') return navLang.trim();
  return undefined;
}

/**
 * Wrap DSH's `ctx.locale.bind(ns)` translator with `dsh-pet`'s explicit language override.
 *
 * When `getLanguageSetting()` is `'auto'`, calls `dshTranslate` verbatim so all DSH host languages
 * (including ja/es/fr/de/ru/pt) work seamlessly. When `'vi' | 'en' | 'zh'`, translates directly from
 * `dicts[setting]` with `{param}` interpolation, falling back to `dicts.en` then `dshTranslate`.
 *
 * @param dshTranslate - Translator returned by `ctx.locale.bind(ns)`.
 * @param dicts - Plugin dictionaries containing at least `zh`, `en`, `vi`.
 * @returns Reactive translator respecting `setActiveLanguage(...)`.
 */
export function bindPluginLocale(
  dshTranslate: (key: string, params?: Record<string, unknown>) => string,
  dicts: Readonly<Record<ResolvedLanguage, Readonly<Record<string, string>>>>,
): (key: string, params?: Record<string, unknown>) => string {
  return (key, params) => {
    const setting = getLanguageSetting();
    if (setting === 'auto') return dshTranslate(key, params);
    const dict = dicts[setting] ?? dicts.en;
    const raw = dict[key] ?? dicts.en[key];
    if (typeof raw !== 'string') return dshTranslate(key, params);
    if (!params) return raw;
    const normalized: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === 'string' || typeof v === 'number') normalized[k] = v;
      else if (v !== undefined && v !== null) normalized[k] = String(v);
    }
    return formatMessage(raw, normalized);
  };
}
