/**
 * check-english-visible: report leftover CJK (Chinese) text on the visible product surface.
 *
 * The repository-wide gate (`npm run check:english`) is expected to stay non-empty while the
 * visible wave is frozen: comments, test names, test fixtures, documentation and asset names are
 * deferred to later waves. This check proves the narrower claim — the literals a user can
 * actually see, plus the desktop-helper sources, carry no Chinese — by parsing the TypeScript AST
 * and reporting only *string-like literals*. Comments are not literals, so deferred comment
 * translation cannot make this check fail.
 *
 * What is scanned:
 * - `src/**\/*.ts` except `src/**\/*.test.ts` (product literals live here);
 * - `runtime/electron-helper/**\/*.js` (desktop helper sources);
 * - `runtime/electron-helper/**\/*.html` after removing HTML and CSS comments.
 *
 * Escape sequences are never findings: the check reads the *raw* source slice of each literal, so
 * `'\u5e02'` is plain ASCII and stays invisible, exactly like the network data it represents
 * (see `src/host/weather.ts`).
 *
 * Exceptions are the fork decisions listed on EXCLUDED_DIRECTORIES / EXCLUDED_FILES and on
 * FONT_MARKERS below; every one of them keeps Chinese text on purpose.
 *
 * Usage:
 *   node scripts/check-english-visible.mjs           human-readable report
 *   node scripts/check-english-visible.mjs --help    this text
 *
 * Exit codes: 0 = no findings, 1 = findings were reported, 2 = the check could not run (missing
 * source tree, unreadable file, bad arguments). The scan is limited to package sources and needs
 * no build step.
 * @module dsh-pet/scripts/check-english-visible
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
/** Package root: the directory that owns `src/` and `runtime/`. */
const ROOT = dirname(SCRIPTS_DIR);

// Chinese characters plus the CJK punctuation block, same ranges as the repository-wide gate.
const CJK_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F]/;

const MAX_PREVIEW_CHARS = 120;

// Directories that legitimately keep Chinese text. Every entry is a fork decision, not an
// oversight:
// - locale dictionaries are the i18n layer the owner froze (out of scope for the rework);
// - `standalone/settings-page/` assembles the settings page from template-string pieces whose CJK
//   is confined to comments.
const EXCLUDED_DIRECTORIES = [
  'src/client/settings/locales/',
  'src/client/chat/locales/',
  'src/standalone/settings-page/',
];

// Individual files that legitimately keep Chinese text:
// - `shared/menu/labels.ts` maps Chinese asset keys to English labels; the keys are file/animation
//   names that must not be renamed (decision D3);
// - `client/chat/panel-css.ts` keeps Chinese only inside CSS comments of a CSS template string;
// - `host/chat.ts` and `host/chat-action.ts` use the `[action:]/[image:]` protocol markers that
//   stay verbatim in stored chat history (decision D7);
// - `runtime/electron-helper/shared-core.js` is generated from `src/shared` by
//   `npm run build:desktop-core` and is git-ignored; its content mirrors sources this check
//   already classifies, so scanning the stale bundle would only duplicate/dilute findings.
const EXCLUDED_FILES = new Set([
  'src/shared/menu/labels.ts',
  'src/client/chat/panel-css.ts',
  'src/host/chat.ts',
  'src/host/chat-action.ts',
  'runtime/electron-helper/shared-core.js',
]);

// Font stacks are asset names, not product copy: the owner keeps the bundled font's Chinese
// aliases in `font-family` / `@font-face` declarations, so a literal that declares the stack is
// skipped even though it contains CJK.
const FONT_MARKERS = ['font-family', '@font-face', 'truetype', 'ShangshouSoftCandy'];

/** Print the usage text and exit successfully. */
const printHelp = () => {
  console.log(`check-english-visible: report leftover CJK text on the visible product surface.

Usage:
  node scripts/check-english-visible.mjs [--help]

Scanned: src/**/*.ts (except *.test.ts), runtime/electron-helper/**/*.js and *.html.
Skipped on purpose: locale dictionaries, Chinese asset keys in shared/menu/labels.ts,
CSS-comment templates, D7 protocol markers, font-family declarations and the generated
runtime/electron-helper/shared-core.js bundle.

Exit codes:
  0  no CJK in visible literals
  1  findings were reported
  2  the check could not run (missing source tree, unreadable file, bad arguments)`);
};

/** Exit with a clear diagnostic; used for every condition that prevents a meaningful scan. */
const abort = (message) => {
  console.error(`check-english-visible: ${message}`);
  process.exit(2);
};

/** True when a package-relative path is exempted by an explicit fork decision above. */
const isExcluded = (path) => EXCLUDED_FILES.has(path) || EXCLUDED_DIRECTORIES.some((prefix) => path.startsWith(prefix));

