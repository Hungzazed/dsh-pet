---
name: dsh-plugin-comment-spec
description: "Use when writing, reviewing, or migrating code comments for DSH plugins: built around module headers, declaration-level TSDoc contracts, and a few why comments; unifies tags, language, and validation."
whenToUse: "When writing or modifying DSH plugin code (host side / browser side / standalone mode / desktop helper), adding TSDoc and API documentation, reviewing comment quality, cleaning up banner or narrative comments, or introducing lint or documentation gates for comments."
metadata:
  language: "en"
  category: "development"
disable-model-invocation: false
user-invocable: true
---

# DSH Plugin Comment Specification

## Goal

Let callers use the plugin API correctly without reading the implementation, let maintainers change the code safely after reading only the necessary information, and let comments be validated by tools without drifting away from the implementation.

Three baselines:

1. **A comment is a contract, not prose.** Each comment answers only what types and names cannot: boundaries, invariants, side effects, and why it is done this way.
2. **State each fact once.** Information that can be generated from code, types, OpenAPI, or schemas is not written a second time by hand.
3. **One line by default, expand only when complex.** Fix the structure first, then write comments; comments cannot compensate for an oversized file or a too-deep function.

## Quick reference (ten-line version)

| Scenario | What to write | Where |
| --- | --- | --- |
| New file (entry / driver / stateful hook) | Responsibilities, non-goals, dependencies, invariants | Top of the file, 4–8 lines |
| New file (ordinary module) | One-sentence responsibility | Top of the file, 1 line |
| New file (pure-function leaf) | May be omitted: omit it when the export documents itself fully | — |
| Exported symbol | One-line summary, plus tags when needed | Above the declaration |
| Interface field | Write only when the semantics are not obvious (config options, units, mutual exclusion, defaults) | Above the field, 1 line |
| Complex function | Summary + `@param` / `@returns` / `@throws` | Above the declaration, ≤ 12 lines |
| Private member / internal class | One-line summary, no compatibility promise | Above the declaration |
| Non-obvious implementation | Why, tradeoffs, the ordering that must hold | Inline, 1–4 lines |
| Generated file | `@generated`, the generation command, do not edit by hand | Top of the file |
| Credential-related | Source, lifetime, whether it may go into logs | One line at the point of use |
| TODO | `TODO(#123, @owner): action` | Inline |
| Background and decisions | Link to `docs/` or an ADR | One line in the module header |

## Scope

Applies to hand-written source code in DSH plugin repositories:

- Host side: the Cordis plugin entry, service registration, routes, config merging, state maintenance.
- Browser side (client): the `./client` entry, React components, the settings page, rendering and polling.
- Standalone mode (standalone / CLI): argument parsing, the pseudo ctx, the local server, shims.
- Desktop helper (Electron / runtime): the main process, preload, renderer, windows and asset scheduling.

Does not apply to: `lib/` build output, generated `*.d.ts` declarations, `node_modules`, and manifest files such as `package.json` that cannot hold comments (document those in the README).

Projects in other languages can reuse the layering, the prohibitions, and the workflow, swapping only the tags for the corresponding ecosystem (for example, Java uses Javadoc).

## First principle: decide first whether it should be written

Before typing, ask three questions of every sentence:

1. **Can it be derived directly from the signature or the name?** Yes — delete it. `/** user name */ name: string` is noise.
2. **Does it describe the current fact, or history and plans?** History — delete it or move it to the CHANGELOG; plans — file an issue; keep only the constraints that must hold now.
3. **Will it become false the next time the code changes?** Yes — turn it into a constraint, turn it into a link, or do not write it. The value of a comment is not that it was written but that it is still true.

One-sentence test: **can a future reader verify this sentence with the code or a test?** A narrative that cannot be verified probably should not stay in a comment.

### Negative comments

In a module header, one non-goal is allowed and encouraged; at function and field level, do not write them by default.

