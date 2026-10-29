import { useState, useMemo, useCallback } from 'react';
import {
    useGetEventCalendar,
    useGetPanchangamCalendar,
    toMidnightKey,
} from '../../../hooks/queries/Calendar/useCalendar';

export const useCalendarController = () => {
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'panchangam'
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [searchQuery, setSearchQuery] = useState('');

    const { data: eventMap = {}, isLoading: isEventsLoading } = useGetEventCalendar();
    const { data: panchangamMap = {}, isLoading: isPanchangamLoading } = useGetPanchangamCalendar();

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Navigation handlers (jump based on the view mode)
    const goToToday = useCallback(() => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    }, []);

    const goToPrevious = useCallback(() => {
        setCurrentDate((prev) => {
            const d = new Date(prev);
            if (viewMode === 'day') {
                d.setDate(d.getDate() - 1);
                setSelectedDate(new Date(d));
            } else if (viewMode === 'week') {
                d.setDate(d.getDate() - 7);
            } else {
                d.setMonth(d.getMonth() - 1);
            }
            return d;
        });
    }, [viewMode]);

    const goToNext = useCallback(() => {
        setCurrentDate((prev) => {
            const d = new Date(prev);
            if (viewMode === 'day') {
                d.setDate(d.getDate() + 1);
                setSelectedDate(new Date(d));
            } else if (viewMode === 'week') {
                d.setDate(d.getDate() + 7);
            } else {
                d.setMonth(d.getMonth() + 1);
            }
            return d;
        });
    }, [viewMode]);

    const selectDate = useCallback((date) => {
        setSelectedDate(date);
        setCurrentDate(date);
    }, []);

    // Month Grid Calculation
    const monthDays = useMemo(() => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const startDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
        const days = [];

        // Trailing previous month days
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - 1, prevMonthDaysCount - i);
            const key = toMidnightKey(d);
            days.push({
                date: d,
                dayNumber: d.getDate(),
                key,
                isCurrentMonth: false,
                events: eventMap[key] || [],
                panchangam: panchangamMap[key] || null,
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(currentYear, currentMonth, day);
            const key = toMidnightKey(d);
            days.push({
                date: d,
                dayNumber: day,
                key,
                isCurrentMonth: true,
                events: eventMap[key] || [],
                panchangam: panchangamMap[key] || null,
            });
        }

        // Leading next month days
        const remainingCells = (7 - (days.length % 7)) % 7;
        for (let day = 1; day <= remainingCells; day++) {
            const d = new Date(currentYear, currentMonth + 1, day);
            const key = toMidnightKey(d);
            days.push({
                date: d,
                dayNumber: day,
                key,
                isCurrentMonth: false,
                events: eventMap[key] || [],
                panchangam: panchangamMap[key] || null,
            });
        }

        return days;
    }, [currentYear, currentMonth, eventMap, panchangamMap]);

    // 2. Week View Days (full 7 days containing the selected/current date: Sunday to Saturday)
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = startOfWeek.getDay(); // 0 is Sunday
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            const key = toMidnightKey(d);
            days.push({
                date: d,
                dayNumber: d.getDate(),
                key,
                events: eventMap[key] || [],
                panchangam: panchangamMap[key] || null,
            });
        }
        return days;
    }, [currentDate, eventMap, panchangamMap]);

    // Selected Day Details
    const selectedKey = toMidnightKey(selectedDate);
    const selectedEvents = useMemo(() => {
        const list = eventMap[selectedKey] || [];
        if (!searchQuery.trim()) return list;
        return list.filter((ev) =>
            ev.refDataName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [eventMap, selectedKey, searchQuery]);

    const selectedPanchangam = panchangamMap[selectedKey] || null;

    return {
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        currentDate,
        selectedDate,
        searchQuery,
        setSearchQuery,
        currentYear,
        currentMonth,
        monthDays,
        weekDays,
        selectedEvents,
        selectedPanchangam,
        isEventsLoading,
        isPanchangamLoading,
        goToToday,
        goToPrevious,
        goToNext,
        selectDate,
    };
};

export default useCalendarController;



