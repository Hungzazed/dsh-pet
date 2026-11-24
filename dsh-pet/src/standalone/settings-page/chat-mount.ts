/**
 * 独立模式「对话」分区的浏览器入口：把 DSH 右侧栏那套面板挂到设置页上。
 *
 * 组件、状态与渲染树全部来自 client/chat，这里只补宿主那一侧：react 运行时由本包自己
 * 打包（独立环境没有 DSH 注入），样式走外链 CSS（页面 CSP 是 style-src 'self'，内联 style 会被拦掉）。
 * 平台 UI 原语在独立模式没有，面板按既有分支自行降级。
 * @module dsh-pet/src/standalone/settings-page/chat-mount
 */
import { createElement, useEffect, useRef, useState, type FC } from 'react';
import { createRoot } from 'react-dom/client';
import { jsx } from 'react/jsx-runtime';
import { dicts as chatDicts, zh } from '../../client/chat/locales/index.ts';
import { makePetChatPanel } from '../../client/chat/panel.ts';
import type { ChatPanelRuntime } from '../../client/chat/runtime.ts';
import { ROUTE_PATH } from '../../shared/constants.ts';
import { getActiveLanguage, initClientLanguage, setActiveLanguage } from '../../shared/i18n/core.ts';
import { STANDALONE_LANGUAGE_EVENT } from './locales.ts';
import { createTranslator } from './translate.ts';

/** 设置页里对话面板的挂载点 id，与 chrome.ts 的容器一致。 */
const HOST_ID = 'pet-chat-root';

const translators = {
  zh: createTranslator(zh),
  en: createTranslator(chatDicts.en),
  vi: createTranslator(chatDicts.vi),
};

initClientLanguage(typeof navigator !== 'undefined' ? navigator.language : undefined);

// Listen for live language changes from settings.js so the Chat tab switches immediately without reload.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener(STANDALONE_LANGUAGE_EVENT, (event: Event) => {
    const detail = (event as CustomEvent<{ language?: unknown }>).detail;
    if (detail && 'language' in detail) {
      setActiveLanguage(detail.language, undefined, { persist: true });
    }
  });
}

void fetch(ROUTE_PATH + '/config', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .then((body: { ok?: unknown; main?: { language?: unknown } } | null) => {
    if (!body || body.ok === false || !body.main || !('language' in body.main)) return;
    setActiveLanguage(body.main.language, undefined, { persist: true });
  })
  .catch(() => undefined);

const runtime: ChatPanelRuntime = {
  h: jsx as ChatPanelRuntime['h'],
  useState,
  useEffect,
  useRef,
  t: (key, params) => translators[getActiveLanguage()](key, params),
};

const host = document.getElementById(HOST_ID);
if (host !== null) {
  const Panel = makePetChatPanel(runtime) as unknown as FC;
  createRoot(host).render(createElement(Panel));
}