Before typing, pass three questions; if all three answers are no, do not write it:

1. **Is going out of scope cheap?** It can be written in passing without adding imports or crossing type boundaries.
2. **Would the reader be mistaken?** The name and context do not hint at this boundary.
3. **Has an incident happened?** There has been a real misfiling or rework.

Counter-examples (writing them is noise):

- `// This file is not a collection of utility functions.` — the reader would not think so.
- `/** Does not handle persistence. */` attached to `parseX()` — the function body already says so.
- `const ts = Date.now(); // this is milliseconds, not seconds` — just rename it to `tsMs`.

Good examples (worth writing):

- Config write entry point: does not restart the desktop Helper — a higher layer once called restart directly, an easy cross-layer mistake.
- Event-listening module: does not subscribe to events (subscription happens at the assembly layer) — the name says watch but it does not subscribe, which is counterintuitive.

Variable-level "is A, not B": write it only when two similar concepts coexist, and prefer distinguishing them by name; if naming can make it clear, do not write it.

## Comment layers

| Layer | Location | What must be written | Length limit | Verification |
| --- | --- | --- | --- | --- |
| Module header (entry / driver / stateful) | Top of the file | Plugin role, responsibilities, non-goals, dependencies, key invariants | 4–8 lines | review |
| Module header (ordinary module) | Top of the file | One-sentence responsibility | 1 line | review |
| Module header (pure-function leaf) | Top of the file | May be omitted | 0 lines | review |
| Exported declaration | `export`ed functions, classes, constants, types | One-line summary, plus tags when needed | 1–7 lines | tsdoc / api-extractor |
| Interface field | Fields whose semantics are not obvious | One line of semantics | 1 line | review |
| Private member | Internal class fields, private methods, module-level constants | One-line summary, no compatibility promise | 1 line | review |
| Complex function | When parameters, return values or exceptions are not obvious | Summary + `@param` / `@returns` / `@throws` | ≤ 12 lines | eslint |
| Lifecycle | `apply` / `inject` / `dispose` / `ctx.on` | What is registered, what is depended on, when it is cleaned up | 1–4 lines | review |
| Inside the implementation | Non-obvious branches, magic numbers, external quirks | Why it is done this way, why it cannot be done that way | 1–4 lines | review |
| Generated file | Top of the file | `@generated`, the generation command, do not edit by hand | 3 lines | review |
| Tool directives | `eslint-disable` / `v8 ignore` | Directive + reason | 1 line | lint |

### Module header

Split into three tiers by file role; do not always write the four-paragraph form:

| Role | What to write | Length |
| --- | --- | --- |
| Entry, assembly, service, driver, stateful hook | What it is responsible for, what it is not responsible for (at most one), what it depends on, what must always hold | 4–8 lines |
| Ordinary module (a group of related functions or one component) | One-sentence responsibility, plus one non-goal if needed | 1 line |
| Pure-function leaf (conversion, formatting, pure decision) | Omit; also omit when the file has a single export and that export is already fully documented | 0 lines |

When `@module` is present, put it on the first or the last line; only entry and driver files are worth carrying it. The header is not a table: if one sentence makes it clear, it should not be stretched into four lines.

Do not write: route lists, field lists, config-option lists, change history, ASCII diagrams, directory trees. This content can either be generated or belongs to the documentation site; writing it into a comment creates a second source of truth.

```ts
/**
 * Host side: registers <capability> as DSH services and routes, and maintains its in-memory state.
 * Does not handle rendering or assets; the browser side polls /<prefix>/state to read it.
 * The contract is defined in openapi.yaml; config is read only through readAllConfig and this module never touches files.
 * @module dsh-plugin-<name>
 */
```

Going over 8 lines usually does not mean that more explanation is needed; it means this file should be split.

### Exported declarations

The entries pointed to by `exports` in `package.json` (`.` and `./client`) are the plugin's public surface: every symbol must have a summary; fields are written per the criteria in the next section.

