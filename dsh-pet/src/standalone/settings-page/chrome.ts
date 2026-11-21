/**
 * 设置页 HTML 外壳：左侧固定分区导航 + 右侧内容区，配置页把桌宠与 AI 两块合并在一处。
 *
 * 页面只在本机回环上由 ./server 提供；CSP 是 `style-src 'self'`，所以这里不许出现内联样式，
 * 也不许内联脚本。桌宠配置面板的内容依赖 GET /config，初始只有一句占位文案。
 * 图标走设置页自己的公开资源路径（/standalone-ai/icon.png），内容读自包内 assets/logo.png，
 * 不复制第二份图；不能用插件路由 /logo——浏览器取 favicon 不带 Origin 也不带令牌，会被判成文件来源而 403。
 * 导航项以 `data-tab` 声明，脚本按约定找 `panel-<tab>`，新增分区只需照此加一对按钮与面板。
 * @module dsh-pet/src/standalone/settings-page/chrome
 */

/** 设置页 HTML。 */
export const settingsPage = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><base href="/"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pet settings</title><link rel="icon" type="image/png" href="/standalone-ai/icon.png"><link rel="stylesheet" href="/standalone-ai/settings.css">
<script src="/standalone-ai/settings.js" defer></script><script src="/standalone-ai/chat-panel.js" defer></script></head><body>
<main class="shell">
<aside class="side">
<div class="brand"><img class="brandLogo" src="/standalone-ai/icon.png" alt=""><span>Pet</span></div>
<nav class="nav" aria-label="Settings sections"><div class="navList" role="tablist">
<button type="button" class="navCell" role="tab" id="tab-chat" data-tab="chat" data-title="Chat" aria-controls="panel-chat" aria-selected="true"><svg class="navGlyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3.4h10a1.1 1.1 0 0 1 1.1 1.1v5.6A1.1 1.1 0 0 1 13 11.2H8.2L5 13.6v-2.4H3a1.1 1.1 0 0 1-1.1-1.1V4.5A1.1 1.1 0 0 1 3 3.4Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg><span class="navLabel">Chat</span></button>
<button type="button" class="navCell" role="tab" id="tab-config" data-tab="config" data-title="Config" aria-controls="panel-config" aria-selected="false"><svg class="navGlyph" viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M2.6 4.6h10.8M2.6 11.4h10.8"/><circle cx="6.2" cy="4.6" r="1.6" fill="currentColor" stroke="none"/><circle cx="9.8" cy="11.4" r="1.6" fill="currentColor" stroke="none"/></g></svg><span class="navLabel">Config</span></button>
</div></nav>
<div class="sideFoot">Standalone mode</div>
</aside>
<div class="main">
<div class="topbar"><h1 class="pageTitle" id="page-title">Chat</h1><span class="dirty" id="dirty" hidden>Unsaved changes</span></div>
<div class="options">
<section class="panel" id="panel-config" role="tabpanel" aria-labelledby="tab-config" hidden>
<div class="scroll">
<div id="pet-cards"><p class="empty">Loading local config…</p></div>
<div class="footer"><p class="status" id="pet-status" role="status" aria-live="polite"></p><button class="btn primary" id="pet-save" type="button" disabled>Save</button></div>
<form id="settings" aria-describedby="privacy">
<div class="card"><div class="cardHead"><h2 class="cardTitle">Model connection</h2></div>
<p class="cardHint">Standalone mode connects to the provider directly, without DSH; all settings stay on this machine.</p>
<div class="field"><span class="fieldLabel" id="service-label">Provider</span><div id="service-host"></div><p class="fieldHint" id="service-note">Picking a provider fills in the protocol and endpoint automatically; the key and model are saved per provider, so switching providers never overwrites another one. Custom providers do not support balance lookup.</p></div>
<div class="field"><span class="fieldLabel" id="protocol-label">Protocol</span><div id="protocol-host"></div></div>
<div class="field"><label for="baseUrl">Endpoint URL (Base URL)</label><input id="baseUrl" name="baseUrl" type="url" placeholder="https://example.com/v1" maxlength="2048" spellcheck="false" aria-describedby="endpoint-note"><p class="fieldHint" id="endpoint-note">Base endpoint URL provided by the provider. HTTP and HTTPS are supported; it usually ends with /v1. Do not put the key in the URL.</p></div>
<div class="field"><label for="model">Model name</label><div class="combo" id="model-combo"><input id="model" name="model" type="text" maxlength="200" placeholder="Enter or fetch a model ID, e.g. deepseek-chat" spellcheck="false" aria-describedby="model-note"><button id="model-toggle" class="comboToggle" type="button" aria-label="Fetch and pick a model" aria-haspopup="listbox" aria-expanded="false"></button></div><p class="fieldHint" id="model-note">Type it directly, or click the arrow on the right to fetch the available models from the endpoint and pick one. Fetching uses only the URL and key entered here and does not save them.</p><p class="status" id="model-result" role="status" aria-live="polite"></p></div>
<div class="field"><label for="apiKey"><span id="key-label">API key</span> <span class="hintInline" id="key-state">Not read yet</span></label><input id="apiKey" name="apiKey" type="password" autocomplete="new-password" maxlength="8192" placeholder="Leave empty to keep the saved key" aria-describedby="key-note"><div class="keyActions" id="key-actions" hidden><button id="key-delete" class="btn ghost" type="button">Delete saved key</button></div><p id="key-note" class="fieldHint">The key is written only to the local config and is never shown back. Leave empty to keep the key saved for this provider; to delete it completely, use the button above.</p></div>
<div class="field"><label for="deepseekApiKey">DeepSeek speech key <span class="hintInline" id="deepseek-key-state">Not read yet</span></label><input id="deepseekApiKey" name="deepseekApiKey" type="password" autocomplete="new-password" maxlength="4096" placeholder="Leave empty to keep the saved key" aria-describedby="deepseek-key-note"><div class="keyActions" id="deepseek-key-actions" hidden><button id="deepseek-key-delete" class="btn ghost" type="button">Delete saved speech key</button></div><p id="deepseek-key-note" class="fieldHint">Used only for DeepSeek speech synthesis and recognition, and stored separately from the chat key above, so DeepSeek speech still works when chats use another provider. Leave empty to reuse the key saved for the DeepSeek official provider, and finally fall back to DSH credentials.</p></div>
<div class="field"><p class="fieldHint" id="balance-note">Balance lookup follows the provider above and uses the key saved for that provider; custom providers do not support balance lookup.</p><div class="testRow"><button id="balance-btn" class="btn ghost" type="button" disabled>Check balance</button><span id="balance-result" class="status" role="status" aria-live="polite"></span></div></div>
<div class="testRow"><button id="test-btn" class="btn" type="button">Test connection</button><span id="test-result" class="status" role="status" aria-live="polite"></span></div>
</div>
<p id="privacy" class="fineprint">All settings and keys stay on this machine only.</p>
<div class="footer"><p class="status" id="status" role="status" aria-live="polite">Loading local settings…</p><button id="save" class="btn primary" type="submit" disabled>Save</button></div>
</form>
</div>
</section>
<section class="panel" id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
<div class="pet-chat-host" id="pet-chat-root"></div>
</section>
</div>
</div>
</main>
<noscript>JavaScript is required to save settings. Open this page from the pet context menu.</noscript>
</body></html>`;
