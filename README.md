# dsh-pet 🐾

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-pet"><img alt="npm version" src="https://img.shields.io/npm/v/dsh-pet?label=npm&color=blue"></a>
  <a href="https://www.npmjs.com/package/dsh-pet"><img alt="npm monthly downloads" src="https://img.shields.io/npm/dm/dsh-pet?label=monthly%20downloads&color=brightgreen"></a>
  <a href="https://www.npmjs.com/package/dsh-pet"><img alt="npm total downloads" src="https://img.shields.io/npm/dt/dsh-pet?label=total%20downloads&color=success"></a>
  <a href="https://github.com/hametovbr/dsh-pet"><img alt="stars" src="https://img.shields.io/github/stars/hametovbr/dsh-pet?style=social"></a>
  <a href="https://github.com/hametovbr/dsh-pet/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/github/license/hametovbr/dsh-pet?color=orange"></a>
  <a href="https://awesome-dsh-plugin.com"><img alt="awesome dsh plugin" src="https://awesome-dsh-plugin.com/badge.svg"></a>
  <img alt="platform" src="https://img.shields.io/badge/platform-DeepSeek%20Harness%20Web-8A2BE2">
  <img alt="assets" src="https://img.shields.io/badge/assets-dynamic%20animations-ff69b4">
</p>

**English-localization fork** of [PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet). The plugin's visible runtime interface is English; the character, artwork, asset pipeline and prompt recipes come from the upstream project and remain its authors' work.

