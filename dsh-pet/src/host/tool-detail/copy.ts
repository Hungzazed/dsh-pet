/**
 * 气泡文案表：工具名 → 一句话，命令名 → 一句话。
 *
 * 纯数据，不含判定；加工具或改语气只改这里。
 * 必须始终成立：每句都带具体对象，不说空话；不出现参数值（可能含 token 或内网地址）。
 * @module dsh-pet/src/host/tool-detail/copy
 */
import { fileTarget, filesTarget, firstStr, queryTarget, urlHost } from './target.ts';

/** 句子里可用的占位符：{target} 目标名、{cmd} 命令名。 */
export type CopyLine = string;

/** 从解析后的参数里取「目标」（文件名 / 搜索词 / 域名…）；取不到 → null。 */
type TargetPicker = (args: Record<string, unknown>) => string | null;

/** 只描述「怎么取目标」，不含任何文案（文案全部在下面的表里）。 */
export interface ToolRule {
  pick: TargetPicker;
  /**
   * 目标是不是路径：只有路径才做「太长只留文件名」的压缩。
   * 描述、搜索词、域名这类文本不该被 `/` 切开。
   */
  path?: boolean;
}

/** 文件名/图片类：每句都带 {target}。 */
const FILE_COPY: readonly CopyLine[] = ['Let me flip through {target}', "What's in {target}?", "I'll peek at {target}"];

/** 写文件。 */
const WRITE_COPY: readonly CopyLine[] = [
  'Writing into {target}',
  '{target} is coming right up',
  'Adding a pinch to {target}',
];

/** 改文件。 */
const EDIT_COPY: readonly CopyLine[] = [
  '{target} needs a little fixing',
  "I'll tinker with {target}",
  'Gotta patch up {target}',
];

/** 找文件。 */
const GLOB_COPY: readonly CopyLine[] = [
  'Where is {target} hiding?',
  'Let me look for {target}',
  'Which corner is {target} in?',
];

/** 搜内容。 */
const GREP_COPY: readonly CopyLine[] = [
  'Where has {target} gone?',
  'Let me search for {target}',
  'Where is {target} at?',
];

/** 给人看文件。 */
const PRESENT_COPY: readonly CopyLine[] = [
  'Here, look at {target}',
  'Let me show you {target}',
  'Ta-da, {target} is right here',
];

/** 学技能。 */
const SKILL_COPY: readonly CopyLine[] = [
  'Learning a new trick: {target}',
  'Remember this move: {target}',
  "Let's pick up {target}",
];

/** 委派子任务。 */
const SUBAGENT_COPY: readonly CopyLine[] = [
  'Calling in a helper: {target}',
  'Helper will check {target}',
  'Handed {target} to a helper',
];

/** 一个工具的文案：3 句带 {target} 的说法 + 目标太长时的一句纯氛围兜底。 */
export interface ToolCopy {
  readonly lines: readonly CopyLine[];
  /** 目标超过 TARGET_DISPLAY_MAX 时用：不出现文件名与工具名（气泡是氛围，不是信息面板） */
  readonly short: CopyLine;
}

/** 工具 → 文案。没列在这里的工具走 UNKNOWN_TOOL_LINE。 */
export const TOOL_COPY: Readonly<Record<string, ToolCopy>> = {
  read: { lines: FILE_COPY, short: 'Let me flip through the code' },
  read_image: {
    lines: ['What does {target} look like?', 'Let me take a peek at {target}', 'What a picture, {target}!'],
    short: 'Let me see what this picture is',
  },
  write: { lines: WRITE_COPY, short: "Let's write something in there" },
  edit: { lines: EDIT_COPY, short: 'This needs a little fixing' },
  str_replace_editor: { lines: EDIT_COPY, short: 'This needs a little fixing' },
  glob: { lines: GLOB_COPY, short: 'Looking for where things are' },
  grep: { lines: GREP_COPY, short: 'Digging around everywhere' },
  present: { lines: PRESENT_COPY, short: 'Got something to show you' },
  skill: { lines: SKILL_COPY, short: 'Learning a new trick' },
  subagent: { lines: SUBAGENT_COPY, short: 'Calling in a helper' },
  subagent_fork: { lines: SUBAGENT_COPY, short: 'Calling in a helper' },
  workflow: {
    lines: ['Lining up the work, off we go', 'Arranging a few things together', 'One thing at a time, in order'],
    short: 'Lining up the work',
  },
  web_search: {
    lines: ['Let me go look up {target}', 'Search will tell: {target}', 'Ask the web: {target}'],
    short: 'Checking the web',
  },
  web_fetch: {
    lines: ['Let me see what {target} has', 'Let me check {target}', "What's on {target}?"],
    short: 'Taking a look online',
  },
};

/** 未知工具：只说一句氛围话，不报工具名（`str_replace_editor` 这种名字上屏很怪）。 */
export const UNKNOWN_TOOL_LINE: CopyLine = 'What does this tool even do';

/** 兜底：没进表的命令（npm / python / node / tsc / eslint / docker…），短命令名会上屏。 */
export const COMMAND_FALLBACK: readonly CopyLine[] = [
  "Let's run {cmd}",
  '{cmd} is running now',
  'Giving {cmd} some work to do',
];

/** 兜底：命令名本身太长（如 Get-NetTCPConnection）时用，不带名字。 */
export const COMMAND_NAME_TOO_LONG: CopyLine = "Let's run a command";

