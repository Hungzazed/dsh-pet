/**
 * 独立模式的命令行解析与路径推导，纯逻辑、零 I/O。
 *
 * 负责把 argv 变成选项，并镜像宿主半侧推导出的配置路径；不读文件、不建目录。
 * 路径口径以宿主半侧为准，这里只是只读镜像，测试会钉住两者一致。
 * 必须始终成立：--check 不 apply 也能算出 DSH 会读的配置路径。
 * @module dsh-pet/src/standalone/options
 */
import { join } from 'node:path';

import type { ConfigPaths } from '../host/config.ts';
import { DEFAULT_STANDALONE_PORT } from './server.ts';

/** 解析后的命令行选项。 */
export interface CliOptions {
  port: number;
  check: boolean;
  help: boolean;
}

/** --help 正文。 */
export const USAGE = `dsh-pet standalone mode (no DSH required)

Usage: dsh-pet-standalone [options]

Options:
  --port <port>   Listen port (default ${DEFAULT_STANDALONE_PORT}; scans forward when taken)
  --check         Health check only: print config sources, pet list and Electron status; open no window
  -h, --help      Show this help

Notes:
  Standalone mode runs the pet in a transparent always-on-top window; the in-browser overlay needs a DSH web page, which standalone mode does not provide.
  Chat and whispers become available after an API is configured on the local AI settings page; no model requests are sent until then.
  Balance / DSH session working state / system notifications still require the DSH host.
`;

/**
 * 解析 argv。
 * @param argv - 已去掉 node 与脚本路径的参数。
 * @returns 选项，或带 error 的失败结果，由调用方打印用法并以 2 退出。
 */
export function parseArgs(argv: string[]): { options: CliOptions } | { error: string } {
  const options: CliOptions = { port: DEFAULT_STANDALONE_PORT, check: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? '';
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--port' || arg.startsWith('--port=')) {
      const raw = arg === '--port' ? String(argv[index + 1] ?? '') : arg.slice('--port='.length);
      if (arg === '--port') index += 1;
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 1 || value > 65535) {
        return { error: `--port expects an integer port in 1..65535, got ${JSON.stringify(raw)}` };
      }
      options.port = value;
    } else {
      return { error: `Unknown argument: ${arg}` };
    }
  }
  return { options };
}

/**
 * 推导配置路径集（宿主半侧那份推导的只读镜像）。
 * @param root - 插件包根目录。
 * @param home - DSH_HOME。
 * @returns 与宿主半侧一致的路径集。
 */
export function configPathsFor(root: string, home: string): ConfigPaths {
  const userRoot = join(home, 'dsh-pet');
  return {
    defaultFile: join(root, 'assets', 'config.jsonc'),
    userFile: join(userRoot, 'main-config.jsonc'),
    legacyUserFile: join(userRoot, 'main-config.json'),
    petDir: join(userRoot, 'pet'),
  };
}

/** 宠物列表的展示串：display 原样打印，供用户确认。 */
export function describePets(pets: Record<string, unknown>[]): string {
  if (pets.length === 0) return '(no pets: the config pets list is empty)';
  return pets
    .map((pet) => `${String(pet.id ?? '?')}(size=${String(pet.size ?? '?')}, display=${String(pet.display ?? '?')})`)
    .join('  ');
}

/**
 * 判断实例是否会出现在桌面（display 含 desktop 或 both），只用于提示。
 * @param pet - 宠物条目。
 * @returns 是否会出现在桌面。
 */
export function isDesktopVisible(pet: Record<string, unknown>): boolean {
  const display = pet.display;
  return display === 'desktop' || display === 'both';
}
