# Глоссарий перевода dsh-pet

> Канонический файл — `docs/english-rework/glossary.md`; рабочая копия лежит в
> `.npm-cache/reports/glossary.md`. Обязателен для каждого субагента.


Канонические английские термины. Отклонения запрещены: один термин на понятие во всём репозитории.
Слева — английский канон, в скобках — русское пояснение для переводчика.

## Продукт и персонаж

- **pet** (питомец) — не «animal», не «creature», не «mascot».
- **pet pack** (набор/вид питомца) — не «pet type», не «breed».
- **whisper** (короткая реплика по таймеру) — не «murmur», не «chatter», не «mutter», не «babble».
- **bubble** (облачко с текстом рядом с питомцем) — не «popup», не «tooltip», не «toast».
- **meme** (картинка-реакция) — не «sticker», не «emoji», не «picture».
- **animation**, **animation pool** (анимация, пул анимаций) — не «clip», не «video».
- **playback** (воспроизведение анимации) — не «playing», не «replay».
- **pose** (поза/координата питомца) — не «position» (position — только координаты окна).
- **drag**, **throw** (перетаскивание, бросок) — не «swipe».
- **sleep / wake** (сон и пробуждение питомца).

## Функции

- **balance** (баланс средств) — не «wallet», не «funds», не «credits».
- **work status** (статус работы агента) — не «job state», не «progress status».
- **todo** (задача в списке дел), **todo list** — не «task», не «reminder» (reminder — только напоминание).
- **voice** (озвучка/голос), **speech** (синтез речи), **hear** (распознавание речи).
- **memory**, **recall** (память, выборка из памяти), **provider** (провайдер).
- **notification** (системное уведомление) — не «alert», не «popup».
- **settings page** (страница настроек), **config** (конфигурация).
- **menu** (контекстное меню), **menu item** (пункт меню).

## Архитектура

- **host half**, **client half** (хостовая и браузерная половины плагина) — не «backend/frontend».
- **standalone mode** (независимый режим без DSH) — не «desktop mode» (это окно рабочего стола).
- **desktop window** (прозрачное окно рабочего стола) — не «desktop app».
- **desktop helper** (Electron-оболочка).
- **session** (сессия агента), **turn** (ход диалога), **tool call** (вызов инструмента).
- **route** (HTTP-маршрут), **endpoint** (конечная точка) — не «handler» (handler — обработчик).
- **route path** (путь маршрута), **asset** (медиафайл), **bundle** (сборка бандла).

## Запрещено переводить

- Имена идентификаторов, типов, полей и ключей конфигурации.
- Пути, имена файлов, CSS-классы, id, имена npm-пакетов.
- Бренды: DeepSeek, DSH, DeepSeek Harness, Cordis, Electron.
- Протокольные маркеры и служебные префиксы в истории диалога.
- Плейсхолдеры шаблонов: `{target}`, `{n}`, `{name}`, `{id}` и подобные.
- Теги JSDoc и их значения: `@param`, `@returns`, `@throws`, `@module dsh-pet/src/...`.

## Стиль

- Комментарии: по смыслу, не пословно; без сокращения фактов; без добавления новых утверждений.
- Интерфейс: повелительное наклонение для действий («Add pet»), без «Please».
- Ошибки: что случилось и что делать; без извинений и без «oops».
- Заголовки документации: без эмодзи, кроме уже существующих.

## Дополнения волны 1 (решения координатора, 2026-11-21)

Канон для строк, которые курс переводит в волне 1. Один термин на понятие.

- **timestamp prefix** — префикс времени в истории диалога, канонический формат `[MM-DD HH:mm]`
  (например `[10-31 22:53]`); в тексте промпта писать именно такому формату и не называть его
  «reply format».
- **name line** — строка объявления имени в system-промпте: `Your name is "<name>".`
- **persona prompt** — `whisperPrompt`: персонаж остаётся (chibi, blue-haired maid, playful,
  short lines); переводится только язык.
- **whisper** — короткая реплика по таймеру; **sleep talk** — реплика во сне;
  **chat** — диалог; **memory query rewrite** — переписывание пользовательской фразы в поисковый
  запрос памяти.