const CD_COPY: readonly CopyLine[] = [
  'Let me move somewhere first',
  'Heading to that directory',
  'Moving somewhere else to keep working',
];

const LS_COPY: readonly CopyLine[] = ['Let me see what is here', 'What all is on this level', 'Checking around here'];

const CAT_COPY: readonly CopyLine[] = [
  'Let me bring the content out',
  'Seeing what is written inside',
  'Reading through this content',
];

const MKDIR_COPY: readonly CopyLine[] = ['Making a new folder', 'Clearing out a spot', 'Opening a new directory'];

const RM_COPY: readonly CopyLine[] = [
  'Clearing out the unneeded bits',
  "This one doesn't need to stay",
  'Cleaning these up',
];

const MV_COPY: readonly CopyLine[] = [
  'Moving things to another spot',
  'Putting it somewhere else',
  'Over to that side',
];

const CP_COPY: readonly CopyLine[] = ['Copying one to keep', 'Making a spare copy', 'One more copy as backup'];

const CURL_COPY: readonly CopyLine[] = [
  'Knocking to see if the API answers',
  'Knock knock, is it reachable?',
  'Sending a request to that address',
];

const CHECKOUT_COPY: readonly CopyLine[] = [
  'Switching over to that branch',
  'Let me try another branch',
  'Taking another route',
];

/** 命令 / 「命令 子命令」→ 3 句候选（键一律小写，别名共用同一组）。 */
export const COMMAND_COPY: Readonly<Record<string, readonly CopyLine[]>> = {
  cd: CD_COPY,
  'set-location': CD_COPY,
  ls: LS_COPY,
  dir: LS_COPY,
  'get-childitem': LS_COPY,
  cat: CAT_COPY,
  'get-content': CAT_COPY,
  mkdir: MKDIR_COPY,
  'new-item': MKDIR_COPY,
  rm: RM_COPY,
  del: RM_COPY,
  'remove-item': RM_COPY,
  mv: MV_COPY,
  'move-item': MV_COPY,
  cp: CP_COPY,
  'copy-item': CP_COPY,
  curl: CURL_COPY,
  'invoke-webrequest': CURL_COPY,

  // git：没命中子命令时用这一组
  git: ['Tinkering with the git repo', 'Having a word with git', 'Poking at things in git'],
  'git status': ['Seeing what changed just now', 'Checking if the workspace is clean', "So what's the situation?"],
  'git diff': ['Let me see what changed this time', 'Which spots got touched?', 'Comparing to see all the changes'],
  'git log': [
    'Let me peek at your commit history',
    'Flipping through the recent commits',
    'Seeing what happened these days',
  ],
  'git add': ['Gathering these up first', 'Putting the good stuff in', 'Registering all the changes'],
  'git commit': ['The code needs to be saved', 'Making a commit, one for the books', 'Saving a copy first'],
  'git push': ['Time to push, let me do it', 'Pushing it up, leave it to me', 'The remote should know'],
  'git pull': ['Pulling the latest over', 'Bringing back the remote news', 'Syncing up first'],
  'git fetch': ['Asking the remote for news first', 'Sneaking a peek at the remote', 'Pulling down the latest state'],
  'git checkout': CHECKOUT_COPY,
  'git switch': CHECKOUT_COPY,
  'git branch': ['Seeing which branches exist', 'Sorting out these branches', 'Making a spare branch'],
  'git merge': ['Joining the two sides', 'Merging, no fighting', 'These two lines should meet'],
  'git rebase': ['Combing through the history', 'Reordering things a bit', 'Tidying up the commit order'],
  'git stash': ['Putting the changes away first', 'Setting these aside', 'Hiding it for a moment'],
  'git clone': ['Moving the whole repo over', 'Copying one over the same way', 'Fetching this one down to look'],
  'git reset': ['Rewinding what just happened', 'Undoing these steps', 'Back to how it was'],
  'git tag': ['Marking this one', 'Sticking a version label on', 'Noting a milestone'],
};

/**
 * 语义已由别处表达、不该进气泡的工具：
 * `todo_write` 的文案本身就是气泡正文（写它等于自己盖自己）；`ask_user_question` 与 goal 系已有
 * 专门档位（waiting / success / error）；`exit_plan_mode` 是纯内部调度。
 * 这些报出来不是重复就是噪音。
 */
export const SILENT_TOOLS: ReadonlySet<string> = new Set([
  'todo_write',
  'ask_user_question',
  'create_goal',
  'get_goal',
  'update_goal',
  'exit_plan_mode',
]);

/** 取目标的方式（与文案表按工具名关联；pwsh 不在这里，它走命令表）。 */
export const TOOL_RULES: Readonly<Record<string, ToolRule>> = {
  read: { pick: fileTarget, path: true },
  read_image: { pick: fileTarget, path: true },
  write: { pick: fileTarget, path: true },
  edit: { pick: fileTarget, path: true },
  str_replace_editor: { pick: fileTarget, path: true },
  glob: { pick: (args) => firstStr(args, ['pattern', 'path']) },
  grep: { pick: (args) => firstStr(args, ['pattern', 'path']) },
  web_fetch: { pick: urlHost },
  web_search: { pick: queryTarget },
  subagent: { pick: (args) => firstStr(args, ['description']) },
  subagent_fork: { pick: (args) => firstStr(args, ['description']) },
  workflow: { pick: (args) => firstStr(args, ['name', 'description']) },
  skill: { pick: (args) => firstStr(args, ['name']) },
  present: { pick: filesTarget, path: true },
};
