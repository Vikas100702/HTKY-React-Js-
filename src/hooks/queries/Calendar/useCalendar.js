import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { ENV_CONFIG } from '../../../config/envConfig';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

const PRODUCT_ID = ENV_CONFIG.PRODUCT_ID;
const CLIENT_ID = ENV_CONFIG.CLIENT_ID;

export const HINDU_TITHIS = Object.freeze([
    'PRATIPADA', 'DWITIYA', 'TRITIYA', 'CHATURTHI', 'PANCHAMI',
    'SHASHDI', 'SHASHTHI', 'SAPTAMI', 'ASHTAMI', 'NAVAMI', 'DASHAMI',
    'EKADASHI', 'DWADASHI', 'TRAYODASHI', 'CHATURDASHI', 'PURNIMA', 'AMAVASYA'
]);

const WEEKDAY_MAP = Object.freeze({
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0, // getDay(): Sunday is 0, Monday is 1
});

export const toMidnightKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const parseFlexibleDate = (val) => {
    if (!val || typeof val !== 'string' || !val.trim()) return null;
    const str = val.trim();

    // Try ISO YYYY-MM-DD
    if (str.includes('-')) {
        const parts = str.split('T')[0].split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
            if (!isNaN(d.getTime())) return d;
        }
    }
    // Try MM/dd/yyyy or MM-dd-yyyy
    const slashParts = str.split(/[/]/);
    if (slashParts.length === 3) {
        const d = new Date(parseInt(slashParts[2], 10), parseInt(slashParts[0], 10) - 1, parseInt(slashParts[1], 10), 0, 0, 0, 0);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
};

// EVENT CALENDAR & ARCHANA QUERY
const fetchEventCalendarData = async ({ signal }) => {
    // 1. Fetch Temple Calendar Events
    const eventsPayload = buildComponentConfigPayload({
        moduleName: 'Temple Calendar',
        aspectType: 'templeCalendar',
        query: { aspectType: 'templeCalendar' },
    })

    // 2. Fetch Archana Services marked for Calendar
    const archanaPayload = buildComponentConfigPayload({
        moduleName: 'Temple Services',
        aspectType: 'ServiceSetup',
        collectionType: 'Business',
        query: {
            aspectType: 'ServiceSetup',
            serviceCategoryTypes: { $in: ['IN-TEMPLE', 'EVENTS', 'SPONSORSHIP'] },
            sourceTypes: 'WEBSITE',
            status: 'ACTIVE',
            showInCalendar: 'YES',
        },
    });

    const [eventsRes, archanaRes] = await Promise.all([
        apiClient.post(ENDPOINTS.FILTER_API, eventsPayload, { signal, pre: false }),
        apiClient.post(ENDPOINTS.FILTER_API, archanaPayload, { signal, pre: false }),
    ]);

    const rawEvents = Array.isArray(eventsRes?.data) ? eventsRes.data : eventsRes?.data?.data || [];
    const rawArchana = Array.isArray(archanaRes?.data) ? archanaRes.data : archanaRes?.data?.data || [];

    const dummyArchanaEvents = rawArchana.map((item) => ({
        id: item?._id || item?.id,
        refDataName: item?.refDataName || '',
        dayTypes: item?.dayTypes || '',
        eventDate: '',
        startTime: '',
        endTime: '',
        colour: '',
        sequenceIdAsNumber: parseInt(item?.sequenceIdAsNumber || item?.sequenceId || '0', 10) || 0,
    }));

    const allRawEvents = [...rawEvents, ...dummyArchanaEvents];

    // Recurrence Generator Logic (Start: Jan 1 Previous Year, End: Dec 31 Current Year)
    const now = new Date();
    const currentYear = now.getFullYear();
    const start = new Date(currentYear - 1, 0, 1, 0, 0, 0, 0);
    const end = new Date(currentYear, 11, 31, 0, 0, 0, 0);

    const eventMap = {};
    const addEvent = (dateObj, ev) => {
        const key = toMidnightKey(dateObj);
        if (!eventMap[key]) eventMap[key] = [];
        eventMap[key].push({
            id: ev._id || ev.id,
            refDataName: ev.refDataName || '',
            dayTypes: ev.dayTypes || 'EVERYDAY',
            startTime: ev.startTime || 'ALL DAY',
            endTime: ev.endTime || 'ALL DAY',
            colour: ev.colour || '#800000',
            sequenceIdAsNumber: parseInt(ev.sequenceIdAsNumber || '0', 10) || 0,
        });
    };

    for (const ev of allRawEvents) {
        const eventDate = (ev.eventDate || '').trim();
        const dayType = (ev.dayTypes || '').trim().toUpperCase();

        // Condition 1: One-Time Events
        if (eventDate.length > 0) {
            const parsed = parseFlexibleDate(eventDate);
            if (parsed) addEvent(parsed, ev);
            continue;
        }

        // Condition 2: Daily Recurring Events
        const isDaily =
            dayType.length === 0 ||
            dayType === 'EVERY DAY' ||
            dayType === 'EVERYDAY' ||
            dayType === 'ALL DAY' ||
            dayType === 'ALLDAY';

        if (isDaily) {
            const cur = new Date(start);
            while (cur <= end) {
                addEvent(cur, ev);
                cur.setDate(cur.getDate() + 1);
            }
            continue;
        }

        // Condition 3: Weekly Recurring (Single or '&' separated)
        const checkDays = dayType.includes('&')
            ? dayType.split('&').map((d) => d.trim())
            : [dayType];

        let hasWeekdayMatch = false;
        for (const dName of checkDays) {
            const cleanName = dName.replace('EVERY', '').trim();
            const targetDay = WEEKDAY_MAP[cleanName];
            if (targetDay !== undefined) {
                hasWeekdayMatch = true;
                const cur = new Date(start);
                while (cur <= end) {
                    if (cur.getDay() === targetDay) addEvent(cur, ev);
                    cur.setDate(cur.getDate() + 1);
                }
            }
        }

        // Condition 4: Tithi Recurring Event
        if (!hasWeekdayMatch) {
            const matchedTithi = HINDU_TITHIS.find((t) => dayType.includes(t));
            if (matchedTithi) {
                try {
                    const tithiPayload = {
                        componentConfig: {
                            moduleName: 'Temple Services',
                            aspectType: 'ServiceSetup',
                            productID: PRODUCT_ID,
                            clientID: CLIENT_ID,
                            tithi: matchedTithi,
                        },
                    };
                    const tithiRes = await apiClient.post(
                        ENDPOINTS.GET_THITHI_NEXT_90_DAYS || '/api/event/getThithiNext90Days',
                        tithiPayload,
                        { signal, pre: true }
                    );
                    const tithiList = Array.isArray(tithiRes?.data) ? tithiRes.data : tithiRes?.data?.data || [];
                    tithiList.forEach((t) => {
                        const tDate = parseFlexibleDate(t.startDate);
                        if (tDate) addEvent(tDate, ev);
                    });
                } catch {
                    // Non-blocking fallback
                }
            }
        }
    }

    // Sort events by sequenceIdAsNumber ascending
    Object.keys(eventMap).forEach((k) => {
        eventMap[k].sort((a, b) => a.sequenceIdAsNumber - b.sequenceIdAsNumber);
    });

    return eventMap;
};

