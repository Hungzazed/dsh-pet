---
name: dsh-plugin-standards
description: "Code standards for writing, modifying, or reviewing DSH plugins: unified plugin types, package manifest, directories and files, naming, types and interfaces, configuration and state, testing and release practices."
whenToUse: "Use when creating a new DSH plugin package, writing or modifying host/client plugin code, splitting files or adding interfaces, adding tests, or self-checking before a release."
metadata:
  language: "en"
  category: "development"
disable-model-invocation: false
user-invocable: true
---

# DSH Plugin Code Standards

## Goal

Make DSH plugins structurally consistent, predictable at their interfaces, and split-friendly for maintenance. The standards answer one question only: **how should this code be written so the next person taking it over does not curse you out.**

Applies to: the host half (host), the browser half (client), tools, projections, bundles, standalone and desktop carriers. Does not apply to the internals of third-party libraries.

## 1. Decide the plugin type first

Before writing the first line of code, confirm which category this is; the type determines the entry point, manifest fields, and lifecycle.

| Type | Traits | Entry point |
|---|---|---|
| A Functional host | Registers services/listeners/routes only | Named exports `name`/`inject`/`Config`/`apply` |
| B Service host | Provides one Cordis service to the outside | `class X extends Service` + `static Config` + `super(ctx, 'name')` |
| C Tool | Registers a tool for the model | `ctx.tools.register(defineTool({...}))` |
| D Projection | Folds state from session events | `ctx.sessionProjections.register({...})` |
| E Client UI | Has browser rendering | empty `apply()` on the host side + `lib/client.js` + `dsh.client` |
| F Bundle | Only composes other plugins | `lib/index.js` + `cordis.patch.yml` + `dsh.bundle.patch` |
| G Pure re-export | Exports types or forwards calls only | re-export only, no logic |
| H Metadata | Only locale/icon | `locale/*.json` + `icon` |

Decision order: has UI → E; composes only → F; used by the model → C; maintains derived state → D; exposes a service → B; everything else → A.

## 2. Package manifest

Fixed `package.json` fields:

```jsonc
{
  "name": "@scope/dsh-<domain>-<role>",
  "description": "One line, shown in the marketplace",
  "version": "0.2.1-rc.2",              // exactly aligned with the DSH of the same release, no ^
  "publishConfig": { "access": "public" },
  "repository": { "type": "git", "url": "…", "directory": "packages/<group>/<package>" },
  "type": "module",
  "main": "lib/index.js",
  "types": "lib/types/index.d.ts",
  "exports": { … },
  "files": [ … ],
  "license": "MIT"
}
```

Five fixed `exports` entries:

```jsonc
".":               { "types": "./lib/types/index.d.ts", "default": "./lib/index.js" },
"./client":        { "types": "./lib/types/client/index.d.ts", "default": "./lib/client.js" },
"./src/*":         "./src/*",
"./package.json":  "./package.json",
"./locale/*.json": "./locale/*.json"
```

- `./client` is only for type E, and `lib/client.js` and `lib/types/client/index.d.ts` must both exist.
- `./cordis.patch.yml` is only for type F.
- `files` ships runtime artifacts and metadata only: `lib/index.js`, `lib/types/**/*.d.ts`, `locale/*.json`; type E adds `lib/client.js`; type F adds `cordis.patch.yml`, `icon.svg`.

Dependencies in three buckets:

| Location | What goes there | Version |
|---|---|---|
| `dependencies` | Packages actually imported at runtime and not provided by the host | exact |
| `peerDependencies` | Packages the host provides that must not be bundled; usually only `@deepseek-ai/cordis` | exact or `~` |
| `devDependencies` | Everything else: peer packages, typings, test libraries, react | exact match with the release |

Every package listed in `dsh.client.inject` must also appear in `devDependencies`, otherwise you get no types.

`dsh` field:

```jsonc
// type E
"dsh": { "client": { "inject": ["@deepseek-ai/dsh-client-locale"], "platform": "web" } }
// type F
"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
// when a compatibility declaration is needed
"dsh": { "compatibility": { "dshReleases": { "0.2.1-rc.2": "compatible" } } }
```

`dsh.client.inject` lists package names; the plugin's `inject` lists service names — they are not the same thing.

## 3. Directories and files

`src` template:

```text
src/
├── index.ts          # plugin entry: name/inject/Config/apply
├── types.ts          # the single home for this package's types
├── client.ts         # optional: client type re-exports
├── client/           # type E browser half
│   ├── index.ts      # inject + apply(ClientContext)
│   ├── <Component>.tsx
│   ├── slots.ts      # inject face / props
│   └── locales.ts    # zh/en dictionaries + key types
└── <topic>.ts        # host side split by topic: storage / request / format
```

