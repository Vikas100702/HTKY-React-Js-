import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/useAuthStore";
import { fetchMyPujaBookings } from "../../../services/dashboardApi";
import { useDateFilteredRecords } from "./useDateFilteredRecords";

export const PUJA_CATEGORY_OPTIONS = Object.freeze([
    { value: "ALL", label: "ALL" },
    { value: "IN-TEMPLE", label: "INSIDE TEMPLE" },
    { value: "AWAY-TEMPLE", label: "OUTSIDE TEMPLE" },
    { value: "EVENTS", label: "EVENTS" },
]);

/**
 * Formats a booking service date (either `MM/DD/YYYY` or ISO timestamp) cleanly for table display.
 *
 * @param {string} rawDate
 * @param {string} [rawTime]
 * @returns {string}
 */
const formatBookingDateTime = (rawDate, rawTime) => {
    const datePart = String(rawDate || "").trim();
    const timePart = String(rawTime || "").trim();

    if (!datePart) return timePart || "—";

    let formattedDate = datePart;
    if (/^\d{4}-\d{2}-\d{2}T/.test(datePart)) {
        const parsed = new Date(datePart);
        if (!Number.isNaN(parsed.getTime())) {
            const mm = String(parsed.getMonth() + 1).padStart(2, "0");
            const dd = String(parsed.getDate()).padStart(2, "0");
            const yyyy = parsed.getFullYear();
            formattedDate = `${mm}/${dd}/${yyyy}`;
        }
    }

    return timePart ? `${formattedDate} • ${timePart}` : formattedDate;
};

/**
 * Normalizes a raw `serviceBooking` record into a clean table row view model.
 *
 * @param {Object} item
 * @param {number} index
 * @returns {Object}
 */
const normalizeBookingRow = (item, index) => {
    const receiptNumber =
        String(item?.batchNo || item?.tokenNumber || item?.mpiInvNumber || "").trim() ||
        "—";
    const bookingDate = String(item?.cartCreDate || item?.recCreDate || "—").trim();
    const serviceName =
        String(item?.ServiceSetup || item?.serviceName || item?.serviceTypes || "").trim() ||
        "Temple Puja";

    const parsedAmount = Number(item?.serviceAmount ?? 0);
    const formattedAmount = Number.isFinite(parsedAmount)
        ? `$ ${parsedAmount.toFixed(2)}`
        : "$ 0.00";

    const serviceDateTime = formatBookingDateTime(
        item?.serviceDate,
        item?.startTime || item?.time
    );

    const rawPaymentStatus = String(item?.paymentStatus || "PENDING")
        .trim()
        .toUpperCase();
    const paymentStatus =
        rawPaymentStatus === "COMPLETED" ? "PAID" : rawPaymentStatus;

    const preferredPriest =
        String(
            item?.priestName ||
            item?.preferredPriest ||
            item?.selectedPriest ||
            ""
        ).trim() || "—";

    const location =
        String(
            item?.serviceAddress ||
            item?.location ||
            item?.serviceCategoryTypes ||
            ""
        ).trim() || "—";

    return {
        id: item?._id || item?.insertedId || `booking-${index}`,
        receiptNumber,
        bookingDate,
        serviceName,
        serviceTypes: String(item?.serviceTypes || "").trim(),
        categoryType: String(item?.serviceCategoryTypes || "").trim(),
        amount: parsedAmount,
        formattedAmount,
        serviceDateTime,
        paymentStatus,
        rawPaymentStatus,
        preferredPriest,
        location,
        qty: Number(item?.qty ?? 1) || 1,
        rawItem: item,
    };
};

const BOOKING_SEARCH_FIELDS = Object.freeze([
    "receiptNumber",
    "serviceName",
    "bookingDate",
    "paymentStatus",
    "location",
]);

export const useMyPujaBookings = ({ pageSize = 10 } = {}) => {
    const user = useAuthStore((state) => state.user);
    const memberId = user?._id || user?.id || user?.memberId || "";
    const [categoryFilter, setCategoryFilter] = useState("ALL");

    // Step 1: Resolve date mode & bounds first via shared hook
    const dateFilter = useDateFilteredRecords({
        records: [],
        searchFields: BOOKING_SEARCH_FIELDS,
        pageSize,
    });

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: [
            "myPujaBookingsList",
            memberId,
            categoryFilter,
            dateFilter.resolvedDateRange.startDate,
            dateFilter.resolvedDateRange.endDate,
        ],
        queryFn: async ({ signal }) => {
            if (!memberId) {
                return {
                    count: 0,
                    records: [],
                    bookings: [],
                    dateRange: dateFilter.resolvedDateRange,
                };
            }
            return await fetchMyPujaBookings(
                {
                    memberId,
                    categoryFilter,
                    startDate: dateFilter.resolvedDateRange.startDate,
                    endDate: dateFilter.resolvedDateRange.endDate,
                },
                { signal }
            );
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 3,
        refetchOnWindowFocus: false,
    });

    const normalizedRows = useMemo(() => {
        const list = Array.isArray(data?.records) ? data.records : [];
        return list.map(normalizeBookingRow);
    }, [data]);

    const filteredRows = useMemo(() => {
        const q = dateFilter.searchQuery.trim().toLowerCase();
        if (!q) return normalizedRows;
        return normalizedRows.filter((row) =>
            BOOKING_SEARCH_FIELDS.some((field) =>
                String(row?.[field] ?? "")
                    .toLowerCase()
                    .includes(q)
            )
        );
    }, [normalizedRows, dateFilter.searchQuery]);

    const [page, setPage] = useState(1);

    const totalEntries = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);

    const paginatedRows = useMemo(() => {
        const startIdx = (safePage - 1) * pageSize;
        return filteredRows.slice(startIdx, startIdx + pageSize);
    }, [filteredRows, safePage, pageSize]);

    const handleCategoryChange = (nextCategory) => {
        setCategoryFilter(nextCategory);
        setPage(1);
    };

    const handleDateModeChange = (nextMode) => {
        dateFilter.setDateMode(nextMode);
        setPage(1);
    };

    const handleSearchChange = (val) => {
        dateFilter.setSearchQuery(val);
        setPage(1);
    };

    return {
        ...dateFilter,
        setDateMode: handleDateModeChange,
        setSearchQuery: handleSearchChange,
        rows: paginatedRows,
        totalEntries,
        currentPage: safePage,
        totalPages,
        setCurrentPage: setPage,
        categoryFilter,
        setCategoryFilter: handleCategoryChange,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    };
};

export default useMyPujaBookings;