- **work status stages** — фиксированные имена стадий, не переводить иначе:
  `thinking`, `working`, `result`, `waiting`, `success`, `error`.
- **todo** — задача в списке дел; **due date** — срок; **no due date** — «No due date»;
  **overdue** — «Overdue by …»; **remaining** — «… left»; **done** — «Done».
- **относительные сроки**: `Today HH:mm`, `Tomorrow HH:mm`, `In N days HH:mm`, `Mon D HH:mm`.
- **единицы**: `min`, `h`, `d` (коротко, как в панели), без «minutes» в тесных подписях.
- **menu label map** — карта английских подписей меню (D3): английская подпись по китайскому
  имени анимации/мема/категории; исходные имена не переименовываются.
- **failure reasons** (коды не переводить): `provider-missing`, `generate-error`.
  Человеческие сообщения: `The current chat has no model configured`,
  `The LLM service is unavailable`.

## Дополнения после батча 1 волны 1 (2026-11-21)

- **hotkey hint**: `D key`, `L key`, `S key` (одна латинская буква + слово `key`), не «буква + китайский иероглиф ключа».
- **инструкция с мемом в чате**: заголовок `[Meme]`; протокольные маркеры данных
  (вида `[<китайское слово>:...]` для изображения и действия) не переводятся (D7) и остаются дословно внутри английского текста.
- **сроки в панели**: `No due date`, `Today HH:mm`, `Tomorrow HH:mm`, `In N days HH:mm`,
  полный будний день `Monday 08:00`, дальняя дата `Nov 8 08:00`; `N min`, `N h`, `N d`;
  `… left` и `Overdue by …`; `Done` и `Done · …`.
- **месяц в календаре**: полное имя + год `October 2026`; aria-ячейка `November 8`.
- **шрифт**: в font-family остаётся латинский алиас `YouYuan`; иероглифические алиасы того же шрифта
  удаляются во всех копиях стека (todo, fonts, tooltip, score-popup, chat/styles, client/bubble,
  runtime/electron-helper/index.html).
- **имя персонажа по умолчанию**: `Blue-Haired Maid`.
- **лимит реплики**: «одна короткая фраза» (`one short sentence`), в английском проверяется
  словами (`under 20 words`), а не числом иероглифов.

## Дополнения после батча 2 волны 1 (2026-11-21)

- **меню**: корень `Actions`; группы `Idle`, `Turn`, `Drag`, `Click reactions`, `Move`,
  `Display position`, `More`; события `Balance levels`, `Whispers`, `Work status`;
  мемы `Memes` / `Memes in chat` / `Other`.
- **подписи анимаций/мемов/категорий** живут только в `src/shared/menu/labels.ts`; ключи там
  китайские (D3), значения английские; неизвестное имя падает в исходное (fallback).
- **имена полей остаются китайскими**: `anim`, `image`, `action` — это ключи ассетов/конфига;
  переводится только `label`.
- **уведомления**: `Chat finished`, `Generation failed`, `Output truncated`,
  `Output token limit reached`, `Permission requested`, `Tool "<name>"`,
  `The model is waiting for your answer`.
- **баланс**: `This provider does not support balance lookup yet`, `Current provider: …`,
  `Missing balance lookup credentials`, `Balance lookup failed`, `Balance <amount>`,
  `Peak`/`Off-peak`, `Weekly`/`Monthly`, `<label> quota used N%`, `Reset time unknown`,
  `Already reset`, `resets in N d/h`, `N in`, `N out`, `N requests this period`,
  `Points data unavailable`.
- **мини-игра**: подпись `Rice time`; сцены — английские реплики, число строк в массивах
  неизменно.
- **failure-тексты**: `Generation was cancelled`, `Output limit reached before any text was
  produced`, `The model returned no text`, `No failure reason was provided`,
  `The current chat has no model configured; whispers are unavailable`,
  `Whisper generation failed`.
- **базовый счётчик тестов сдвинулся** из-за `labels.test.ts`: глобально +8 тестов / +4 набора
  (ориентир к волне 3: 2754 / 598 вместо 2746 / 594; проверить полным прогоном).

