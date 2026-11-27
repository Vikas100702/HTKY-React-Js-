/**
 * @file src/pages/Facilities/FacilitiesPage.jsx
 * @description Modular Orchestrator Page for Temple Facility Booking.
 * Connects `useFacilityForm()` state & server queries to isolated step modules:
 * - `FacilityStepHeader` (3-step wizard stepper & validation alert banner)
 * - `FacilityEventDetailsStep` (Step 1: Event Details & Priest Services sub-form)
 * - `FacilityChooseRentalStep` (Step 2: 3-column grid using `UniversalServiceCard`)
 * - `FacilitySubmitRequestStep` (Step 3: Request Summary, Member Discount, Security Deposit & Book Now)
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { format24To12Label, useFacilityForm } from "../../hooks/queries/Facilities/useFacilityForm";
import { FacilityStepHeader } from "./components/FacilityStepHeader";
import { FacilityEventDetailsStep } from "./components/FacilityEventDetailsStep";
import { FacilityChooseRentalStep } from "./components/FacilityChooseRentalStep";
import { FacilitySubmitRequestStep } from "./components/FacilitySubmitRequestStep";
import { APP_FONTS } from "../../constants/appTheme";
import { useCallback, useMemo, useState } from "react";
import { useGetDevoteeDetails } from "../../hooks/queries/Profile/useDevoteeProfile";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import useCheckout from "../../hooks/queries/Checkout/checkoutApi";
import HostedPaymentModal from "../../components/checkout/HostedPaymentModal";
import FacilityAgreementModal from "./components/FacilityAgreementModal";

export const FacilitiesPage = () => {
  const {
    currentStep,
    steps,
    eventDetails,
    fieldErrors,
    validationBanner,
    readOnlyAddress,
    isAddressLoading,
    isPriestSectionActive,
    priestServices,
    isPriestServicesLoading,
    serviceTimeSlots,
    activeServiceTime24,
    availablePriests,
    isPriestsLoading,
    updateEventField,
    selectPriestServiceOffering,
    selectPreferredPriest,
    selectPriestServices,
    handleProceedFromEventDetails,
    goToStep,
    facilitiesList,
    isFacilitiesLoading,
    isFacilitiesError,
    refetchFacilities,
    selectedRentals,
    slotAvailabilityMap,
    selectFacilityPriceTier,
    updateFacilityTimeRange,
    adjustFacilityQuantity,
    toggleFacilitySelection,
    handleProceedFromChooseRental,
    isMemberActive,
    membershipStatusInfo,
    step3PricingSummary,
  } = useFacilityForm();

  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const showToast = useCartStore((state) => state.showToast);
  const memberId = authUser?._id || authUser?.id || authUser?.memberId || "";
  const { data: devoteeProfile } = useGetDevoteeDetails(memberId);
  const { addServiceCartTemp, isProcessing: isPreparingCheckout } =
    useCheckout();

  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [facilityInvoiceNumber, setFacilityInvoiceNumber] = useState("");

  // Build normalized line items (Rentals + Optional Priest Service) for checkoutApi
  // const facilityCheckoutItems = useMemo(() => {
  //   const items = (step3PricingSummary?.itemizedRentals || []).map((item) => ({
  //     id: item.facilityId,
  //     serviceId: item.facilityId,
  //     refDataName: item.serviceName,
  //     title: item.serviceName,
  //     itemType: "FACILITY REQUEST",
  //     serviceCategoryTypes: item.rentalCategory || "",
  //     serviceTypes: item.refDataCode || "",
  //     startDate: eventDetails.eventDate,
  //     quantity: item.qty || 1,
  //     time: format24To12Label(item.startTime),
  //     startTime: format24To12Label(item.startTime),
  //     endTime: format24To12Label(item.endTime),
  //     bookingType: item.selectedTierKey || "",
  //     bookingTypes: item.selectedTierKey || "",
  //     selectedTierKey: item.selectedTierKey || "",
  //     serviceAddress: readOnlyAddress.streetAddress,
  //     originalUnitPrice: item.originalUnitPrice,
  //     oldServiceAmount: item.originalUnitPrice,
  //     discountedAmount: item.unitDiscount,
  //     unitPrice: item.finalUnitPrice,
  //     amount: item.finalUnitPrice,
  //     isServicePaid: true,
  //   }));

  //   if (
  //     eventDetails.addPriestServices === "YES" &&
  //     eventDetails.selectedServiceId
  //   ) {
  //     const priestAmt = Number(step3PricingSummary?.priestServiceAmount || 0);
  //     const serviceTime12 = format24To12Label(
  //       eventDetails.serviceTime || eventDetails.eventTime,
  //     );
  //     items.push({
  //       id: eventDetails.selectedServiceId,
  //       serviceId: eventDetails.selectedServiceId,
  //       refDataName: eventDetails.selectedServiceName,
  //       title: eventDetails.selectedServiceName,
  //       itemType: "SERVICE",
  //       serviceCategoryTypes: "IN-TEMPLE",
  //       serviceTypes: "SERVICE REQUEST",
  //       startDate: eventDetails.eventDate,
  //       quantity: 1,
  //       time: serviceTime12,
  //       startTime: serviceTime12,
  //       serviceAddress: readOnlyAddress.streetAddress,
  //       originalUnitPrice: priestAmt,
  //       oldServiceAmount: priestAmt,
  //       discountedAmount: 0,
  //       unitPrice: priestAmt,
  //       amount: priestAmt,
  //       isServicePaid: true,
  //     });
  //   }

  //   return items;
  // }, [step3PricingSummary, eventDetails, readOnlyAddress.streetAddress]);

  // cardData me sirf Facility Rentals jaaenge (Priest Services serviceDetail me jaayegi)
  const facilityCheckoutItems = useMemo(() => {
    return (step3PricingSummary?.itemizedRentals || []).map((item) => ({
      id: item.facilityId,
      serviceId: item.facilityId,
      refDataName: item.serviceName,
      title: item.serviceName,
      itemType: "FACILITY REQUEST",
      serviceCategoryTypes: item.rentalCategory || "FACILITIES",
      serviceTypes: item.refDataCode || "RENTALS",
      startDate: eventDetails.eventDate,
      quantity: item.qty || 1,
      time: format24To12Label(item.startTime),
      startTime: format24To12Label(item.startTime),
      endTime: format24To12Label(item.endTime),
      bookingType: item.selectedTierKey || "",
      bookingTypes: item.selectedTierKey || "",
      selectedTierKey: item.selectedTierKey || "",
      serviceAddress: readOnlyAddress.streetAddress,
      originalUnitPrice: item.originalUnitPrice,
      oldServiceAmount: item.originalUnitPrice,
      discountedAmount: item.unitDiscount,
      unitPrice: item.finalUnitPrice,
      amount: item.finalUnitPrice,
      isServicePaid: true,
    }));
  }, [
    step3PricingSummary,
    eventDetails.eventDate,
    readOnlyAddress.streetAddress,
  ]);

  // Build `eventDetail` metadata matching `addServiceCartTemp` & `addRentalServiceCart` contract
  const facilityEventDetail = useMemo(
    () => ({
      eventName: eventDetails.eventName,
      eventDate: eventDetails.eventDate,
      eventTime: format24To12Label(eventDetails.eventTime),
      eventEndTime: null,
      eventAddress: readOnlyAddress.streetAddress,
      eventCity: readOnlyAddress.city,
      eventState: readOnlyAddress.state,
      eventLanguage: eventDetails.preferredLanguage || "",
      adults: String(eventDetails.attendeesCount || "0"),
      children: "0",
      zip: readOnlyAddress.zipCode,
      eventDescription: eventDetails.eventDescription || "",
    }),
    [eventDetails, readOnlyAddress],
  );

  // Step 3 `Book Now` -> Open Rental Agreement PDF Modal first
  const handleBookNowSubmit = useCallback(() => {
    setIsAgreementOpen(true);
  }, []);

  // Priest Services details for `addServiceCartTemp.serviceDetail` & `addRentalServiceCart.serviceDetail`
  const facilityServiceDetail = useMemo(() => {
    if (
      eventDetails.addPriestServices !== "YES" ||
      !eventDetails.selectedServiceId
    ) {
      return {};
    }

    const serviceTime12 = format24To12Label(
      eventDetails.serviceTime || eventDetails.eventTime,
    );
    const serviceAmt = String(
      Number(step3PricingSummary?.priestServiceAmount || 0),
    );

    return {
      serviceId: eventDetails.selectedServiceId,
      serviceName: eventDetails.selectedServiceName,
      serviceCategory: "IN-TEMPLE",
      serviceType: "SERVICE REQUEST",
      serviceAmount: serviceAmt,
      priestId: eventDetails.selectedPriestId || "",
      priestName: eventDetails.selectedPriestName || "",
      serviceDate: eventDetails.eventDate,
      serviceTime: serviceTime12,
      priestEmail: "",
      priestPhone: "",
      oldServiceAmount: serviceAmt,
      discountedAmount: 0,
      couponCode: "",
      couponId: "",
    };
  }, [eventDetails, step3PricingSummary?.priestServiceAmount]);

  // Agreement `Accept` -> Lock temporary cart (`addServiceCartTemp`) & open Payment Gateway Modal
  const handleAcceptAgreement = useCallback(async () => {
    const generatedInv = String(Date.now());
    const payableTotal = Number(step3PricingSummary?.saleTotal || 0);

    try {
      await addServiceCartTemp({
        invoiceNum: generatedInv,
        totalAmount: payableTotal,
        cartItems: facilityCheckoutItems,
        eventDetail: facilityEventDetail,
        serviceDetail: facilityServiceDetail,
      });

      setFacilityInvoiceNumber(generatedInv);
      setIsAgreementOpen(false);
      setIsPaymentModalOpen(true);
    } catch (err) {
      showToast(
        err?.errorMessage ||
          err?.message ||
          "Unable to initialize facility checkout. Please try again.",
        "error",
      );
    }
  }, [
    step3PricingSummary?.saleTotal,
    addServiceCartTemp,
    facilityCheckoutItems,
    facilityEventDetail,
    facilityServiceDetail,
    showToast,
  ]);

  const handlePaymentSuccess = useCallback(
    (orderResult) => {
      setIsPaymentModalOpen(false);
      navigate("/checkout/success", {
        state: {
          invoiceNo: orderResult?.invoiceNo || facilityInvoiceNumber,
          totalAmount: Number(step3PricingSummary?.saleTotal || 0),
          bookingType: "FACILITY",
        },
      });
    },
    [navigate, facilityInvoiceNumber, step3PricingSummary?.saleTotal],
  );

  return (
    <div
      className="w-full min-h-screen bg-[#faf7f2] pb-12"
      style={{ fontFamily: APP_FONTS.body }}
    >
      {/* 3-Step Timeline Header & Validation Banner */}
      <FacilityStepHeader
        steps={steps}
        currentStep={currentStep}
        onStepClick={goToStep}
        validationBanner={validationBanner}
      />

      {/* Main Step Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {currentStep === 1 && (
          <FacilityEventDetailsStep
            eventDetails={eventDetails}
            fieldErrors={fieldErrors}
            readOnlyAddress={readOnlyAddress}
            isAddressLoading={isAddressLoading}
            isPriestSectionActive={isPriestSectionActive}
            priestServices={priestServices}
            isPriestServicesLoading={isPriestServicesLoading}
            serviceTimeSlots={serviceTimeSlots}
            activeServiceTime24={activeServiceTime24}
            availablePriests={availablePriests}
            isPriestsLoading={isPriestsLoading}
            onUpdateField={updateEventField}
            onSelectPriestService={selectPriestServiceOffering}
            onSelectPreferredPriest={selectPreferredPriest}
            onSelectPriestChoice={selectPriestServices}
            onNext={handleProceedFromEventDetails}
          />
        )}

        {currentStep === 2 && (
          <FacilityChooseRentalStep
            eventDate={eventDetails.eventDate}
            facilitiesList={facilitiesList}
            isFacilitiesLoading={isFacilitiesLoading}
            isFacilitiesError={isFacilitiesError}
            onRetry={refetchFacilities}
            selectedRentals={selectedRentals}
            slotAvailabilityMap={slotAvailabilityMap}
            onSelectTier={selectFacilityPriceTier}
            onChangeTime={updateFacilityTimeRange}
            onAdjustQuantity={adjustFacilityQuantity}
            onToggleSelect={toggleFacilitySelection}
            onPrevious={() => goToStep(1)}
            onNext={handleProceedFromChooseRental}
          />
        )}

        {currentStep === 3 && (
          <FacilitySubmitRequestStep
            eventDetails={eventDetails}
            readOnlyAddress={readOnlyAddress}
            isMemberActive={isMemberActive}
            membershipStatusInfo={membershipStatusInfo}
            step3PricingSummary={step3PricingSummary}
            isSubmitting={isPreparingCheckout}
            onPrevious={() => goToStep(2)}
            onSubmitRequest={handleBookNowSubmit}
          />
        )}
      </div>

      {/* Rental Agreement PDF Preview Modal (Cancel / Accept) */}
      <FacilityAgreementModal
        isOpen={isAgreementOpen}
        pdfUrl="/Rental_agreement.pdf"
        isAccepting={isPreparingCheckout}
        onCancel={() => !isPreparingCheckout && setIsAgreementOpen(false)}
        onAccept={handleAcceptAgreement}
      />

      {/* Centralized Hosted Payment Gateway Modal (with reCAPTCHA) */}
      <HostedPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        payableAmount={Number(step3PricingSummary?.saleTotal || 0)}
        invoiceNumber={facilityInvoiceNumber}
        cartItems={facilityCheckoutItems}
        devoteeProfile={devoteeProfile}
        eventDetail={facilityEventDetail}
        serviceDetail={facilityServiceDetail}
        securityDeposit={Number(
          step3PricingSummary?.securityDepositAmount || 0,
        )}
        isFacilityBooking={true}
        skipCartClear={true}
        requireCaptcha={true}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};;;;

export default FacilitiesPage;
