/**
 * check-english: report leftover CJK (Chinese) text in files tracked by git.
 *
 * This is the repository-wide English-only gate: it fails when Chinese characters appear in
 * tracked text files or in tracked file names, except for the tokens declared in
 * `english-allowlist.json` next to this script. It never rewrites or translates anything; it
 * only reports what is left, so the rework can burn the list down.
 *
 * What is scanned: only files `git ls-files -z` reports (so ignored trees such as .npm-cache/ and
 * untracked scratch files are out of scope), and only text formats listed in TEXT_EXTENSIONS and
 * TEXT_NAMES. Directories that may leak into git by accident are skipped defensively.
 *
 * Allowlist model (see `english-allowlist.json`):
 * - wholeFiles: files whose entire content is allowed (Chinese locale dictionaries, the allowlist
 *   itself).
 * - allowedTokenDirs: tokens taken from file names (the Chinese names of meme images and webm
 *   animations; decision D3 keeps file names as-is).
 * - allowedTokens: extra standalone tokens allowed anywhere (the five animation category ids that
 *   also double as menu labels; decision D3 keeps them and adds English labels via a label map).
 * - filenameAllowPrefixes: path prefixes whose file names may contain CJK (asset folders).
 * - protocolMarkerWords: words of the chat history protocol markers (`[image:...]`,
 *   `[action:...]` in the product language); whole `[<word> ...]` fragments are stripped before
 *   scanning because that history is never translated (decision D7).
 * - linePatterns: reserved for future line-level exceptions; entries are not applied yet.
 *
 * Usage:
 *   node scripts/check-english.mjs           human-readable report
 *   node scripts/check-english.mjs --json    machine-readable report
 *   node scripts/check-english.mjs --help    this text
 *
 * Exit codes: 0 = clean, 1 = findings, 2 = cannot run (bad allowlist, bad arguments, I/O).
 * Run from anywhere; the repository root comes from git, not from the current directory.
 * @module dsh-pet/scripts/check-english
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST_PATH = join(SCRIPTS_DIR, 'english-allowlist.json');

// Extensions that are treated as UTF-8 text. Everything else (images, video, fonts, archives) is
// skipped: binary content cannot contain "readable Chinese" and is handled by asset decisions.
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.jsonc',
  '.md',
  '.markdown',
  '.yaml',
  '.yml',
  '.html',
  '.htm',
  '.css',
  '.py',
  '.sh',
  '.bash',
  '.txt',
  '.toml',
  '.swift',
  '.patch',
  '.diff',
]);

// Extensionless files that are text and worth scanning.
const TEXT_NAMES = new Set([
  'LICENSE',
  '.gitattributes',
  '.gitignore',
  '.prettierignore',
  '.editorconfig',
  '.npmrc',
  'CNAME',
]);

// Defensive skips for paths that must never be scanned even if they reach git.
const EXCLUDED_PREFIXES = [
  'dsh-pet/lib/',
  'dsh-pet/runtime/electron-helper/shared-core.js',
  '.npm-cache/',
  'node_modules/',
];

// Chinese characters plus the CJK punctuation block.
const CJK_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F]/;

const MAX_LINE_CHARS = 140;

/** Print the usage text and exit successfully. */
const printHelp = () => {
  console.log(`check-english: report leftover CJK text in git-tracked files.

Usage:
  node scripts/check-english.mjs [--json|--help]

Options:
  --json   print { findings, filenames, summary } as JSON instead of text
  --help   print this help and exit

Allowed Chinese text is declared in scripts/english-allowlist.json:
whole files, per-directory file-name tokens, standalone tokens, filename prefixes,
and chat protocol markers that are stripped before scanning.

Exit codes:
  0  no CJK outside the allowlist
  1  findings were reported
  2  the check could not run (bad allowlist, bad arguments, unreadable file, git failure)`);
};

/** Exit with a clear diagnostic; used for every condition that prevents a meaningful scan. */
const abort = (message) => {
  console.error(`check-english: ${message}`);
  process.exit(2);
};

/** Read and minimally validate the allowlist; a malformed allowlist is a hard failure. */
const readAllowlist = () => {
  let source;
  try {
    source = readFileSync(ALLOWLIST_PATH, 'utf8');
  } catch (error) {
    abort(`cannot read allowlist ${ALLOWLIST_PATH}: ${error.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    abort(`allowlist ${ALLOWLIST_PATH} is not valid JSON: ${error.message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    abort(`allowlist ${ALLOWLIST_PATH} must contain a JSON object`);
  }
  return parsed;
};

/** Return a validated array field from the allowlist (missing means empty). */
const allowlistArray = (allowlist, field) => {
  const value = allowlist[field];
  if (value === undefined) return [];
  if (!Array.isArray(value)) abort(`allowlist field "${field}" must be an array`);
  return value;
};

/** Escape a literal string for embedding in a regular expression. */
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when a repo-relative path must not be touched by this check. */
const isExcluded = (path) =>
  EXCLUDED_PREFIXES.some((prefix) => {
    const bare = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    return path === bare || path.startsWith(`${bare}/`) || path.includes(`/${bare}/`);
  });

/** True when the repo-relative path has a text extension or a known extensionless text name. */
const isTextFile = (path) => {
  const base = path.slice(path.lastIndexOf('/') + 1);
  if (TEXT_NAMES.has(base)) return true;
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return false;
  return TEXT_EXTENSIONS.has(base.slice(dot).toLowerCase());
};

// ---------------------------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}
const jsonMode = args.includes('--json');
const unknownArgs = args.filter((arg) => arg !== '--json');
if (unknownArgs.length > 0) {
  abort(`unknown argument(s): ${unknownArgs.join(', ')}; try --help`);
}

// ---------------------------------------------------------------------------------------------
// Repository root and tracked paths
// ---------------------------------------------------------------------------------------------
let repoRoot;
try {
  repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: SCRIPTS_DIR,
    encoding: 'utf8',
  }).trim();
} catch (error) {
  abort(`cannot locate the git repository root from ${SCRIPTS_DIR}: ${error.message}`);
}
if (!repoRoot) abort('git did not report a repository root');