export const useGetEventCalendar = () => {
    return useQuery({
        queryKey: ['templeCalendar', 'events'],
        queryFn: fetchEventCalendarData,
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
    });
};

// PANCHANGAM CALENDAR QUERY
const fetchPanchangamCalendarData = async ({ signal }) => {
    const currentYear = new Date().getFullYear();
    const payload = {
        clientId: CLIENT_ID,
        year: {
            $gte: String(currentYear),
            $lte: String(currentYear + 1),
        },
    };

    const response = await apiClient.post(
        ENDPOINTS.PANCHANGAM || '/api/home/getCalendar',
        payload,
        { signal, pre: false }
    );

    const rawList = Array.isArray(response?.data) ? response.data : response?.data?.data || [];
    const panchangamMap = {};

    rawList.forEach((item) => {
        const d = parseFlexibleDate(item.startDate);
        if (d) {
            const key = toMidnightKey(d);
            panchangamMap[key] = {
                location: item.Location || '-',
                sunRise: item.SunRise || '-',
                sunSet: item.SunSet || '-',
                moonRise: item.MoonRise || '-',
                moonSet: item.MoonSet || '-',
                shakaSamvat: item.ShakaSamvat || '-',
                amantaMonth: item.AmantaMonth || '-',
                purnimantaMonth: item.PurnimantaMonth || '-',
                weekday: item.Weekday || '-',
                paksha: item.Paksha || '-',
                tithi: item.Tithi || '-',
                nakshatra: item.Nakshatra || '-',
                yoga: item.Yoga || '-',
                karana: item.Karana || '-',
                sunsign: item.Sunsign || '-',
                rahuKalam: item.RahuKalam || '-',
                gulikaiKalam: item.GulikaiKalam || '-',
                yamaganda: item.Yamaganda || '-',
                durMuhurtam: item.DurMuhurtam || '-',
                durMuhurtam2: item.DurMuhurtam2 || '-',
                amritKalam: item.AmritKalam || '-',
                varjyam: item.Varjyam || '-',
            };
        }
    });

    return panchangamMap;
};

export const useGetPanchangamCalendar = () => {
    return useQuery({
        queryKey: ['templeCalendar', 'panchangam'],
        queryFn: fetchPanchangamCalendarData,
        staleTime: 1000 * 60 * 60 * 6,
        gcTime: 1000 * 60 * 60 * 12,
        refetchOnWindowFocus: false,
    });
};

