/**
 * 内置路由处理器：设置页、连通性自检与模型清单。
 *
 * 不负责分发与监听；请求体已由上层解析并限长。
 * 必须始终成立：设置页只回本机数据，绝不回显凭据。
 * @module dsh-pet/src/standalone/server/handlers
 */
import { publicSettings, validateSettings, type StandaloneSettingsService } from '../settings.ts';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import { rejectRequest } from '../request-security.ts';
import type { ModelDiscoveryInput } from '../ai-provider/types.ts';
import { sendJson } from './respond.ts';

/** 读完请求体并解析成 JSON；空体当作空对象。 */
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    req.once('end', resolve);
    req.once('error', reject);
  });
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

/** 只接受对象形态的草稿；数组、标量与 null 一律当未填。 */
function asDraft(body: unknown): ModelDiscoveryInput {
  return body !== null && typeof body === 'object' && !Array.isArray(body) ? (body as ModelDiscoveryInput) : {};
}

/**
 * 创建设置读写处理器（GET 读，POST 存）。
 * @param ai - 设置服务。
 * @returns 处理请求的异步函数。
 */
export function settingsHandler(
  ai: StandaloneSettingsService | undefined,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  let windowStart = Date.now();
  let count = 0;
  return async (req, res) => {
    if (!ai) {
      rejectRequest(res, 503, 'Local AI settings are not ready yet');
      return;
    }
    if (req.method === 'GET') {
      sendJson(res, 200, publicSettings(ai.getSettings()));
      return;
    }
    if (req.method !== 'POST') {
      rejectRequest(res, 405, 'Only GET or POST is supported');
      return;
    }
    if (Date.now() - windowStart >= 60000) {
      windowStart = Date.now();
      count = 0;
    }
    count += 1;
    // 保存是重操作，按一分钟窗口限流，避免设置页反复重试打爆磁盘。
    if (count > 20) {
      rejectRequest(res, 429, 'Saving too often; try again later');
      return;
    }
    if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      rejectRequest(res, 415, 'Send settings as JSON');
      return;
    }
    try {
      const input = validateSettings(await readJsonBody(req));
      sendJson(res, 200, publicSettings(await ai.saveSettings(input)));
    } catch {
      rejectRequest(
        res,
        400,
        'Settings were not saved: check the endpoint URL, model name, API key and numeric ranges',
      );
    }
  };
}

/**
 * 创建连通性测试处理器（POST）。
 * @param ai - 设置服务。
 * @returns 处理请求的异步函数。
 */
export function testHandler(
  ai: StandaloneSettingsService | undefined,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'POST') {
      rejectRequest(res, 405, 'Only POST is supported');
      return;
    }
    try {
      const input = asDraft(await readJsonBody(req));
      if (ai?.testConnection) sendJson(res, 200, await ai.testConnection(input));
      else sendJson(res, 200, { ok: false, message: 'Connection testing is not configured in this environment' });
    } catch {
      sendJson(res, 400, { ok: false, message: 'Invalid request format' });
    }
  };
}

/**
 * 创建模型清单处理器（POST）。
 * @param ai - 设置服务。
 * @returns 处理请求的异步函数。
 */
export function modelsHandler(
  ai: StandaloneSettingsService | undefined,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'POST') {
      rejectRequest(res, 405, 'Only POST is supported');
      return;
    }
    if (!ai?.discoverModels) {
      sendJson(res, 200, { ok: false, code: 'input', message: 'Model listing is not configured in this environment' });
      return;
    }
    try {
      sendJson(res, 200, await ai.discoverModels(asDraft(await readJsonBody(req))));
    } catch {
      sendJson(res, 400, { ok: false, code: 'input', message: 'Invalid request format' });
    }
  };
}

/**
 * 创建余额查询处理器（POST）。
 *
 * 服务商与密钥都取自已保存的设置，请求体不参与：避免调用方把密钥经查询接口再传一遍。
 * @param ai - 设置服务。
 * @returns 处理请求的异步函数。
 */
export function balanceHandler(
  ai: StandaloneSettingsService | undefined,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'POST') {
      rejectRequest(res, 405, 'Only POST is supported');
      return;
    }
    if (!ai?.queryBalance) {
      sendJson(res, 200, { ok: false, provider: '', reason: 'unsupported' });
      return;
    }
    try {
      sendJson(res, 200, await ai.queryBalance());
    } catch {
      sendJson(res, 200, { ok: false, provider: '', reason: 'fetch-error', message: 'Balance query failed' });
    }
  };
}
