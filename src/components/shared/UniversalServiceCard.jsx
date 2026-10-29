import { useState, useRef, useEffect, useMemo } from "react";
import { useServicesStore } from "../../store/useServicesStore";
import { useGetDieties } from "../../hooks/queries/Services/useGetDieties";
import {
  checkIsServiceGreyScale,
  calculateAvailableDates,
  getSelectedOccurrences,
  formatSlashDate,
} from "../../utils/serviceDateUtils";
import {
  fetchServiceAvailability,
  fetchTithiDates,
  IN_TEMPLE_CATEGORY,
} from "../../hooks/queries/Services/useGetServices";
import { ServiceDatePickerModal } from "../services/ServiceDatePickerModal";
import { ServiceTimePickerModal } from "../services/ServiceTimePickerModal";

const TITHI_KEYWORDS = Object.freeze([
  "PRATIPADA",
  "DWITIYA",
  "TRITIYA",
  "CHATURTHI",
  "PANCHAMI",
  "SHASHDI",
  "SAPTAMI",
  "ASHTAMI",
  "NAVAMI",
  "DASHAMI",
  "EKADASHI",
  "DWADASHI",
  "TRAYODASHI",
  "CHATURDASHI",
  "PURNIMA",
  "AMAVASYA",
]);

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%23fdf6ee"/><text x="50%" y="48%" font-family="serif" font-size="20" font-weight="bold" fill="%23900000" text-anchor="middle">HTKY TEMPLE</text><text x="50%" y="62%" font-family="sans-serif" font-size="12" fill="%23854d0e" text-anchor="middle">Temple Service</text></svg>';