## Дополнения после батча 3 волны 1 (2026-11-21)

- **погода**: формулировки WMO/Open-Meteo — `Clear`, `Mostly clear`, `Partly cloudy`, `Overcast`,
  `Fog`, `Depositing rime fog`, `Light drizzle`, `Drizzle`, `Dense drizzle`, `Light freezing
  drizzle`, `Dense freezing drizzle`, `Slight rain`, `Moderate rain`, `Heavy rain`, `Light freezing
  rain`, `Heavy freezing rain`, `Slight snow`, `Moderate snow`, `Heavy snow`, `Snow grains`,
  `Slight rain showers`, `Moderate rain showers`, `Violent rain showers`, `Slight snow showers`,
  `Heavy snow showers`, `Thunderstorm`, `Thunderstorm with slight hail`, `Thunderstorm with heavy
  hail`; fallback `Unknown weather`. Таблицу кодов не менять.
- **служебные китайские данные**: китайские суффиксы админ-единиц в геокодинге — это lookup-данные,
  не пользовательский текст; в исходнике записываются `\u`-escape, поведение побайтно прежнее.
- **реплики инструментов** (`host/tool-detail/copy.ts`): лёгкий разговорный голос питомца, каждая
  фраза с объектом; бюджет пузыря — цель ≤20 code points, без цели ≤40; плейсхолдеры `{target}`
  и `{cmd}` дословно в тех же фразах; по 3 фразы на инструмент + короткая fallback-фраза.
- **меню карточки питомца**: `Balance`, `Weather`, `Todos`, `Whisper`, `Chat`, `Sleep`, `Wake up`,
  `Reset position`, `Display position` — согласовано с подписями `shared/menu`.
- **локали**: `zh.ts` и `ja.ts` целиком разрешены сканером (i18n вне области); комментарии в
  остальных локалях (de/es/fr/pt/ru/en) переводит волна 2, как и CJK-пунктуацию в английских
  строках `settings/locales/en.ts`.

## Дополнения после батча 4 волны 1 (2026-11-21)

- **периоды суток** (9, границы 0–4/5–6/7–8/9–10/11–12/13–16/17–18/19–22/23):
  `late night`, `dawn`, `early morning`, `mid-morning`, `noon`, `afternoon`, `early evening`,
  `evening`, `deep night`.
- **метка времени в истории диалога**: `historyStampOf` возвращает `YYYY-MM-DD HH:mm` (24 ч, год
  всегда), вызывающий код оборачивает в `[ ]`; в `persona.ts` формат описан как
  `[YYYY-MM-DD HH:mm]`.
- **строка времени в промпте**: `It is HH:mm on Weekday, Month D, YYYY (slot), a weekday/weekend.`
  Маркер начала — `[Now]`; конструкции праздников/сезонов: `X is tomorrow`,
  `X is coming up soon`, `Today is <spoken|name>`, `It is still the <Name> holiday`,
  `Today is the last day of the <Name> holiday`, `The <Name> holiday has just ended`,
  `X has just passed`, `X has started`, `X is almost over`, `It is <season> right now`.
- **праздники**: стандартные английские названия (Spring Festival, Lantern Festival, Qingming
  Festival, Dragon Boat Festival, Mid-Autumn Festival, National Day, New Year's Day, Christmas,
  summer/winter vacation и т.д.); порядок, ключи, окна и лунные вычисления не меняются.
- **время в панели чата** задаётся словарями локалей (`client/chat/locales/*`, i18n вне области):
  `stampYesterday`, `stampMonthDay`, `stampFullDate`; литерала в `stamp.ts` нет, канон
  «Today HH:mm» к чату не применяется (это правило панели задач).
- **шрифт**: единственное оставшееся китайское имя в font-family удалено (todo-панель сделала это
  раньше, теперь и `client/bubble.ts`); путь к файлу шрифта сохранён `\u`-escape.
- **данные окружения**: названия места/погоды приходят из сети (IP-геокодинг) и могут быть
  китайскими — это данные, не литералы; вопрос локализации источника вынесен в план.

