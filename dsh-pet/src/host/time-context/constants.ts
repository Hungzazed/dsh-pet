/**
 * 时段与星期：把小时数翻成中文时段，把星期几翻成工作日/周末。
 *
 * 纯换算，不含节日表；时间一律取 Date 的本地字段（跟用户时区走）。
 * 必须始终成立：时段区间首尾相接且全覆盖 0–23 点。
 * @module dsh-pet/src/host/time-context/constants
 */

/** 时段文案：一天分 9 档（划分见 SLOTS）。 */
export type TimeSlot =
  | 'late night'
  | 'dawn'
  | 'early morning'
  | 'mid-morning'
  | 'noon'
  | 'afternoon'
  | 'early evening'
  | 'evening'
  | 'deep night';

/**
 * 时段划分表：[起始小时, 时段]，按起始小时从晚到早排列——匹配时取第一个不超过当前小时的档。
 * 口径含起始小时（0–23 全覆盖、不重叠）：凌晨 0–4、清晨 5–6、早上 7–8、上午 9–10、中午 11–12、
 * 下午 13–16、傍晚 17–18、晚上 19–22、深夜 23。
 */
const SLOTS: ReadonlyArray<readonly [number, TimeSlot]> = [
  [23, 'deep night'],
  [19, 'evening'],
  [17, 'early evening'],
  [13, 'afternoon'],
  [11, 'noon'],
  [9, 'mid-morning'],
  [7, 'early morning'],
  [5, 'dawn'],
  [0, 'late night'],
];

/** 星期文案：索引 = Date.getDay()（0 = 周日）。 */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Month names: index = Date.getMonth() (0 = January). */
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** 一天毫秒数（日期算术用 UTC 毫秒，避开本地时区）。 */
export const DAY_MS = 86_400_000;

/** 缺省窗口：提前 3 天预热、本身 1 天、过后 3 天回味。 */
export const DEFAULT_AHEAD = 3;

export const DEFAULT_SPAN = 1;

export const DEFAULT_AFTER = 3;

/** 假期区间的窗口：提前 3 天预热、末尾 3 天说「快结束了」、结束后 3 天回味。 */
export const SEASON_AHEAD = 3;

export const SEASON_ENDING_AHEAD = 3;

export const SEASON_AFTER = 3;

/** 两位补零（只用于时分；月/日刻意不补零——中文写「2月17日」比「02月17日」自然）。 */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * 小时 → 时段。
 * @param hour - 小时数（来自 Date.getHours()，正常为 0–23）。
 * @returns 对应时段；越界或 NaN（异常输入）按「凌晨」兜底、绝不抛错——提示词路径不能因为时间格式问题失败。
 */
export function timeSlotOf(hour: number): TimeSlot {
  for (const [start, slot] of SLOTS) {
    if (hour >= start) return slot;
  }
  return 'late night';
}

/**
 * 星期几 → 工作日 / 周末（周六周日算周末；与余额低谷判定同一口径，见 balance/deepseek-common.ts）。
 * @param day - Date.getDay()（0 = 周日）。
 * @returns 「周末」（周六/周日）或「工作日」。
 */
export function dayKindOf(day: number): 'weekday' | 'weekend' {
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}
