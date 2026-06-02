/** @param {number} count @param {Date} [anchor] */
export function getDateWindow(count = 7, anchor = new Date()) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const dates = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/** @param {Date} date */
export function toISODateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ESPN scoreboard `dates` param: YYYYMMDD */
export function toEspnDateParam(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** Calendar day (YYYY-MM-DD) in US Eastern for an event start time. */
export function gameDateFromEventStart(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

/** @param {string} startIso @param {string} endIso YYYY-MM-DD */
export function isDateInRange(iso, startIso, endIso) {
  return iso >= startIso && iso <= endIso;
}

/** @param {string} isoDate YYYY-MM-DD */
export function weekLabelForDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${y}`;
}