Write the summary as an imperative or a noun phrase, in the present tense, ending with a period; write it in English and keep identifiers as-is. Do not repeat the name or the type.

```ts
/** Parses a command name without a leading slash; returns undefined when it is invalid. */
export function parseCommandName(line: string): string | undefined;

/** The only data source for polled state; rendering is triggered only when counter changes. */
readonly state: PollState;
```

### Interface fields

Write only fields whose semantics are not obvious. The following four categories must be written:

- **Config options and toggles**: what behavior they change, and the default value.
- **Numbers**: unit and dimension (`_MS` / `_PX` / `_BYTES`), plus the value range or clamping rule.
- **Mutually exclusive or either-or**: what the other side is, and who guarantees that only one appears.
- **Cross-module contract**: who writes, who reads, how it degrades on failure or absence.

Do not write for fields whose names already make things clear, such as coordinates, sizes, counts and names. Adding a line to each of dozens of fields reads more like a table than a contract: the fields that really need explaining get drowned by the same boilerplate phrasing.

### Private members and internal classes

Internal classes, private fields and module-level constants follow the same standard as exported symbols, but get only a one-line summary, no full tag set, and no compatibility promise:

```ts
/** Registration layer of the current instance; a definition in a higher layer shadows the global one. */
private readonly layers: ScopedLayers;

/** Sequence for generating commandId within a single process; starts from 0 after a restart. */
private commandSeq = 0;
```

Add `@internal` when something must be explicitly marked as not public; any symbol that can be imported directly from outside is documented to the exported standard.

### Complex functions

Expand only when questions remain after reading the signature. The structure is fixed: one summary line → blank line → tag block.

- `@param name - semantics`: write the meaning, optionality, default value, boundaries; do not write the type.
- `@returns`: write the boundary values (empty, `undefined`, defaults, partial success).
- `@throws`: write the trigger condition and the error type; if it never throws, do not write it.
- `{@link Symbol}`: reference a related symbol; do not write "see xxx.ts:123".
- `@example`: only for unconventional usage, at most one per function.

```ts
/**
 * Registers a plugin command.
 *
 * @param definition - Discovery metadata and the handler; a duplicate registration of the same name is rejected.
 * @returns A disposer that unregisters exactly this definition.
 * @throws {TypeError} When the name does not match `<rule>`.
 */
```

#### Generics

When a type parameter is not obvious, use `@typeParam` to state the constraint and the purpose; do not repeat what `extends` already expresses:

```ts
/**
 * Reads a value by config key.
 *
 * @typeParam K - Config key; the return type is derived from this key.
 * @param key - A declared key.
 * @returns The corresponding value; `undefined` when the key does not exist.
 */
export function readConfigValue<K extends keyof Config>(key: K): Config[K] | undefined;
```

#### Overloads

Write the summary and tags once, on the implementation signature or the first overload; add a `@remarks` line only to an overload whose behavior differs, and do not copy the same explanation three times.

### Lifecycle and injection

DSH-plugin-specific places, the ones most likely to be written as a restatement of the framework:

- `name` / `inject` / `provide` / `apply` / `dispose`: one line each stating **why this dependency is needed, what is registered, what is cleaned up**; do not explain how Cordis itself works.
- `ctx.on(...)` / `ctx.effect(...)`: note the listener's lifetime and when it is torn down.
- Route handlers: link the contract to OpenAPI; do not enumerate the response body field by field.
- Client components: one line per prop field; for `useEffect` dependencies, explain only why this dependency cannot be removed.
- Config merging: write defaults and precedence in the module header; do not write prose per field.

### Inside the implementation

Write only five categories of content: the source of a non-obvious constant, a counterintuitive branch, a performance or security tradeoff, a quirk of an external system, and a call order that must be preserved.

Do not write: line-by-line restatement of the code, obvious null checks, getter/setter descriptions, restatements of what a variable means.

