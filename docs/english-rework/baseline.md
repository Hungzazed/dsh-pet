# Базовая линия dsh-pet перед переработкой на английский

> Исторический документ: снимок до начала перевода (2026-11-21). Текущий статус —
> `docs/english-rework/STATUS.md`.


Дата: 2026-11-21. Ветка: `english-rework` (создана от `main`).

- Коммит: `fb38ce6` — идентичен upstream `PC2005-cloud/dsh-pet` (0/0 расхождений).
- Версия плагина: 0.4.9.
- Окружение: Node v24.19.0, pnpm 11.19.0, npm 11.17.0, Linux.

## Установка зависимостей

Глобальный pnpm store (`~/.local/share/pnpm`) недоступен на запись из песочницы, поэтому store и кэш
вынесены в корень workspace, за пределы каталога пакета (так их не видит `prettier --check .`):

```
cd dsh-pet
pnpm install --frozen-lockfile \
  --store-dir ../.npm-cache/pnpm-store \
  --cache-dir ../.npm-cache/pnpm-cache
```

Каталог `.npm-cache/` уже в `.gitignore`, отслеживаемые файлы не менялись.

## Результаты гейтов (все зелёные)

| Гейт | Результат | Детали |
|---|---|---|
| `npm run typecheck` | 0 | `tsc --noEmit` + `tsc -p tsconfig.test.json` |
| `npm run lint` | 0 | eslint по всему пакету |
| `npm run format:check` | 0 | prettier; зелёный только после выноса store из пакета |
| `npm run check:cycles` | 0 | 646 модулей, 1184 runtime-ребра, циклов нет |
| `npm run check:runtime` | 0 | eslint по `runtime/electron-helper` (no-undef) |
| `npm run check:openapi` | 0 | 46 путей / 56 операций, совпадение с реализацией маршрутов |
| `npm test` | 0 | 2746 тестов, 594 набора, 0 падений, ~396 с |
| `npm run build` | 0 | tsdown (5 входов) + `shared-core.js` + `lib/types` |
| `node scripts/prepack-check.js` | 0 | 27 мемов = 27 ключей конфига, пакет 79.5 МБ |

Смоук-тест артефакта: `node lib/standalone.js --help` — код 0, печатает справку (на китайском).

## Инвентарь переводимых строк

Подсчёт строковых литералов с китайским текстом, без комментариев, тестов и словарей локалей:

- всего: 2302 литерала, из них 2038 уникальных, в 195 файлах;
- плагин (host + client + shared + standalone + app + собственный код runtime): 1330;
- инструментарий и сайт (tools + site + scripts): 800.

По областям плагина: host 599, standalone 351, shared 174, client 121, runtime (свой код) 70, app 15.

Важно: `runtime/electron-helper/shared-core.js` — сгенерированный артефакт (172 литерала),
его нельзя править руками; источник — `src/shared`, пересборка через `npm run build:desktop-core`.

## Ограничения и замечания

- `format:check` проходит только при store вне каталога пакета: prettier обходит `.` и иначе
  проверяет файлы pnpm-store.
- В дереве остаётся неотслеживаемый `.cgcignore` (создан CodeGraphContext).
- Полный прогон тестов ~6.6 мин, сборка ~2 мин — учитывать при итерациях.
- CGC-метрика циклических зависимостей (353) недостоверна; авторитетный источник — `check:cycles`.
