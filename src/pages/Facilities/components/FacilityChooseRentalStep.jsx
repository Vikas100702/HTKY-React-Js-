import { useMemo } from "react";
import { Home, RefreshCw } from "lucide-react";
import { UniversalServiceCard } from "../../../components/shared/UniversalServiceCard";
import { APP_COLORS } from "../../../constants/appColors";

export const FacilityChooseRentalStep = ({
  eventDate = "",
  facilitiesList = [],
  isFacilitiesLoading = false,
  isFacilitiesError = false,
  onRetry,
  selectedRentals = {},
  slotAvailabilityMap = {},
  onSelectTier,
  onChangeTime,
  onAdjustQuantity,
  onToggleSelect,
  onPrevious,
  onNext,
}) => {
  const { selectedCount, totalRentalAmount } = useMemo(() => {
    const checked = Object.values(selectedRentals).filter(
      (entry) => entry?.isChecked,
    );
    const subtotal = checked.reduce(
      (sum, entry) =>
        sum + Number(entry.unitPrice || 0) * Number(entry.qty || 1),
      0,
    );
    return {
      selectedCount: checked.length,
      totalRentalAmount: subtotal,
    };
  }, [selectedRentals]);

  return (
    <div className="space-y-6">
      {/* Section Sub-Header with Live Selection Summary */}
      <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
            Choose Facility Rental
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Showing facility availability for{" "}
            <span className="font-bold text-[#900000]">
              {eventDate || "selected date"}
            </span>
            . Select duration type and check the facilities you wish to book.
          </p>
        </div>

        <div className="inline-flex items-center gap-3 bg-[#faf7f2] border border-amber-300/80 rounded-lg px-4 py-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-stone-700">
            Selected:{" "}
            <strong className="text-stone-900">{selectedCount}</strong>
          </span>
          <span className="h-4 w-px bg-stone-300" />
          <span className="text-xs font-semibold text-stone-700">
            Rental Total:{" "}
            <strong className="text-[#900000]">
              ${totalRentalAmount.toFixed(2)}
            </strong>
          </span>
        </div>
      </div>

      {/* Loading Skeleton Grid */}
      {isFacilitiesLoading && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-busy="true"
        >
          {[1, 2, 3, 4, 5, 6].map((skeletonIdx) => (
            <div
              key={skeletonIdx}
              className="h-80 rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs animate-pulse flex flex-col"
            >
              <div className="h-48 bg-stone-200" />
              <div className="p-5 space-y-3 flex-1">
                <div className="h-5 w-2/3 bg-stone-200 rounded" />
                <div className="h-4 w-20 bg-stone-200 rounded-full" />
                <div className="h-3 w-full bg-stone-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isFacilitiesLoading && isFacilitiesError && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-8 text-center">
          <p className="text-sm font-bold text-red-900">
            Unable to load facility availability for the selected date and time.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold text-white cursor-pointer"
            style={{ backgroundColor: APP_COLORS.primary }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isFacilitiesLoading &&
        !isFacilitiesError &&
        facilitiesList.length === 0 && (
          <div className="rounded-xl border border-stone-300 bg-white p-10 text-center shadow-xs">
            <Home className="w-9 h-9 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-800">
              No facilities found for {eventDate || "the selected date"}.
            </p>
          </div>
        )}

      {/* Responsive 3-Column Grid using UniversalServiceCard (Never hides unavailable cards; renders them grayscale) */}
      {!isFacilitiesLoading &&
        !isFacilitiesError &&
        facilitiesList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilitiesList.map((facility) => {
              const rentalEntry = selectedRentals[facility.id];
              const slotState = slotAvailabilityMap[facility.id] || {};
              const isInitiallyBlocked = Boolean(facility.isBlocked);
              const isSlotUnavailable = Boolean(slotState.isSlotUnavailable);
              const isCheckingSlot = Boolean(slotState.isChecking);
              const isGrayscaleBlocked =
                isInitiallyBlocked || isSlotUnavailable;

              const unitPrice = isInitiallyBlocked
                ? 0
                : (rentalEntry?.unitPrice ?? facility.baseUnitPrice);

              const resolvedTimeError = isCheckingSlot
                ? "Checking slot availability..."
                : isSlotUnavailable
                  ? slotState.message ||
                    "Not Available for the selected time slot."
                  : rentalEntry?.timeError || "";

              const adaptedCardService = {
                id: facility.id,
                title: facility.refDataName,
                description:
                  facility.shortDescription || facility.description || "",
                amount: unitPrice,
                serviceAmount: unitPrice,
                imageUrl: facility.imageUrl,
                qtyCounterEnabled: facility.qtyCounterEnabled,
                serviceCategoryTypes: facility.rentalCategory || "FACILITIES",
                serviceTypes: facility.refDataCode || "RENTALS",
                rawItem: facility.raw,
              };

              const facilityControl = {
                isBlocked: isInitiallyBlocked,
                isSlotUnavailable,
                isCheckingSlot,
                isCheckboxDisabled: isGrayscaleBlocked || isCheckingSlot,
                availabilityMessage: isSlotUnavailable
                  ? slotState.message || "Not Available"
                  : facility.availabilityMessage,
                isAvailableCode: facility.isAvailableCode,
                availableCount: facility.availableCount,
                isChecked: Boolean(
                  rentalEntry?.isChecked &&
                  !isGrayscaleBlocked &&
                  !isCheckingSlot,
                ),
                quantity: rentalEntry?.qty || 1,
                unitPrice,
                priceTypes: facility.priceTypes,
                selectedTierKey: rentalEntry?.selectedTierKey || "",
                isShiftLocked: Boolean(rentalEntry?.isShiftLocked),
                minHours: Number(rentalEntry?.minHours || 0),
                maxHours: Number(rentalEntry?.maxHours || 0),
                endTimeSlots: Array.isArray(rentalEntry?.endTimeSlots)
                  ? rentalEntry.endTimeSlots
                  : [],
                isDTVisible: facility.isDTVisible,
                startTime: rentalEntry?.startTime || "",
                endTime: rentalEntry?.endTime || "",
                timeError: resolvedTimeError,
                onSelectTier: (tierKey) => onSelectTier?.(facility, tierKey),
                onChangeTime: (field, nextTime24) =>
                  onChangeTime?.(facility, field, nextTime24),
                onIncreaseQty: () => onAdjustQuantity?.(facility, 1),
                onDecreaseQty: () => onAdjustQuantity?.(facility, -1),
                onToggleSelect: () => onToggleSelect?.(facility),
              };

              return (
                <div
                  key={facility.id}
                  className={
                    isSlotUnavailable && !isInitiallyBlocked
                      ? "grayscale opacity-80 transition-all duration-200"
                      : "transition-all duration-200"
                  }
                >
                  <UniversalServiceCard
                    service={adaptedCardService}
                    facilityControl={facilityControl}
                  />
                </div>
              );
            })}
          </div>
        )}

      {/* Step 2 Footer Navigation: Previous & Next */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2.5 rounded-md border border-stone-400 bg-white text-stone-800 text-xs sm:text-sm font-bold hover:bg-stone-100 transition-colors cursor-pointer"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-2.5 rounded-md text-white text-xs sm:text-sm font-bold tracking-wide shadow-sm hover:opacity-95 transition-all cursor-pointer"
          style={{ backgroundColor: APP_COLORS.primary }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FacilityChooseRentalStep;