## Дополнения после батча 5 волны 1 (2026-11-21)

- **ошибки маршрутов**: `Missing ...`, `Invalid ...`, `Unknown ...`, `... is required`,
  `... is not supported`, `Failed to write avatar`, `Generation failed`, `No fields to update`;
  без «oops/please»; HTTP-статусы, `reason`/`code` и ключи JSON не меняются.
- **канонические отказы host** (использовать дословно в остальных пакетах):
  `No such pet: <id>`, `The pet is sleeping; wake it up first`,
  `pet is required: specify which pet to act on`,
  `Message is too long (max 2000 characters)`, `Meme is not in the pool: <name>`,
  причина остановки `'tray quit'`.
- **голоса**: display names латиницей — `Xiaoxiao`, `Xiaoyi`, `Yunxi`, `Yunjian`, `Aria`, `Guy`;
  теги `Female · General`, `Female · Lively`, `Male · Young`, `Male · Calm`, `Male · General`;
  id остаются `zh-CN-...`/`en-US-...`; голос по умолчанию `en-US-AriaNeural`
  (`DEFAULT_VOICE` = единственный `default: true`), в конфиге `voiceName: "edge/en-US-AriaNeural"`.
- **DeepSeek-голоса**: display names `Stella` (женский) и `Tide` (мужской), id `stella`/`tide`
  не меняются.

## Дополнения после батча 6 волны 1 (2026-11-21)

- **память**: провайдер по умолчанию `Built-in memory`; блок доказательств в промпте:
  `Here is relevant information retrieved from long-term memory; if it conflicts with what the
  user says this time, follow the user:`, секции `[Topic memory]` / `[Atomic memory]`,
  запись раунда `User: …` / `Pet: …`; маркеры истории D7 не трогать.
- **чат (общие модули)**: `Say something…`, `Attach image`, `Screenshot`, `Hold to talk`,
  `Remove image`, `Only PNG / JPEG / WebP / GIF are supported`, `Screenshot is not supported in
  this environment; try uploading instead`, `The audio did not pass the host validation`,
  `Transcribing…`, `Recording 0:05 · release to stop`; hotkey-подсказки `M key` / `L key` / `S key`.
- **напоминания задач**: `"<label>" is due in …`, `"<label>" is due now, remember to handle it`,
  `"<label>" is overdue by …, remember to handle it`; единицы `min`/`h`/`d`.
- **standalone CLI**: баннер `dsh-pet standalone mode (no DSH required)`; справка с `--port`,
  `--check`, `-h, --help`; ошибки аргументов императивные; сервер: `Only GET is supported`,
  `Use POST to shut down`, `The local server cannot handle the request right now`,
  `Standalone server listening on …`; AI: `Connection successful!`, `Enter the endpoint URL
  (Base URL) first`, `Enter the API key first`.
- **страница настроек**: `Model connection`, `Provider`, `Endpoint URL (Base URL)`,
  `Model name`, `API key`, `DeepSeek speech key`, `Check balance`, `Test connection`, `Save`,
  `Unsaved changes`, `Default entry`, `Entry notes`, `Upload avatar`, `Avatar updated`,
  позиции `Top-left/Top-right/Bottom-left/Bottom-right`, режимы `Browser only/Desktop only/
  Both/Neither`; (историческая запись) `lang="zh-CN"` в chrome.ts оставался до синхронизации
  с чат-панелью — снято решением D8 (см. дополнения батча 8: `lang="en"` и словарь `en`).

## Дополнения после батча 7 волны 1 (2026-11-21)

- **страница настроек, часть 2**: `Global switches`, `Environment and location`,
  `Voice`, `Manual playback`, `Volume`, `Speak scheduled whispers / todo reminders / notifications`,
  `Appearance and font`, `Drag and throw feel` (`Gravity`, `Wall bounce`, `Ground friction`,
  `Throw power`, `Ceiling bounce`, `Pet collisions`, `Spring follow`), `Animation frequency`,
  `Chat context`, `Long-term memory` (`PowerContext endpoint`, `Access token`), `Storage
  locations`, `Select pet`, `Add/Delete`, `Display name`, `ID`, `Frame size (px)`,
  `Screen width (%)`, `Corner`, `Horizontal/Vertical margin`, `Stay still`,
  `Persona for this pet (optional)`, `Saved · not shown`, `Not set`, `Sunny`/`Cloudy`-подобные
  значения погоды приходят с сервера как есть.