File size (effective lines, excluding blank lines and comments):

| Type | Soft limit | Hard limit |
|---|---|---|
| Regular module | 200 | 300 |
| With IO/routing aggregation | 300 | 400 |
| React component file | 200 | 250 |
| Entry/wiring | 120 | 150 |
| Type file | 150 | 200 |
| Test file | 400 | 600 |

- When over the limit, split by **reason to change**, not by line count: the same resource, the same state owner, and the same lifecycle stay together.
- When line count conflicts with reason to change, **reason to change wins**: if there truly is no independent reason to change, do not split; state in the commit message "over the limit but no independent reason to change; not split for now". The criterion is "will a future requirement still touch both places at once", not "does the line count fit the table again".
- One file, one primary responsibility; the first line of the module header must make it clear.
- Directory depth ≤4; ≤30 files per directory; leave no empty directories.
- File names kebab-case; component files PascalCase; types `types.ts`; slots `slots.ts`; dictionaries `locales.ts`.
- `utils.ts`, `helpers.ts`, `common.ts`, `misc.ts` are forbidden; name by domain (`jsonc.ts`, `http.ts`, `dom.ts`).
- Relative imports carry the extension: `from './slots.ts'`, `from './GoalBar.tsx'`.
- `src/index.ts` is the only entry; every other file is its private dependency; a client plugin entry must not import `src/client/**`.

The README must have a source map:

```md
| File | Responsibility |
|---|---|
| `src/index.ts` | Plugin entry: Config schema, tool registration |
| `src/types.ts` | Single home for projection keys and payload types |
```

### Directory refinement

Directories are split by domain, not by technical type. Create a subdirectory only when all five conditions hold:

1. This group of files shares one reason to change (changing A usually means changing B);
2. It needs only 1–2 entry points to the outside;
3. It can be named after a domain (not `utils`/`common`/`components`);
4. ≤30 files in the group (same measure as the per-directory limit), and it will not keep growing;
5. Cross-group references go mostly through the exit.

| Files per directory (including tests) | Recommendation |
|---|---|
| ≤20 | Stay flat |
| 20–30 | Merge similar files and delete unused ones first, then consider splitting |
| >30 | Must be split by domain |

- Create a subdirectory only with ≥3 files.
- Create an `index.ts` exit on demand: only with ≥2 cross-group references or a stable public surface; with only 1–2 references, import directly by relative path. An exit solves "scattered deep paths", not "directories must all look alike" — without a second consumer, an extra layer is just one more hop.
- Do not split by technical type (`components/`, `hooks/`, `services/`) or create junk-drawer directories (`misc/`, `helpers/`, `common/`).
- Test files follow their source files into subdirectories; do not gather them into `tests/`.

### File lifecycle

When splitting or replacing an old file, the old file has only three possible destinations:

| Old file role | Destination | Kept for |
|---|---|---|
| Package entry | Thin shell: re-exports and wiring only, ≤50 lines | Forever |
| Imported by other packages | Compatibility layer: re-exports only, marked `@deprecated replacement path and removal version` | One minor |
| Used only inside this package | Delete | Immediately |

- `legacy/`, `old/`, `archive/`, `backup/` directories are forbidden; `_v2`/`_new` parallel implementations are forbidden; commented-out old code is forbidden.
- Before deleting, confirm: references are gone, typecheck passes, tests are green, the README source map is updated.
- History belongs to git (`git log --follow`, `git blame -C -C`), not to leftover files.

## 4. Plugin skeleton

Functional host:

```ts
/**
 * <One-line responsibility>.
 *
 * <Why this plugin is needed / what it constrains, 2–4 sentences>.
 * @module @scope/dsh-<name>
 */
import z from '@deepseek-ai/schemastery';

/** Cordis plugin name. */
export const name = '<name>';
/** Required host services. */
export const inject = ['<service>'];
/** Runtime config schema; defaults live here. */
export const Config = z.object({
  enabled: z.boolean().default(true),
});

/**
 * <What it registers, what it depends on, what it cleans up>.
 * @param ctx - mount context.
 * @param config - <config semantics>.
 */
export function apply(ctx: Context, config: z.infer<typeof Config>) {
  ctx.effect(() => ctx.<service>.<register>({ /* ... */ }), '<name>.<resource>()');
}
```

Service host:

