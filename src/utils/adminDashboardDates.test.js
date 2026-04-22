import { describe, it, expect } from 'vitest';
import {
  defaultFourWeeksArgentinaRange,
  isoWeekMondaySlotsArgentina,
  mergeWeeklyCounts,
  mondayArgentinaOfWeekContainingYmd
} from './adminDashboardDates.js';

describe('adminDashboardDates (Argentina)', () => {
  it('mondayArgentinaOfWeekContainingYmd returns Monday in Argentina', () => {
    const mon = mondayArgentinaOfWeekContainingYmd('2025-04-23');
    expect(mon.weekday).toBe(1);
    expect(mon.toFormat('yyyy-LL-dd')).toBe('2025-04-21');
  });

  it('defaultFourWeeksArgentinaRange returns from <= to', () => {
    const { from, to } = defaultFourWeeksArgentinaRange();
    expect(from.length).toBe(10);
    expect(to.length).toBe(10);
    expect(from <= to).toBe(true);
  });

  it('isoWeekMondaySlotsArgentina includes at least one week', () => {
    const slots = isoWeekMondaySlotsArgentina('2025-01-01', '2025-01-31');
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });

  it('mergeWeeklyCounts fills zeros', () => {
    const slots = ['2025-01-06T03:00:00.000Z'];
    const merged = mergeWeeklyCounts(slots, [{ weekStart: '2025-01-06T03:00:00.000Z', count: 3 }]);
    expect(merged[0].count).toBe(3);
  });
});
