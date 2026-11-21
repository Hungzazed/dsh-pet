/**
 * 「吃白饭」菜单控制器的契约测试 —— 钉住三个判定：读点击的三种输入、注册菜单的前置条件、
 * 点播归属条目的查找。这三个判定不碰 DOM，是这段逻辑里唯一能脱离浏览器断言的部分。
 *
 * 假传输层与假演出只实现被调用的成员；`retryMs` 传负数，让首拍必定进入补注册分支。
 *
 * 跑法：node --experimental-strip-types --test src/client/baifan/menu.test.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import type { ActivityAssets } from './assets.ts';
import { createMenu } from './menu.ts';
import type { Show } from './show.ts';
import type { Transport } from './transport.ts';

/** 记录一次接口调用。 */
interface CallRecord {
  /** HTTP 方法。 */
  method: string;
  /** 路径（不含前缀）。 */
  path: string;
  /** 请求体（有则记录）。 */
  body?: unknown;
}

/** 假传输层：只实现 `call`，其余成员给空实现。 */
function fakeTransport(reply: (rec: CallRecord) => Record<string, unknown>): {
  transport: Transport;
  calls: CallRecord[];
} {
  const calls: CallRecord[] = [];
  const transport: Transport = {
    attach: () => {},
    call: async (method, path, body) => {
      const rec: CallRecord = { method, path };
      if (body !== undefined) rec.body = body;
      calls.push(rec);
      return reply(rec);
    },
    pose: () => null,
    progress: () => null,
    waitPlayback: async () => ({ status: 'gone' }),
  };
  return { transport, calls };
}

/** 假演出：只记录开演请求。 */
function fakeShow(): { show: Show; starts: Array<{ petId: string; assets: ActivityAssets }> } {
  const starts: Array<{ petId: string; assets: ActivityAssets }> = [];
  const show: Show = {
    start: (petId, assets) => {
      starts.push({ petId, assets });
    },
    halt: async () => {},
    isRunning: () => false,
  };
  return { show, starts };
}

/** 等异步链跑完：`launch` 里只有一次 await，两轮 setImmediate 足够。 */
async function flush(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
}

/** 造一份默认依赖；`get` 的返回值按用例覆盖。 */
function makeMenu(get: (name: string) => unknown, transport: Transport, show: Show): ReturnType<typeof createMenu> {
  return createMenu({
    get,
    transport,
    show,
    signal: new AbortController().signal,
    // 负数：`performance.now() - 0` 恒大于它，首拍必定进入补注册分支。
    retryMs: -1,
  });
}

describe('createMenu', () => {
  test('read click: in-page service missing → re-register the menu, no playback', async () => {
    const { transport, calls } = fakeTransport(() => ({ ok: true }));
    const { show, starts } = fakeShow();
    const menu = makeMenu(() => undefined, transport, show);

    menu.tick();
    await flush();

    assert.deepEqual(
      calls.map((rec) => rec.method + ' ' + rec.path),
      ['GET /config'],
      'service missing: only re-register, never play',
    );
    assert.equal(starts.length, 0, 'no click means no show');
  });

  test('read click: owner not in the snapshot yet (ok:false) → re-register the menu', async () => {
    const { transport, calls } = fakeTransport(() => ({ ok: true }));
    const { show } = fakeShow();
    const menu = makeMenu(() => ({ menuEvents: () => ({ ok: false }) }), transport, show);

    menu.tick();
    await flush();

    assert.deepEqual(
      calls.map((rec) => rec.method + ' ' + rec.path),
      ['GET /config'],
      'owner not in the snapshot: retry registration on the interval',
    );
  });

  test('read click: hits "Rice time" → find the owning entry by petId and start the show', async () => {
    const { transport, calls } = fakeTransport(() => ({
      main: { pets: [{ id: 'pet-1' }], animations: { baifan: ['a', 'b'] } },
    }));
    const { show, starts } = fakeShow();
    const menu = makeMenu(
      () => ({ menuEvents: () => ({ ok: true, events: { 'Rice time': 'pet-1' } }) }),
      transport,
      show,
    );

    menu.tick();
    await flush();

    assert.deepEqual(
      calls.map((rec) => rec.method + ' ' + rec.path),
      ['GET /config'],
      'after a hit: read the config once, no re-registration',
    );
    assert.equal(starts.length, 1, 'owning entry found: start exactly one show');
    assert.equal(starts[0].petId, 'pet-1', 'the click starts the pet that was clicked');
  });

  test('register menu: main without animations.baifan → no POST', async () => {
    const { transport, calls } = fakeTransport(() => ({ main: { animations: {} } }));
    const { show } = fakeShow();
    const menu = makeMenu(() => undefined, transport, show);

    await menu.ensureMenu();

    assert.deepEqual(
      calls.map((rec) => rec.method + ' ' + rec.path),
      ['GET /config'],
      'without the activity, do not register a host menu item',
    );
  });

  test('register menu: animations.baifan configured → POST carries the owner', async () => {
    const { transport, calls } = fakeTransport(() => ({ ok: true, main: { animations: { baifan: ['a'] } } }));
    const { show } = fakeShow();
    const menu = makeMenu(() => undefined, transport, show);

    await menu.ensureMenu();

    const post = calls.find((rec) => rec.method === 'POST');
    assert.ok(post !== undefined, 'activity configured: send POST /menu/item');
    assert.equal(post.path, '/menu/item');
    assert.deepEqual(
      (post.body as Record<string, unknown>).owner,
      'dsh-pet-baifan',
      'the menu item owner stays the fixed rice-activity owner',
    );
  });

  test('playback: the clicked pet belongs to no entry → no show', async () => {
    const { transport } = fakeTransport(() => ({ main: { pets: [{ id: 'other' }], animations: { baifan: ['a'] } } }));
    const { show, starts } = fakeShow();
    const menu = makeMenu(
      () => ({ menuEvents: () => ({ ok: true, events: { 'Rice time': 'pet-1' } }) }),
      transport,
      show,
    );

    menu.tick();
    await flush();

    assert.equal(starts.length, 0, 'no owning entry means no show');
  });

  test('after dispose: no more click reads', async () => {
    const { transport, calls } = fakeTransport(() => ({ ok: true }));
    const { show } = fakeShow();
    const menu = makeMenu(
      () => ({ menuEvents: () => ({ ok: true, events: { 'Rice time': 'pet-1' } }) }),
      transport,
      show,
    );

    menu.dispose();
    menu.tick();
    await flush();

    assert.equal(calls.length, 0, 'after dispose: no more requests');
  });
});