```ts
export class WebServer extends Service {
  static readonly Config = z.object({ host: z.string().required(), port: z.number().required() });
  constructor(ctx: Context, config: z.infer<typeof Config>) {
    super(ctx, 'webServer');
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context { webServer: WebServer; }
}
```

Client UI: keep an empty `apply()` on the host side so the Loader can see the plugin; browser side:

```ts
import type { Context as ClientContext } from '@deepseek-ai/cordis';

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { <ns>: <Key>; }
}

/** Required services. */
export const inject: string[] = ['slots', 'locale'];

/**
 * Client plugin body.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void { /* ctx.slots.register(...) */ }
```

Rules:

- All registrations go through `ctx.effect(register, '<module>.<resource>()')`; the second argument is a stable label and must not be omitted.
- Config defaults live only in the `Config` schema; `apply` adds no fallbacks.
- Optional fields use spread merge: `...config.x ? { x: true } : {}`.
- A bundle patch uses `- insert:` + `id`/`name`/`config`; `group: true` with `isolate` isolates the service scope.

## 5. Exports and the Loader contract

The Loader's `unwrapExports` takes `default` whenever it sees one; named exports are silently ignored:

| Shape | How to write it | Consequence |
|---|---|---|
| Functional | Named exports only, **no default** | With a default, `inject` is lost |
| Class-based | `export { Klass, Klass as default }`, write `inject`/`name` as **static members** | A named `inject` does not take effect |

- Export order is alphabetical: `export { Config, apply, inject, name }`.
- One leading export per file; types sit next to their implementation; test-only exports are marked `@internal` and placed at the end of the file.
- ≤15 exports per file; `index.ts` is the public entry only, `export *` is forbidden.
- The package export surface contains only the plugin's four-piece contract and public types; internal modules promise no compatibility.

## 6. Naming

| Object | Rule | Example |
|---|---|---|
| File/directory | kebab-case | `request-zone.ts` |
| Component file | PascalCase | `GoalBar.tsx` |
| Variable/function | camelCase, starting with a verb | `deriveTimeZoneContext` |
| Constant | UPPER_SNAKE | `MAX_WAIT_MS` |
| Type/interface | PascalCase, no `I` prefix | `WebRoute` |
| Boolean | `is/has/can/should/was` | `isLoopbackHost` |
| Service name | camelCase, a key on Context | `webServer` |
| Plugin name | kebab-case | `tool-todo` |
| Event name | `<domain>/<action>` | `turn/start`, `llm/stream` |
| Slot name | dot-separated hierarchy | `conversation.input.dock` |
| Config field | camelCase, unit in the name | `compressionThresholdBytes` |

- Unit suffixes are mandatory: `_MS`, `_PX`, `_BYTES`, `_PERCENT`.
- No 1–2 character identifiers (`i/j` loop counters, `e` in catch, and `t` translation functions are exceptions).
- `data/info/temp/obj/val/manager/helper/flag` are forbidden as local variable names.
- Abbreviation allowlist: `id`, `url`, `api`, `http`, `json`, `css`, `ms`.
- One word per concept; do not rotate `pet`/`instance`/`item`.

## 7. Variables

Classified by role; each class has its own rules:

| Kind | Shape | Rule |
|---|---|---|
| Module constant | UPPER_SNAKE | Assigned only at the definition; unit in the name |
| Shared constant | Centralized in `constants.ts` | One definition per concept; cross-package use is type-only |
| Config value | `config.xxx` | Comes only from the schema; read-only; no fallback |
| Environment variable | `DSH_<PKG>_<NAME>` | Read once in `env.ts` and parsed there; invalid means failure |
| Mutable state | camelCase | Lives only in a store/closure; never export mutable objects |
| Module singleton | `xxxStore`/`xxxRegistry` | Must be disposable; resettable in tests; initialization order documented in the module header |
| Cache | `cache`/`byId` suffix | Must have an invalidation policy and a capacity limit |
| Counter | `seq`/`count`/`epoch` | Monotonicity documented; uniqueness under concurrency never relies on increment alone |
| Timer | `*Timer`/`*Handle` | Must be cleanable; one `unref` policy across the codebase |
| Disposer | `dispose*`/`*Off` | Must be collected by `ctx.effect`; never discard the return value |
| Resource handle | `child`/`stream`/`fd`/`server` | Single owner; shutdown order documented in the module header |
| Sentinel | No magic strings | Missing is `undefined`, no value is `null`; never let one value mean two things |
| Credential | `*Key`/`*Token`/`*Secret` | Memory only; never logged; errors return a category message only |
| Path | `*Path`/`*Dir` | Absolute paths internally; validate the prefix after joining |
| Identifier string | Constant export | route/service/slot/event names must not be scattered as literals |
| Time/randomness | `now`/`rng` parameters | Pure functions do not read the clock; randomness is injectable |