Limit: 1–4 lines. More than 4 lines means you need better names, a smaller function, or moving the background to `docs/` and leaving only a link.

```ts
// The host's dispose is asynchronous: detach listeners first, then close the window, otherwise callbacks land on an already-destroyed webContents.
```

### Security and credentials

For code that deals with keys, tokens, or user data, the comment states only the **source, lifetime, and whether it may go into logs**; never write real values, and always use placeholders in examples.

```ts
// key lives only in memory; never log it or write it to disk; keep only the last four characters in error messages.
```

### Generated files

Generated artifacts committed to the repository (bundles, copied runtime scripts) must declare within the first three lines of the file: who generates them, the generation command, and do not edit by hand.

```ts
/**
 * @generated by `pnpm run build:desktop-core`; do not edit by hand.
 * Source file: src/shared/index.ts.
 */
```

When the generator cannot inject a file header, note it in the nearest hand-written entry point or in the README.

## Prohibitions

| Anti-pattern | Why it is wrong | Alternative |
| --- | --- | --- |
| Banners such as `// ---- config ----` | Hide an oversized file, create merge conflicts, and often stay behind after the code is moved | Split the module; use files and export boundaries instead |
| `**bold**`, `## heading`, ASCII diagrams | Editors do not render them, and they are pure noise in grep and diff output | Plain text; diagrams go to the documentation site |
| "before the rework / the old implementation / it used to be" | Not verifiable, and necessarily rots | git, CHANGELOG, ADR |
| Commented-out code | Double maintenance; the reader cannot tell which copy is live | Delete it and recover it from version control |
| Line-number or file-path references | Break as soon as the file moves | `{@link}` or a stable documentation link |
| `@param {string} name the name` | The type is already expressed by TS, pure redundancy | Write only the semantics |
| Copying route, field, or config tables into comments | Drifts from the implementation and nobody validates it | Link OpenAPI, the schema, or the generated artifact |
| An ownerless TODO | Will never be handled | `TODO(#123, @owner): concrete action`, or just leave an issue |
| Mixing languages within one comment block | Readers switch back and forth and terminology drifts | Use English consistently; other languages only for identifiers and quoted originals |
| Padding comments to reach coverage | Adds noise and masks the contracts that are really missing | Better missing than fake |
| `// this file is not…`, "does not handle…" at function level, "is A, not B" for a variable | The reader would not have been mistaken anyway, so it is noise | Delete; rename when a distinction is needed |

## Tag conventions

Use TSDoc semantics (compatible with the JSDoc toolchain).

| Tag | When to use | Form |
| --- | --- | --- |
| `@module` | Module header | `@module <package-name>` |
| `@param` | Has parameters and their semantics are not obvious | `@param name - semantics` |
| `@typeParam` | A generic parameter is not obvious | `@typeParam T - constraint and purpose` |
| `@returns` | Has a return value and its boundaries are not obvious | `@returns boundaries and defaults` |
| `@throws` | Can throw | `@throws {Type} trigger condition` |
| `@deprecated` | Planned for removal | `@deprecated replacement and starting version` |
| `@internal` | No public promise | `@internal` |
| `@remarks` | Needs a paragraph of explanation | A separate paragraph after the summary |
| `@example` | Unconventional usage | Code block, at most one |
| `@see` / `{@link}` | Related symbol or document | `{@link Symbol}` |

Rules:

- Fixed order: summary → `@remarks` → `@typeParam` → `@param` → `@returns` → `@throws` → `@example`.
- The `@param` name must match the signature exactly; update the tag when renaming a parameter.
- No blank lines between tags; no blank line between the `@param` group and `@returns`; one blank line after the summary.
- English sentences use ASCII punctuation; punctuation inside code snippets, commands and paths stays as-is.
- Do not write `@param {type}`; leave the type to TypeScript.

## Language and terminology

