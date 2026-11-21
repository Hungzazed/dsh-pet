# Инвентарь строк с китайским текстом

> Исторический документ: замер до начала перевода (2026-11-21). Актуальные цифры и прогресс —
> в `docs/english-rework/STATUS.md`.


## Итоги

- literals: 2302
- distinct_literals: 2038
- files: 195
- repeated_literals: 184

## По областям

| Область | Файлов | Строковых литералов | Комментариев |
|---|---|---|---|
| src/host | 74 | 599 | 3677 |
| src/client | 24 | 121 | 3551 |
| src/shared | 31 | 174 | 1890 |
| src/standalone | 27 | 351 | 769 |
| src/app | 2 | 15 | 59 |
| runtime/electron-helper | 14 | 242 | 1414 |
| scripts | 10 | 52 | 190 |
| tools | 11 | 507 | 566 |
| site | 2 | 241 | 11 |

## Топ файлов по литералам

| Строк | Файл |
|---|---|
| 364 | tools/api-tester.html |
| 172 | dsh-pet/runtime/electron-helper/shared-core.js |
| 142 | site/index.html |
| 130 | dsh-pet/src/host/tool-detail/copy.ts |
| 102 | dsh-pet/src/standalone/settings-page/script/globals.ts |
| 99 | site/fetch_metrics.py |
| 45 | dsh-pet/src/standalone/settings-page/script/pet-card.ts |
| 42 | tools/preview.html |
| 38 | dsh-pet/src/host/time-context/context.ts |
| 34 | tools/cordis-probe/lib/client.js |
| 33 | dsh-pet/src/standalone/settings-page/script/ai.ts |
| 31 | dsh-pet/src/host/time-context/entries.ts |
| 30 | dsh-pet/src/host/time-context/constants.ts |
| 29 | dsh-pet/src/host/wmo-code.ts |
| 24 | dsh-pet/runtime/electron-helper/sprite/menu.js |
| 24 | dsh-pet/scripts/check-openapi.mjs |
| 24 | tools/cordis-probe/lib/mock-balance.js |
| 23 | dsh-pet/src/shared/todo/due-picker.ts |
| 22 | dsh-pet/src/host/plugin/chat-memory.ts |
| 22 | dsh-pet/src/client/baifan/constants.ts |
| 21 | dsh-pet/src/standalone/cli.ts |
| 20 | dsh-pet/src/shared/todo/format.ts |
| 17 | dsh-pet/src/client/pet/menu-actions.ts |
| 16 | dsh-pet/src/shared/chat/hear-control.ts |
| 16 | tools/api-tester.cjs |