Placement rules: module constants go after imports and before types; a local variable sits ≤10 lines from its first use; loop invariants are hoisted out of the loop; the same meaning is declared once.

## 8. Types and interfaces

Two schemas with a clear division of labor:

- **A plugin `Config` uses schemastery**: it must be able to dump JSON Schema for the Loader and patches.
- **Persisted records / wire payloads use zod**: `z.infer` derives the type, and the same schema can later be projected into an RPC schema.

Type rules:

- Public fields are always `readonly`; arrays are `readonly T[]`.
- Failures use a discriminated union: `{ ok: false; error: { code; message } }`, never `boolean + optional error`.
- Cross-package contracts use `declare module` merging only (`Context`/`Events`/`SlotMap`/`LocaleNamespaceMap`/`SessionProjectionMap`); never copy a local duplicate.
- Config types are derived from the schema; never hand-write a second copy.
- `any` is forbidden; external input is `unknown` + field-by-field validation; an assertion must sit right next to its validation statement.
- Internal fields use `#private`, not a `_` prefix.
- Discriminated unions must be exhaustive: `default: assertNever(x)`.

Interface layers and stability:

| Layer | Content | Promise |
|---|---|---|
| Package export surface | `.`/`./client` of `exports` | semver-bound |
| Plugin interface | `name/inject/Config/apply` | Loader contract |
| Service interface | `Service` class + `Context` augmentation | Cross-plugin runtime contract |
| Cross-package type | `declare module` merging | Compile-time contract |

- Event declarations state `@mode emit`/`@mode waterfall`/`@mode serial`; the payload must be a serializable discriminated union.
- Registration interfaces are always `register(def) => disposer`: unique id, built-in wins, duplicate registration throws, unregistering removes only one's own registration.
- Public errors must have a stable `code` (kebab-case) + a human-readable `message`; a `code` change counts as an API change.
- Deprecation uses `@deprecated replacement and starting version` and is kept for at least one minor.

## 9. Functions, control flow, and layering

### 9.1 Size and complexity

| Object | Limit |
|---|---|
| Regular function | 40 lines |
| Exported API function | 60 lines |
| `apply` | 60 lines |
| React component (presentational) | 150 lines |
| React component (real-time: rAF / pointer / state machine) | 150 lines for the panel part; the driver must be external |
| Custom hook | 80 lines |
| Class | 200 lines; methods 30 lines; 10 public methods |
| Parameters | 4 (beyond that, use an object) |
| Nesting | 3 |
| Cyclomatic complexity | 10 |

- A function performs one layer of abstraction: never mix "decision + IO + formatting".
- With ≥2 boolean parameters or >4 parameters, switch to an options object or split the function.
- Classes are only for "state with a lifecycle / multiple instances"; one-shot objects must state in the module header "not reusable after stop".
- Real-time components are judged by **driver count**, not line count: with `ref ≥ 8`, `rAF loops ≥ 2`, or a pointer state machine, extract the driver into a `createXxx(deps)` factory and leave only "panel + wiring" in the component. The criterion for splitting is "does this part have an independent failure mode", not "did the line count go over".
- When unsure whether to extract, apply one criterion: **can this part's rules be asserted without DOM / React?** If yes (conversion, priority, state transitions, decisions), extract into a pure function with tests; if no (frame timing, pointer capture, layout writes), consolidate the state first — do not rush to move files.

### 9.2 Control flow

- Guard clauses + early returns; keep the success path at the leftmost indentation; use `else` only for genuinely symmetric branches.
- Nesting ≤3; beyond that, extract a function or switch to a lookup table.
- With >3 branches on the same concept (e.g. `kind` with four or more values), switch to `Record<Kind, Handler>` and cover exhaustiveness with `assertNever`.
- No IO inside loops; build an index before nested loops; if one pass suffices, do not make two.
- Nested ternaries are forbidden; write `if (x) return true; return false;` as `return x`.
- Name complex conditions first: `const isStale = ...`, instead of stuffing the whole expression into `if`.

### 9.3 Validation boundaries

The DSH way is "parse once, then trust":