let trackedPaths;
try {
  // -z is required: the repository tracks non-ASCII path names.
  trackedPaths = execFileSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\0')
    .filter((path) => path !== '');
} catch (error) {
  abort(`git ls-files failed in ${repoRoot}: ${error.message}`);
}

// ---------------------------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------------------------
const allowlist = readAllowlist();

const wholeFiles = new Set(
  allowlistArray(allowlist, 'wholeFiles')
    .map((entry) => (typeof entry === 'string' ? entry : entry?.path))
    .filter((path) => typeof path === 'string' && path !== ''),
);

const filenameAllowPrefixes = allowlistArray(allowlist, 'filenameAllowPrefixes')
  .map((entry) => (typeof entry === 'string' ? entry : entry?.prefix))
  .filter((prefix) => typeof prefix === 'string' && prefix !== '');

const protocolMarkerWords = allowlistArray(allowlist, 'protocolMarkerWords')
  .map((entry) => (typeof entry === 'string' ? entry : entry?.word))
  .filter((word) => typeof word === 'string' && word !== '');

// linePatterns is reserved for future line-level exceptions; validated but not applied yet.
allowlistArray(allowlist, 'linePatterns');

const tokenSet = new Set(
  allowlistArray(allowlist, 'allowedTokens')
    .map((entry) => (typeof entry === 'string' ? entry : entry?.token))
    .filter((token) => typeof token === 'string' && token !== ''),
);
for (const entry of allowlistArray(allowlist, 'allowedTokenDirs')) {
  const dir = entry?.dir;
  const ext = entry?.ext;
  if (typeof dir !== 'string' || dir === '' || typeof ext !== 'string' || ext === '') {
    abort('each "allowedTokenDirs" entry needs string "dir" and "ext" fields');
  }
  let entries;
  try {
    entries = readdirSync(join(repoRoot, dir), { withFileTypes: true });
  } catch (error) {
    abort(`cannot read allowed token directory ${dir}: ${error.message}`);
  }
  for (const dirent of entries) {
    if (dirent.isFile() && dirent.name.endsWith(ext)) {
      const token = dirent.name.slice(0, -ext.length);
      if (token !== '') tokenSet.add(token);
    }
  }
}
// Longest tokens first: a longer allowed name must be removed before a shorter one inside it.
const tokens = [...tokenSet].sort((a, b) => b.length - a.length || (a < b ? -1 : a > b ? 1 : 0));

const markerPattern =
  protocolMarkerWords.length === 0
    ? null
    : new RegExp(`\\[(?:${protocolMarkerWords.map(escapeRegExp).join('|')})[^\\]\\n]*\\]`, 'g');

// ---------------------------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------------------------
/** Findings about file content, one per line that still contains CJK. */
const findings = [];
/** Paths whose file name still contains CJK. */
const filenames = [];
let scanned = 0;

for (const path of trackedPaths) {
  if (isExcluded(path)) continue;
  if (wholeFiles.has(path)) continue;

  if (CJK_RE.test(path) && !filenameAllowPrefixes.some((prefix) => path.startsWith(prefix))) {
    filenames.push(path);
  }

  if (!isTextFile(path)) continue;

  let text;
  try {
    text = readFileSync(join(repoRoot, path), 'utf8');
  } catch (error) {
    abort(`cannot read tracked file ${path}: ${error.message}`);
  }
  scanned++;

  // Protocol markers are part of the stored chat history and are never translated (D7).
  if (markerPattern) text = text.replace(markerPattern, '');
  // Allowed tokens (file names kept by decision D3) are removed before scanning.
  for (const token of tokens) text = text.replaceAll(token, '');

  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const column = line.search(CJK_RE);
    if (column === -1) continue;
    const snippet = line.trim().slice(0, MAX_LINE_CHARS);
    findings.push({ path, line: index + 1, column: column + 1, text: snippet });
  }
}

const byPathThenLine = (a, b) => {
  if (a.path < b.path) return -1;
  if (a.path > b.path) return 1;
  return (a.line ?? 0) - (b.line ?? 0);
};
const byPath = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
findings.sort(byPathThenLine);
filenames.sort(byPath);

// `summary.findings` counts everything the gate reports: content findings plus CJK file names,
// so the human summary line and the JSON summary agree with each other.
const problemFiles = new Set([...findings.map((item) => item.path), ...filenames]);
const totalFindings = findings.length + filenames.length;
const summary = { files: problemFiles.size, findings: totalFindings, scanned };
const hasProblems = totalFindings > 0;

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
if (jsonMode) {
  process.stdout.write(`${JSON.stringify({ findings, filenames, summary }, null, 2)}\n`);
  // Never process.exit() after a large write: stdout is non-blocking for pipes, so exiting would
  // cut the report off before it drains. Setting exitCode lets the process end when writes flush.
  process.exitCode = hasProblems ? 1 : 0;
} else {
  for (const finding of findings) {
    console.log(`${finding.path}:${finding.line}:${finding.column}: ${finding.text}`);
  }
  if (filenames.length > 0) {
    console.log('');
    console.log('CJK in file names:');
    for (const path of filenames) console.log(`  ${path}`);
  }
  console.log('');
  console.log(`${summary.findings} findings in ${summary.files} files (${summary.scanned} files scanned)`);
  process.exitCode = hasProblems ? 1 : 0;
}
