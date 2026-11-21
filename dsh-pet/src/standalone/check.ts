/**
 * 独立模式体检：只读取配置与 Electron 解析结果并打印报告。
 *
 * 不启动宿主、不建窗口、不发网络请求，因此不会掩盖桌宠没出现的现场。
 * 依赖插件自己的纯模块，与运行时读的是同一份配置和同一套解析规则。
 * 必须始终成立：报告只描述事实，缺包内默认配置时以非零码退出。
 * @module dsh-pet/src/standalone/check
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { flattenPetList, readAllConfig } from '../host/config.ts';
import {
  dshHomeDir,
  electronLandingDir,
  hasGraphicalDisplay,
  packageRoot,
  resolveElectronPath,
} from '../host/helper-process.ts';
import type { StandaloneLogger } from './context.ts';
import { configPathsFor, describePets, isDesktopVisible } from './options.ts';

/** 读包版本，读不到时返回 unknown。 */
export function packageVersion(root: string): string {
  try {
    const parsed = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version?: unknown };
    return typeof parsed.version === 'string' ? parsed.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * 打印体检报告。
 * @param logger - 输出目标。
 * @returns 进程退出码：0 表示就绪，1 表示缺包内默认配置或配置读不出来。
 */
export function runCheck(logger: StandaloneLogger): number {
  const home = dshHomeDir();
  const paths = configPathsFor(packageRoot, home);
  const electron = resolveElectronPath();
  const lines: string[] = [
    `Node            ${process.version} (${process.platform}-${process.arch})`,
    `Plugin          dsh-pet@${packageVersion(packageRoot)}  ${packageRoot}`,
    `DSH_HOME        ${home}`,
    `User config     ${paths.userFile}${existsSync(paths.userFile) ? '' : ' (missing → using bundled default)'}`,
    `File pet dir    ${paths.petDir}${existsSync(paths.petDir) ? '' : ' (missing)'}`,
    `Bundled config  ${paths.defaultFile}${existsSync(paths.defaultFile) ? '' : '  ✗ missing'}`,
    `Electron        ${electron ?? `not found (downloaded on first run to ${electronLandingDir()})`}`,
    `Display         ${
      hasGraphicalDisplay() ? 'yes' : 'no (desktop window skipped; set DSH_PET_DESKTOP_FORCE=1 for remote desktop/Xvfb)'
    }`,
  ];

  const fail = (message: string): number => {
    // 先打完整报告再报错，读者能一次看到全部环境信息。
    for (const line of lines) logger.info(line);
    logger.error(message);
    return 1;
  };

  if (!existsSync(paths.defaultFile)) {
    // 直接跑源码时包根会指向 src/，这里提示改用构建产物。
    return fail(
      'Bundled default config is unreadable: you are most likely running the source directly ' +
        '(the package root resolved to src/). For standalone mode use the build output: ' +
        'run npm run bundle, then node lib/standalone.js, or npm run standalone.',
    );
  }

  try {
    const merged = readAllConfig(paths);
    const entries = Object.keys(merged);
    lines.push(`Config entries  ${entries.length}: ${entries.join(', ') || '(none)'}`);
    for (const entry of entries) {
      // 按条目汇总宠物数与 idle 动画数，便于发现空配置。
      const conf = merged[entry] ?? {};
      const pets = Array.isArray(conf.pets) ? (conf.pets as Record<string, unknown>[]) : [];
      const animations = conf.animations as { idle?: unknown[] } | undefined;
      const idle = Array.isArray(animations?.idle) ? animations.idle.length : 0;
      lines.push(`  entry ${entry}: ${pets.length} pet(s)  ${describePets(pets)} | idle animations ${idle}`);
    }
    const desktopVisible = flattenPetList(merged).filter(isDesktopVisible);
    // 只有 display 为 desktop 或 both 的宠物会真的出现在桌面上。
    lines.push(
      `Desktop window  ${desktopVisible.length} pet(s)${
        desktopVisible.length === 0
          ? ' (display must be desktop or both, otherwise standalone mode has no pet to show)'
          : ''
      }`,
    );
    for (const line of lines) logger.info(line);
    logger.info('Ready: config and Electron are in place — start with npm run standalone.');
    return 0;
  } catch (error) {
    return fail(`Failed to read config: ${error instanceof Error ? error.message : String(error)}`);
  }
}
