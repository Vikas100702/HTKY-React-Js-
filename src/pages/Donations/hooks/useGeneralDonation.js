import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    useGetDonationCategories,
    useGetDonationCategoryDetails,
    parseDateString
} from '../../../hooks/queries/Donations/useGetDonations';

const WEEKDAY_MAP = Object.freeze({
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
});

const ORDINAL_MAP = Object.freeze({
    FIRST: 1,
    SECOND: 2,
    THIRD: 3,
    FOURTH: 4,
    FIFTH: 5,
    SIXTH: 6
});

const logControllerTelemetry = (level, message, context = {}) => {
    const event = {
        timestamp: new Date().toISOString(),
        module: 'HTKY_DONATION_CONTROLLER',
        level,
        message,
        context
    };

    if (level === 'error') {
        console.error(`[HTKY_CONTROLLER][ERROR] ${message}`, event);
    } else if (level === 'warn') {
        console.warn(`[HTKY_CONTROLLER][WARN] ${message}`, event);
    } else {
        console.log(`[HTKY_CONTROLLER][INFO] ${message}`, event);
    }
};

// ============================================================================
// LOGIC CONTROLLER HOOK
// ============================================================================

export const useGeneralDonation = () => {
    const isMountedRef = useRef(true);

    // --------------------------------------------------------------------------
    // 1. SERVER STATE QUERIES
    // --------------------------------------------------------------------------
    const {
        data: categories = [],
        isLoading: isCategoriesLoading,
        isError: isCategoriesError
    } = useGetDonationCategories();

    // User tab selection tracking
    const [userSelectedCategory, setUserSelectedCategory] = useState(null);

    // Derived Category: Picks manual user selection, falls back to 'GENERAL DONATIONS', or takes first entry
    const selectedCategory = useMemo(() => {
        if (userSelectedCategory) return userSelectedCategory;
        if (categories.length > 0) {
            const defaultCategory =
                categories.find((cat) => cat.refDataName?.toUpperCase() === 'GENERAL DONATIONS') ||
                categories[0];
            return defaultCategory?.refDataName || '';
        }
        return '';
    }, [categories, userSelectedCategory]);

    const {
        data: categoryDetails = [],
        isLoading: isDetailsLoading,
        isError: isDetailsError
    } = useGetDonationCategoryDetails(selectedCategory);

    // --------------------------------------------------------------------------
    // 2. LOCAL INTERACTIVE STATE
    // --------------------------------------------------------------------------
    const [searchQuery, setSearchQuery] = useState('');
    const [checkedCategoryMap, setCheckedCategoryMap] = useState({});
    const [categoryQuantitiesMap, setCategoryQuantitiesMap] = useState({});
    const [customAmountMap, setCustomAmountMap] = useState({});
    const [selectedDatesMap, setSelectedDatesMap] = useState({});
    const [selectedTimeMap, setSelectedTimeMap] = useState({});
    const [expandedDescMap, setExpandedDescMap] = useState({});
    const [warningMessage, setWarningMessage] = useState('');
    const [currencySymbol] = useState('$');

    // Modal Dialog Descriptors with Mutex Stacking Lock
    const [dateModal, setDateModal] = useState({
        isOpen: false,
        item: null,
        isCustomSlot: false,
        availableDates: []
    });

    const [timeModal, setTimeModal] = useState({
        isOpen: false,
        item: null
    });

    // Memory safety lifecycle audit
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // --------------------------------------------------------------------------
    // 3. SEARCH & REAL-TIME FILTERING
    // --------------------------------------------------------------------------
    const filteredCategoryDetails = useMemo(() => {
        try {
            const query = searchQuery.trim().toLowerCase();
            if (!query) return categoryDetails;

            return categoryDetails.filter((item) => {
                const name = (item?.refDataName || '').toLowerCase();
                const desc = (item?.description || '').toLowerCase();
                return name.includes(query) || desc.includes(query);
            });
        } catch (error) {
            logControllerTelemetry('error', 'Search filter failure', { error: error.message });
            return categoryDetails;
        }
    }, [categoryDetails, searchQuery]);

    // --------------------------------------------------------------------------
    // 4. BUSINESS RULE HELPERS & VALIDATORS
    // --------------------------------------------------------------------------

    /**
     * Evaluates if current time falls within item's active operating window.
     */
    const isWithinTimeRange = useCallback((startStr, endStr) => {
        if (!startStr || !endStr || !startStr.trim() || !endStr.trim()) return true;
        try {
            const now = new Date();
            const parseTime = (timeStr) => {
                const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (!match) return null;
                const [, hours, minutes, modifier] = match;
                let h = parseInt(hours, 10);
                const m = parseInt(minutes, 10);
                if (modifier.toUpperCase() === 'PM' && h !== 12) h += 12;
                if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
                const d = new Date(now);
                d.setHours(h, m, 0, 0);
                return d;
            };

            const startTime = parseTime(startStr);
            const endTime = parseTime(endStr);
            if (!startTime || !endTime) return true;

            return now >= startTime && now <= endTime;
        } catch {
            return true;
        }
    }, []);

    /**
     * Checks whether card should be disabled/greyscaled.
     */
    const isCategoryGreyScale = useCallback(
        (item) => {
            try {
                const status = item?.isAvailable ?? 0;
                if (status === 1) return true;
                if (status === 2) return !isWithinTimeRange(item?.startTime, item?.endTime);
                if (status === 3) {
                    const count = parseInt(item?.availableCount, 10) || 0;
                    return count <= 0;
                }
                return false;
            } catch {
                return true;
            }
        },
        [isWithinTimeRange]
    );

    const checkDateVisibility = useCallback((isDtVisible) => {
        return (isDtVisible || '').trim().toUpperCase() === 'YES';
    }, []);

    const checkTimeVisibility = useCallback((isTimeVisible) => {
        return (isTimeVisible || '').trim().toUpperCase() === 'YES';
    }, []);

    const checkQtyCounterEnabled = useCallback((qtyCounter) => {
        return (qtyCounter || '').toString().trim().toUpperCase() === 'YES';
    }, []);

    const checkBookingLimitPerDay = useCallback((bookingLimit) => {
        return (parseInt(bookingLimit, 10) || 0) > 0;
    }, []);

    // --------------------------------------------------------------------------
    // 5. RECURRING DATE & OCCURRENCE ENGINE
    // --------------------------------------------------------------------------

    /**
     * Generates valid recurring calendar dates based on day types and holding rules.
     */
    const calculateAvailableDates = useCallback(({ dayTypes, startDate, endDate, holdingDates }) => {
        try {
            const upperDayTypes = (dayTypes || '').toUpperCase().trim();
            let allowedWeekdays = [];
            let requiredOrdinal = null;
            let targetDayString = upperDayTypes;

            for (const [key, value] of Object.entries(ORDINAL_MAP)) {
                if (upperDayTypes.includes(key)) {
                    requiredOrdinal = value;
                    targetDayString = upperDayTypes.replace(key, '').trim();
                    break;
                }
            }

            const isEveryday =
                targetDayString.includes('EVERYDAY') ||
                targetDayString.includes('EVERY DAY') ||
                targetDayString.includes('ALLDAY') ||
                targetDayString.includes('ALL DAY') ||
                !targetDayString;

            if (isEveryday) {
                allowedWeekdays = [0, 1, 2, 3, 4, 5, 6];
            } else {
                const tokens = upperDayTypes.split(/[&,\s]+/);
                for (const token of tokens) {
                    for (const [dayName, dayIndex] of Object.entries(WEEKDAY_MAP)) {
                        if (token.includes(dayName)) {
                            allowedWeekdays.push(dayIndex);
                        }
                    }
                }
            }

            allowedWeekdays = Array.from(new Set(allowedWeekdays));
            if (allowedWeekdays.length === 0) return [];

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

            const parsedStart = parseDateString(startDate) || today;
            const parsedEnd =
                parseDateString(endDate) || new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

            const current = parsedStart < today ? new Date(today) : new Date(parsedStart);
            const endLimit = new Date(parsedEnd);

            const getOrdinalOfMonth = (date) => {
                let count = 0;
                const temp = new Date(date.getFullYear(), date.getMonth(), 1);
                while (temp <= date) {
                    if (temp.getDay() === date.getDay()) count += 1;
                    temp.setDate(temp.getDate() + 1);
                }
                return count;
            };

            const holdingDatesSet = new Set();
            if (holdingDates && typeof holdingDates === 'string') {
                holdingDates.split(',').forEach((dStr) => {
                    const parsed = parseDateString(dStr.trim());
                    if (parsed) holdingDatesSet.add(parsed.toDateString());
                });
            }

            const availableDates = [];
            while (current <= endLimit) {
                if (allowedWeekdays.includes(current.getDay())) {
                    const passesOrdinal = requiredOrdinal
                        ? getOrdinalOfMonth(current) === requiredOrdinal
                        : true;

                    if (passesOrdinal && !holdingDatesSet.has(current.toDateString())) {
                        availableDates.push(new Date(current));
                    }
                }
                current.setDate(current.getDate() + 1);
            }

            return availableDates;
        } catch (error) {
            logControllerTelemetry('error', 'Date recurrence calculation error', { error: error.message });
            return [];
        }
    }, []);

    /**
     * Slices multiple occurrences from the starting picked date.
     */
    const getSelectedOccurrences = useCallback((userSelectedDate, occurrencesNo, allDates) => {
        const occurrences = Math.max(parseInt(occurrencesNo, 10) || 1, 1);
        if (occurrences <= 1) return [userSelectedDate];

        const startIndex = allDates.findIndex(
            (d) => d.toDateString() === userSelectedDate.toDateString()
        );
        if (startIndex === -1) return [userSelectedDate];

        return allDates.slice(startIndex, startIndex + occurrences);
    }, []);

    const getRemainingSlots = useCallback((_date, bookingLimitPerDay) => {
        const limit = parseInt(bookingLimitPerDay, 10) || 0;
        return limit <= 0 ? 9999 : limit;
    }, []);

    // --------------------------------------------------------------------------
    // 6. CART AGGREGATION PIPELINE
    // --------------------------------------------------------------------------
    const totalCartCount = useMemo(() => {
        return Object.entries(checkedCategoryMap).reduce((count, [key, isChecked]) => {
            if (!isChecked) return count;
            const item = categoryDetails.find((cat) => cat.id === key);
            const isQty = checkQtyCounterEnabled(item?.qtyCounter);
            return count + (isQty ? categoryQuantitiesMap[key] || 1 : 1);
        }, 0);
    }, [checkedCategoryMap, categoryDetails, categoryQuantitiesMap, checkQtyCounterEnabled]);

    const totalCartAmount = useMemo(() => {
        return Object.entries(checkedCategoryMap).reduce((total, [key, isChecked]) => {
            if (!isChecked) return total;
            const item = categoryDetails.find((cat) => cat.id === key);
            if (!item) return total;

            const price = item.parsedAmount > 0 ? item.parsedAmount : parseFloat(customAmountMap[key] || 0);
            const isQty = checkQtyCounterEnabled(item.qtyCounter);
            const qty = isQty ? categoryQuantitiesMap[key] || 1 : 1;

            return total + price * qty;
        }, 0);
    }, [checkedCategoryMap, categoryDetails, customAmountMap, categoryQuantitiesMap, checkQtyCounterEnabled]);

    // --------------------------------------------------------------------------
    // 7. ACTION DISPATCHERS & HANDLERS
    // --------------------------------------------------------------------------

    const handleCategorySelect = (categoryName) => {
        if (!categoryName || selectedCategory === categoryName) return;
        setUserSelectedCategory(categoryName);
        setSearchQuery('');
        setWarningMessage('');
    };

    const handleToggleDescription = (key) => {
        setExpandedDescMap((prev) => ({
            ...prev,
            [key]: prev[key] === undefined ? false : !prev[key]
        }));
    };

    const handleCustomAmountChange = (key, value) => {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed > 0) {
            setCustomAmountMap((prev) => ({ ...prev, [key]: parsed }));
            setCheckedCategoryMap((prev) => ({ ...prev, [key]: true }));
        } else {
            setCustomAmountMap((prev) => ({ ...prev, [key]: '' }));
            setCheckedCategoryMap((prev) => ({ ...prev, [key]: false }));
        }
    };

    const handleQuantityIncrement = (key) => {
        setCategoryQuantitiesMap((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        setCheckedCategoryMap((prev) => ({ ...prev, [key]: true }));
    };

    const handleQuantityDecrement = (key) => {
        setCategoryQuantitiesMap((prev) => ({
            ...prev,
            [key]: Math.max((prev[key] || 1) - 1, 1)
        }));
    };

    const handleCheckboxChange = (key, isChecked, item) => {
        const isDtVisible = checkDateVisibility(item?.isDTVisible);
        const selectedDates = selectedDatesMap[key] || [];

        // Mandatory Date Guard: Prevent selection without picked date
        if (isChecked && isDtVisible && selectedDates.length === 0) {
            setWarningMessage('Date Required: Please pick a date before selecting this service.');
            return;
        }

        setWarningMessage('');
        setCheckedCategoryMap((prev) => ({ ...prev, [key]: isChecked }));
        if (isChecked && (!categoryQuantitiesMap[key] || categoryQuantitiesMap[key] < 1)) {
            setCategoryQuantitiesMap((prev) => ({ ...prev, [key]: 1 }));
        }
    };

    // Date Modal Open/Close with Modal Lock
    const handleOpenDatePicker = (item) => {
        if (timeModal.isOpen) return; // Mutex Stacking Lock

        const availableDates = calculateAvailableDates({
            dayTypes: item?.dayTypes,
            startDate: item?.startDate,
            endDate: item?.endDate,
            holdingDates: item?.holdingDates
        });

        setDateModal({
            isOpen: true,
            item,
            isCustomSlot: checkBookingLimitPerDay(item?.bookingLimitPerDay),
            availableDates
        });
    };

    const handleCloseDatePicker = () => {
        setDateModal({
            isOpen: false,
            item: null,
            isCustomSlot: false,
            availableDates: []
        });
    };

    const handleSelectDate = (pickedDate) => {
        if (!dateModal.item || !pickedDate) return;
        const serviceKey = dateModal.item.id;

        const occurrences = getSelectedOccurrences(
            pickedDate,
            dateModal.item.serviceOccurrencesNo,
            dateModal.availableDates
        );

        setSelectedDatesMap((prev) => ({
            ...prev,
            [serviceKey]: occurrences
        }));

        handleCloseDatePicker();
    };

    // Time Modal Open/Close with Operating Hours Validation
    const handleOpenTimePicker = (item) => {
        if (dateModal.isOpen) return; // Mutex Stacking Lock

        const serviceKey = item?.id;
        const isDtVisible = checkDateVisibility(item?.isDTVisible);
        const selectedDates = selectedDatesMap[serviceKey] || [];

        if (isDtVisible && selectedDates.length === 0) {
            setWarningMessage('Date Required: Please select a date before choosing a time.');
            return;
        }

        setTimeModal({ isOpen: true, item });
    };

    const handleCloseTimePicker = () => {
        setTimeModal({ isOpen: false, item: null });
    };

    const handleSelectTime = (timeString) => {
        if (!timeModal.item || !timeString) return;
        const serviceKey = timeModal.item.id;

        // Operating hours check: 9:00 AM to 9:00 PM
        const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
            const [, hours, minutes, modifier] = match;
            let h = parseInt(hours, 10);
            const m = parseInt(minutes, 10);
            if (modifier.toUpperCase() === 'PM' && h !== 12) h += 12;
            if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;

            if (h < 9 || h >= 21) {
                setWarningMessage('Invalid Time: Please choose a slot between 9:00 AM and 9:00 PM.');
                return;
            }

            // Past time validation for current date
            const now = new Date();
            const selectedDates = selectedDatesMap[serviceKey] || [];
            const selectedDate = selectedDates.length > 0 ? selectedDates[0] : now;
            const isToday =
                selectedDate.getFullYear() === now.getFullYear() &&
                selectedDate.getMonth() === now.getMonth() &&
                selectedDate.getDate() === now.getDate();

            if (isToday) {
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const pickedMinutes = h * 60 + m;
                if (pickedMinutes < currentMinutes) {
                    setWarningMessage('Invalid Time: You cannot select a past time for today.');
                    return;
                }
            }
        }

        setWarningMessage('');
        setSelectedTimeMap((prev) => ({
            ...prev,
            [serviceKey]: timeString
        }));

        handleCloseTimePicker();
    };

    // Non-blocking Checkout Trigger
    const handleCheckoutClick = () => {
        if (totalCartCount === 0) {
            setWarningMessage('Empty Cart: Please select at least one donation service.');
            return;
        }

        logControllerTelemetry('info', 'Donation checkout initiated', {
            totalCartCount,
            totalCartAmount,
            currencySymbol
        });

        setWarningMessage(
            `Checkout Summary: ${totalCartCount} item(s) totaling ${currencySymbol}${totalCartAmount.toFixed(2)}. (Gateway integration proceeds in Phase 2).`
        );
    };

    return {
        state: {
            categories,
            selectedCategory,
            filteredCategoryDetails,
            isLoading: isCategoriesLoading || isDetailsLoading,
            hasError: isCategoriesError || isDetailsError,
            searchQuery,
            currencySymbol,
            totalCartCount,
            totalCartAmount,
            checkedCategoryMap,
            categoryQuantitiesMap,
            customAmountMap,
            selectedDatesMap,
            selectedTimeMap,
            expandedDescMap,
            dateModal,
            timeModal,
            warningMessage
        },
        actions: {
            setSearchQuery,
            setWarningMessage,
            handleCategorySelect,
            handleToggleDescription,
            handleCustomAmountChange,
            handleQuantityIncrement,
            handleQuantityDecrement,
            handleCheckboxChange,
            handleOpenDatePicker,
            handleCloseDatePicker,
            handleSelectDate,
            handleOpenTimePicker,
            handleCloseTimePicker,
            handleSelectTime,
            handleCheckoutClick
        },
        helpers: {
            isCategoryGreyScale,
            checkDateVisibility,
            checkTimeVisibility,
            checkQtyCounterEnabled,
            getRemainingSlots
        }
    };
};

