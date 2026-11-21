#!/usr/bin/env node
/**
 * 独立模式入口：不启动 DSH，直接在本机运行桌宠。
 *
 * 负责把伪 ctx、本机 HTTP 服务与桌面 Helper 串成一条启动路径，并处理收尾与退出码。
 * 不实现路由、配置读取或窗口逻辑，这些都复用插件与宿主半侧的实现。
 * 必须始终成立：服务先监听再 apply，所有退出入口共用同一套收尾流程。
 * @module dsh-pet/src/standalone/cli
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { flattenPetList, readAllConfig } from '../host/config.ts';
import { dshHomeDir, packageRoot } from '../host/helper-process.ts';
import { apply } from '../host/index.ts';
import { defaultLog, setDefaultLogger } from '../host/log-file.ts';
import { runCheck, packageVersion } from './check.ts';
import { createStandaloneAi } from './ai-provider.ts';
import { createRequestSecurity } from './request-security.ts';
import { writeStandaloneRuntime } from './runtime-state.ts';
import { createStandaloneContext, type RegisteredRoute, type StandaloneLogger } from './context.ts';
import { createStandaloneLogger } from './logger.ts';
import { configPathsFor, describePets, isDesktopVisible, parseArgs, USAGE } from './options.ts';
import { listenStandaloneServer } from './server.ts';
import { serviceLabel } from './services.ts';
import { ROUTE_SEGMENT } from '../shared/constants.ts';

/** 启动独立模式：先起服务拿到端口，再 apply。 */
async function run(logger: StandaloneLogger, options: { port: number }): Promise<void> {
  const home = dshHomeDir();
  const paths = configPathsFor(packageRoot, home);

  // 包内默认配置缺失时宿主半侧每个请求都会失败，先给可操作的诊断。
  if (!existsSync(paths.defaultFile)) {
    logger.error(
      `Bundled default config is missing: ${paths.defaultFile}. If you are running the source directly ` +
        '(the package root resolved to src/), use the build output instead: run npm run bundle, ' +
        'then node lib/standalone.js (or npm run standalone).',
    );
    process.exitCode = 1;
    return;
  }

  const routes: RegisteredRoute[] = [];
  // /shutdown 的回调要在建服务时交出，而收尾函数要在服务之后定义：
  // 用可替换的转发器解耦，让服务构造时只拿到「将来会是谁」。
  let forwardShutdown: (reason: string) => void = () => {};
  const portRef = { value: options.port };
  const ai = createStandaloneAi(home, logger);
  const security = createRequestSecurity();
  const context = createStandaloneContext({
    port: () => portRef.value,
    logger,
    routes,
    ai,
    authenticatedUrl: security.authenticatedUrl,
    // 托盘退出与 POST /shutdown 走同一条收尾路径。
    shutdown: (reason) => forwardShutdown(reason),
  });
  // 收尾函数要在服务之后定义（见 forwardShutdown 的说明）。
  const server = await listenStandaloneServer({
    routes,
    logger,
    port: options.port,
    security,
    ai,
    status: () => ({
      name: 'dsh-pet-standalone',
      pid: process.pid,
      pluginRoot: packageRoot,
      plugin: { root: packageRoot, version: packageVersion(packageRoot) },
      port: portRef.value,
      uptimeSec: Math.round(process.uptime()),
    }),
    onShutdown: () => forwardShutdown('POST /shutdown'),
  });
  portRef.value = server.port;
  let releaseRuntime: () => void;
  try {
    releaseRuntime = writeStandaloneRuntime(home, {
      port: server.port,
      token: security.token,
      settingsUrl: security.authenticatedUrl(`http://127.0.0.1:${server.port}`),
      pluginRoot: packageRoot,
    });
  } catch (error) {
    await context.dispose();
    await server.close();
    throw error;
  }

  let shuttingDown = false;
  const shutdown = async (reason: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Shutting down (${reason})…`);
    // 先释放插件注册的 effect（停 Helper、清周期定时器），再关服务。
    try {
      await context.dispose();
    } finally {
      await server.close();
      releaseRuntime();
    }
    logger.info('Exited.');
  };
  const requestShutdown = (reason: string): void => {
    shutdown(reason)
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        logger.error(`Shutdown failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      });
  };
  forwardShutdown = (reason) => requestShutdown(reason);
  process.on('SIGINT', () => requestShutdown('SIGINT'));
  process.on('SIGTERM', () => requestShutdown('SIGTERM'));

  // 这一句里注册路由表、状态仓与桌面 Helper（含 bridge 管道）。
  apply(context.ctx);

  let pets: Record<string, unknown>[] = [];
  let configSource = paths.userFile;
  try {
    pets = flattenPetList(readAllConfig(paths));
    if (!existsSync(paths.userFile)) configSource = `${paths.userFile} (missing → using bundled default)`;
  } catch (error) {
    logger.warn(
      `Failed to read config (the server keeps running; the affected endpoints will report errors): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const desktopVisible = pets.filter(isDesktopVisible);
  for (const line of [
    '',
    '===== dsh-pet standalone mode (no DSH required) =====',
    `  Plugin      dsh-pet@${packageVersion(packageRoot)}  ${packageRoot}`,
    `  Routes      http://127.0.0.1:${server.port}${ROUTE_SEGMENT}/`,
    `  Config      ${configSource}`,
    `  Pets        ${describePets(pets)}`,
    desktopVisible.length === 0
      ? '  Desktop     0 pets: display must be desktop or both for the transparent window to appear (the server keeps running)'
      : `  Desktop     ${desktopVisible.length} pet(s)`,
    ai.isReady()
      ? '  AI          local API enabled; automatic whispers follow the settings toggle'
      : '  AI          not configured or disabled; no model requests are sent; right-click "Open AI settings" to configure it locally',
    ai.getSettings().service === 'custom'
      ? '  Balance     custom providers have no balance endpoint; to check balance, switch the provider to DeepSeek official / opencode Go / commandcode'
      : `  Balance     follows the ${serviceLabel(ai.getSettings().service)} provider; click "Query balance" on the settings page`,
    '  Unavailable Session working state / DSH system notifications',
    '  Exit        Ctrl+C, POST /shutdown, or "Exit" in the desktop tray menu',
    '',
  ]) {
    logger.info(line);
  }
  if (context.failures.length > 0) {
    logger.warn(
      `${context.failures.length} item(s) failed during initialization (see the log above); routes still work and the affected endpoints will report errors`,
    );
  }
}

/** CLI 入口，返回进程退出码。 */
async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if ('error' in parsed) {
    console.error(`dsh-pet-standalone: ${parsed.error}\n`);
    console.error(USAGE);
    return 2;
  }
  const { options } = parsed;
  if (options.help) {
    console.log(USAGE);
    return 0;
  }
  // 独立模式常常没有终端，日志必须同时落盘；插件会复用同一个 logger。
  const logger = createStandaloneLogger({ file: join(dshHomeDir(), 'dsh-pet', 'logs.txt') });
  // 纯模块没有 ctx.logger，靠默认出口落盘。
  setDefaultLogger(logger);
  if (options.check) return runCheck(logger);
  await run(logger, options);
  return 0;
}

// 本文件就是 bin 指向的可执行入口，因此无条件启动；
// import.meta.main 需要 Node 24+，而 argv[1] 比较在 pnpm 的 bin 符号链接下会判错。
main()
  .then((code) => {
    if (code !== 0) process.exit(code);
  })
  .catch((error: unknown) => {
    defaultLog(
      'error',
      `dsh-pet-standalone: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    );
    process.exit(1);
  });
