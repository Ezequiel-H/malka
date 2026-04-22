import { DateTime } from 'luxon';

const TZ = 'America/Argentina/Buenos_Aires';

/** YYYY-MM-DD del calendario en Argentina para un instante dado. */
export function formatYmdArgentina(d) {
  return DateTime.fromJSDate(d instanceof Date ? d : new Date(d))
    .setZone(TZ)
    .toFormat('yyyy-LL-dd');
}

/** Lunes (00:00) de la semana que contiene el día `yyyy-mm-dd` en Argentina. */
export function mondayArgentinaOfWeekContainingYmd(ymd) {
  const day = DateTime.fromFormat(ymd, 'yyyy-LL-dd', { zone: TZ }).startOf('day');
  const wd = day.weekday;
  return day.minus({ days: wd - 1 }).startOf('day');
}

/** Domingo 23:59:59.999 de la semana cuyo lunes es `monday` (objeto DateTime en TZ). */
export function sundayArgentinaEndFromMonday(mondayDt) {
  return mondayDt.plus({ days: 6 }).endOf('day');
}

/** Últimas 4 semanas completas: lunes de hace 3 semanas → domingo de la semana actual (Argentina). */
export function defaultFourWeeksArgentinaRange() {
  const todayAr = DateTime.now().setZone(TZ).startOf('day');
  const mondayThisWeek = todayAr.minus({ days: todayAr.weekday - 1 });
  const fromMonday = mondayThisWeek.minus({ weeks: 3 });
  const toSunday = sundayArgentinaEndFromMonday(mondayThisWeek);
  return {
    from: fromMonday.toFormat('yyyy-LL-dd'),
    to: toSunday.toFormat('yyyy-LL-dd')
  };
}

/** Instantes UTC (ISO) del lunes 00:00 AR de cada semana entre los rangos fromYmd–toYmd (inclusive). */
export function isoWeekMondaySlotsArgentina(fromYmd, toYmd) {
  const start = mondayArgentinaOfWeekContainingYmd(fromYmd);
  const endMonday = mondayArgentinaOfWeekContainingYmd(toYmd);
  const slots = [];
  for (let d = start; d <= endMonday; d = d.plus({ weeks: 1 })) {
    slots.push(d.toUTC().toJSDate().toISOString());
  }
  return slots;
}

export function mergeWeeklyCounts(slotsIso, weeklyFromApi) {
  const map = new Map();
  for (const row of weeklyFromApi || []) {
    map.set(new Date(row.weekStart).getTime(), row.count);
  }
  return slotsIso.map((weekStartIso) => {
    const tick = DateTime.fromJSDate(new Date(weekStartIso)).setZone(TZ).toFormat('dd/MM/yy');
    return {
      weekStart: weekStartIso,
      weekShort: weekStartIso.slice(0, 10),
      weekTick: tick,
      count: map.get(new Date(weekStartIso).getTime()) ?? 0
    };
  });
}
