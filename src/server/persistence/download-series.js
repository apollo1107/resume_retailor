/** Pure date-series helpers (no I/O). Download day keys are UTC YYYY-MM-DD. */

export const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function addUtcDayString(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

export function inclusiveUtcRangeDayCount(fromStr, toStr) {
  if (!YMD_RE.test(fromStr) || !YMD_RE.test(toStr) || fromStr > toStr) return 0;
  let n = 0;
  let cur = fromStr;
  let guard = 0;
  while (cur <= toStr && guard++ < 500) {
    n += 1;
    cur = addUtcDayString(cur);
  }
  return n;
}

/** @param {Record<string, { cv?: number, cover?: number }>} userDays */
export function getDailySeriesRangeFromUserDays(userDays, fromStr, toStr) {
  if (!YMD_RE.test(fromStr) || !YMD_RE.test(toStr) || fromStr > toStr) return [];
  const out = [];
  let cur = fromStr;
  let guard = 0;
  while (cur <= toStr && guard++ < 500) {
    const bucket = userDays[cur] || { cv: 0, cover: 0 };
    out.push({
      date: cur,
      cv: bucket.cv || 0,
      cover: bucket.cover || 0,
    });
    cur = addUtcDayString(cur);
  }
  return out;
}

/** @param {Record<string, { cv?: number, cover?: number }>} userDays */
export function getDailySeriesFromUserDays(userDays, numDays = 30) {
  const out = [];
  const end = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    const bucket = userDays[key] || { cv: 0, cover: 0 };
    out.push({
      date: key,
      cv: bucket.cv || 0,
      cover: bucket.cover || 0,
    });
  }
  return out;
}
