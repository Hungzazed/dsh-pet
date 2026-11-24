/**
 * 文案组装：把命中的节日、节气与时段拼成一句话，另提供历史消息用的时间前缀。
 *
 * 不读时钟、不碰 IO；候选由 ./lunar 提供，城市与天气由调用方查好后经 env 传入。
 * 必须始终成立：同一日期多次调用结果一致，不依赖调用顺序；不传 env 时输出与加入环境前逐字相同。
 * @module dsh-pet/src/host/time-context/context
 */
import { MAX_AHEAD, MAX_LOOKBACK, SEASON_ENTRIES } from './entries.ts';
import type { Candidate, Entry, RankedEntry } from './entries.ts';
import {
  DEFAULT_AFTER,
  DEFAULT_AHEAD,
  DEFAULT_SPAN,
  SEASON_AFTER,
  SEASON_AHEAD,
  SEASON_ENDING_AHEAD,
  WEEKDAYS,
  dayKindOf,
  pad2,
  timeSlotOf,
} from './constants.ts';
import { dayOfYear, dayOfYearOf, entriesAt } from './lunar.ts';
import type { ResolvedLanguage } from '../../shared/i18n/core.ts';
import { localizeWeatherSummary } from '../../shared/i18n/ui.ts';

/** 时间行里附带的环境事实（城市与天气）。 */
export interface TimeContextEnv {
  /** 省 / 州（如“江西省”）；缺省 = 不知道省份，地点只写城市。 */
  readonly region?: string;
  /** 市（如“南昌市”）；缺省 = 不知道在哪，连“你在……”一起省掉。 */
  readonly city?: string;
  /** 此刻天气；缺省 = 没有可用天气，只写一句“这次没查到”的交代，防止模型自己编。 */
  readonly weather?: WeatherFacts;
}

/** 天气事实：只用于拼一句口语，不承诺展示格式。 */
export interface WeatherFacts {
  /** Optional WMO code used for localized weather summaries. */
  readonly code?: number;
  /** 天气短语（如“阴”）。 */
  readonly summary: string;
  /** 气温（°C）。 */
  readonly temperatureC: number;
  /** 体感温度（°C）。 */
  readonly apparentC: number;
  /** 相对湿度（%）。 */
  readonly humidityPercent: number;
  /** 风速（km/h）。 */
  readonly windKph: number;
}

/**
 * 相位 → 从句措辞。
 * @param entry - 节日条目；`name`/`spoken`/`span` 决定措辞与默认窗口。
 * @param delta - 相对节日起始日的天数：> 0 = 还有这么多天；0 = 起始当天；< 0 = 已在节期内或过后。
 */
function phraseOf(entry: Entry, delta: number): string {
  const span = entry.span ?? DEFAULT_SPAN;
  if (delta > 0) return delta === 1 ? '明天就是' + entry.name : '快要过' + entry.name + '了';
  if (delta === 0) return '今天是' + (entry.spoken ?? entry.name);
  // 节期内（长假分段说，避免十几天重复同一句）：进入节日体的第 daysIn + 1 天
  const daysIn = -delta;
  if (daysIn < span) {
    return span - daysIn === 1 ? entry.name + '假期最后一天了' : '还在' + entry.name + '假期里';
  }
  // 节后：rest 是「结束后第几天」（0 起）
  const rest = daysIn - span;
  return rest <= 1 ? entry.name + '刚过完' : entry.name + '这么快就过完了';
}

/**
 * 条目 → 候选从句（不在自身窗口内则返回 undefined）。
 * @param ranked - 已排序条目；`priority` 高者先出候选。
 * @param delta - 相对节日起始日的天数。
 */
function candidateOf(ranked: RankedEntry, delta: number): Candidate | undefined {
  const { entry, priority } = ranked;
  const ahead = entry.ahead ?? DEFAULT_AHEAD;
  const span = entry.span ?? DEFAULT_SPAN;
  const after = entry.after ?? DEFAULT_AFTER;
  const daysIn = -delta;
  if (delta > 0) {
    if (delta > ahead) return undefined;
  } else if (delta < 0) {
    if (daysIn >= span + after) return undefined;
  }
  return { clause: phraseOf(entry, delta), priority };
}

/** 假期区间 → 候选从句（不在窗口内返回 undefined）。 */
function seasonCandidateOf(date: Date): Candidate | undefined {
  const year = date.getFullYear();
  const today = dayOfYear(date);
  for (const ranked of SEASON_ENTRIES) {
    const { entry, priority, from: fromMd, to: toMd } = ranked;
    const name = entry.name;
    const from = dayOfYearOf(year, fromMd);
    const to = dayOfYearOf(year, toMd);
    if (today < from) {
      const ahead = from - today;
      if (ahead > SEASON_AHEAD) continue;
      return { clause: ahead === 1 ? '明天就放' + name + '了' : '快要放' + name + '了', priority };
    }
    if (today <= to) {
      if (today === from) return { clause: name + '开始了', priority };
      if (to - today < SEASON_ENDING_AHEAD) return { clause: name + '快结束了', priority };
      return { clause: '正在放' + name, priority };
    }
    const rest = today - to - 1;
    if (rest >= SEASON_AFTER) continue;
    return { clause: rest <= 1 ? name + '刚结束' : name + '这么快就过完了', priority };
  }
  return undefined;
}