Comments are always written in English. Code identifiers, type names, API names and command names keep their original spelling and are not translated; when quoting error messages, logs, or UI copy, keep the original text and do not rewrite it.

- **The comment language follows the target repository.** The examples in this document are in English because the target language for this repository is English; when porting or referencing other code, do not copy its language; unify on the target repository's language, and do not mix languages in one file.
- **One narrative language across the whole repository.** Do not alternate languages sentence by sentence; using proper nouns in English does not count as mixing.
- **One concept, one word.** On first occurrence you may gloss it in parentheses, for example "resolved config"; do not rotate synonyms.
- **Avoid project jargon.** When it is unavoidable, define it once in the module header; do not make newcomers guess.
- **Punctuation follows the sentence.** English sentences use ASCII punctuation; punctuation inside code snippets, commands and paths stays as-is.
- **Tag names stay in English.** `@param`, `@returns`, `{@link}` are tool syntax and are not translated.

## Comments versus tests

Rules that a test can pin down are not written into comments. Precedence tables, boundary conversions, state transitions and fallback branches all become assertions; comments keep only the three categories a test cannot express:

- **Ordering**: why execution must follow this order, and where a different order breaks.
- **Tradeoffs**: among two workable options, why this one was chosen and what was given up.
- **External quirks**: behavior somewhere in the host or the browser is counterintuitive, and a test cannot reproduce it reliably.

The same fact appears in only one place: if a test already asserts the conversion formula, the module header does not need to copy it, so write only the conventions the tests do not cover (for example, the result is independent of elapsed time and unaffected by input order). Writing both drifts, and when they drift nobody knows which side to trust.

## Length and density

- Module headers are tiered by role (entry 4–8 lines / ordinary 1 line / pure-function leaf optional); declaration summaries 1 line; function documentation ≤ 12 lines; in-body why 1–4 lines.
- The median documentation block should be 1 line, p90 ≤ 7 lines. **A block of ≥ 10 lines is a signal that it should move to the docs**, not a signal to write more detail.
- A comment-line ratio of 10%–20% is the usual range. Above 25%, first check whether you are writing prose or masking the structure; below 5%, first check whether exported contracts are missing.
- Density is not a KPI, is not assessed by line count, and does not justify filler written to hit a target. This is especially true for field comments: padding out the obvious fields drowns the fields that really need explaining in the same boilerplate phrasing.

## Writing workflow

**Adding code**

1. For a new file, define the module header by role first (entry/driver 4–8 lines; ordinary module 1 line; pure-function leaf optional), then write the imports.
2. Write one summary line per exported symbol; one line per interface field.
3. Add tags when parameters, return values or exceptions are not obvious; add `@example` only for non-obvious usage.
4. Write why only in non-obvious places; anything expressible through naming and types is not written at all.
5. Before committing, run the type check and lint (if TSDoc rules are configured).

**Modifying code**

1. First work out which comments this change makes false; change only the relevant comments, do not rewrite unrelated ones in passing.
2. Remove references to symbols that no longer exist and examples that no longer work.
3. Sync behavior changes into `@returns` / `@throws`; to remove an export, first mark it `@deprecated` and keep it for one version.
4. If a new branch introduces a new constraint, add a why sentence rather than a paragraph of process description.

**Reviewing code**

1. Go through the checklist item by item and classify the problems as wrong, stale, or style.
2. Require changes only for wrong and stale; style issues get suggestions and do not block.
3. For long comments, require only that they be migrated to the documentation, not that information be deleted.
4. When a comment contradicts the implementation, the code wins: fix the comment first, then decide whether the code has a bug.

**Migrating existing code**

1. Remove decoration first: banners, bold, headings, ASCII diagrams.
2. Then move blocks of ≥ 10 lines to `docs/`, leaving a 2–3 line summary plus a link in the code.
3. Then fill in the tags for exported symbols.
4. Finally turn on the gates: `warn` first, `error` once stable. Change one dimension at a time to avoid a huge diff.

