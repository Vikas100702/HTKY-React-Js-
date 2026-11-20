/**
 * @file src/pages/Donations/hooks/useGeneralDonation.js
 * @description Enterprise Logic Controller Hook for HTKY General Donation & Sponsorship Module.
 * Synchronizes local selections directly with Zustand global cart store (`useCartStore`),
 * preserves backend `qtyCounter` and `rawItem` metadata for Checkout parity,
 * enforces dynamic Lunar Tithi engine, holding dates exclusion, and modal stacking locks.
 *
 * Strict Tech Stack: Pure ES6+ JavaScript (NO TypeScript).
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '../../../store/useCartStore';
import {
    useGetDonationCategories,
    useGetDonationCategoryDetails,
    useGetTithiDates,
    extractTithiKeyword,
    parseDateString,
    useGetClientSettings,
    useGetServiceAvailability,
    formatDateToMMDDYYYY,
} from '../../../hooks/queries/Donations/useGetDonations';

// ============================================================================
// CONSTANTS & RECURRENCE MAPS
// ============================================================================

const WEEKDAY_MAP = Object.freeze({
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
});

const ORDINAL_MAP = Object.freeze({
    FIRST: 1,
    SECOND: 2,
    THIRD: 3,
    FOURTH: 4,
    FIFTH: 5,
    SIXTH: 6,
});

// ============================================================================
// TELEMETRY & OBSERVABILITY
// ============================================================================

const logControllerTelemetry = (level, message, context = {}) => {
    const event = {
        timestamp: new Date().toISOString(),
        module: 'HTKY_DONATION_CONTROLLER',
        level,
        message,
        context,
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
// CONTROLLER HOOK
// ============================================================================

export const useGeneralDonation = () => {
    const isMountedRef = useRef(true);

    // --------------------------------------------------------------------------
    // 1. GLOBAL ZUSTAND STORE SUBSCRIPTION
    // --------------------------------------------------------------------------
    const cartItems = useCartStore((state) => state.items);
    const totalCartCount = useCartStore((state) => state.totalCount);
    const totalCartAmount = useCartStore((state) => state.totalAmount);
    const currencySymbol = useCartStore((state) => state.currencySymbol);

    const setCurrencySymbol = useCartStore((state) => state.setCurrencySymbol);
    const addItemToGlobalCart = useCartStore((state) => state.addItem);
    const removeItemFromGlobalCart = useCartStore((state) => state.removeItem);
    const updateGlobalQuantity = useCartStore((state) => state.updateQuantity);
    const acquireModalLock = useCartStore((state) => state.acquireModalLock);
    const releaseModalLock = useCartStore((state) => state.releaseModalLock);

    // --------------------------------------------------------------------------
    // 2. SERVER STATE QUERIES
    // --------------------------------------------------------------------------
    const {
        data: categories = [],
        isLoading: isCategoriesLoading,
        isError: isCategoriesError,
    } = useGetDonationCategories();

    const [userSelectedCategory, setUserSelectedCategory] = useState(null);
    const [activeTithi, setActiveTithi] = useState(null);

    // Default Category Fallback ('HANUMAN' -> 'GENERAL DONATIONS' -> categories[0])
    const selectedCategory = useMemo(() => {
        if (userSelectedCategory) return userSelectedCategory;
        if (categories.length > 0) {
            const defaultCat =
                categories.find((cat) => cat.refDataName?.toUpperCase() === 'HANUMAN') ||
                categories.find((cat) => cat.refDataName?.toUpperCase() === 'GENERAL DONATIONS') ||
                categories[0];
            return defaultCat?.refDataName || '';
        }
        return '';
    }, [categories, userSelectedCategory]);

    const {
        data: categoryDetails = [],
        isLoading: isDetailsLoading,
        isError: isDetailsError,
    } = useGetDonationCategoryDetails(selectedCategory);

    // 90-Days Lunar Tithi dynamic query
    const {
        data: tithiDates = [],
        isLoading: isTithiLoading,
    } = useGetTithiDates(activeTithi);

    // Dynamic Client Settings Query (Settings API)
    const { data: clientSettings } = useGetClientSettings();

    useEffect(() => {
        if (clientSettings?.currencySymbol) {
            setCurrencySymbol(clientSettings.currencySymbol);
        }
    }, [clientSettings?.currencySymbol, setCurrencySymbol]);

    // --------------------------------------------------------------------------
    // 3. LOCAL INTERACTIVE STATE (UI Modifiers & Validation)
    // --------------------------------------------------------------------------
    const [searchQuery, setSearchQuery] = useState('');
    const [customAmountMap, setCustomAmountMap] = useState({});
    const [selectedDatesMap, setSelectedDatesMap] = useState({});
    const [selectedTimeMap, setSelectedTimeMap] = useState({});
    const [expandedDescMap, setExpandedDescMap] = useState({});
    const [warningMessage, setWarningMessage] = useState('');

    // Modal dialog descriptors
    const [dateModal, setDateModal] = useState({
        isOpen: false,
        item: null,
        isCustomSlot: false,
        tithiKeyword: null,
    });

    const [timeModal, setTimeModal] = useState({
        isOpen: false,
        item: null,
    });

    const checkBookingLimitPerDay = useCallback((bookingLimit) => {
        return (parseInt(bookingLimit, 10) || 0) > 0;
    }, []);

    const isCustomSlotActive = Boolean(
        dateModal?.isOpen &&
        dateModal?.item &&
        checkBookingLimitPerDay(dateModal.item?.bookingLimitPerDay)
    );

    const { data: availabilityMap = {} } = useGetServiceAvailability(
        dateModal?.item?.refDataName || '',
        dateModal?.item?.serviceTypes || selectedCategory || '',
        isCustomSlotActive
    );

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            releaseModalLock('DONATION_DATE_MODAL');
            releaseModalLock('DONATION_TIME_MODAL');
        };
    }, [releaseModalLock]);

    // Derive checked state and quantities reactively from global cart store
    const checkedCategoryMap = useMemo(() => {
        const map = {};
        cartItems.forEach((item) => {
            map[item.id] = true;
        });
        return map;
    }, [cartItems]);

    const categoryQuantitiesMap = useMemo(() => {
        const map = {};
        cartItems.forEach((item) => {
            map[item.id] = item.quantity || 1;
        });
        return map;
    }, [cartItems]);

    // --------------------------------------------------------------------------
    // 4. SEARCH FILTERING
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
    // 5. BUSINESS RULE HELPERS & VALIDATORS
    // --------------------------------------------------------------------------

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

    const checkQtyCounterEnabled = useCallback(() => {
        return false;
    }, []);

    // --------------------------------------------------------------------------
    // 6. DATE & TITHI CALCULATION ENGINE
    // --------------------------------------------------------------------------

    const calculateGregorianDates = useCallback(({ dayTypes, startDate, endDate, holdingDates, bookingLimitPerDay, slotsMap = {} }) => {
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

            const limit = parseInt(bookingLimitPerDay, 10) || 0;
            const availableDates = [];

            while (current <= endLimit) {
                if (allowedWeekdays.includes(current.getDay())) {
                    const passesOrdinal = requiredOrdinal
                        ? getOrdinalOfMonth(current) === requiredOrdinal
                        : true;

                    if (passesOrdinal && !holdingDatesSet.has(current.toDateString())) {
                        if (limit > 0) {
                            const dateKey = formatDateToMMDDYYYY(current);
                            const bookedCount = slotsMap[dateKey] || 0;
                            const remainingSlots = limit - bookedCount;
                            if (remainingSlots > 0) {
                                availableDates.push(new Date(current));
                            }
                        } else {
                            availableDates.push(new Date(current));
                        }
                    }
                }
                current.setDate(current.getDate() + 1);
            }

            return availableDates;
        } catch (error) {
            logControllerTelemetry('error', 'Gregorian date calculation error', { error: error.message });
            return [];
        }
    },
        []
    );

    const modalAvailableDates = useMemo(() => {
        if (!dateModal.isOpen || !dateModal.item) return [];

        const holdingDatesSet = new Set();
        if (dateModal.item.holdingDates && typeof dateModal.item.holdingDates === 'string') {
            dateModal.item.holdingDates.split(',').forEach((dStr) => {
                const parsed = parseDateString(dStr.trim());
                if (parsed) holdingDatesSet.add(parsed.toDateString());
            });
        }

        if (dateModal.tithiKeyword) {
            return tithiDates
                .map((tItem) => tItem.date)
                .filter((d) => d instanceof Date && !holdingDatesSet.has(d.toDateString()));
        }

        return calculateGregorianDates({
            dayTypes: dateModal.item.dayTypes,
            startDate: dateModal.item.startDate,
            endDate: dateModal.item.endDate,
            holdingDates: dateModal.item.holdingDates,
            bookingLimitPerDay: dateModal.item.bookingLimitPerDay,
            slotsMap: availabilityMap,
        });
    }, [dateModal.isOpen, dateModal.item, dateModal.tithiKeyword, tithiDates, availabilityMap, calculateGregorianDates]);

    const getSelectedOccurrences = useCallback((userSelectedDate, occurrencesNo, allDates) => {
        const occurrences = Math.max(parseInt(occurrencesNo, 10) || 1, 1);
        if (occurrences <= 1) return [userSelectedDate];

        const startIndex = allDates.findIndex(
            (d) => d.toDateString() === userSelectedDate.toDateString()
        );
        if (startIndex === -1) return [userSelectedDate];

        return allDates.slice(startIndex, startIndex + occurrences);
    }, []);

    const getRemainingSlots = useCallback(
        (date, bookingLimitPerDay) => {
            const limit = parseInt(bookingLimitPerDay, 10) || 0;
            if (limit <= 0) return 9999;

            const dateKey = formatDateToMMDDYYYY(date);
            const booked = availabilityMap[dateKey] ?? 0;
            return limit - booked;
        },
        [availabilityMap]
    );

    // --------------------------------------------------------------------------
    // 7. ACTION DISPATCHERS WITH GLOBAL CART STORE SYNC
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
            [key]: prev[key] === undefined ? false : !prev[key],
        }));
    };

    // Synchronized Checkbox Handler
    const handleCheckboxChange = (key, isChecked, item) => {
        const isCustomAmount = item.parsedAmount <= 0;
        const currentCustomAmount = parseFloat(customAmountMap[key] || 0);

        if (isChecked && isCustomAmount && (!currentCustomAmount || currentCustomAmount <= 0)) {
            setWarningMessage('Amount Required: Please enter a valid offering amount before selecting this item.');
            return;
        }

        const isDtVisible = checkDateVisibility(item?.isDTVisible);
        const selectedDates = selectedDatesMap[key] || [];

        if (isChecked && isDtVisible && selectedDates.length === 0) {
            setWarningMessage('Date Required: Please select a date to proceed with this service.');
            return;
        }

        setWarningMessage('');

        if (isChecked) {
            const price = item.parsedAmount > 0 ? item.parsedAmount : parseFloat(customAmountMap[key] || 0);
            const payload = {
                id: item.id,
                title: item.refDataName,
                refDataName: item.refDataName,
                category: selectedCategory || item.serviceTypes || 'GENERAL DONATION',
                serviceTypes: item.serviceTypes,
                serviceCategoryTypes: item.serviceCategoryTypes || 'DONATIONS',
                itemType:
                    String(item.serviceCategoryTypes || '').toUpperCase().includes('SPONSOR')
                        ? 'SPONSORSHIP'
                        : 'GENERAL DONATION',
                amount: price,
                quantity: 0,
                qtyCounterEnabled: false,
                image: item.image,
                selectedDates: selectedDatesMap[key] || [],
                selectedTime: selectedTimeMap[key] || '',
                qtyCounter: 'NO',
                rawItem: item,
            };
            addItemToGlobalCart(payload);
        } else {
            removeItemFromGlobalCart(item.id);
        }
    };

    // Synchronized Custom Amount Handler
    const handleCustomAmountChange = (key, value) => {
        const item = categoryDetails.find((cat) => cat.id === key);
        if (!item) return;

        const parsed = parseFloat(value);
        setCustomAmountMap((prev) => ({ ...prev, [key]: value }));

        if (isNaN(parsed) || parsed <= 0) {
            if (checkedCategoryMap[key]) {
                removeItemFromGlobalCart(key);
            }
            return;
        }

        if (checkedCategoryMap[key]) {
            const isDtVisible = checkDateVisibility(item.isDTVisible);
            const selectedDates = selectedDatesMap[key] || [];

            if (isDtVisible && selectedDates.length === 0) {
                setWarningMessage('Date Required: Please select a date to proceed with this service.');
                return;
            }

            setWarningMessage('');
            const existing = cartItems.find((i) => i.id === key);
            if (existing) {
                addItemToGlobalCart({
                    ...existing,
                    amount: parsed,
                });
            }
        }
    };

    // Synchronized Quantity Handlers
    const handleQuantityIncrement = (key) => {
        const item = categoryDetails.find((cat) => cat.id === key);
        if (!item) return;

        const currentQty = categoryQuantitiesMap[key] || 0;
        const nextQty = currentQty + 1;

        if (currentQty === 0) {
            const price = item.parsedAmount > 0 ? item.parsedAmount : parseFloat(customAmountMap[key] || 0);
            addItemToGlobalCart({
                id: item.id,
                title: item.refDataName,
                refDataName: item.refDataName,
                serviceTypes: item.serviceTypes,
                serviceCategoryTypes: item.serviceCategoryTypes || 'DONATIONS',
                itemType: String(item.serviceTypes || '').trim().toUpperCase(),
                amount: price,
                quantity: 1,
                image: item.image,
                selectedDates: selectedDatesMap[key] || [],
                selectedTime: selectedTimeMap[key] || '',
                qtyCounter: item.qtyCounter,
                rawItem: item,
            });
        } else {
            updateGlobalQuantity(key, nextQty);
        }
    };

    const handleQuantityDecrement = (key) => {
        const currentQty = categoryQuantitiesMap[key] || 1;
        if (currentQty > 1) {
            updateGlobalQuantity(key, currentQty - 1);
        } else {
            removeItemFromGlobalCart(key);
        }
    };

    // Date Modal Handlers with Mutex Lock
    const handleOpenDatePicker = (item) => {
        const acquired = acquireModalLock('DONATION_DATE_MODAL');
        if (!acquired) return;

        const tithi = extractTithiKeyword(item?.dayTypes);
        if (tithi) {
            setActiveTithi(tithi);
        } else {
            setActiveTithi(null);
        }

        setDateModal({
            isOpen: true,
            item,
            isCustomSlot: checkBookingLimitPerDay(item?.bookingLimitPerDay),
            tithiKeyword: tithi,
        });
    };

    const handleCloseDatePicker = () => {
        releaseModalLock('DONATION_DATE_MODAL');
        setDateModal({
            isOpen: false,
            item: null,
            isCustomSlot: false,
            tithiKeyword: null,
        });
    };

    const handleSelectDate = (pickedDate) => {
        if (!dateModal.item || !pickedDate) return;
        const serviceKey = dateModal.item.id;

        const occurrences = getSelectedOccurrences(
            pickedDate,
            dateModal.item.serviceOccurrencesNo,
            modalAvailableDates
        );

        setSelectedDatesMap((prev) => ({
            ...prev,
            [serviceKey]: occurrences,
        }));

        if (checkedCategoryMap[serviceKey]) {
            const existing = cartItems.find((i) => i.id === serviceKey);
            if (existing) {
                addItemToGlobalCart({
                    ...existing,
                    selectedDates: occurrences,
                });
            }
        }

        handleCloseDatePicker();
    };

    // Time Modal Handlers with Mutex Lock
    const handleOpenTimePicker = (item) => {
        const serviceKey = item?.id;
        const isDtVisible = checkDateVisibility(item?.isDTVisible);
        const selectedDates = selectedDatesMap[serviceKey] || [];

        if (isDtVisible && selectedDates.length === 0) {
            setWarningMessage('Date Required: Please select a date before choosing a time.');
            return;
        }

        const acquired = acquireModalLock('DONATION_TIME_MODAL');
        if (!acquired) return;

        setTimeModal({ isOpen: true, item });
    };

    const handleCloseTimePicker = () => {
        releaseModalLock('DONATION_TIME_MODAL');
        setTimeModal({ isOpen: false, item: null });
    };

    const handleSelectTime = (timeString) => {
        if (!timeModal.item || !timeString) return;
        const serviceKey = timeModal.item.id;

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
            [serviceKey]: timeString,
        }));

        if (checkedCategoryMap[serviceKey]) {
            const existing = cartItems.find((i) => i.id === serviceKey);
            if (existing) {
                addItemToGlobalCart({
                    ...existing,
                    selectedTime: timeString,
                });
            }
        }

        handleCloseTimePicker();
    };

    const handleCheckoutClick = () => {
        if (totalCartCount === 0) {
            setWarningMessage('Empty Cart: Please select at least one donation service.');
            return;
        }

        logControllerTelemetry('info', 'Donation checkout initiated from global cart', {
            totalCartCount,
            totalCartAmount,
            currencySymbol,
        });

        setWarningMessage(
            `Checkout Summary: ${totalCartCount} item(s) totaling ${currencySymbol}${totalCartAmount.toFixed(2)}.`
        );
    };

    return {
        state: {
            categories,
            selectedCategory,
            filteredCategoryDetails,
            isLoading: isCategoriesLoading || isDetailsLoading,
            hasError: isCategoriesError || isDetailsError,
            isTithiLoading,
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
            dateModal: {
                ...dateModal,
                availableDates: modalAvailableDates,
            },
            timeModal,
            warningMessage,
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
            handleCheckoutClick,
        },
        helpers: {
            isCategoryGreyScale,
            checkDateVisibility,
            checkTimeVisibility,
            checkQtyCounterEnabled,
            getRemainingSlots,
        },
    };
};