---
name: dsh-pet-dev
description: "Development charter for this repository (the dsh-pet pet plugin): chains task boundaries, plugin code standards, comment standards, and commit standards into a single execution chain, so one invocation covers the whole path from changing code to committing."
whenToUse: "Use when changing any code, comments, documentation, or preparing a commit in this repository: when the user says “change this”, “add a feature”, “fix it”, “commit and push”, or when the user manually invokes dsh-pet-dev."
metadata:
  language: "en"
  category: "development"
disable-model-invocation: true
user-invocable: true
---

# dsh-pet Development Charter (dsh-pet-dev)

## Goal

The only entry-point skill of this repository. It does not repeat the content of the four standards; it answers one thing: **which sub-skills this request should invoke, and in what order**.

The four sub-skills are the authoritative text; this file is the index and order table. When the two conflict, the sub-skills win.

## The Four Sub-Skills

| Sub-skill | When it must be invoked |
| --- | --- |
| `task-guardrails` | The first step of every request, before any tool call |
| `dsh-plugin-standards` | When touching host/client source, adding or deleting files, changing interfaces, or adding tests |
| `dsh-plugin-comment-spec` | Invoked together with `dsh-plugin-standards`: writing code means writing comments |
| `git-commit` | When committing, or when writing or rewriting a commit message |

All four sub-skills are registered; hand them to the `skill` tool by name — no need to find files and no need to read files. Gate commands run in the `dsh-pet/` subdirectory.

## Execution Chain

Follow the order; do not skip steps, and do not invoke everything at once.

1. **Classify the request** (`task-guardrails`): pure conversation / read-only investigation / change required. When the classification is unclear, lean to the more conservative category.
2. **Speak before touching tools**: state your understanding and what you plan to look at; even read-only work requires speaking first.
3. **Stop before write operations**: state “what to change, what effect to achieve, how to verify”, then wait for a reply with the dialog. Announcing is not approval.
4. **Before touching code, invoke `dsh-plugin-standards` and `dsh-plugin-comment-spec` together**: the former defines the plugin type, file size, directory ownership, export surface, and test location; the latter defines module-header tiers, one-line summaries for exported symbols, and writing only why. Code always comes with comments; do not split this into two steps.
5. **Run the gates at the end** (in `dsh-pet/`): `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run check:cycles`, `npm run check:runtime`, `npm run check:openapi`, `npm test`, `npm run build`. Do not say “verified” for something you have not run.
6. **Invoke `git-commit` when committing**: infer `type(scope)` from the actual diff, and write the implementation approach, behavior changes, and affected files in the body; pushing requires an explicit instruction.

## How to Invoke

- Invoke on demand, not all at once: for pure Q&A invoke none; for read-only investigation invoke only `task-guardrails`; when changing code invoke `task-guardrails`, `dsh-plugin-standards`, and `dsh-plugin-comment-spec` together; for committing invoke `git-commit`.
- The same sub-skill only needs to be invoked once per task; do not invoke it repeatedly, and do not restate its rules from memory.
- This skill is triggered only when the user names it; the four sub-skills are invoked by the AI as needed, and the user may also name them directly.

## Conflicts and Priority

- **Boundaries first**: `task-guardrails` decides “whether you may act”, `dsh-plugin-standards` / `dsh-plugin-comment-spec` decide “how to write”, and `git-commit` decides “how to record”. When a standard conflicts with a boundary, satisfy the boundary first.
- **Report inconsistencies between the standards and the code; do not change them on your own**: if you find that a statement in the standards conflicts with the current state of the repository, explain first and then ask; do not change the standards directly.

## Guidelines

1. Without explicit authorization, produce no side effects: do not write files, do not install dependencies, do not touch Git.
2. Do not treat an example as a task: when the user describes a problem or complains, confirm your understanding first.
3. Delete and leave nothing behind: delete after confirming there are no references; leave no compatibility layer, no old implementation, no commented-out code (unless the user asks for it).
4. Write a fact only once: do not duplicate positioning arithmetic, constants, or types; do not move standard content into this file.
5. Commit messages come from the current diff; do not copy the example text from this skill.
