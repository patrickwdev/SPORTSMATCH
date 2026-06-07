import type { Sport } from '../types';
import { isFootballSport } from '../utils/sport';

const FETCH_HEADERS = { Accept: 'application/json' };

const SUMMARY_BASE: Partial<Record<Sport, string>> = {
  NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
  NCAAF: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football',
};

function formatWeather(weather: {
  displayValue?: string;
  temperature?: number;
  windSpeed?: number;
  precipitation?: number;
  conditionId?: string;
}): string | null {
  const parts: string[] = [];
  if (weather.displayValue) parts.push(weather.displayValue);
  if (weather.temperature != null) parts.push(`${weather.temperature}°`);
  if (weather.windSpeed != null) parts.push(`Wind: ${weather.windSpeed} mph`);
  if (weather.precipitation != null) {
    parts.push(`${Math.round(weather.precipitation * 100)}% Rain`);
  }
  return parts.length > 0 ? parts.join(' | ') : null;
}

export async function fetchEspnGameWeather(
  sport: Sport,
  espnEventId: string | null | undefined,
): Promise<string | null> {
  if (!espnEventId || !isFootballSport(sport)) return null;
  const base = SUMMARY_BASE[sport];
  if (!base) return null;

  try {
    const res = await fetch(`${base}/summary?event=${espnEventId}`, { headers: FETCH_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    const competition = data.header?.competitions?.[0] ?? data.competitions?.[0];
    const weather = competition?.weather ?? data.gameInfo?.weather;
    if (!weather || typeof weather !== 'object') return null;
    return formatWeather(weather as Parameters<typeof formatWeather>[0]);
  } catch {
    return null;
  }
}