- External input is parsed once at the entry: `parseX(raw): X` returns the **validated value**, not a boolean.
- Division of labor: the schema handles types/required/enums; `parseX` only adds constraints the schema cannot express (non-empty, range, dedupe, combination).
- After parsing, pass the validated type downward (branded or parsed object); internal functions do not validate again.
- Configuration is parsed once at the `apply` entry: validate + fill defaults + `deepFreeze`, then read-only.
- Only three cases allow a second validation: a process boundary, cross-version reads, and reading back from a medium.
- A validates, calls B, and B validates again — only one may stay: if B is a public API, drop A's validation; if B is an internal function, drop B's validation.

### 9.4 Layering and dependency direction

Split into four layers along capability seams; do not copy controller / service / mapper:

| Layer | Shape | Only does | Forbidden |
|---|---|---|---|
| Entry carrier | Route handler, slot component, tool `execute`, CLI command | Parse input, call services, write the response/render | Business rules, reading the medium directly |
| Service orchestration | `Service` subclass, registry | Registration, routing, lifecycle, transaction boundaries | Pure computation, building message text |
| Domain | Pure fold, parse, format, policy | Rules, conversion, state transitions | IO, clock, randomness, DOM |
| Medium adapter | storage backend, LLM adapter, HTTP client, bridge | Serialization, persistence, protocol | Business judgment |

- Dependencies are one-way: carrier → service → domain; the adapter is called by the service; the domain depends on no layer.
- Layer on demand: a small plugin need not force all four layers, but **the domain must not depend on the carrier**.
- The module header states non-goals; the canonical wording is "owns only X, never Y".
- When one result has several consumers, build the structured data once and let each renderer do a thin mapping.

### 9.5 Side effects and error placement

- Side effects are concentrated in the entry and the adapter; domain functions do not read the clock, write to disk, or send requests.
- Time, randomness, and IO are injected as parameters to make testing easier.
- The domain throws semantic errors (with `cause`); the entry turns them into a structured result; no repeated wrapping in middle layers.

### 9.6 Call dependencies

- Dependencies come in two kinds: import edges and call edges. Import cycles are banned by tooling; call cycles are straightened out by the wiring root.
- Two-way communication goes only through functions or events injected by the wiring root; two modules must never import each other.
- A lower layer notifies an upper one by injected callback or event, never by importing it.
- `let` + deferred references are allowed only in the wiring root, never in business modules.
- Naming distinguishes "request" from "execute": `requestRestart()` is not `restart()`.

### 9.7 Real-time drivers

rAF loops, pointer state machines, and timer pumps share one skeleton; follow this table instead of inventing your own in each part of the repo:

| Element | Practice | Why |
|---|---|---|
| Frame handle | The driver holds `frame: number \| null` internally | It must survive across renders; kept in a component, it loses the ability to cancel after a re-render |
| Generation counter | `token++` on start/stop; `if (token !== own) return` at the top of the frame | A late frame drops itself; an old loop cannot mutate the new state |
| Instance | `xxxRef.current ??= createXxx({...})` in the component | Rebuilding every render loses the handle; create it once, and then all dependencies must go through getters |
| Dependencies | All getters (`box()`/`physics()`/`viewport()`), never snapshots | The driver outlives many renders; snapshots go stale |
| Stop | `stop()` cancels the frame, clears the handle, clears derived state; the caller decides what to stop | A driver manages only itself and never imports sibling drivers |
| Writes | Write DOM and real-time values synchronously inside the frame; commit framework state only once settled | Deferring writes into a callback makes re-renders read old values, surfacing only at certain render rhythms |

The component side keeps only three things: wire up the getter bundle, connect driver methods to the view, and stop on unmount.

Criterion: **does this part have an independent failure mode** (a frame not cancelled drops frames, a handle not surviving renders loses the loop, a snapshot goes stale) — if so, extract it into a driver; "many lines" alone is not a reason.

### 9.8 Runtime-injected React

When the host injects react capabilities (`h`, `useState`, `useEffect`, `useRef`) into a component library instead of importing react directly, follow this mold instead of redesigning it every time:

```ts
/** Injected react capabilities; the type includes only the subset in use. */
export interface XxxRuntime {
  /** Create an element. */
  h: typeof jsx;
  /** State. */
  useState: <T>(init: T) => [T, Dispatch<SetStateAction<T>>];
  /** Ref. */
  useRef: <T>(initial: T) => ReactNS.MutableRefObject<T>;
}

/**
 * Build a hook.
 *
 * @param rt - injected react capabilities.
 * @returns a hook that accepts view input.
 */
export function createXxx(rt: XxxRuntime) {
  return function useXxx(input: XxxInput): Xxx {
    // …
  };
}
```

