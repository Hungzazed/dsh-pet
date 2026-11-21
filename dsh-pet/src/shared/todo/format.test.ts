/**
 * 待办展示格式化的单元测试：到期说法、相对剩余、紧迫度与 `datetime-local` 互转。
 *
 * 全部用本地时间构造用例（`new Date(y, m, d, h, min)`），因此换时区跑也稳定。
 * 跑法：node --experimental-strip-types --test src/shared/todo/format.test.ts
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  dueLabel,
  formatDateTimeLocal,
  metaLabel,
  parseDateTimeLocal,
  remainingLabel,
  spanText,
  todoUrgency,
} from './format.ts';
import type { TodoItem } from './types.ts';

/** 基准时刻：2026-10-29（周四）09:30 本地时间。 */
const NOW = new Date(2026, 9, 29, 9, 30).getTime();

/** 造一条待办：只覆盖格式化关心的字段。 */
function todo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 'todo-1',
    text: 'Weekly report',
    dueAt: null,
    done: false,
    createdAt: NOW,
    updatedAt: NOW,
    completedAt: null,
    ...overrides,
  };
}

describe('spanText — duration in plain words', () => {
  test('minutes / hours / days, never less than a minute', () => {
    assert.equal(spanText(0), '1 min');
    assert.equal(spanText(25 * 60 * 1000), '25 min');
    assert.equal(spanText(2 * 60 * 60 * 1000), '2 h');
    assert.equal(spanText(3 * 24 * 60 * 60 * 1000), '3 d');
  });
});

describe('dueLabel — absolute wording', () => {
  test('no due date', () => {
    assert.equal(dueLabel(null, NOW), 'No due date');
  });

  test('today / tomorrow / in two days / this week / further out', () => {
    assert.equal(dueLabel(new Date(2026, 9, 29, 18, 0).getTime(), NOW), 'Today 18:00');
    assert.equal(dueLabel(new Date(2026, 9, 30, 9, 0).getTime(), NOW), 'Tomorrow 09:00');
    assert.equal(dueLabel(new Date(2026, 9, 31, 8, 5).getTime(), NOW), 'In 2 days 08:05');
    // 2026-11-02 是周一（与 10-29 周四同一周之后）
    assert.equal(dueLabel(new Date(2026, 10, 2, 8, 0).getTime(), NOW), 'Monday 08:00');
    assert.equal(dueLabel(new Date(2026, 10, 8, 8, 0).getTime(), NOW), 'Nov 8 08:00');
  });
});

describe('remainingLabel — relative wording', () => {
  test('not due / overdue / no due date', () => {
    assert.equal(remainingLabel(NOW + 90 * 60 * 1000, NOW), '2 h left');
    assert.equal(remainingLabel(NOW - 2 * 60 * 60 * 1000, NOW), 'Overdue by 2 h');
    assert.equal(remainingLabel(null, NOW), '');
  });
});

describe('todoUrgency — urgency', () => {
  test('no due date / overdue / within 6 hours / within 24 hours / further out', () => {
    assert.equal(todoUrgency(null, NOW), 'undated');
    assert.equal(todoUrgency(NOW - 1, NOW), 'overdue');
    assert.equal(todoUrgency(NOW + 5 * 60 * 60 * 1000, NOW), 'soon');
    assert.equal(todoUrgency(NOW + 20 * 60 * 60 * 1000, NOW), 'today');
    assert.equal(todoUrgency(NOW + 3 * 24 * 60 * 60 * 1000, NOW), 'later');
  });
});

describe('metaLabel — list subtitle', () => {
  test('pending: absolute + relative; overdue keeps only the relative part', () => {
    const dueAt = new Date(2026, 9, 29, 17, 30).getTime();
    assert.equal(metaLabel(todo({ dueAt }), NOW), 'Today 17:30 · 8 h left');
    assert.equal(metaLabel(todo({ dueAt: NOW - 2 * 60 * 60 * 1000 }), NOW), 'Overdue by 2 h');
    assert.equal(metaLabel(todo(), NOW), 'No due date');
  });

  test('done: wording for the struck-through state', () => {
    const dueAt = new Date(2026, 9, 29, 17, 30).getTime();
    assert.equal(metaLabel(todo({ dueAt, done: true }), NOW), 'Done · Today 17:30');
    assert.equal(metaLabel(todo({ done: true }), NOW), 'Done');
  });
});

describe('datetime-local round trip', () => {
  test('zero-padded formatting, minute precision', () => {
    assert.equal(formatDateTimeLocal(new Date(2026, 9, 29, 9, 5).getTime()), '2026-10-29T09:05');
  });

  test('parses back to the same instant; seconds are accepted', () => {
    const ms = new Date(2026, 9, 29, 9, 5).getTime();
    assert.equal(parseDateTimeLocal('2026-10-29T09:05'), ms);
    assert.equal(parseDateTimeLocal('2026-10-29T09:05:30'), ms);
  });

  test('empty string / invalid format / nonexistent date → null', () => {
    assert.equal(parseDateTimeLocal(''), null);
    assert.equal(parseDateTimeLocal('tomorrow'), null);
    assert.equal(parseDateTimeLocal('2026-02-30T09:00'), null);
    assert.equal(parseDateTimeLocal('2026-13-01T09:00'), null);
  });
});
