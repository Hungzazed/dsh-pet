/** WMO 天气码 → 中文短语；表里没有的码返回“未知天气”，不猜。 */

/** 码 → 中文；只收 Open-Meteo 的 current / daily 会用到的那些码。 */
const TEXT_BY_CODE: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

/**
 * 天气码换中文。
 * @param code - WMO 4677 天气码。
 * @returns 对应说法；未收录的码返回“未知天气”。
 */
export function wmoText(code: number): string {
  return TEXT_BY_CODE[code] ?? 'Unknown weather';
}