- The hook is defined inside the factory closure and called unconditionally once in the component; the returned methods do not depend on `this`, so the view can pass `onClick: xxx.onClick` directly.
- State that needs `useRef` to survive across renders is always held with `useRef`; never use module-level variables (they leak into other instances).
- The injected type uses "only the subset in use", not the whole `typeof React` — test doubles would then have to implement every method as well, doubling the cost.

## 10. Configuration and state

Configuration:

- One schema is the single source of truth: types, defaults, validation, and docs all derive from it.
- Unknown fields are rejected by default (`strict`); allowing them must be explicit and justified.
- Precedence is fixed and documented in the module header: built-in defaults → bundle patch → profile patch → user overrides → CLI.
- Renaming a field or changing its semantics requires a migration and a version number; migrations are idempotent; a failure writes no half-finished state.
- Sensitive items are marked `secret`: not echoed, not logged, not dumped.
- Config changes must go through the same reload path; on a failed reload keep the previous values and report an error.

State:

- Persisted state must have `stateVersion`; a version bump provides adjacent migrations, and old data can be replayed.
- A projection's `apply` must be a pure synchronous function: `(state, event) => state`; IO/clock/randomness are forbidden.
- For events it does not care about, return **the same reference** so the framework can short-circuit with `Object.is`.
- Persisted state must be plain JSON.
- A log event carrying state must include the complete post-change state; bare deltas are forbidden.
- Write-chain semantics: first wait for persistence to succeed → then mutate memory → then emit the change event; on failure memory stays untouched.
- A persisted row is only a "fold shortcut"; discard it when the version mismatches or seq is out of bounds, and never treat it as authoritative.

## 11. Concurrency and resources

- Every wait has a timeout; timeout constants are named and state their basis.
- Async entry points accept `AbortSignal` and thread it to the innermost layer; after cancellation, write no response/state.
- Floating promises are forbidden: either `await`, or `void` + a comment explaining why, or enqueue it.
- Concurrent writes to the same resource must be serialized (queue/lock/single-flight); reads may run concurrently.
- Streaming output must be bounded; queues must have a limit and a drop policy.
- Cleanup order is fixed and documented in the module header: detach listeners → stop timers → close streams/child processes → flush to disk.
- Child processes use `stopAndWait` semantics; restart backoff + circuit breaker; old and new processes must never overlap.
- Timers share one `unref` policy; request-scoped and long-lived timers are kept separate.
- A disposer returned by registration must be handed to `ctx.effect`; "registered but nobody cleans it up" is not allowed.

## 12. Errors and logging

Errors fall into three classes:

| Type | Example | Handling |
|---|---|---|
| User error | Invalid parameters, invalid configuration | 4xx / explicit message; not logged as error |
| System error | IO, network, timeout | 5xx / normalized code; log warn/error; retryable |
| Dependency error | Missing service, missing credential | Degrade or report explicitly unavailable; never fake success |

- Throw with `cause`: `throw new TypeError(msg, { cause })`.
- Error messages say "what was expected, what was received", never "something went wrong".
- Security-related errors return a category message only, never echoing credentials, full URLs, or request bodies.
- Log with `ctx.logger`; bare `console.*` is forbidden (allowed on the client, but with a unified prefix).
- Structured logs: level + `event` + key fields + `durationMs`; never print user content.
- One log prefix per plugin; request-level logs carry a session/trace id.

## 13. Security

- Input: length limits, type allowlists, enum allowlists; validate the prefix after path joining; URLs allow only http/https.
- Credentials: memory only; errors are redacted; never logged, never written to disk; validate file permissions when reading.
- Commands: no shell interpolation; pass arguments as an array; even for fixed commands, guard against quotes in paths.
- HTML: external text is always escaped; rich text goes through an allowlisted node tree + a size limit; CSP denies by default.
- Network: listen on loopback only by default; deny cross-origin by default; compare tokens with a timing-safe comparison.
- Supply chain: the lockfile is committed; dependency build scripts are disabled by default; the release job and the build job have separate permissions.

## 14. Client UI

