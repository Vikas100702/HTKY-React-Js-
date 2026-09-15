import { useGeneralDonation } from "./hooks/useGeneralDonation";
import { DonationSlotModal } from "./Components/DonationSlotModal";
import { ENV_CONFIG } from "../../constants/envConfig";
import { APP_COLORS } from "../../constants/appColors";

const IMAGE_BASE_URL = ENV_CONFIG.BASE_URL;
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%23fdf6ee"/><text x="50%" y="48%" font-family="serif" font-size="20" font-weight="bold" fill="%23900000" text-anchor="middle">HTKY TEMPLE</text><text x="50%" y="62%" font-family="sans-serif" font-size="12" fill="%23854d0e" text-anchor="middle">Sacred Offering</text></svg>';

const resolveImageUrl = (rawPath) => {
  if (!rawPath || typeof rawPath !== "string" || !rawPath.trim()) {
    return FALLBACK_IMAGE;
  }
  if (
    rawPath.startsWith("http://") ||
    rawPath.startsWith("https://") ||
    rawPath.startsWith("data:")
  ) {
    return rawPath;
  }
  const cleanPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  return `${IMAGE_BASE_URL}${cleanPath}`;
};

export const GeneralDonation = () => {
  const { state, actions, helpers } = useGeneralDonation();

  const {
    categories,
    selectedCategory,
    filteredCategoryDetails,
    isLoading,
    hasError,
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
    warningMessage,
  } = state;

  const {
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
  } = actions;

  const {
    isCategoryGreyScale,
    checkDateVisibility,
    checkTimeVisibility,
    checkQtyCounterEnabled,
    getRemainingSlots,
  } = helpers;

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-32">
      {/* Header */}
      <section className="relative text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mt-2 tracking-tight"
            style={{ color: APP_COLORS?.primary || "#900000" }}
          >
            Donations
          </h1>
        </div>
      </section>

      {/* 2. VALIDATION & WARNING NOTIFICATION */}
      {warningMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div
            className="flex items-center justify-between p-4 bg-amber-50 border-l-4 border-amber-600 rounded-r-xl shadow-sm animate-in fade-in"
            role="alert"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-amber-700 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-amber-900">
                {warningMessage}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setWarningMessage("")}
              className="text-amber-700 hover:text-amber-900 p-1 rounded-md"
              aria-label="Dismiss warning"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    
      {/* 3. CATEGORY NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-3 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.refDataName;
            return (
              <button
                key={cat.id || cat.refDataName}
                type="button"
                onClick={() => handleCategorySelect(cat.refDataName)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#900000] text-amber-300 shadow-md ring-2 ring-amber-400/40"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200/80 hover:text-gray-900"
                }`}
              >
                {cat.displayName || cat.refDataName}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* 4. CONTROLS BAR: FULL WIDTH SEARCH BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="w-full pb-6 border-b border-gray-200">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search offerings..."
              className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#900000] focus:border-transparent transition-all shadow-xs"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 5. CONTENT GRID / SKELETON / EMPTY / CARDS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-48 bg-gray-200 w-full" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-md w-1/3" />
                  <div className="h-4 bg-gray-200 rounded-md w-full" />
                  <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-red-200 p-8 shadow-xs">
            <svg
              className="w-12 h-12 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 mt-4">
              Unable to Load Offerings
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              We encountered a temporary network issue fetching donation
              services. Please check your connection and try again.
            </p>
          </div>
        ) : filteredCategoryDetails.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 font-serif text-xl font-bold">
              ॐ
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-4">
              No Offerings Found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No offerings matched "${searchQuery}". Try a different search query.`
                : "There are currently no active offerings under this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategoryDetails.map((item) => {
              const key = item.id;
              const isChecked = Boolean(checkedCategoryMap[key]);
              const isGreyScale = isCategoryGreyScale(item);
              const isDtVisible = checkDateVisibility(item.isDTVisible);
              const isTimeVisible = checkTimeVisibility(item.isTimeVisible);
              const isQtyCounter = checkQtyCounterEnabled(item.qtyCounter);
              const isExpanded = Boolean(expandedDescMap[key]);

              const selectedDates = selectedDatesMap[key] || [];
              const selectedTime = selectedTimeMap[key] || "";
              const quantity = categoryQuantitiesMap[key] || 1;
              const isCustomAmount = item.parsedAmount <= 0;

              return (
                <div
                  key={key}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                    isGreyScale
                      ? "opacity-60 grayscale pointer-events-none border-gray-200"
                      : isChecked
                        ? "border-amber-400 ring-2 ring-amber-400/30"
                        : "border-gray-200"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-amber-50 overflow-hidden">
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.refDataName}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <h3 className="font-serif font-bold text-gray-900 text-base sm:text-lg leading-snug">
                            {item.refDataName}
                          </h3>

                          {/* Amount Badge */}
                          <div>
                            {isCustomAmount ? (
                              <span className="inline-block bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Flexible Amount
                              </span>
                            ) : (
                              <span className="inline-block bg-[#900000] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                                {currencySymbol}
                                {item.parsedAmount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <label className="flex items-center cursor-pointer pt-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              handleCheckboxChange(key, e.target.checked, item)
                            }
                            aria-label={`Select ${item.refDataName}`}
                            className="w-5 h-5 text-[#900000] rounded-md border-gray-300 focus:ring-[#900000] cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* Expandable Description */}
                      {item.description && (
                        <div className="mt-2.5">
                          <p
                            className={`text-xs text-gray-600 leading-relaxed ${
                              !isExpanded ? "line-clamp-2" : ""
                            }`}
                          >
                            {item.description}
                          </p>
                          {item.description.length > 90 && (
                            <button
                              type="button"
                              onClick={() => handleToggleDescription(key)}
                              className="text-[11px] text-amber-800 font-semibold hover:underline mt-1 focus:outline-none"
                            >
                              {isExpanded ? "Read Less" : "Read More"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive Slot Pickers & Modifiers */}
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                      {/* Date Selector Trigger */}
                      {isDtVisible && (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDatePicker(item)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-amber-50 hover:border-amber-300 transition-colors flex items-center gap-1.5"
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
                            {selectedDates.length > 0
                              ? "Change Date"
                              : "Choose Date"}
                          </button>
                          <span className="text-[11px] font-medium text-gray-600 truncate max-w-[150px]">
                            {selectedDates.length > 0
                              ? selectedDates[0].toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "No date chosen"}
                          </span>
                        </div>
                      )}

                      {/* Time Selector Trigger */}
                      {isTimeVisible && (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenTimePicker(item)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-amber-50 hover:border-amber-300 transition-colors flex items-center gap-1.5"
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
                            {selectedTime ? "Change Time" : "Choose Time"}
                          </button>
                          <span className="text-[11px] font-medium text-gray-600">
                            {selectedTime || "No time chosen"}
                          </span>
                        </div>
                      )}

                      {/* Custom Donation Amount Input */}
                      {isCustomAmount && (
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                            Offering Amount ({currencySymbol})
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">
                              {currencySymbol}
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={customAmountMap[key] || ""}
                              onChange={(e) =>
                                handleCustomAmountChange(key, e.target.value)
                              }
                              placeholder="Enter custom amount"
                              className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#900000] focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* Quantity Stepper */}
                      {isQtyCounter && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-medium text-gray-600">
                            Quantity
                          </span>
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleQuantityDecrement(key)}
                              className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              −
                            </button>
                            <span className="px-3 py-1 text-xs font-bold text-gray-900 bg-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityIncrement(key)}
                              className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      
      {/* 6. PERSISTENT AGGREGATED CHECKOUT BAR                                */}
      
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl py-3.5 px-4 sm:px-8 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-sm">
              {totalCartCount}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Total Offering
              </p>
              <p className="text-lg sm:text-2xl font-serif font-bold text-gray-900 leading-tight">
                {currencySymbol}
                {totalCartAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckoutClick}
            disabled={totalCartCount === 0}
            className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-sm cursor-pointer ${
              totalCartCount > 0
                ? "bg-[#900000] text-amber-300 hover:bg-[#7a0000] active:scale-95 shadow-amber-900/10"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Proceed to Checkout
          </button>
        </div>
      </footer>

      
      {/* 7. MODAL DIALOGS CONTAINER */}
      <DonationSlotModal
        dateModal={dateModal}
        timeModal={timeModal}
        onCloseDate={handleCloseDatePicker}
        onSelectDate={handleSelectDate}
        onCloseTime={handleCloseTimePicker}
        onSelectTime={handleSelectTime}
        getRemainingSlots={getRemainingSlots}
        primaryColor = {APP_COLORS.primary}
      />
    </div>
  );
};

