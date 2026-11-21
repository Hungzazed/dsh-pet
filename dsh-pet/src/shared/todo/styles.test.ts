/**
 * 待办面板的尺寸预算（src/shared/todo/styles.ts）：面板随字号缩放，窗口上边距装得下整块面板。
 *
 * 只覆盖纯计算与常量部分；CSS 的实际观感由手动验收。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { BUBBLE_OVERLAP_RATIO, DEFAULT_FONT, bubbleTopMarginPx, resolveFontPx } from '../fonts.ts';
import { TODO_CSS, TODO_FONT_SCALE, TODO_PANEL_METRICS, todoPanelTopMarginPx } from './styles.ts';
import type { FontConfig } from '../types.ts';

/** 面板自身高度（px）：取清单态与日历态的较高者，与 todoPanelTopMarginPx 同一份预算。 */
function panelHeightPx(font: FontConfig | undefined, size: number): number {
  const m = TODO_PANEL_METRICS;
  const lower = Math.max(m.list + m.hint, m.calendar);
  return (m.head + m.form + lower) * resolveFontPx(font, size).bubble * TODO_FONT_SCALE;
}

describe('todoPanelTopMarginPx — desktop window top margin', () => {
  test('default config: the panel is taller than a bare bubble budget, so the window grows', () => {
    const px = todoPanelTopMarginPx(DEFAULT_FONT, 462);
    assert.ok(px > bubbleTopMarginPx(DEFAULT_FONT, 462), 'the panel is taller than the bubble, the window must grow');
    assert.ok(px < 400, `should not be absurd, got ${px}px`);
  });

  test('larger font: the top margin grows with the panel', () => {
    const base = todoPanelTopMarginPx(DEFAULT_FONT, 462);
    const big = todoPanelTopMarginPx({ ...DEFAULT_FONT, size: 42 }, 462);
    assert.ok(big > base * 1.5, `the top margin should grow noticeably when the font doubles, got ${big}px`);
  });

  test('small pet without font following: the panel budget beats the bubble budget, the window grows', () => {
    const font = { ...DEFAULT_FONT, followPet: false };
    const panel = todoPanelTopMarginPx(font, 200);
    assert.ok(panel > bubbleTopMarginPx(font, 200), `the panel is taller, got ${panel}px`);
    assert.ok(
      panel >= panelHeightPx(font, 200) - 200 * BUBBLE_OVERLAP_RATIO,
      'the top margin should cover the panel minus the bottom overhang',
    );
  });

  test('missing font: falls back to the default scale, no NaN or negative values', () => {
    const px = todoPanelTopMarginPx(undefined, 462);
    assert.ok(Number.isFinite(px) && px > 0, `got ${px}`);
  });
});

describe('TODO_CSS — sizes anchored to the font size', () => {
  test('font size and width both derive from --f, no hard-coded pixels left', () => {
    assert.ok(TODO_CSS.includes('var(--f)'), 'panel sizes should be anchored to --f');
    assert.ok(!TODO_CSS.includes('font-size:13px'), 'the 13px font size should not be hard-coded anymore');
    assert.ok(!TODO_CSS.includes('width:308px'), 'the 308px width should not be hard-coded anymore');
  });
});