/**
 * Recursively collect files under `dir` whose name ends with one of `extensions`.
 *
 * @param {string} dir - absolute directory to walk.
 * @param {string[]} extensions - file name suffixes to keep.
 * @returns {string[]} absolute file paths, sorted for a deterministic scan.
 */
const collectFiles = (dir, extensions) => {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    abort(`cannot read directory ${dir}: ${error.message}`);
  }
  const found = [];
  for (const entry of entries) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectFiles(absolute, extensions));
    else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) found.push(absolute);
  }
  return found.sort();
};

/** Package-relative path with forward slashes, independent of the host path separator. */
const relativePathOf = (absolute) => relative(ROOT, absolute).split(sep).join('/');

/**
 * One-line preview of a literal, short enough to stay readable in a terminal.
 *
 * @param {string} raw - raw source slice of the literal.
 * @returns {string} at most {@link MAX_PREVIEW_CHARS} characters, newlines spelled as `\n`.
 */
const previewOf = (raw) => {
  const oneLine = raw.replace(/\r\n|\r|\n/g, '\\n');
  return oneLine.length <= MAX_PREVIEW_CHARS ? oneLine : `${oneLine.slice(0, MAX_PREVIEW_CHARS - 1)}…`;
};

/** Findings about literals, one per string-like node that still contains CJK. */
const findings = [];

/** True when the AST node is a string-like literal whose text a user could ever see. */
const isScannedLiteral = (node) =>
  ts.isStringLiteral(node) ||
  ts.isNoSubstitutionTemplateLiteral(node) ||
  ts.isTemplateHead(node) ||
  ts.isTemplateMiddle(node) ||
  ts.isTemplateTail(node) ||
  ts.isJsxText(node);

/**
 * Walk the TypeScript/JavaScript AST of one file and record CJK string literals.
 *
 * @param {string} path - package-relative path of the file.
 * @param {string} text - file content.
 */
const scanScript = (path, text) => {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    if (isScannedLiteral(node)) {
      // The RAW slice is what matters: `'\u5e02'` reads as ASCII and is data, not UI copy.
      const start = node.getStart(sourceFile);
      const raw = sourceFile.text.slice(start, node.getEnd());
      if (CJK_RE.test(raw) && !FONT_MARKERS.some((marker) => raw.includes(marker))) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
        findings.push({ path, line: line + 1, column: character + 1, preview: previewOf(raw) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
};

/**
 * Scan one HTML file after blanking out HTML and CSS comments.
 *
 * Comments are deferred-wave material, so they are removed before scanning; the blanking keeps
 * their newlines, which keeps the reported line numbers aligned with the file on disk.
 *
 * @param {string} path - package-relative path of the file.
 * @param {string} text - file content.
 */
const scanHtml = (path, text) => {
  const blankComment = (comment) => comment.replace(/[^\n]/g, '');
  const visible = text.replace(/<!--[\s\S]*?-->/g, blankComment).replace(/\/\*[\s\S]*?\*\//g, blankComment);
  const lines = visible.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const column = line.search(CJK_RE);
    if (column === -1) continue;
    findings.push({ path, line: index + 1, column: column + 1, preview: previewOf(line.trim()) });
  }
};

// ---------------------------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}
if (args.length > 0) abort(`unknown argument(s): ${args.join(', ')}; try --help`);

// ---------------------------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------------------------
const sourceFiles = collectFiles(join(ROOT, 'src'), ['.ts']).filter((file) => !file.endsWith('.test.ts'));
const runtimeFiles = collectFiles(join(ROOT, 'runtime', 'electron-helper'), ['.js', '.html']);
const targetPaths = [...sourceFiles, ...runtimeFiles]
  .map(relativePathOf)
  .filter((path) => !isExcluded(path))
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

let scanned = 0;
for (const path of targetPaths) {
  let text;
  try {
    text = readFileSync(join(ROOT, path), 'utf8');
  } catch (error) {
    abort(`cannot read ${path}: ${error.message}`);
  }
  scanned++;
  if (path.endsWith('.html')) scanHtml(path, text);
  else scanScript(path, text);
}

// Deterministic report: path, then line, then column.
findings.sort((a, b) => {
  if (a.path !== b.path) return a.path < b.path ? -1 : 1;
  if (a.line !== b.line) return a.line - b.line;
  return a.column - b.column;
});

const problemFiles = new Set(findings.map((finding) => finding.path));

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
for (const finding of findings) {
  console.log(`${finding.path}:${finding.line}:${finding.column}: ${finding.preview}`);
}
console.log('');
console.log(`${findings.length} findings in ${problemFiles.size} files (${scanned} files scanned)`);
// Never process.exit() after writing the report: stdout is non-blocking for pipes, so exiting
// would cut the report off before it drains. Setting exitCode lets the process end when it flushes.
process.exitCode = findings.length > 0 ? 1 : 0;
