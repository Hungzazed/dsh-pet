---
name: git-commit
description: "Generates an English Git commit message following the type(scope): subject structure from the current code change, for traceability and automatic changelog generation. Use when the user asks to generate, summarize, or normalize a commit message."
whenToUse: "The user asks to generate a commit message from the current code change; the user asks to write an English commit in the structured format described above; the user asks to normalize or rewrite a commit message so that it is traceable."
metadata:
  language: "en"
  category: "development"
disable-model-invocation: false
user-invocable: true
---

# Structured Git Commit Convention (Technical Commit Convention)

## Goal

Provide any project with a unified, structured, technically traceable Git commit message convention, so that every commit clearly describes the code-level change (module, algorithm, configuration, dependencies, etc.) while staying readable for developers and easy to turn into an automatically generated changelog.

## Core Principles

- Technically traceable: every commit clearly describes the code-level change, including module, algorithm, configuration, dependencies, etc.
- Developer-oriented: the commit message is readable, but the core is the technical description; avoid vague wording.
- Structured: use lightweight markers (type, scope, subject, technical details) so that automated parsing and changelog generation are easy.

## Input and Output

- Input: the file list or change description for this change (provided by the user, or inferred from the code).
- Output: plain-text commit message that can be used directly with `git commit -m`.

## Format Definition

```
<type>(<scope>): <subject>

<technical body>  (required, at least one technical description)

[optional footer]
```

### 1. Type (commit type, technical semantics, required)

| Type    | Meaning                          | Example scenario                                  |
|---------|----------------------------------|---------------------------------------------------|
| feat    | New feature/page/component       | Add a search feature, add a login flow            |
| fix     | Fix a code or content defect     | Fix an XSS vulnerability, fix a pagination count error |
| perf    | Performance optimization         | Image lazy loading, caching strategy, bundle splitting |
| refactor| Code refactoring (no behavior change) | Rewrite a module's implementation, unify the request layer |
| style   | UI/style change                  | Change the theme color, adjust responsive breakpoints |
| docs    | Documentation update             | Add/change the README, comments, API documentation |
| chore   | Build/dependency/configuration change | Upgrade dependencies, change the build configuration, adjust CI |
| revert  | Revert a technical change        | Revert an approach because of compatibility problems |

### 2. Scope (required)

Name the affected technical module with a single word, for example: `template`, `router`, `api`, `auth`, `ui`, `style`, `config`, `deploy`, `docs`, `analytics`, `test`, `script`, and so on. When a change cannot be assigned to a single module, `(<scope>)` may be omitted.

### 3. Subject (concise technical description, required)

Write in English, using the imperative mood, at most 72 characters, stating directly what technical change was made, for example:

- Rework pagination logic to use cursor-based pagination
- Upgrade the marked library and fix the XSS risk
- Add webp support with a fallback path

### 4. Technical Body (required)

It must contain at least one concrete technical description; multiple items may be written as a list. The content includes, but is not limited to:

- Implementation approach: which API, algorithm, data structure, or design pattern was used.
- Before/after comparison: how the key code logic changed.
- Performance metrics: load time, bundle size, etc. before and after the optimization.
- Dependency changes: which dependency packages were added/upgraded and their version numbers.
- Configuration adjustments: build, lint, test, and other configuration changes.
- Bug root cause: why the error occurred and how the fix works.

Example format:

```
- Technical implementation:
  - Change the pagination parameter from offset to after timestamp, and query through the createTime index, reducing slow queries at large offsets.
  - Frontend changes the API call to: `GET /items?after=xxx&limit=10`.
- Performance impact: endpoint latency drops from 320ms to 210ms (load test result).
- Files involved: `routes/items.js`, `src/api.ts`
```

### 5. Footer (optional)

- `Breaking change:` describes an incompatible change.
- `Closes #issue` links a task or issue.
- `See also` links related documentation.

## Workflow

1. When the user asks to "generate a commit message from this change", proactively ask for the changed file list or description; if none is provided, infer it from file extensions and common patterns (e.g. a `.scss` change means style details, `.js/.ts` means logic details), and remind the user to fill in the details.
2. Determine the primary type of the change, and pick `type` and `scope`.
3. Write an English `subject` (at most 72 characters, imperative mood), then add at least one technical body item.
4. Add a footer when needed.
5. Output plain text that can be used directly with `git commit -m`.

## Guidelines

- The generated commit message **must** contain at least one technical description; vague descriptions such as "updated styles" are not acceptable.
- If the information the user provided is not enough to describe the technical details, infer from common patterns and remind the user afterwards to fill in as needed.
- Keep the output structured, traceable, and readable for developers.
