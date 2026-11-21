/**
 * 待办面板的悬停快捷键（src/shared/todo/hotkey.ts）：只认裸按的 D。
 *
 * 按键的通用规则由 shared/hotkey 的测试钉住，这里只验「哪个键」这一条。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { TODO_HOTKEY_HINT, isTodoHotkey } from './hotkey.ts';
import type { HotkeyEvent } from '../hotkey.ts';

/** 一个最小的键盘事件替身。 */
function ev(over: Partial<HotkeyEvent> = {}): HotkeyEvent {
  return { key: 'd', ctrlKey: false, metaKey: false, altKey: false, target: null, ...over };
}

describe('isTodoHotkey — only a bare D toggles the panel', () => {
  test('both d and D count', () => {
    assert.equal(isTodoHotkey(ev({ key: 'd' })), true);
    assert.equal(isTodoHotkey(ev({ key: 'D' })), true);
  });

  test('the chat key T does not count', () => {
    assert.equal(isTodoHotkey(ev({ key: 't' })), false);
  });

  test('a modifier key makes it not count', () => {
    assert.equal(isTodoHotkey(ev({ ctrlKey: true })), false);
    assert.equal(isTodoHotkey(ev({ altKey: true })), false);
  });

  test('typing in an input does not count', () => {
    const input = { tagName: 'INPUT' } as unknown as EventTarget;
    assert.equal(isTodoHotkey(ev({ target: input })), false);
  });

  test('the menu hint and the key name the same key', () => {
    assert.ok(TODO_HOTKEY_HINT.startsWith('D'), `the hint should mention D, got ${TODO_HOTKEY_HINT}`);
  });
});
