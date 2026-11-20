/**
 * @file src/hooks/queries/Dashboard/useDateFilteredRecords.js
 * @description Common reusable controller hook for Account tabular pages
 * (My Donations, My Sponsors, My Payments, Recurring Donations).
 * Centralizes `Month` / `Year` / `Date Range` (`MM/DD/YYYY`) calculation,
 * search filtering, and pagination state.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { useMemo, useState } from "react";
import { getCurrentMonthDateRange } from "../../../services/dashboardApi";

export const ACCOUNT_DATE_MODE_OPTIONS = Object.freeze([
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
    { value: "range", label: "Date Range" },
]);

/**
 * Formats an HTML date input (`YYYY-MM-DD`) into `MM/DD/YYYY`.
 *
 * @param {string} isoDate
 * @returns {string}
 */
export const formatIsoToMmDdYyyy = (isoDate) => {
    if (!isoDate || typeof isoDate !== "string") return "";
    const [yyyy, mm, dd] = isoDate.trim().split("-");
    if (!yyyy || !mm || !dd) return "";
    return `${mm.padStart(2, "0")}/${dd.padStart(2, "0")}/${yyyy}`;
};

/**
 * Reusable hook managing date mode (`month` | `year` | `range`),
 * resolved `MM/DD/YYYY` bounds, client-side search, and pagination.
 *
 * @param {{
 *   records?: Array<Object>,
 *   searchFields?: Array<string>,
 *   pageSize?: number,
 *   initialDateMode?: 'month'|'year'|'range'
 * }} [options]
 */
export const useDateFilteredRecords = ({
    records = [],
    searchFields = [],
    pageSize = 10,
    initialDateMode = "month",
} = {}) => {
    const now = useMemo(() => new Date(), []);
    const defaultMonthValue = `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
    const defaultTodayIso = `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const [dateMode, setDateMode] = useState(initialDateMode);
    const [selectedMonth, setSelectedMonth] = useState(defaultMonthValue);
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
    const [fromDateIso, setFromDateIso] = useState(defaultTodayIso);
    const [toDateIso, setToDateIso] = useState(defaultTodayIso);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const yearOptions = useMemo(() => {
        const currentYr = now.getFullYear();
        return [
            String(currentYr + 1),
            String(currentYr),
            String(currentYr - 1),
            String(currentYr - 2),
            String(currentYr - 3),
        ];
    }, [now]);

    const resolvedDateRange = useMemo(() => {
        if (dateMode === "year") {
            const yr = String(selectedYear || now.getFullYear()).trim();
            return {
                startDate: `01/01/${yr}`,
                endDate: `12/31/${yr}`,
            };
        }

        if (dateMode === "range") {
            const fallback = getCurrentMonthDateRange(now);
            const start = formatIsoToMmDdYyyy(fromDateIso) || fallback.startDate;
            const end = formatIsoToMmDdYyyy(toDateIso) || start;
            return { startDate: start, endDate: end };
        }

        // Default: "month" (`YYYY-MM` -> 1st day to last day of month)
        const [yrStr, moStr] = String(selectedMonth || defaultMonthValue).split("-");
        const yr = parseInt(yrStr, 10);
        const moIndex = parseInt(moStr, 10) - 1;
        if (!Number.isFinite(yr) || !Number.isFinite(moIndex) || moIndex < 0) {
            return getCurrentMonthDateRange(now);
        }
        const mm = String(moIndex + 1).padStart(2, "0");
        const lastDay = new Date(yr, moIndex + 1, 0).getDate();
        return {
            startDate: `${mm}/01/${yr}`,
            endDate: `${mm}/${String(lastDay).padStart(2, "0")}/${yr}`,
        };
    }, [
        dateMode,
        selectedMonth,
        selectedYear,
        fromDateIso,
        toDateIso,
        defaultMonthValue,
        now,
    ]);

    const filteredRecords = useMemo(() => {
        const list = Array.isArray(records) ? records : [];
        const q = searchQuery.trim().toLowerCase();
        if (!q) return list;

        return list.filter((row) => {
            if (Array.isArray(searchFields) && searchFields.length > 0) {
                return searchFields.some((field) =>
                    String(row?.[field] ?? "")
                        .toLowerCase()
                        .includes(q)
                );
            }
            return Object.values(row || {}).some((val) =>
                String(val ?? "")
                    .toLowerCase()
                    .includes(q)
            );
        });
    }, [records, searchFields, searchQuery]);

    const totalEntries = filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedRecords = useMemo(() => {
        const startIdx = (safePage - 1) * pageSize;
        return filteredRecords.slice(startIdx, startIdx + pageSize);
    }, [filteredRecords, safePage, pageSize]);

    const handlePageChange = (updater) => {
        setCurrentPage((prev) => {
            const nextVal =
                typeof updater === "function" ? updater(prev) : Number(updater);
            if (!Number.isFinite(nextVal)) return 1;
            return Math.min(Math.max(1, nextVal), totalPages);
        });
    };

    return {
        dateMode,
        setDateMode: (mode) => {
            setDateMode(mode);
            setCurrentPage(1);
        },
        selectedMonth,
        setSelectedMonth: (val) => {
            setSelectedMonth(val);
            setCurrentPage(1);
        },
        selectedYear,
        setSelectedYear: (val) => {
            setSelectedYear(val);
            setCurrentPage(1);
        },
        yearOptions,
        fromDateIso,
        setFromDateIso: (val) => {
            setFromDateIso(val);
            setCurrentPage(1);
        },
        toDateIso,
        setToDateIso: (val) => {
            setToDateIso(val);
            setCurrentPage(1);
        },
        resolvedDateRange,
        searchQuery,
        setSearchQuery: (val) => {
            setSearchQuery(val);
            setCurrentPage(1);
        },
        paginatedRecords,
        rows: paginatedRecords,
        totalEntries,
        currentPage: safePage,
        totalPages,
        pageSize,
        setCurrentPage: handlePageChange,
    };
};

export default useDateFilteredRecords;