A desktop pet that lives inside [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): idle breathing, random actions (dozing off, solving a Rubik's cube, eating hotpot…), turning left and right, roaming the screen, squishy click reactions, drag-and-throw with bounce and rebound, right-click menu playback — more than a hundred transparent animations that blend seamlessly at any moment. It follows DSH session events to switch its work-status animation, plays a balance animation for the current tier with a speech bubble overhead, mutters to itself and chats with you, and raises a system notification when the window loses focus. Several pets can share one screen, it can leave the browser and live on the **desktop** (a transparent always-on-top window), and you can add **brand-new pet species** (pet packs).

This is not an ordinary plugin but a **complete three-part project**:

```
① Prompt recipes          →  ② Asset pipeline                  →  ③ Plugin
   AI animation recipes        source video → transparent            the pet running inside DSH
                                animation pipeline
```

Anyone who clones this repository can **generate their own desktop pet from scratch** — swap the character, the moves, the style; the whole pipeline is reproducible.

## Localization status

The plugin's visible runtime interface is already English: menus, speech bubbles, tool messages, the settings page, and the default voice (`en-US-AriaNeural`). The comic memes and the animation identifiers keep their original names, because those names are configuration keys and asset file names.

The rest of this repository's documentation is **still Chinese**: [INSTALL.md](INSTALL.md), [FEATURES.md](FEATURES.md), [CONFIG.md](CONFIG.md), [API.md](API.md), [CORDIS.md](CORDIS.md), [CORDIS-API.md](CORDIS-API.md), [MAKE-YOUR-OWN-PET.md](MAKE-YOUR-OWN-PET.md), the OpenAPI spec and the recipes under `prompts/`. This README is the English entry point for now; translating those documents is deferred work, so the Chinese links in the sections below are intentional. The localization process itself and its acceptance evidence are documented in `docs/english-rework/` in Russian — internal fork documents rather than user documentation.

The npm package `dsh-pet@0.4.9` matches upstream, so what npm installs today is the Chinese build. The English localization is currently installed from **this repository** with a source install (see [INSTALL.md](INSTALL.md), still Chinese); publishing the English build to npm is a separate step.

---

## Quick start (install the plugin)

Two ways to install it, pick either:

- **Graphical (inside the desktop app)**: open the Plugins page and type `dsh-pet` into the install box — no terminal needed.
- **Command line**: `dsh plugin --profile <profile> add dsh-pet`, with `<profile>` matching the UI you use — `web` for `dsh web`, `desktop` for the desktop (Electron) app.

> The command above installs from npm, which is the upstream Chinese build. For the English interface, install from this repository's source: clone it, run `npm run build` inside the plugin directory, then `dsh plugin --profile <profile> add file:/path/to/dsh-pet/dsh-pet`; the full walkthrough is in [INSTALL.md](INSTALL.md).

**Don't want DSH?** Standalone mode needs no DSH at all: package the portable Windows x64 bundle from source with `npm run dist` and double-click the `dsh-pet.exe` in `dist-app/win-unpacked/`, or install the CLI globally from npm (`npm install -g dsh-pet`, then run `dsh-pet-standalone`). Both paths are in [INSTALL.md](INSTALL.md) — remember that the npm package is the upstream build, so the English UI comes from the source install described above.

Restart DSH after installing (restart `dsh web` if that is what you use) for it to take effect — a running process keeps the old plugin in memory. The pet lands in the top-right corner of the interface by default.

Prerequisites, the source install, standalone mode usage and packaging, the first Electron download, and what you will see after installing are all covered in **[INSTALL.md](INSTALL.md)** (Chinese for now).

## Plugin features

It only does the desktop pet itself and never touches the DSH kernel; these are all the capabilities it has.

- **100+ animation assets**: idle, walking and roaming, play, work, conversation and every other expression are driven by video animations, chained head-to-tail by weight, and you can swap in your own assets.
- **Multiple pets and species**: raise several at once, each with its own size and position; define custom pet species (pet packs), each species bringing its own set of animations and assets.
- **Three runtime forms**: the browser overlay inside DSH web, the transparent always-on-top window of the DSH desktop app, and a standalone mode that does not need DSH at all.
- **Interaction and physics**: click reactions, drag-and-throw, double-click slingshot, pets colliding with each other — one physics and squash-and-stretch feel for all of them, and the parameters are tunable.
- **Phones and touchscreens**: drag and throw with a finger, sharing the same physics and squash feel as the mouse; in a mobile browser you can also tilt the phone to change the gravity direction, shake it to fling the pet away, and get haptic feedback on collisions — each of the three can be turned off separately under "mobile effects" on the settings page. The sensors only work over HTTPS or localhost (iOS also asks for permission once), and iOS and desktop have no vibration API, so that part is skipped automatically.
- **Muttering and chat**: says something automatically on a timer and you can chat any time; memory persists, images are supported, and replies can be read aloud.
- **Voice (speaking and listening)**: chat replies and manual mutters are spoken; voice, volume and a master switch are configurable; hold the microphone in the chat window to speak a sentence and have the recording transcribed straight into the input box.
- **Balance display**: built-in balance/quota queries for common providers, an animation tier chosen by remaining credit plus a speech bubble; you can also register your own provider.
- **Weather and location**: right-click "Check weather" to look up the current city and conditions once (coarse IP geolocation + Open-Meteo, no key, no setup); the bubble shows temperature, feels-like, humidity, wind speed and a matching weather icon, and this environment also becomes context for the chat.
- **Work-status sync**: switches tier animations following DSH session state and keeps a line of text above its head.
- **Todos**: one sentence plus an optional due time; the list hangs above the pet's head, reminding more often as deadlines approach, and the pet speaks the reminders out loud.
- **Sleep**: right-click "Sleep" to put it to bed, click once or right-click "Wake up" to wake it; while asleep it is completely quiet — random actions, muttering, balance, todos and work status all leave it alone — and it talks in its sleep on a timer; sleep poses can be configured via `animations.sleep` (curled up, lying down, …).
- **System notifications**: a system notification when a task completes or needs confirmation; click it to jump back to the corresponding session.
- **Right-click menu**: switch animations, start a chat, return to the start position, open DSH / the website, reload the configuration.
- **Other**: click sound effects, a system tray icon, and a display position per pet.

Details for every capability are in **[FEATURES.md](FEATURES.md)**; configuration (size / position / multiple pets / physics / model / persona / pet species) is in **[CONFIG.md](CONFIG.md)**.

## 🔌 External API (for other plugins)

The pet does not only play by itself: it **opens two call channels** so other plugins or scripts can drive it and read its state.

- **What it can do**: make it say a given sentence, play a given animation, chat with it; read what it is currently saying, its work status, system notifications and balance, plus its city and the current weather
- **Why it is open**: a desktop pet should not be a mere ornament — a "maid" plugin that has just finished an inspection, for example, can let the pet be its physical voice; and it makes building on top of the pet easy for anyone
- **Channel one · HTTP**: mounted on DSH's own web server (prefix `/dsh-pet-7340`, loopback-only, no authentication), callable across processes and from scripts. Action endpoints reply with `{ok}` only; read data from `GET /state`
- **Channel two · Cordis service**: the client half registers inside the DSH web page, and same-page client plugins get it directly with `ctx.get('petApi7340')` — no network, no port; it is valid only within that page instance, and its methods and returns are in [`CORDIS.md`](CORDIS.md)

The related files (one set for HTTP, one for Cordis):

- [`API.md`](API.md) — HTTP endpoint overview (one line per endpoint, a feature preview)
- [`openapi.yaml`](openapi.yaml) — the full contract (OpenAPI 3.1, imports straight into Swagger UI / Postman)
- [`CORDIS-API.md`](CORDIS-API.md) — Cordis service overview (one line per member, a feature preview)
- [`CORDIS.md`](CORDIS.md) — the exported Cordis service (client half, `ctx.get('petApi7340')` inside the page, no network)
- [`tools/api-tester.html`](tools/api-tester.html) — HTTP-side example: a pet console playing the third-party consumer, easy to try by hand (`node tools/api-tester.cjs` starts it)
- [`tools/cordis-probe`](tools/cordis-probe/README.md) — Cordis-side example: plays a same-page client plugin consuming the service through `ctx.get()`

Those reference documents are **still Chinese** for now (see [Localization status](#localization-status)); the contracts and the `/dsh-pet-7340` prefix are unchanged.

## Compatibility

- **Operating systems**: Windows / Linux / macOS all work — the browser overlay and desktop mode (Electron transparent always-on-top window) behave identically, and Electron is detected or downloaded per platform automatically (`electron.exe` / `Electron.app` / a single Linux binary), with no manual install.
- **Headless / no desktop environment**: Linux headless and other graphical-session-less setups are supported — desktop mode detects the display environment (on Linux, no `DISPLAY` / `WAYLAND_DISPLAY` means no display, so the desktop window is skipped with a log warning), while the browser overlay is unaffected.
- **Browsers**: the browser overlay supports **Chromium-based browsers (Chrome / Edge and others) and Firefox** — transparent animation relies on VP9-Alpha webm and is verified transparent in all three; **Safari is not supported** (macOS does not handle webm alpha and renders the transparency as black) — on macOS use the `.mov` assets (the `assets-mov` release bundle from the upstream project) and drop them in (see section "②.5 Safari/HEVC-compatible assets" in [MAKE-YOUR-OWN-PET.md](MAKE-YOUR-OWN-PET.md)).
- **Multi-monitor**: multi-screen setups are supported — roaming and throwing are bounded by each screen's work area, and heterogeneous scaling (different DPI per screen), taskbar strips and gaps between screens are all detected correctly (landscape / portrait / stacked). "Lock to the current screen" on the settings page keeps the pet (throwing and roaming) on the screen it is currently on.

## Screenshots

What the pet looks like running in the DSH web interface, with the English UI:

<p>
  <img src="docs/english-rework/acceptance/web-overlay.png" width="380" alt="dsh-pet in the DSH web overlay" title="dsh-pet in the DSH web overlay">
  <img src="docs/english-rework/acceptance/web-overlay-submenu.png" width="380" alt="dsh-pet context menu in the web overlay" title="dsh-pet context menu in the web overlay">
  <img src="docs/english-rework/acceptance/settings-chat.png" width="380" alt="dsh-pet settings page: chat" title="dsh-pet settings page: chat">
  <img src="docs/english-rework/acceptance/settings-config.png" width="380" alt="dsh-pet settings page: configuration" title="dsh-pet settings page: configuration">
</p>

## Animation previews

Every animation (640×360, the very assets the plugin plays) — the GIF previews live in `dsh-pet/assets/preview/` in the repository (referenced directly from the repository; the file names are pinyin to stay cross-platform), and the full transparent videos are in the plugin package under `dsh-pet/assets/webm/` (VP9-alpha, the only published format):

**Idle / turn**

<p>
  <img src="dsh-pet/assets/preview/daiji-huxi-xiuxian.gif" width="160" alt="Idle breathing" title="Idle breathing">
  <img src="dsh-pet/assets/preview/dongzhangxiwang.gif" width="160" alt="Looking around" title="Looking around">
</p>

**Movement**

<p>
  <img src="dsh-pet/assets/preview/pangxie-zoulu.gif" width="160" alt="Crab walk" title="Crab walk">
  <img src="dsh-pet/assets/preview/yuandi-piaofu-tabu.gif" width="160" alt="Floating march" title="Floating march">
  <img src="dsh-pet/assets/preview/yuandi-zuozhuan-benpao.gif" width="160" alt="Turn and run" title="Turn and run">
</p>

**Small actions**

<p>
  <img src="dsh-pet/assets/preview/youxian-hengga.gif" width="160" alt="Humming a tune" title="Humming a tune">
  <img src="dsh-pet/assets/preview/chaoda-shenlanyao.gif" width="160" alt="Big stretch" title="Big stretch">
  <img src="dsh-pet/assets/preview/yuandi-qiaoji-zhuomian-hudong.gif" width="160" alt="Desk tapping" title="Desk tapping">
  <img src="dsh-pet/assets/preview/yuandi-zhongli-xiadun-yasuo.gif" width="160" alt="Gravity crouch" title="Gravity crouch">
  <img src="dsh-pet/assets/preview/haqian-liantian.gif" width="160" alt="Big yawn" title="Big yawn">
  <img src="dsh-pet/assets/preview/yuandi-xiaoqi-chenmian.gif" width="160" alt="Nap in place" title="Nap in place">
  <img src="dsh-pet/assets/preview/nvpu-quxi-liyi.gif" width="160" alt="Maid curtsy" title="Maid curtsy">
  <img src="dsh-pet/assets/preview/beixiayitiao-zhamao.gif" width="160" alt="Getting startled" title="Getting startled">
  <img src="dsh-pet/assets/preview/xiaofudu-yuandi-360du-xuanzhuan-zhanshi.gif" width="160" alt="360 spin showcase" title="360 spin showcase">
  <img src="dsh-pet/assets/preview/touchi-lingshi-bei-zhuazhu.gif" width="160" alt="Caught snacking" title="Caught snacking">
  <img src="dsh-pet/assets/preview/yong-jingyu-weiba-paidadi.gif" width="160" alt="Tail slapping floor" title="Tail slapping floor">
  <img src="dsh-pet/assets/preview/da-keshui-bei-jingxing.gif" width="160" alt="Startled awake" title="Startled awake">
  <img src="dsh-pet/assets/preview/zhao-jingzi.gif" width="160" alt="Looking in the mirror" title="Looking in the mirror">
  <img src="dsh-pet/assets/preview/zhengti-huanzhuang-shise.gif" width="160" alt="Outfit try-on" title="Outfit try-on">
  <img src="dsh-pet/assets/preview/qingkuai-jilu.gif" width="160" alt="Quick note-taking" title="Quick note-taking">
  <img src="dsh-pet/assets/preview/xie-daima.gif" width="160" alt="Writing code" title="Writing code">
  <img src="dsh-pet/assets/preview/yaoshan-naliang.gif" width="160" alt="Fanning to cool" title="Fanning to cool">
  <img src="dsh-pet/assets/preview/chenjian-shuaya.gif" width="160" alt="Brushing teeth" title="Brushing teeth">
</p>

**Play**

<p>
  <img src="dsh-pet/assets/preview/yuandi-zhuanxin-wan-mofang.gif" width="160" alt="Rubik cube solving" title="Rubik cube solving">
  <img src="dsh-pet/assets/preview/yuandi-dunxia-wan-wanju-qiche.gif" width="160" alt="Toy car play" title="Toy car play">
  <img src="dsh-pet/assets/preview/jingyu-tu-paopao-texiao.gif" width="160" alt="Bubble-blowing whale" title="Bubble-blowing whale">
  <img src="dsh-pet/assets/preview/yuandi-tiaoyue-zhuasui-touding-wupin.gif" width="160" alt="Jump and grab" title="Jump and grab">
  <img src="dsh-pet/assets/preview/wan-youxi-qijibaituai.gif" width="160" alt="Gamer rage" title="Gamer rage">
  <img src="dsh-pet/assets/preview/wan-shuiqiang.gif" width="160" alt="Water gun fight" title="Water gun fight">
  <img src="dsh-pet/assets/preview/xiaotiqin-yanzou.gif" width="160" alt="Playing violin" title="Playing violin">
  <img src="dsh-pet/assets/preview/lanjing-xianshi.gif" width="160" alt="Blue whale appears" title="Blue whale appears">
  <img src="dsh-pet/assets/preview/youya-nvpuwu.gif" width="160" alt="Elegant maid dance" title="Elegant maid dance">
  <img src="dsh-pet/assets/preview/qingkuai-yaobaiwu.gif" width="160" alt="Bouncy sway dance" title="Bouncy sway dance">
  <img src="dsh-pet/assets/preview/keai-zhaiwu.gif" width="160" alt="Cute otaku dance" title="Cute otaku dance">
  <img src="dsh-pet/assets/preview/chui-qiqiu.gif" width="160" alt="Blowing a balloon" title="Blowing a balloon">
  <img src="dsh-pet/assets/preview/dongwu-huanrao.gif" width="160" alt="Circling animals" title="Circling animals">
  <img src="dsh-pet/assets/preview/fang-fengzheng.gif" width="160" alt="Flying a kite" title="Flying a kite">
  <img src="dsh-pet/assets/preview/chai-liwu.gif" width="160" alt="Opening gifts" title="Opening gifts">
  <img src="dsh-pet/assets/preview/bian-gezi.gif" width="160" alt="Dove transformation" title="Dove transformation">
  <img src="dsh-pet/assets/preview/puke-moshu.gif" width="160" alt="Card trick" title="Card trick">
  <img src="dsh-pet/assets/preview/chou-tuoluo.gif" width="160" alt="Spinning top" title="Spinning top">
  <img src="dsh-pet/assets/preview/chui-dizi.gif" width="160" alt="Playing the flute" title="Playing the flute">
  <img src="dsh-pet/assets/preview/hudie-mifeng-huanrao-touding-kaihua.gif" width="160" alt="Butterfly bloom halo" title="Butterfly bloom halo">
  <img src="dsh-pet/assets/preview/lu-mao.gif" width="160" alt="Petting a cat" title="Petting a cat">
  <img src="dsh-pet/assets/preview/pingkong-shenghua.gif" width="160" alt="Conjuring flowers" title="Conjuring flowers">
  <img src="dsh-pet/assets/preview/qi-muma.gif" width="160" alt="Rocking horse" title="Rocking horse">
  <img src="dsh-pet/assets/preview/sanqiu-paojie.gif" width="160" alt="Juggling balls" title="Juggling balls">
  <img src="dsh-pet/assets/preview/ti-jianzi.gif" width="160" alt="Shuttlecock kicks" title="Shuttlecock kicks">
  <img src="dsh-pet/assets/preview/xiawuziqi.gif" width="160" alt="Gomoku match" title="Gomoku match">
  <img src="dsh-pet/assets/preview/dangqiuqian.gif" width="160" alt="On the swing" title="On the swing">
</p>

**Food**

<p>
  <img src="dsh-pet/assets/preview/chi-baifan.gif" width="160" alt="Eating plain rice" title="Eating plain rice">
  <img src="dsh-pet/assets/preview/dakou-chi-lingshi.gif" width="160" alt="Greedy snacking" title="Greedy snacking">
  <img src="dsh-pet/assets/preview/chi-token.gif" width="160" alt="Eating tokens" title="Eating tokens">
  <img src="dsh-pet/assets/preview/chi-zaocan.gif" width="160" alt="Eating breakfast" title="Eating breakfast">
  <img src="dsh-pet/assets/preview/chi-wucan.gif" width="160" alt="Eating lunch" title="Eating lunch">
  <img src="dsh-pet/assets/preview/chi-wancan.gif" width="160" alt="Eating dinner" title="Eating dinner">
  <img src="dsh-pet/assets/preview/chi-bingqilin-ronghua.gif" width="160" alt="Melting ice cream" title="Melting ice cream">
  <img src="dsh-pet/assets/preview/chi-dazhaxie.gif" width="160" alt="Hairy crab feast" title="Hairy crab feast">
  <img src="dsh-pet/assets/preview/chi-tanghulu.gif" width="160" alt="Candied hawthorn" title="Candied hawthorn">
  <img src="dsh-pet/assets/preview/chi-changshoumian.gif" width="160" alt="Longevity noodles" title="Longevity noodles">
  <img src="dsh-pet/assets/preview/chi-xigua.gif" width="160" alt="Eating watermelon" title="Eating watermelon">
  <img src="dsh-pet/assets/preview/shuan-huoguo.gif" width="160" alt="Hotpot dinner" title="Hotpot dinner">
</p>

**Seasonal**

<p>
  <img src="dsh-pet/assets/preview/beiluoye-yanmo.gif" width="160" alt="Buried in leaves" title="Buried in leaves">
  <img src="dsh-pet/assets/preview/zhongqiu-shangyue-chi-yuebing.gif" width="160" alt="Mid-Autumn mooncake" title="Mid-Autumn mooncake">
  <img src="dsh-pet/assets/preview/duixueren.gif" width="160" alt="Building a snowman" title="Building a snowman">
  <img src="dsh-pet/assets/preview/fang-yanhua.gif" width="160" alt="Fireworks show" title="Fireworks show">
  <img src="dsh-pet/assets/preview/chi-zongzi.gif" width="160" alt="Eating zongzi" title="Eating zongzi">
  <img src="dsh-pet/assets/preview/chi-niangao.gif" width="160" alt="New Year rice cake" title="New Year rice cake">
  <img src="dsh-pet/assets/preview/chi-qingtuan.gif" width="160" alt="Green rice ball" title="Green rice ball">
  <img src="dsh-pet/assets/preview/chi-labazhou.gif" width="160" alt="Laba porridge" title="Laba porridge">
  <img src="dsh-pet/assets/preview/chi-chongyanggao.gif" width="160" alt="Double Ninth cake" title="Double Ninth cake">
  <img src="dsh-pet/assets/preview/shou-hongbao.gif" width="160" alt="Red envelope" title="Red envelope">
  <img src="dsh-pet/assets/preview/xie-fuzi.gif" width="160" alt="Writing blessing" title="Writing blessing">
  <img src="dsh-pet/assets/preview/chuanzhenqiqiao.gif" width="160" alt="Needle threading" title="Needle threading">
  <img src="dsh-pet/assets/preview/wu-shitou.gif" width="160" alt="Lion dance" title="Lion dance">
  <img src="dsh-pet/assets/preview/taotang-nanguadeng.gif" width="160" alt="Pumpkin trick-or-treat" title="Pumpkin trick-or-treat">
  <img src="dsh-pet/assets/preview/cha-zhuyu-shangju.gif" width="160" alt="Chrysanthemum viewing" title="Chrysanthemum viewing">
  <img src="dsh-pet/assets/preview/fanghedeng.gif" width="160" alt="River lantern" title="River lantern">
  <img src="dsh-pet/assets/preview/menghua-xiaoyouling.gif" width="160" alt="Cute little ghost" title="Cute little ghost">
  <img src="dsh-pet/assets/preview/zhuangdian-shengdanshu.gif" width="160" alt="Decorating the tree" title="Decorating the tree">
  <img src="dsh-pet/assets/preview/fang-kongmingdeng.gif" width="160" alt="Sky lantern" title="Sky lantern">
  <img src="dsh-pet/assets/preview/chitangyuan.gif" width="160" alt="Sweet rice balls" title="Sweet rice balls">
  <img src="dsh-pet/assets/preview/chijiaozi.gif" width="160" alt="Eating dumplings" title="Eating dumplings">
</p>

**Text**

<p>
  <img src="dsh-pet/assets/preview/shia-chishenme.gif" width="160" alt="What to eat text" title="What to eat text">
  <img src="dsh-pet/assets/preview/shendu-sikao-suisuinian.gif" width="160" alt="Deep-thought muttering" title="Deep-thought muttering">
</p>

**Click reactions**

<p>
  <img src="dsh-pet/assets/preview/dianji-huiying-kaixin-yuedong.gif" width="160" alt="Happy bounce" title="Happy bounce">
  <img src="dsh-pet/assets/preview/dianji-huiying-haixiu-jingya.gif" width="160" alt="Shy surprise" title="Shy surprise">
  <img src="dsh-pet/assets/preview/dianji-huiying-aojiao-shengqi-ceshen-zhanshi.gif" width="160" alt="Pouty anger" title="Pouty anger">
  <img src="dsh-pet/assets/preview/dianji-huiying-naoyang-gegexiao.gif" width="160" alt="Ticklish giggle" title="Ticklish giggle">
  <img src="dsh-pet/assets/preview/dianji-huiying-yuanqi-huishou.gif" width="160" alt="Energetic wave" title="Energetic wave">
</p>

**Drag**

<p>
  <img src="dsh-pet/assets/preview/beishubiao-tuozhuai-xuankong-fankui.gif" width="160" alt="Dangled by mouse" title="Dangled by mouse">
</p>

**Balance events** (tiers by the percentage of balance used: full → tight → exhausted)

<p>
  <img src="dsh-pet/assets/preview/qian-dai-man-yi.gif" width="160" alt="Overflowing purse" title="Overflowing purse">
  <img src="dsh-pet/assets/preview/jin-dai-ding-dang.gif" width="160" alt="Jingling coins" title="Jingling coins">
  <img src="dsh-pet/assets/preview/qian-dai-ru-chang.gif" width="160" alt="Steady purse" title="Steady purse">
  <img src="dsh-pet/assets/preview/shu-jin-zhou-mei.gif" width="160" alt="Counting coins" title="Counting coins">
  <img src="dsh-pet/assets/preview/dai-kong-ru-xi.gif" width="160" alt="Empty pockets" title="Empty pockets">
  <img src="dsh-pet/assets/preview/fen-wen-bu-sheng.gif" width="160" alt="Flat broke" title="Flat broke">
</p>

**Whisper animations** (triggered by muttering or a chat reply, one picked at random)

<p>
  <img src="dsh-pet/assets/preview/suisuinian-cazhuo-suisuinian.gif" width="160" alt="Wiping and muttering" title="Wiping and muttering">
  <img src="dsh-pet/assets/preview/suisuinian-fadai-suisuinian.gif" width="160" alt="Spaced-out muttering" title="Spaced-out muttering">
  <img src="dsh-pet/assets/preview/suisuinian-duiping-suisuinian.gif" width="160" alt="Muttering at the screen" title="Muttering at the screen">
</p>

**Work-status animations** (following DSH session events, six tiers: thinking / working / tidying / waiting / success / error)

<p>
  <img src="dsh-pet/assets/preview/gongzuozhuangtai-sikao-maopao.gif" width="160" alt="Thinking bubbles" title="Thinking bubbles">
  <img src="dsh-pet/assets/preview/gongzuozhuangtai-manglu-dianan.gif" width="160" alt="Busy clicking" title="Busy clicking">
  <img src="dsh-pet/assets/preview/gongzuozhuangtai-qingdian-guidang.gif" width="160" alt="Filing and sorting" title="Filing and sorting">
  <img src="dsh-pet/assets/preview/gongzuozhuangtai-yuandi-duobu-zhangwang.gif" width="160" alt="Pacing and peeking" title="Pacing and peeking">
  <img src="dsh-pet/assets/preview/gongzuozhuangtai-queyue-qingzhu.gif" width="160" alt="Happy celebration" title="Happy celebration">
  <img src="dsh-pet/assets/preview/gongzuozhuangtai-chuitou-tanqi-maohan.gif" width="160" alt="Sighing and sweating" title="Sighing and sweating">
</p>

**Sleep** (right-click "Sleep" or hover and press `S`; click once while asleep to wake up)

<p>
  <img src="dsh-pet/assets/preview/shuijiao-kaishi.gif" width="160" alt="Falling asleep" title="Falling asleep">
  <img src="dsh-pet/assets/preview/shuijiao-xunhuan.gif" width="160" alt="Sleeping" title="Sleeping">
  <img src="dsh-pet/assets/preview/shuijiao-qilai.gif" width="160" alt="Waking up" title="Waking up">
</p>

> Note: the animations have a transparent background; in the GIF previews the transparent areas show the page background, while the actual webm plays fully transparent.

## Make your own pet from scratch

AI prompts → green-screen video → transparent animation → plugin; change the character, the moves, the style, and the whole pipeline is reproducible.

The complete walkthrough is in **[MAKE-YOUR-OWN-PET.md](MAKE-YOUR-OWN-PET.md)** (prompt recipes, the asset pipeline, Safari compatibility, publishing).

## Project structure

Only the code and release-related directories are listed; for the asset pipeline's video / scripts / step / pr see section ② of [MAKE-YOUR-OWN-PET.md](MAKE-YOUR-OWN-PET.md) (gitignored local directories are not listed):

```
├── README.md  INSTALL.md  FEATURES.md  MAKE-YOUR-OWN-PET.md  CONFIG.md  API.md  CORDIS.md  openapi.yaml   # readme / install / feature guide / pet-making guide / configuration / HTTP API / Cordis service / OpenAPI spec
├── docs/english-rework/ # localization process docs (Russian): status, plan, glossary, acceptance screenshots
├── HANDOFF.md           # cross-session handoff journal (Russian)
├── .agents/skills/      # repository development skills (task guardrails, plugin and commit standards)
├── prompts/             # ① animation prompt recipes (green-screen rules + per-second breakdown)
├── assets/              # legacy upstream screenshots (Chinese UI); the English ones live in docs/english-rework/acceptance/
├── tools/               # developer tools: API debugging page, cordis-probe mock provider, DPI probe
├── .github/workflows/   # CI: Safari/HEVC transcoding pipeline (macOS runner, manual trigger → assets-mov Release)
├── dsh-pet/             # ③ the plugin (independently publishable to npm)
│   ├── src/
│   │   ├── host/        # host half: configuration / routes / balance / work status
│   │   ├── client/      # browser half: pet rendering / animation chain / settings page
│   │   ├── shared/      # pure logic shared by both halves (physics / menu / data fetching)
│   │   └── standalone/  # standalone-mode CLI (runs the pet directly, without DSH)
│   ├── lib/             # build output (generated by npm run build, not committed)
│   ├── runtime/         # desktop-mode runtime shell (Electron transparent window)
│   ├── assets/          # webm animations / preview GIFs / fonts / icons / config.jsonc default configuration
│   └── scripts/         # build, release and development scripts
└── LICENSE              # MIT
```

## Related projects

- **[aipets](https://github.com/kallen-noelle/aipets)** — a Windows 11 desktop pet with five characters, multiple instances, transparent always-on-top, click-through and inertia when flung. Its distinguishing feature is that **the model picks the actions**: after each conversation round the model chooses an action from the time, weather, battery level and affinity, and when nobody is talking it can even schedule almost a whole day; when the model is unavailable it falls back to built-in rules. Chat connects to any OpenAI-compatible endpoint and includes long-term memory, stickers, image generation and tool calls (web search / Home Assistant / MCP), plus read-aloud and voice input. The same code ships both as a single-file `aipets.exe` desktop build and as a full-page stage version in the browser.

## 💬 Feedback and release cadence

[Issues](https://github.com/hametovbr/dsh-pet/issues) and PRs are welcome — bugs and UX problems, any time. **Open an issue first for a new feature** describing the use case, and start on it only after it is agreed; please do not send an implementation PR before that confirmation. This plugin focuses on the desktop pet and DSH itself, so requests that drift too far away usually will not be built. Before starting, also skim the [commit history](https://github.com/hametovbr/dsh-pet/commits/main) to make sure it is not the same problem already fixed (some issues are fixed on `main` but not released yet).

- **Small fixes are not released on their own**: small bugs and optimizations that do not affect usability are **accumulated** into the next version to avoid overly frequent releases. So "fixed on `main`" does not mean "the version you installed already has it" — when `latest` has not moved, the commit history on `main` is the source of truth.
- **Want an unreleased fix right now**: point the plugin at your local clone with the "install from source" path in [INSTALL.md](INSTALL.md); note that changes on the **host half** need a DSH restart to take effect (the browser half only needs a page refresh).
- **When reporting a bug, please include**: the plugin version, the `dsh` version, the operating system, and reproduction steps (logs or screenshots help).

## License

- Code: MIT
- Assets (animations / prompts / source videos): open-source use is permitted; for the exact grant see the character's image license (see "Character license" below)
- **Derivative-work terms**: derivative / modified / reskinned works based on this project must, on public channels such as a GitHub repository or a product website, include the original author's GitHub address: <https://github.com/PC2005-cloud/dsh-pet>
- **Character origin**: the pet is a community fan-art DeepSeek "big fat fish" (whale girl), **not an official DeepSeek character**; the prototype Mingyue comes from Bilibili [@上善无形](https://space.bilibili.com/4456176), and the DeepSeek version (maid whale girl) was designed by Bilibili [@ZipZipPipe](https://space.bilibili.com/4168597)
- **Character license**: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en) (Attribution · NonCommercial · ShareAlike), [original statement](https://www.bilibili.com/opus/1247156596114456581): "The big fat fish is a character released under CC BY-NC-SA 4.0 and must not be commercialized in any form. If you love the character and wish it had a physical form, you are welcome to have one made for yourself."