export const UniversalServiceCard = ({ service, currencySymbol = "$" }) => {
  const serviceKey = service.id;
  const isGrey = checkIsServiceGreyScale(service);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Master Diety list from API
  const { data: masterDieties = [], isLoading: isDietiesLoading } =
    useGetDieties();

  // Zustand State Selectors
  const checkedCategoryMap = useServicesStore(
    (state) => state.checkedCategoryMap,
  );
  const categoryQuantitiesMap = useServicesStore(
    (state) => state.categoryQuantitiesMap,
  );
  const selectedDatesMap = useServicesStore((state) => state.selectedDatesMap);
  const selectedTimeMap = useServicesStore((state) => state.selectedTimeMap);
  const selectedDietyMap = useServicesStore(
    (state) => state.selectedDietyMap || {},
  );
  const activeModal = useServicesStore((state) => state.activeModal);
  const activeModalServiceId = useServicesStore(
    (state) => state.activeModalServiceId,
  );

  // Zustand Store Actions
  const toggleCheckbox = useServicesStore((state) => state.toggleCheckbox);
  const incrementQuantity = useServicesStore(
    (state) => state.incrementQuantity,
  );
  const decrementQuantity = useServicesStore(
    (state) => state.decrementQuantity,
  );
  const updateSelectedDates = useServicesStore(
    (state) => state.updateSelectedDates,
  );
  const updateSelectedTime = useServicesStore(
    (state) => state.updateSelectedTime,
  );
  const updateSelectedDiety = useServicesStore(
    (state) => state.updateSelectedDiety,
  );

  const openModal = useServicesStore((state) => state.openModal);
  const closeModal = useServicesStore((state) => state.closeModal);
  const showToast = useServicesStore((state) => state.showToast);

  const isChecked = Boolean(checkedCategoryMap[serviceKey]);
  const quantity = categoryQuantitiesMap[serviceKey] || 1;
  const selectedDates = selectedDatesMap[serviceKey] || [];
  const selectedTime = selectedTimeMap[serviceKey] || "";
  const selectedDiety = selectedDietyMap[serviceKey] || "";

  const [availableDatesList, setAvailableDatesList] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [isSlotLoading, setIsSlotLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isDTVisible = Boolean(service?.isDTVisible);
  const isTimeVisible = Boolean(service?.isTimeVisible);
  const isDietyDropdownVisible = Boolean(service?.isDietySelected);

  // Compute Diety Dropdown Options
  const dietyOptions = useMemo(() => {
    if (!isDietyDropdownVisible) return [];

    const rawDiety = service?.dietyName;
    if (typeof rawDiety === "string" && rawDiety.trim().length > 0) {
      return rawDiety
        .split(/[,&]/)
        .map((d) => d.trim())
        .filter(Boolean);
    }

    if (Array.isArray(rawDiety) && rawDiety.length > 0) {
      return rawDiety.map((d) => String(d).trim()).filter(Boolean);
    }

    return masterDieties
      .map((d) => (typeof d === "string" ? d : d?.name || d?.refDataName || ""))
      .map((name) => String(name).trim())
      .filter(Boolean);
  }, [isDietyDropdownVisible, service?.dietyName, masterDieties]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleDateTap = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setIsSlotLoading(true);
      let slotsMap = {};

      if (service.bookingLimitPerDay > 0) {
        slotsMap = await fetchServiceAvailability(
          {
            serviceSetup: service.title,
            startDate: service.startDate || "",
            endDate: service.endDate || "",
            serviceTypes: service.serviceTypes || IN_TEMPLE_CATEGORY,
          },
          signal,
        );
        if (isMountedRef.current) setAvailabilityMap(slotsMap);
      }

      const dayTypesUpper = (service.dayTypes || "").toUpperCase();
      const matchedTithi = TITHI_KEYWORDS.find((t) =>
        dayTypesUpper.includes(t),
      );

      let dates = [];
      if (matchedTithi) {
        dates = await fetchTithiDates(matchedTithi, signal);
      } else {
        dates = calculateAvailableDates({
          dayTypes: service.dayTypes,
          startDate: service.startDate,
          endDate: service.endDate,
          bookingLimitPerDay: service.bookingLimitPerDay,
          holdingDates: service.holdingDates,
          availabilityMap: slotsMap,
        });
      }

      if (isMountedRef.current) {
        setAvailableDatesList(dates);
        openModal("DATE_PICKER", serviceKey);
      }
    } catch (err) {
      if (err?.name !== "AbortError" && err?.name !== "CanceledError") {
        showToast("Unable to load booking slots. Please try again.", "error");
      }
    } finally {
      if (isMountedRef.current) setIsSlotLoading(false);
    }
  };

  const handleTimeTap = () => {
    if (isDTVisible && selectedDates.length === 0) {
      showToast("Please select a date before choosing a time.", "warning");
      return;
    }
    openModal("TIME_PICKER", serviceKey);
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    if (checked) {
      if (isDietyDropdownVisible && !selectedDiety) {
        showToast("Please select a diety from the dropdown.", "warning");
        return;
      }
      if (isDTVisible && selectedDates.length === 0) {
        showToast(
          "Please select a date to proceed with this service.",
          "warning",
        );
        return;
      }
    }
    toggleCheckbox(service, checked);
  };

  const isDatePickerOpen =
    activeModal === "DATE_PICKER" && activeModalServiceId === serviceKey;
  const isTimePickerOpen =
    activeModal === "TIME_PICKER" && activeModalServiceId === serviceKey;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
        isGrey
          ? "opacity-60 grayscale pointer-events-none select-none border-gray-200"
          : isChecked
            ? "border-amber-400 ring-2 ring-amber-400/30"
            : "border-gray-200"
      }`}
    >
      {/* 1. Top Image */}
      <div className="relative h-48 bg-amber-50 overflow-hidden">
        <img
          src={
            !imageError && service.imageUrl ? service.imageUrl : FALLBACK_IMAGE
          }
          alt={service.title}
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* 2. Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <h3 className="font-serif font-bold text-gray-900 text-base sm:text-lg leading-snug">
                {service.title}
              </h3>

              {/* Amount Badge */}
              <div>
                <span className="inline-block bg-[#900000] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  {currencySymbol}
                  {Number(service.amount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-center cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                aria-label={`Select ${service.title}`}
                className="w-5 h-5 text-[#900000] rounded-md border-gray-300 focus:ring-[#900000] cursor-pointer"
              />
            </label>
          </div>

          {/* Description */}
          {service.description && (
            <div className="mt-2.5">
              <p className="text-xs text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          )}
        </div>

        {/* 3. Interactive Slot Pickers & Modifiers */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
          {/* Diety Dropdown */}
          {isDietyDropdownVisible && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                Select Diety
              </label>
              <select
                value={selectedDiety}
                onChange={(e) =>
                  updateSelectedDiety(serviceKey, e.target.value)
                }
                disabled={isDietiesLoading}
                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#900000]/20 focus:border-[#900000] cursor-pointer"
              >
                <option value="">--select diety--</option>
                {dietyOptions.map((name, i) => (
                  <option key={`${name}-${i}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Selector Trigger */}
          {isDTVisible && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={isSlotLoading}
                onClick={handleDateTap}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-amber-50 hover:border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <svg
                  className="w-3.5 h-3.5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {isSlotLoading
                    ? "Checking..."
                    : selectedDates.length > 0
                      ? "Change Date"
                      : "Choose Date"}
                </span>
              </button>
              <span className="text-[11px] font-medium text-gray-600 truncate max-w-[150px]">
                {selectedDates.length === 1
                  ? formatSlashDate(selectedDates[0])
                  : selectedDates.length > 1
                    ? `${formatSlashDate(selectedDates[0])} - ${formatSlashDate(
                        selectedDates[selectedDates.length - 1],
                      )}`
                    : "No date chosen"}
              </span>
            </div>
          )}

          {/* Time Selector Trigger */}
          {isTimeVisible && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTimeTap}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-amber-50 hover:border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{selectedTime ? "Change Time" : "Choose Time"}</span>
              </button>
              <span className="text-[11px] font-medium text-gray-600">
                {selectedTime || "No time chosen"}
              </span>
            </div>
          )}

          {/* Quantity Stepper */}
          {service.qtyCounterEnabled && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-gray-600">
                Quantity
              </span>
              <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => decrementQuantity(serviceKey)}
                  className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  −
                </button>
                <span className="px-3 py-1 text-xs font-bold text-gray-900 bg-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => incrementQuantity(serviceKey)}
                  className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Picker Modal */}
      <ServiceDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={closeModal}
        serviceTitle={service.title}
        availableDates={availableDatesList}
        bookingLimitPerDay={service.bookingLimitPerDay}
        availabilityMap={availabilityMap}
        serviceOccurrencesNo={service.serviceOccurrencesNo}
        onSelectDate={(userSelectedDate) => {
          const finalDates = getSelectedOccurrences(
            userSelectedDate,
            service.serviceOccurrencesNo,
            availableDatesList,
          );
          updateSelectedDates(serviceKey, finalDates);
          closeModal();
        }}
      />

      {/* Time Picker Modal */}
      <ServiceTimePickerModal
        isOpen={isTimePickerOpen}
        onClose={closeModal}
        selectedDate={selectedDates[0]}
        onSelectTime={(timeStr) => {
          updateSelectedTime(serviceKey, timeStr);
          closeModal();
        }}
      />
    </div>
  );
};


