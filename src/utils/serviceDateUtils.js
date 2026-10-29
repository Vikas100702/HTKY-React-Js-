/**
 * calendar calculations, recurring date rules,
 * grayscale status determination, and date formatting.
 */

const WEEKDAY_MAP = Object.freeze({
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0,
});

const ORDINAL_MAP = Object.freeze({
    FIRST: 1,
    SECOND: 2,
    THIRD: 3,
    FOURTH: 4,
    FIFTH: 5,
    SIXTH: 6,
});

/**
 * Normalizes any Date object to midnight (00:00:00.000).
 */
export const toMidnight = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Formats a Date object to "MM/DD/YYYY" matching the backend
 */
export const formatSlashDate = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

/**
 * Parses time strings like "09:00 AM" or "06:30 PM" into today's Date instance.
 */
export const parseTimeString = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.trim()) return null;
    try {
        const cleanStr = timeStr.trim().toUpperCase();
        const parts = cleanStr.split(/[:\s]/).filter(Boolean);
        if (parts.length < 3) return null;

        let hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);
        const ampm = parts[2];

        if (isNaN(hour) || isNaN(minute)) return null;

        if (ampm === 'PM' && hour !== 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;

        const target = new Date();
        target.setHours(hour, minute, 0, 0);
        return target;
    } catch {
        return null;
    }
};

/**
 * Evaluates whether a service card should be disabled/grayscale.
 */
export const checkIsServiceGreyScale = (serviceItem) => {
    try {
        const availabilityStatus = parseInt(serviceItem?.isAvailable ?? 0, 10);

        // Condition 1: Direct disabled flag
        if (availabilityStatus === 1) {
            return true;
        }

        // Condition 2: Operating time range check
        if (availabilityStatus === 2) {
            const startTime = parseTimeString(serviceItem?.startTime);
            const endTime = parseTimeString(serviceItem?.endTime);

            if (!startTime || !endTime) return false;

            const now = new Date();
            // True if CURRENT time falls OUTSIDE the window
            return now < startTime || now > endTime;
        }

        // Condition 3: Stock / inventory capacity limit
        if (availabilityStatus === 3) {
            const count = parseInt(serviceItem?.availableCount ?? 0, 10);
            return count <= 0;
        }

        return false;
    } catch (err) {
        console.error('[checkIsServiceGreyScale Error]:', err);
        return true; // Fail-safe: disable on computation error
    }
};

/**
 * Calculates ordinal occurrence of a weekday in a given month (e.g. 1st Saturday = 1).
 */
const getOrdinalOfMonth = (date) => {
    let count = 0;
    const temp = new Date(date.getFullYear(), date.getMonth(), 1);
    while (temp <= date) {
        if (temp.getDay() === date.getDay()) count++;
        temp.setDate(temp.getDate() + 1);
    }
    return count;
};

/**
 * Generates valid selectable dates for weekday recurrence,
 * ordinals, booking limits per day, and holding date exclusions.
 */
export const calculateAvailableDates = ({
    dayTypes = '',
    startDate = '',
    endDate = '',
    bookingLimitPerDay = 0,
    holdingDates = '',
    availabilityMap = {},
}) => {
    try {
        const upperDayTypes = (dayTypes || '').toUpperCase().trim();
        let allowedWeekdays = [];
        let requiredOrdinal = null;

        // Ordinal extraction
        for (const [name, ordinal] of Object.entries(ORDINAL_MAP)) {
            if (upperDayTypes.includes(name)) {
                requiredOrdinal = ordinal;
                break;
            }
        }

        // Weekday extraction
        const isEveryday =
            upperDayTypes.includes('EVERYDAY') ||
            upperDayTypes.includes('EVERY DAY') ||
            upperDayTypes.includes('ALLDAY') ||
            upperDayTypes.includes('ALL DAY') ||
            upperDayTypes.length === 0;

        if (isEveryday) {
            allowedWeekdays = [0, 1, 2, 3, 4, 5, 6];
        } else {
            for (const [dayName, dayIndex] of Object.entries(WEEKDAY_MAP)) {
                if (upperDayTypes.includes(dayName)) {
                    allowedWeekdays.push(dayIndex);
                }
            }
        }

        if (allowedWeekdays.length === 0) allowedWeekdays = [0, 1, 2, 3, 4, 5, 6];

        // Range bounds
        const today = toMidnight(new Date());
        let current = startDate ? parseServiceDate(startDate) || today : today;
        if (current < today) current = today;

        const maxLimitDate = new Date(today);
        maxLimitDate.setFullYear(maxLimitDate.getFullYear() + 1);

        const end = endDate ? parseServiceDate(endDate) || maxLimitDate : maxLimitDate;
        const limit = parseInt(bookingLimitPerDay || 0, 10);

        const validDates = [];
        const walkDate = new Date(current);

        while (walkDate <= end) {
            const currentDay = walkDate.getDay();

            if (allowedWeekdays.includes(currentDay)) {
                let passesOrdinal = true;
                if (requiredOrdinal !== null) {
                    passesOrdinal = getOrdinalOfMonth(walkDate) === requiredOrdinal;
                }

                if (passesOrdinal) {
                    if (limit > 0) {
                        const formatted = formatSlashDate(walkDate);
                        const booked = availabilityMap[formatted] || 0;
                        const remaining = limit - booked;
                        if (remaining > 0) {
                            validDates.push(new Date(walkDate));
                        }
                    } else {
                        validDates.push(new Date(walkDate));
                    }
                }
            }

            walkDate.setDate(walkDate.getDate() + 1);
        }

        // Exclude holding dates
        if (holdingDates && typeof holdingDates === 'string' && holdingDates.trim()) {
            const holdingSet = new Set(
                holdingDates
                    .split(',')
                    .map((d) => d.trim())
                    .filter(Boolean)
            );

            return validDates.filter((date) => !holdingSet.has(formatSlashDate(date)));
        }

        return validDates;
    } catch (err) {
        console.error('[calculateAvailableDates Error]:', err);
        return [];
    }
};

/**
 * Clusters consecutive available dates when serviceOccurrencesNo > 1.
 */
export const getSelectedOccurrences = (
    userSelectedDate,
    serviceOccurrencesNo = 1,
    allAvailableDates = []
) => {
    try {
        const occurrences = parseInt(serviceOccurrencesNo || '1', 10) || 1;
        if (occurrences <= 1) return [userSelectedDate];

        const selectedMidnight = toMidnight(userSelectedDate).getTime();
        const startIndex = allAvailableDates.findIndex(
            (d) => toMidnight(d).getTime() === selectedMidnight
        );

        if (startIndex === -1) return [userSelectedDate];

        const endIndex = Math.min(startIndex + occurrences, allAvailableDates.length);
        return allAvailableDates.slice(startIndex, endIndex);
    } catch (err) {
        console.error('[getSelectedOccurrences Error]:', err);
        return [userSelectedDate];
    }
};

/**
 * Internal date parser (MM/dd/yyyy).
 */
const parseServiceDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const parsed = new Date(year, month, day, 0, 0, 0, 0);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
};