- The slot's `kind` (single/list/keyed/chain) and `scope` (root/session-maybe/session) are declared by the owner; the registrant only consumes them.
- Props are composed by the framework in three parts: `PropsRuntime<slot>` + `InjectFace<...>` + `PropsLocale<ns>`; components do not build their own `t`.
- For every exported component's props fields: add one line where the meaning is not obvious; skip coordinates/size/name and the like (details in `dsh-plugin-comment-spec`); the return type is explicitly `JSX.Element | null`.
- locale: in `locales.ts`, `zh` is the source of truth for the key set, and the `en` key set must match; `type Key = keyof typeof zh`; keys use `<domain>.<object>.<role>`.
- `locale/zh.json` holds marketplace metadata only (`meta.title`/`meta.description`), not UI copy.
- Component splitting: a presentational component ≤150 lines; `useState` ≤5; `useEffect` ≤6; derived state extracted into pure functions. Real-time components (rAF / pointer / state machine) externalize the driver per §9.7; the panel itself is still bound by 150 lines, and the `useState`/`useEffect` budget covers only the panel.
- Styles use only `--dsw-*` design tokens; literal color values are forbidden; prefer primitives and do not rebuild buttons/menus/dialogs.
- Sizes, spacing, and radii go through tokens or shared constants; CSS injection has exactly one entry point, `injectStyleOnce(key, css)`.
- Accessibility: clickable elements use native semantics or `role="button" tabIndex={0}` + Enter/Space; icon buttons have `aria-label`; state uses `aria-expanded`/`aria-live`; focus is visible; everything is keyboard-reachable.

## 15. Comments and documentation

Comment details live in `dsh-plugin-comment-spec` in the same directory; only the hard constraints are listed here:

- The file header is graded by role: entry/wiring/driver/stateful hooks get 4–8 lines (responsibility, non-goals, dependencies, invariants), regular modules get 1 line, pure-function leaves may omit it.
- A one-line summary per export; complex functions document `@param name - meaning`, `@returns boundary`, `@throws condition`.
- Write only "why", never "what"; historical narrative, file path references, and ownerless TODOs are forbidden.
- Coverage exemptions must carry a reason: `/* v8 ignore next N -- reason */`.
- Comment language follows the project; tags and structure stay unchanged.

Documentation:

- `README.md` and `README.zh.md` come in pairs and cross-link at the top.
- The frontmatter is fixed at `description` + `kind: "package-reference"`.
- Fixed sections: Overview → Using this package → Understanding the implementation (source map, export shape) → Going further → Model experience (tool packages) → Known limitations → Development notes.
- Section anchors use `<a id="kebab-case"></a>`; long implementation notes go into `<details>`.
- A bilingual README records the zh/en hash of every heading in `README.i18n.yaml`; changing one side requires syncing the other and re-recording.
- Design decisions go into `notes/<date>-<topic>.md` or an ADR and are linked from the README; they are not stuffed into code comments.

## 16. Testing

### 16.1 Test types

| Type | What it tests | Where it lives | Share |
|---|---|---|---|
| Unit | Pure functions: parse / format / conversion / state transitions | Same directory as the code under test | ~70% |
| Contract | What the plugin registers and what it cleans up | Same directory as the code under test | ~20% |
| Integration | Combined behavior of component + slot + locale | `tests/integration/` | A few |
| End-to-end | Startup, routing, failure matrix | `tests/*.expected.e2e.ts` | ~10% |

- Component tests use real rendering, not large snapshots.
- Tests that need HTTP use a controllable double: a local stub, `nock`/`msw`, or an injected fetch — any one will do; assert the request shape, timeouts, retries, and failure normalization without depending on real accounts or the current time.
- The default test suite does not access the public internet or real service providers; cases that need a real provider live separately in `*.live.test.ts` (skipped by default, require an explicit environment variable, and stay out of CI).

### 16.2 Files and directories

- One source file corresponds to one test file: `foo.ts` ↔ `foo.test.ts`, in the same directory.
- Cross-module integration goes in `tests/integration/`; e2e goes in `tests/*.expected.e2e.ts`.
- Fixtures go in `tests/fixtures/` and are read-only; anything that needs writing uses a temp directory created by each test.
- Test helper functions go in `tests/support/`, never `utils.ts`.
- Test files are ≤600 lines; beyond that, split by behavior group, not into "part 1 / part 2".

### 16.3 Style

- `describe('<module/function>')`; `test('<behavior>: <condition> → <result>')`, in English.
- AAA: arrange, act, assert; one test verifies one behavior.
- Assertion messages state "what it should be" so a failure pinpoints the cause.
- Each test builds its own ctx / store / temp directory; tests share no mutable state and do not depend on execution order.
- Time, randomness, network, and the filesystem are injected as parameters.
- A contract test asserts at least two things: registration succeeded, and everything is cleaned up after dispose.
- Network tests: each test builds its own server on a random port and closes it at the end; assert request headers/paths/timeouts without depending on the public internet.

### 16.4 Forbidden