/**
 * 节日从句：扫描窗口内枚举每一天命中的条目、算出各自相位与措辞，取优先级最小（数组里最靠前）的那个。
 * @returns 如「今天是大年初一」「快要过国庆节了」「还在春节假期里」「正在放暑假」；无节日时 ''。
 */
function holidayClauseOf(date: Date): string {
  let best: Candidate | undefined;
  const keep = (candidate: Candidate | undefined): void => {
    if (candidate && (!best || candidate.priority < best.priority)) best = candidate;
  };
  for (let delta = -MAX_LOOKBACK; delta <= MAX_AHEAD; delta++) {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
    for (const ranked of entriesAt(day)) keep(candidateOf(ranked, delta));
  }
  keep(seasonCandidateOf(date));
  return best ? best.clause : '';
}

/**
 * 节日从句。
 *
 * @param date - 当前时刻。
 * @returns 如「今天是大年初一」；无节日或 `date` 非法时返回空串。
 */
export function festivalOf(date: Date): string {
  return Number.isNaN(date.getTime()) ? '' : holidayClauseOf(date);
}

/** 数值转口语：整数不带小数点，非整数留一位。 */
function numText(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * 地点短语：省 + 市。
 *
 * 省市互相包含时只留一个（“北京市 / 北京”不该写成“北京市北京”），拉丁文地名之间补空格。
 * 拼装留给提示词这一层：宿主的 /environment 只给两段原始数据。
 *
 * @param region - 省 / 州；空串或缺省表示没有这一段。
 * @param city - 市；空串或缺省表示不知道在哪。
 * @returns 展示用地点；城市未知时 undefined。
 */
function placeTextOf(region: string | undefined, city: string | undefined): string | undefined {
  if (city === undefined || city === '') return undefined;
  if (region === undefined || region === '' || region === city) return city;
  if (region.includes(city)) return region;
  if (city.includes(region)) return city;
  return /[\u4e00-\u9fa5]$/u.test(region) ? region + city : region + ' ' + city;
}

const EN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const VI_WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const;
const EN_SLOTS: Readonly<Record<string, string>> = {
  凌晨: 'late night',
  清晨: 'early morning',
  早上: 'morning',
  上午: 'late morning',
  中午: 'noon',
  下午: 'afternoon',
  傍晚: 'early evening',
  晚上: 'evening',
  深夜: 'late night',
};
const VI_SLOTS: Readonly<Record<string, string>> = {
  凌晨: 'rạng sáng',
  清晨: 'sáng sớm',
  早上: 'buổi sáng',
  上午: 'gần trưa',
  中午: 'buổi trưa',
  下午: 'buổi chiều',
  傍晚: 'chiều tối',
  晚上: 'buổi tối',
  深夜: 'đêm khuya',
};

/** 天气从句：有数据时拼一句口语，没有时给出“别编”的交代。 */
function weatherClauseOf(weather: WeatherFacts | undefined, lang: ResolvedLanguage): string {
  if (lang === 'en') {
    if (weather === undefined)
      return "outside weather wasn't fetched this time — if asked, say you don't know rather than guessing";
    const summary =
      typeof weather.code === 'number' ? localizeWeatherSummary(weather.code, weather.summary, 'en') : weather.summary;
    return (
      'outside is ' +
      summary +
      ', temp ' +
      numText(weather.temperatureC) +
      '°C, feels like ' +
      numText(weather.apparentC) +
      '°C, humidity ' +
      numText(weather.humidityPercent) +
      '%, wind ' +
      numText(weather.windKph) +
      ' km/h'
    );
  }
  if (lang === 'vi') {
    if (weather === undefined)
      return 'lần này chưa tra được thời tiết bên ngoài — nếu chủ nhân hỏi thì nói không rõ chứ đừng bịa';
    const summary =
      typeof weather.code === 'number' ? localizeWeatherSummary(weather.code, weather.summary, 'vi') : weather.summary;
    return (
      'ngoài trời ' +
      summary +
      ', nhiệt độ ' +
      numText(weather.temperatureC) +
      '°C, cảm giác ' +
      numText(weather.apparentC) +
      '°C, độ ẩm ' +
      numText(weather.humidityPercent) +
      '%, gió ' +
      numText(weather.windKph) +
      ' km/h'
    );
  }
  if (weather === undefined) return '外面的天气这次没查到，主人问起就说不知道、别编';
  return (
    '外面' +
    weather.summary +
    '，气温 ' +
    numText(weather.temperatureC) +
    '°C，体感 ' +
    numText(weather.apparentC) +
    '°C，湿度 ' +
    numText(weather.humidityPercent) +
    '%，风速 ' +
    numText(weather.windKph) +
    ' km/h'
  );
}

/**
 * 生成注入 system 末尾的时间背景（一行）。
 * @param date - 当前时刻（生产调用方传 new Date()；测试传固定日期）。
 * @param env - 可选的环境事实：传了就多写地点与天气，不传则与加入环境前逐字一致。
 * @param lang - 语言（默认 zh，保持既有契约；生产按配置传入 vi / en / zh）。
 */
export function timeContextOf(date: Date, env?: TimeContextEnv, lang: ResolvedLanguage = 'zh'): string {
  // 非法 Date 的 getFullYear()/getDay() 都返回 NaN，直接拼会产出「NaN年NaN月」——显式挡掉
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDay();
  const hour = date.getHours();
  const placeName = placeTextOf(env?.region, env?.city);
  const clock = pad2(hour) + ':' + pad2(date.getMinutes());
  const isWeekend = day === 0 || day === 6;

  if (lang === 'en') {
    const place = placeName === undefined ? '' : `You are in ${placeName} (rough IP estimate, may be inaccurate). `;
    const weather = env === undefined ? '' : ', ' + weatherClauseOf(env.weather, 'en');
    const slot = EN_SLOTS[timeSlotOf(hour)] ?? 'daytime';
    const dayKind = isWeekend ? 'weekend' : 'workday';
    return (
      `[Now] ${place}It is ${EN_WEEKDAYS[day] ?? ''}, ${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${clock}, ${slot}, ${dayKind}${weather}. ` +
      'This is only background context — do not force-announce the time or mention weather unless it fits naturally; reply naturally in English.'
    );
  }

  if (lang === 'vi') {
    const place =
      placeName === undefined ? '' : `Bạn đang ở ${placeName} (ước lượng theo IP, có thể không chính xác). `;
    const weather = env === undefined ? '' : ', ' + weatherClauseOf(env.weather, 'vi');
    const slot = VI_SLOTS[timeSlotOf(hour)] ?? 'trong ngày';
    const dayKind = isWeekend ? 'cuối tuần' : 'ngày làm việc';
    return (
      `[Hiện tại] ${place}Bây giờ là ${VI_WEEKDAYS[day] ?? ''}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${clock}, ${slot}, ${dayKind}${weather}. ` +
      'Đây chỉ là bối cảnh nền — không cần cố báo giờ hay nhắc thời tiết, chỉ nhắc khi thật sự hợp ngữ cảnh; hãy trả lời tự nhiên bằng tiếng Việt.'
    );
  }

  const holiday = holidayClauseOf(date);
  // 地点带“粗估”括号：城市来自 IP 而不是主人亲口说的，不说明的话模型会当成事实报出来
  const place = placeName === undefined ? '' : '你在' + placeName + '（按网络粗估，不一定准），';
  const weather = env === undefined ? '' : '，' + weatherClauseOf(env.weather, 'zh');
  return (
    '【当下】' +
    place +
    '现在是' +
    date.getFullYear() +
    '年' +
    (date.getMonth() + 1) +
    '月' +
    date.getDate() +
    '日' +
    (WEEKDAYS[day] ?? '星期?') +
    ' ' +
    clock +
    '，' +
    timeSlotOf(hour) +
    '，' +
    dayKindOf(day) +
    (holiday ? '，' + holiday : '') +
    weather +
    '。这只是背景，不必刻意报时，也别句句都提节日' +
    (env === undefined ? '' : '或天气') +
    '——多数时候正常说话就好，真贴切时才顺口带一句。'
  );
}

/**
 * 历史消息的时间前缀（对话历史专用）：`10月31日 22:53`，跨年时带年份。
 *
 * @param ts - 那条消息的发送时刻（毫秒时间戳，`memory.json` 里每条都带）。
 * @param now - 当前时刻；与发送时刻不同年时前缀带年份，消掉“哪一年”的歧义。
 * @param lang - 语言（默认 zh）。
 * @returns `ts` 或 `now` 非法时返回空串（调用方据此不加前缀，原样发送）。
 */
export function historyStampOf(ts: number, now: Date, lang: ResolvedLanguage = 'zh'): string {
  const at = new Date(ts);
  if (Number.isNaN(at.getTime()) || Number.isNaN(now.getTime())) return '';
  const clock = pad2(at.getHours()) + ':' + pad2(at.getMinutes());
  if (lang === 'en') {
    const date =
      (at.getFullYear() === now.getFullYear() ? '' : at.getFullYear() + '-') +
      pad2(at.getMonth() + 1) +
      '-' +
      pad2(at.getDate());
    return date + ' ' + clock;
  }
  if (lang === 'vi') {
    const date =
      at.getDate() + '/' + (at.getMonth() + 1) + (at.getFullYear() === now.getFullYear() ? '' : '/' + at.getFullYear());
    return date + ' ' + clock;
  }
  const date =
    (at.getFullYear() === now.getFullYear() ? '' : at.getFullYear() + '年') +
    (at.getMonth() + 1) +
    '月' +
    at.getDate() +
    '日';
  return date + ' ' + clock;
}
