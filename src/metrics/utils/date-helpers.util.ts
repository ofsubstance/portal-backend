import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { DurationSpan } from '../enums/duration-span.enum';

/**
 * Converts a period string to a Date object based on the span type
 * @param dateStr The period string (e.g., "2025-04" for month, "2025-04-17" for day)
 * @param span The duration span type (daily, weekly, monthly)
 * @param isStart Whether this is the start or end of the period
 * @returns A Date object representing the start or end of the period
 */
export function stringToDate(
  dateStr: string,
  span: DurationSpan,
  isStart: boolean,
): Date {
  switch (span) {
    case DurationSpan.WEEKLY:
      // Format: yyyy-ww (e.g., 2025-16)
      // This requires custom handling since parseISO doesn't handle week numbers
      const [year, week] = dateStr.split('-').map(Number);
      // Create a simple date representing first day of the year
      const firstDayOfYear = new Date(year, 0, 1);
      // Add (week number - 1) * 7 days to get to the start of the desired week
      const dayOfWeek = (week - 1) * 7;
      const approxDate = new Date(year, 0, 1 + dayOfWeek);
      // Adjust to the start or end of that week
      return isStart ? startOfWeek(approxDate) : endOfWeek(approxDate);

    case DurationSpan.MONTHLY:
      // Format: yyyy-MM (e.g., 2025-04)
      const monthDate = parseISO(`${dateStr}-01`);
      return isStart ? startOfMonth(monthDate) : endOfMonth(monthDate);

    case DurationSpan.DAILY:
    default:
      // Format: yyyy-MM-dd (e.g., 2025-04-16)
      const dayDate = parseISO(dateStr);
      return isStart ? startOfDay(dayDate) : endOfDay(dayDate);
  }
}

/**
 * Gets the default start date for a given span type
 * @param span The duration span type (daily, weekly, monthly)
 * @param forGrowth Whether this is for growth rate calculations (requires one extra period)
 * @returns A Date object representing the default start date
 */
export function getDefaultStartDate(
  span: DurationSpan,
  forGrowth: boolean = false,
): Date {
  // Default start dates based on span
  switch (span) {
    case DurationSpan.WEEKLY:
      const weeksAgo = forGrowth ? 10 : 9;
      const weeksAgoDate = new Date();
      weeksAgoDate.setDate(weeksAgoDate.getDate() - weeksAgo * 7);
      return startOfWeek(weeksAgoDate);
    case DurationSpan.MONTHLY:
      const monthsAgo = forGrowth ? 12 : 11;
      return startOfMonth(subMonths(new Date(), monthsAgo));
    case DurationSpan.DAILY:
    default:
      return startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  }
}

/**
 * Gets the month difference between two dates
 * @param startDate The start date
 * @param endDate The end date
 * @returns The number of months between the two dates
 */
export function getMonthDifference(startDate: Date, endDate: Date): number {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth()
  );
}

/**
 * Processes date parameters for consistent handling across API endpoints
 * @param startDate Optional start date from request
 * @param endDate Optional end date from request
 * @param span The duration span type
 * @param forGrowth Whether this is for growth rate calculations
 * @returns Processed date strings and format information
 */
export function processDateParams(
  startDate: Date | undefined,
  endDate: Date | undefined,
  span: DurationSpan,
  forGrowth: boolean = false,
) {
  let startPeriodString: string;
  let endPeriodString: string;
  let dateFormat: string;
  let groupByFormat: string;

  switch (span) {
    case DurationSpan.WEEKLY:
      dateFormat = 'yyyy-ww'; // Year-WeekNumber
      groupByFormat = "TO_CHAR(login_event.timestamp, 'YYYY-IW')";
      startPeriodString = startDate
        ? format(startOfWeek(startDate), dateFormat)
        : format(getDefaultStartDate(span, forGrowth), dateFormat);
      endPeriodString = endDate
        ? format(endOfWeek(endDate), dateFormat)
        : format(new Date(), dateFormat);
      break;
    case DurationSpan.MONTHLY:
      dateFormat = 'yyyy-MM'; // Year-Month
      groupByFormat = "TO_CHAR(login_event.timestamp, 'YYYY-MM')";
      startPeriodString =
        startDate?.toISOString().split('T')[0].substring(0, 7) ||
        format(getDefaultStartDate(span, forGrowth), dateFormat);
      endPeriodString =
        endDate?.toISOString().split('T')[0].substring(0, 7) ||
        format(new Date(), dateFormat);
      break;
    case DurationSpan.DAILY:
    default:
      dateFormat = 'yyyy-MM-dd'; // Year-Month-Day
      // Use the same logic as the getDailyActiveUsers method for consistent results
      groupByFormat = 'DATE(login_event.timestamp)';
      startPeriodString =
        startDate?.toISOString().split('T')[0] ||
        format(getDefaultStartDate(span, forGrowth), dateFormat);
      endPeriodString =
        endDate?.toISOString().split('T')[0] || format(new Date(), dateFormat);
      break;
  }

  // Convert string dates to Date objects for database queries
  const queryStartDate = stringToDate(startPeriodString, span, true);
  const queryEndDate = stringToDate(endPeriodString, span, false);

  return {
    startPeriodString,
    endPeriodString,
    dateFormat,
    groupByFormat,
    queryStartDate,
    queryEndDate,
  };
}

/**
 * Gets all periods in a date range based on span type
 * @param startDate The start date
 * @param endDate The end date
 * @param span The duration span type
 * @returns An array of Date objects representing all periods in the range
 */
export function getPeriodsInRange(
  startDate: Date,
  endDate: Date,
  span: DurationSpan,
): Date[] {
  switch (span) {
    case DurationSpan.WEEKLY:
      return eachWeekOfInterval({
        start: startDate,
        end: endDate,
      });
    case DurationSpan.MONTHLY:
      return eachMonthOfInterval({
        start: startDate,
        end: endDate,
      });
    case DurationSpan.DAILY:
    default:
      return eachDayOfInterval({
        start: startDate,
        end: endDate,
      });
  }
}

/**
 * Creates a map of periods with zero counts
 * @param periodRange Array of dates representing periods
 * @param dateFormat The date format string to use
 * @returns A Map with period keys and zero counts
 */
export function createPeriodMap(
  periodRange: Date[],
  dateFormat: string,
): Map<string, number> {
  const periodMap = new Map<string, number>();
  periodRange.forEach((date) => {
    const periodKey = format(date, dateFormat);
    periodMap.set(periodKey, 0);
  });
  return periodMap;
}
