/**
 * 日历格（src/shared/todo/calendar.ts）：周一为首列、补满整周、前后月标 out。
 *
 * 只覆盖纯计算；选择器的交互与渲染由手动验收。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { monthCells } from './calendar.ts';

/** 把格子写成 `YYYY-MM-DD`，断言里比日期比拼 Date 好读。 */
function days(year: number, month: number): string[] {
  return monthCells(year, month).map((cell) => {
    const d = cell.date;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  });
}

describe('monthCells — how many rows a month takes', () => {
  test('October 2026: the 1st is a Thursday, three lead cells, five rows', () => {
    const list = days(2026, 9);
    assert.equal(list.length, 35, 'should be 5 rows × 7 columns');
    assert.equal(list[0], '2026-09-28', 'first cell should be the last Monday of the previous month');
    assert.equal(list[34], '2026-11-01', 'last cell should be the first Sunday of the next month');
  });

  test('August 2026: spans six weeks, padded to 42 cells', () => {
    const list = days(2026, 7);
    assert.equal(list.length, 42, 'should be 6 rows × 7 columns');
    assert.equal(list[0], '2026-07-27');
    assert.equal(list[41], '2026-09-06');
  });

  test('February 2026: the 1st is a Sunday, a whole row is padded in front', () => {
    const list = days(2026, 1);
    assert.equal(list.length, 35);
    assert.equal(list[0], '2026-01-26', 'Sunday lands in the last column, six cells are padded in front');
  });

  test('out only marks cells from the previous and next months', () => {
    const cells = monthCells(2026, 9);
    assert.equal(cells.filter((cell) => cell.out).length, 3 + 1, '3 cells from the previous month + 1 from the next');
    assert.ok(
      cells.slice(3, 34).every((cell) => !cell.out),
      'none of the 31 days of this month should be marked out',
    );
  });

  test('every row is a full week: always 7 columns, first cell is a Monday', () => {
    for (let month = 0; month < 12; month++) {
      const cells = monthCells(2026, month);
      assert.equal(cells.length % 7, 0, `month ${month + 1} is not a whole number of weeks`);
      assert.equal(cells[0]?.date.getDay(), 1, `the first cell of month ${month + 1} is not a Monday`);
    }
  });
});
