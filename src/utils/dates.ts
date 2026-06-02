const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type DayOption = {
  isoDate: string;
  shortLabel: string;
  subLabel: string;
};

export function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** ISO date string for today + `offset` days (local calendar). */
export function gameDateFromToday(offset: number): string {
  return toISODateLocal(addDaysLocal(new Date(), offset));
}

export function getNext7DayOptions(anchor = new Date()): DayOption[] {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());

  return Array.from({ length: 7 }, (_, i) => {
    const d = addDaysLocal(start, i);
    const isoDate = toISODateLocal(d);
    const shortLabel =
      i === 0 ? 'Today' : i === 1 ? 'Tom' : WEEKDAYS[d.getDay()];
    const subLabel = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    return { isoDate, shortLabel, subLabel };
  });
}

export function formatSelectedDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const todayIso = toISODateLocal(new Date());
  if (isoDate === todayIso) {
    return 'Today';
  }
  const tomorrowIso = toISODateLocal(addDaysLocal(new Date(), 1));
  if (isoDate === tomorrowIso) {
    return 'Tomorrow';
  }
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}
