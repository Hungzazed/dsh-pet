/**
 * 待办 wire 解析与排序的单元测试：脏数据不进渲染层，顺序以「未完成、到期近、无期限垫底」为准。
 *
 * 跑法：node --experimental-strip-types --test src/shared/todo/types.test.ts
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { parseTodoItem, parseTodoList, sortTodoItems } from './types.ts';

/** 造一条合法记录。 */
const valid = {
  id: 'todo-1',
  text: 'Weekly report',
  dueAt: 1000,
  done: false,
  createdAt: 10,
  updatedAt: 20,
  completedAt: null,
};

describe('parseTodoItem — narrowing a single record', () => {
  test('reads every field of a valid record', () => {
    const todo = parseTodoItem(valid);
    assert.deepEqual(todo, {
      id: 'todo-1',
      text: 'Weekly report',
      dueAt: 1000,
      done: false,
      createdAt: 10,
      updatedAt: 20,
      completedAt: null,
    });
  });

  test('dueAt may be missing or null; done only accepts a boolean', () => {
    assert.equal(parseTodoItem({ ...valid, dueAt: null })?.dueAt, null);
    assert.equal(parseTodoItem({ ...valid, dueAt: undefined })?.dueAt, null);
    assert.equal(parseTodoItem({ ...valid, done: 'yes' })?.done, false);
  });

  test('missing id / missing text / non-numeric dueAt → null', () => {
    assert.equal(parseTodoItem({ ...valid, id: '' }), null);
    assert.equal(parseTodoItem({ ...valid, text: 42 }), null);
    assert.equal(parseTodoItem({ ...valid, dueAt: '1000' }), null);
    assert.equal(parseTodoItem(null), null);
    assert.equal(parseTodoItem([valid]), null);
  });
});

describe('parseTodoList — the whole list', () => {
  test('not an array → empty list; bad entries are skipped, good ones kept', () => {
    assert.deepEqual(parseTodoList(null), []);
    assert.deepEqual(parseTodoList({ todos: [] }), []);
    const list = parseTodoList([valid, { id: '' }, { ...valid, id: 'todo-2' }]);
    assert.deepEqual(
      list.map((item) => item.id),
      ['todo-1', 'todo-2'],
    );
  });
});

describe('sortTodoItems — display order', () => {
  test('pending first by nearest due date, undated last among pending, done at the end', () => {
    const base = { done: false, createdAt: 1, updatedAt: 1, completedAt: null as number | null };
    const list = sortTodoItems([
      { ...base, id: 'done', text: 'Done', dueAt: 1, done: true, completedAt: 9 },
      { ...base, id: 'undated', text: 'No due date', dueAt: null },
      { ...base, id: 'late', text: 'Late', dueAt: 300 },
      { ...base, id: 'early', text: 'Early', dueAt: 200 },
    ]);
    assert.deepEqual(
      list.map((item) => item.id),
      ['early', 'late', 'undated', 'done'],
    );
  });

  test('same due date falls back to creation order', () => {
    const list = sortTodoItems([
      { id: 'b', text: 'b', dueAt: 5, done: false, createdAt: 2, updatedAt: 2, completedAt: null },
      { id: 'a', text: 'a', dueAt: 5, done: false, createdAt: 1, updatedAt: 1, completedAt: null },
    ]);
    assert.deepEqual(
      list.map((item) => item.id),
      ['a', 'b'],
    );
  });
});