## Checklist

- [ ] Does the module header match the file role (entry/driver written in full, pure-function leaves may skip it), and does it answer what it is responsible for, what it depends on, and what must always hold?
- [ ] Does every exported symbol have a summary; are interface fields written only for those whose semantics are not obvious (config options, units, mutual exclusion, defaults), with obvious fields not padded for coverage?
- [ ] Is `@typeParam` written when a generic parameter is not obvious? Is the overload note written only once?
- [ ] Are generated files marked with `@generated` and the generation command?
- [ ] Do credential-related comments state only the source and the redaction requirement, with no real values?
- [ ] Do `@param` names match the signature? Are the boundaries of return values and exceptions spelled out?
- [ ] Is there any duplicated type, duplicated name, or duplicated implementation detail?
- [ ] Is there any banner, bold text, diagram, historical narrative, or line-number reference?
- [ ] Should a comment of ≥ 10 lines be migrated to the documentation?
- [ ] Does every TODO carry an issue and an owner?
- [ ] Does each fact exist in only one place (no copied OpenAPI, schema, or config table)?
- [ ] Is the narrative language consistently English (except identifiers and quoted originals)?

## Gates and tools (recommended, not mandatory)

- `eslint-plugin-tsdoc`: validates TSDoc syntax; start directly at `error`.
- `eslint-plugin-jsdoc`: `require-jsdoc` (exported only), `require-param`, `require-returns`, `check-param-names`, `check-tag-names`, `tag-lines`; start with `warn`.
- `@microsoft/api-extractor`: generates `.api.md` and diffs it in CI; export changes must be explicitly approved.
- TypeDoc: `--validation.notDocumented` turns "an export without documentation" into a failure.
- CI checks the TODO format: only `TODO(#\d+, @[\w-]+)` is accepted.
- **Existing baseline**: gates apply only to new files and diff lines; record existing problems in a baseline file and only let the metric go down, never up, so that thousands of legacy blocks do not all turn red at once.
- Migration order: read-only inventory → `warn` → fix existing code → `error`. Do not turn everything on at once.

## Metrics (suggested values, not hard requirements)

| Metric | Suggested value |
| --- | --- |
| Export documentation coverage | ≥ 95% |
| Exported functions with `@param` | ≥ 90% |
| Interface field coverage | Not a metric: cover only non-obvious fields, writing them all lowers quality |
| Comment blocks of ≥ 10 lines | 0 |
| Banners, bold, ASCII diagrams | 0 |
| TODOs with an issue and an owner | 100% |
| Documentation block length p50 / p90 | 1 line / ≤ 7 lines |
| Comment-line ratio | 10%–20% |

## Example: one rewrite

```ts
// ---- config module ----
// Before the rework, config was scattered across three files; now it is unified here
// Read config
export function readConfig() { /* ... */ }
```

Becomes:

```ts
/**
 * The single read entry point for config: merges built-in defaults, the user layer, and environment variables.
 * Does not write to disk; writing goes only through saveUserConfig.
 * @module dsh-plugin-<name>/config
 */

/** Returns the resolved config with all fields filled in; throws on a parse failure instead of returning a half-built result. */
export function readConfig(): Config;
```

The change is only three things: the banner becomes a module header, the historical narrative is removed, and the function summary states the contract. No information was added, but every sentence is now verifiable.

## Ground rules

1. Do not write comments for metrics; better missing than excessive.
2. Do not use comments to compensate for structure: split an oversized file first, extract from an overlong function, do not write banners.
3. Do not delete a valuable why; migrate it to `docs/` or an ADR and leave a link in the code.
4. Change one dimension at a time: decoration first, then long prose, then tags, and finally the gates.
5. Public API changes must sync the comments and the API report.
6. When in doubt, decide by whether a future reader can verify the sentence.