- **приложение локального сервера**: `Local server listening on …`, `Pets`, `Config file`,
  `AI settings`, `Status`, `(no pets found; check the config file)`; `lang="en"`.
- **меню окна рабочего стола**: `Open`, `Open AI settings`, `Open website`, `Quit`,
  `Reload config`, `Reset position`, `Display position`; трей-тултип `dsh-pet desktop pet`.
- **runtime-диагностика**: `[dsh-pet-desktop-helper]` префиксы сохраняются; сообщения
  playback/sleep/work-status выровнены по браузерному канону.
- **шрифт**: в `runtime/electron-helper/index.html` и `renderer.js` иероглифические алиасы
  удалены (путь к файлу шрифта — `\u`-escape), латинский `YouYuan` сохранён.

## Дополнения батча 8 видимой волны (2026-11-22)

- **host-валидация и команды**: `pet is required: specify which pet to act on`,
  `No such pet: <id>`, `No such animation: <name>`, `url must be a full http/https URL`,
  `Only one of name and url can be given`, `Either name or url is required`,
  `target must be web / desktop / both (omitted = both)`,
  `owner must be a string of 1–<N> characters (no control characters)`,
  `At most <N> items per owner`, `x must be a finite number`,
  `duration in line mode must be a finite number >= 0 (milliseconds)`,
  `surface is required: web / desktop / both / any`,
  `attachment.data must be a non-empty base64 string`,
  `attachment.data is not valid base64`, `attachment.data is too long (compress it or lower the
  resolution)`.
- **канон «только одно из двух»**: `Only one of X and Y can be given` /
  `Either X or Y is required` — единая форма для взаимоисключающих параметров.
- **lock**: `This pet is currently locked; pass lock=<lockId>`, `This pet is already locked`,
  причины `The lock expired (it was not renewed in time)`, `The lock has been released`,
  `The user took over (drag / click / hide / close)`, `lock is not the currently active lock id`.
- **конфиг**: предупреждения `Invalid <field> in <label>; using the default`,
  `Missing or empty pets in <label>; using the default pet list`,
  `Invalid, duplicate, or already used pet id "<id>" in <label>; skipping this instance`,
  `Pet "<id>" has no name; using the id instead`, плейсхолдер `(empty)`; миграция
  `User config migrated to JSONC: <old> → <new>`.
- **helper рабочего стола**: `Downloading Electron <version>`, `Download complete (<s>s),
  extracting`, `Electron ready (<s>s), starting the pet`, `Electron download failed: <reason>`;
  расшифровки exit code: `access violation`, `breakpoint (sandbox init failed)`,
  `missing DLL`, `DLL initialization failed`; подсказки при краш-лупе императивные.
- **баланс**: `Balance lookup timed out (20 s); try again later`, `Missing credential <ref>`,
  `Missing account service (<provider>)`, `dsh-pet: invalid balance data field <what>`,
  ответы провайдеров `…response is missing <field>`.
- **погода/окружение**: `Weather`, `Weather is unavailable right now`, `Feels like`,
  `Humidity`, `Wind`, `Observed <time>`; служебные китайские суффиксы геокодинга остаются
  `\u`-escape (это данные, не литералы).
- **распознавание/мини-игра**: `Speech recognition response is not JSON`,
  `Speed <n> · Size <n>`.
- **подсказки клавиш (канон)**: `<значение> key` — `D key`, `L key`, `S key`, `Z key`,
  `1 key`…`4 key`; форма `Key <значение>` не используется.
- **страница настроек standalone (D8)**: страница выбирает английский словарь чат-панели и
  объявляет `lang="en"`; словари `zh.ts`/`ja.ts` и остальной i18n-слой не трогаются. В
  веб-панели DSH язык чат-панели следует локали хоста — это штатное поведение i18n.