- New regex guards that read source code (e.g. "this file must contain a certain symbol"): they test text, not behavior, and go red on any refactor. Register existing guards in a baseline and only decrease them; when touching a related file, replace the guard with a test that asserts behavior.
- Mocking internal functions of the module under test.
- Large object snapshots.
- `sleep` waiting; use conditional polling or an injected clock.
- Passing state between tests (globals, module-level caches).
- Asserting implementation details (private fields, call counts) instead of behavior.

### 16.5 Coverage

- New/changed lines ≥80%; pure functions ≥90%; do not chase an overall number.
- Uncovered existing code is registered in a baseline and may only decrease, never increase.
- Coverage exemptions must state a reason.
- Test lines : source lines ≈ 0.8–1.2.

## 17. Build and release

- The build uses tsdown, output in `lib/`; the client bundle takes the form `window.__ModuleLoader__.load({ id, factory })`, with `react`/`react-dom`/`@deepseek-ai/*` externalized.
- Before release, run: `typecheck → lint → format:check → test → prepack-check`.
- The `files` allowlist may have only one source; generators, bundlers, and check scripts either derive from it or assert against it.
- Generated artifacts (`lib/types/**`, bundles, schema dumps, catalogs, i18n hashes) are marked `@generated` + the generating command; CI verifies them by diff.
- Versions are synced with the DSH release; before tagging, verify that `package.json.version` matches the tag.
- CI: PRs run the full gate; releases are a separate job, and only it gets `contents: write`; the build job runs with read-only permissions.

## 18. Performance

- Budgets: bundle size, startup time, per-request memory, and first-paint time each have a threshold enforced in CI.
- Caching: cache only pure computation results; with a key, a limit, and invalidation; caching does not change semantics.
- Lazy loading: heavy dependencies such as SDKs and parsers are dynamically imported and stay off the startup path.
- Hot paths (rAF, polling) must not allocate large objects/closures every frame; cache derived values.
- IO: batch reads, avoid redundant stat calls; debounce file watching.

## 19. Forbidden list

1. A functional plugin exporting `default` (it makes the Loader lose `inject`).
2. A client plugin missing the host-side `apply()`.
3. Declaring only `exports["./client"]` and omitting `dsh.client`.
4. A package in `dsh.client.inject` that is missing from `devDependencies`.
5. Hand-writing a second copy of config defaults.
6. Literal color values / hard-coded px instead of `--dsw-*`.
7. `utils.ts`/`common.ts` junk drawers.
8. Copying types/constants/protocol across plugins.
9. A file >300 lines, a function >60 lines, a component >150 lines (for "external driver" of real-time components see §9.7; the panel part is bound by this limit too).
10. Registering a resource with no disposer ownership.
11. Floating promises, waits without timeouts, async work that cannot be cancelled.
12. `console.*` instead of `ctx.logger`.
13. Writing history, paths, or ownerless TODOs in comments.
14. Maintaining the release list and the build script separately.
15. A migration without a version number, or changing the format without bumping `stateVersion`.

## 20. Pre-commit checklist

- [ ] The plugin type is explicit and the four-piece entry contract is complete.
- [ ] `exports`/`files`/the three dependency buckets/the `dsh` field are correct.
- [ ] File ≤300 lines, function ≤60 lines, component ≤150 lines; when over the limit, first ask "is there an independent reason to change" — if not, state why you are not splitting; only split if there is.
- [ ] The driver of a real-time component (rAF / pointer / state machine) is externalized, with the frame handle and generation counter inside the driver (§9.7).
- [ ] The react-injected hook follows the `createXxx(rt)` mold, and cross-render state uses `useRef` rather than module-level variables (§9.8).
- [ ] There is no second copy of constants/types/rules/lists.
- [ ] Variables sit in the right place by kind; handles and timers have cleanup ownership.
- [ ] Config defaults live only in the schema; unknown fields are rejected.
- [ ] Persisted state has `stateVersion` and adjacent migrations.
- [ ] Async work has timeouts/cancellation; there are no floating promises.
- [ ] Errors are classified, carry a `code`/`cause`, and are redacted.
- [ ] Logs are structured and do not print user content or credentials.
- [ ] Input validates length/enums/paths/URLs.
- [ ] The client uses only `--dsw-*` tokens and prefers primitives.
- [ ] The locale zh/en key sets match; keyboard access works.
- [ ] Tests sit next to the source, test behavior, and cover new lines.
- [ ] Generated artifacts are marked `@generated` and verified by CI.
- [ ] The README has a source map, comes in a bilingual pair, and the i18n hashes are updated.
- [ ] Deprecation/compatibility has a declaration and migration notes.
