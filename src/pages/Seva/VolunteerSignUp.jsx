import { useState, useRef, useEffect } from "react";
import {
  useUploadVolunteerPhoto,
  useSubmitVolunteerForm,
  useGetStates,
  useGetCities,
} from "../../hooks/queries/Seva/useGetVolunteerSignUp";
import { APP_COLORS } from "../../constants/appColors";
import { ENV_CONFIG } from "../../constants/envConfig";
import dividerImg from "../../assets/border.png";

const baseFieldClasses =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/30 transition-all placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed";

const FormInput = (props) => <input className={baseFieldClasses} {...props} />;

const FormSelect = ({ children, ...props }) => (
  <select
    className={`${baseFieldClasses} ${!props.disabled ? "cursor-pointer text-gray-700" : "text-gray-400"}`}
    {...props}
  >
    {children}
  </select>
);

const FormTextarea = (props) => (
  <textarea className={`${baseFieldClasses} resize-none`} {...props} />
);
const labelClasses = "block text-[13px] text-gray-700 font-medium mb-1 pl-1";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const CustomDatePicker = ({ name, value, onChange, primaryColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    value
      ? new Date(value)
      : new Date(new Date().setFullYear(new Date().getFullYear() - 25)),
  ); // Default to 25 yrs ago for DOB
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysCount }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const handleDayClick = (day) => {
    const selected = new Date(year, month, day);
    const y = selected.getFullYear();
    const m = String(selected.getMonth() + 1).padStart(2, "0");
    const d = String(selected.getDate()).padStart(2, "0");
    onChange({ target: { name, value: `${y}-${m}-${d}` } });
    setIsOpen(false);
  };

  const handleMonthChange = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const handleYearChange = (e) => {
    setCurrentDate(new Date(Number(e.target.value), month, 1));
  };

  const displayValue = value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="relative w-full" ref={calendarRef}>
      {/* Trigger Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gray-50 border ${
          isOpen ? "border-gray-400 ring-2" : "border-gray-200"
        } rounded-xl px-4 py-3.5 text-[15px] font-medium cursor-pointer transition-all flex items-center justify-between`}
        style={{
          borderColor: isOpen ? primaryColor : undefined,
          boxShadow: isOpen ? `0 0 0 2px ${primaryColor}30` : undefined,
        }}
      >
        <span className={displayValue ? "text-gray-800" : "text-gray-400"}>
          {displayValue || "DD / MM / YYYY"}
        </span>
        <svg
          className="w-5 h-5 text-gray-500"
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
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 p-5 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.12)] border border-gray-100 z-50 w-[320px] animate-in fade-in zoom-in-95 duration-200">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-5">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[16px]">
              <span>{MONTHS[month]}</span>
              <select
                value={year}
                onChange={handleYearChange}
                className="bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 appearance-none cursor-pointer outline-none hover:border-gray-300 transition-colors"
                style={{ color: primaryColor }}
              >
                {Array.from(
                  { length: 100 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Days Week Header */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[13px] font-extrabold text-gray-400 pb-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="w-10 h-10"></div>
            ))}
            {days.map((day) => {
              const currentDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = value === currentDateStr;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-[14px] font-bold transition-all hover:-translate-y-0.5
                    ${isSelected ? "text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}
                  `}
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const VolunteerSignUp = () => {
  const primaryColor = APP_COLORS?.primary || "#900000";

  const { mutateAsync: uploadPhoto, isPending: isUploading } =
    useUploadVolunteerPhoto();
  const { mutateAsync: submitForm, isPending: isSubmitting } =
    useSubmitVolunteerForm();

  // Local UI State
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    productId: ENV_CONFIG.PRODUCT_ID,
    clientId: ENV_CONFIG.CLIENT_ID,
    date: new Date().toLocaleDateString("en-GB"), // e.g. "09/01/2026"
    time: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }), // e.g. "12:36 AM"
    volunteerID: "",
    name: "", // Mapped from First Name + Last Name
    firstName: "", // Local only
    lastName: "", // Local only
    mobile: "",
    email: "",
    volunteerArea: [],
    isInsert: true,
    emrgContactName: "",
    emrgContactNumber: "",
    dob: "",
    gender: "Male",
    workingHours: "",
    notes: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    address: "",
  });

  const { data: states } = useGetStates();
  const { data: cities, isLoading: isCitiesLoading } = useGetCities(
    formData.state,
  );

  // Abort Safety for memory management
  const abortControllerRef = useRef(null);

  // Cleanup active network requests if component unmounts during upload
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Ensure body scroll is locked when Modal is open
  useEffect(() => {
    if (isTermsModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isTermsModalOpen]);

  /**
   * Strictly blocks any non-numeric key presses
   * It allows control keys like Backspace, Delete, Arrows, Tab, and Copy/Paste shortcuts.
   */
  const handleNumericKeyDown = (e) => {
    const allowedKeys = [
      "Backspace",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Delete",
      "Tab",
      "Enter",
    ];

    // If the key is not a number (0-9), not an allowed control key, and not a Ctrl/Cmd shortcut
    if (
      !/^[0-9]$/.test(e.key) &&
      !allowedKeys.includes(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }
  };

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;

    if (
      name === "mobile" ||
      name === "emrgContactNumber" ||
      name === "workingHours" ||
      name === "zip"
    ) {
      value = value.replace(/\D/g, "");
    }

    if (type === "checkbox" && name !== "terms") {
      setFormData((prev) => {
        const currentAreas = prev.volunteerArea || [];
        if (checked) {
          return { ...prev, volunteerArea: [...currentAreas, value] };
        } else {
          return {
            ...prev,
            volunteerArea: currentAreas.filter((item) => item !== value),
          };
        }
      });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target?.files?.[0];
    if (!selectedFile) return;

    setUploadError(null); // Reset previous states
    abortControllerRef.current = new AbortController(); // Initialize AbortController for this specific request

    try {
      const result = await uploadPhoto({
        image: selectedFile,
        signal: abortControllerRef.current.signal,
      });

      if (result) {
        setUploadedFileMeta(result);
      } else {
        console.log("[RESULT]", result);
        setUploadError("Failed to parse server response. Please try again.");
      }
    } catch (error) {
      // Ignore errors caused by the user navigating away (AbortController)
      if (error.name !== "CanceledError" && error.name !== "AbortError") {
        console.error("[UI Error] Upload failed:", error);
        setUploadError("Network error occurred during upload.");
      }
    }
  };

  const handleClearForm = () => {
    setFormData((prev) => ({
      ...prev,
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      volunteerArea: [],
      emrgContactName: "",
      emrgContactNumber: "",
      dob: "",
      gender: "Male",
      workingHours: "",
      notes: "",
      state: "",
      city: "",
      zip: "",
      address: "",
    }));
    setUploadedFileMeta(null);
    setUploadError(null);
    setIsTermsAccepted(false);
  };

  /**
   * Opens modal if not accepted.
   */
  const handleTermsClick = (e) => {
    e.preventDefault();
    if (isTermsAccepted) {
      setIsTermsAccepted(false);
    } else {
      setIsTermsModalOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isTermsAccepted) {
      alert("Please accept the Terms and Conditions.");
      return;
    }

    const finalPayload = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      // Map the parsed image filename to 'base64' key as requested
      base64: uploadedFileMeta?.extractedFilename || "",
      volunteerArea: JSON.stringify(formData.volunteerArea),
    };

    // Remove UI-only helper keys before sending to server
    delete finalPayload.firstName;
    delete finalPayload.lastName;

    try {
      const response = await submitForm(finalPayload);
      if (
        response?.statusCode === 1 ||
        response?.msg === "Volunteer added succesfully"
      ) {
        alert("Volunteer registration successful!");
        handleClearForm();
      } else {
        console.log("[Submit Response]", response);
        alert(
          "Failed to submit registration." + response?.msg ||
            "Please try again.",
        );
      }
    } catch {
      alert("An error occurred during submission. Please try again.");
    }
  };

  return (
    <section className="w-full py-12 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form Container */}
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="text-center mb-10 md:mb-7 px-4 flex flex-col items-center">
            <h2
              className="text-3xl md:text-4xl font-bold font-serif"
              style={{ color: primaryColor }}
            >
              Volunteer Registration Form
            </h2>
            <img
              src={dividerImg}
              alt="divider"
              className="mt-3 md:mt-4 w-48 md:w-80 h-auto opacity-80 pointer-events-none"
              loading="lazy"
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>

          {/* Form Grid */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Upload Photo */}
              <fieldset
                className={`border rounded-lg px-4 pb-4 pt-2 transition-colors ${uploadError ? "border-red-400" : "border-gray-300"}`}
              >
                <legend className="text-[13px] text-gray-700 px-1 font-medium bg-white">
                  Upload Photo
                </legend>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200 file:cursor-pointer disabled:opacity-50 mt-1"
                />

                {/* Status Indicators */}
                {isUploading && (
                  <p className="text-xs text-blue-600 mt-2 animate-pulse">
                    Uploading...
                  </p>
                )}
                {uploadError && (
                  <p className="text-xs text-red-600 mt-2">{uploadError}</p>
                )}
                {uploadedFileMeta?.extractedFilename && !isUploading && (
                  <p className="text-xs text-green-600 mt-2 truncate">
                    Uploaded: {uploadedFileMeta.extractedFilename}
                  </p>
                )}
              </fieldset>
              <div className="flex flex-col justify-end">
                <label className={labelClasses}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <FormInput
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="First Name"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className={labelClasses}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <FormInput
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* 2. Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>
                  Email <span className="text-red-500">*</span>
                </label>
                <FormInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Email"
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <FormInput
                  type="tel"
                  inputMode="numeric"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  onKeyDown={handleNumericKeyDown}
                  required
                  placeholder="Phone Number"
                />
              </div>
            </div>

            {/* 3. Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Emergency Contact Name</label>
                <FormInput
                  type="text"
                  name="emrgContactName"
                  value={formData.emrgContactName}
                  onChange={handleInputChange}
                  placeholder="Emergency Contact Name"
                />
              </div>
              <div>
                <label className={labelClasses}>Emergency Contact Number</label>
                <FormInput
                  type="tel"
                  inputMode="numeric"
                  name="emrgContactNumber"
                  value={formData.emrgContactNumber}
                  onChange={handleInputChange}
                  onKeyDown={handleNumericKeyDown}
                  placeholder="Emergency Contact Number"
                />
              </div>
            </div>

            {/* 4. Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Date of Birth</label>
                <CustomDatePicker
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  primaryColor={primaryColor}
                />
              </div>
              <div className="flex flex-col justify-center pt-5">
                <label className={`${labelClasses} -mt-5`}>Select Gender</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2.5 text-[15px] font-medium text-gray-700 cursor-pointer">
                    <FormInput
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={formData.gender === "Male"}
                      onChange={handleInputChange}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: primaryColor }}
                    />
                    Male
                  </label>
                  <label className="flex items-center gap-2.5 text-[15px] font-medium text-gray-700 cursor-pointer">
                    <FormInput
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={formData.gender === "Female"}
                      onChange={handleInputChange}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: primaryColor }}
                    />
                    Female
                  </label>
                </div>
              </div>
            </div>

            {/* 5. Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Address</label>
                <FormInput
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                />
              </div>
              <div>
                <label className={labelClasses}>County</label>
                <FormInput
                  type="text"
                  name="county"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="County"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClasses}>State</label>
                <FormSelect
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                >
                  <option value="" disabled className="text-gray-400">
                    Select State
                  </option>
                  {states?.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div>
                {/* City Dropdown (Locked until State is selected) */}
                <label className={labelClasses}>City</label>
                <FormSelect
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!formData.state || isCitiesLoading}
                >
                  <option value="" disabled className="text-gray-400">
                    {isCitiesLoading ? "Loading cities..." : "Select City"}
                  </option>
                  {cities?.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <label className={labelClasses}>Zipcode</label>
                <FormInput
                  type="text"
                  inputMode="numeric"
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  onKeyDown={handleNumericKeyDown}
                  placeholder="Zipcode"
                />
              </div>
            </div>

            {/* 6. Volunteer Area Checkboxes */}
            <fieldset className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm relative mt-4">
              <legend className="text-[14px] md:text-[15px] text-gray-800 px-4 py-1 font-bold bg-white rounded-lg shadow-sm border border-gray-100">
                Volunteer Area
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
                {[
                  "FRONT DESK",
                  "OTHERS",
                  "GARDEN",
                  "FLOWERS ( GARLAND MAKING )",
                  "RELIGIOUS",
                  "INFORMATION TECHNOLOGY",
                  "YOUTH (AAKAAR)",
                  "PUBLICATIONS",
                  "DECORATIONS",
                  "HUNDI COLLECTION",
                  "ENGINEERING",
                  "CULTURAL",
                ].map((area) => {
                  const isSelected = formData.volunteerArea.includes(area);
                  return (
                    <label
                      key={area}
                      className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? "bg-red-50/40 border-red-200 shadow-sm"
                          : "bg-gray-50 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      {/* Custom Styled SVG Checkbox */}
                      <div
                        className={`relative w-5 h-5 flex-shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-transparent"
                            : "bg-white border-gray-300"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? primaryColor
                            : undefined,
                        }}
                      >
                        {isSelected && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Visually hidden native input */}
                      <input
                        type="checkbox"
                        name={area}
                        value={area}
                        checked={isSelected}
                        onChange={handleInputChange}
                        className="hidden"
                      />

                      {/* Label Text */}
                      <span
                        className={`text-[12px] md:text-[13px] font-semibold text-left leading-tight flex-1 ${
                          isSelected ? "" : "text-gray-700"
                        }`}
                        style={{
                          color: isSelected ? primaryColor : undefined,
                        }}
                      >
                        {area}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* 7. Working Hours & Notes */}
            <div>
              <label className={labelClasses}>
                How many hours per week are you committed to volunteer?
              </label>
              <FormInput
                type="text"
                inputMode="numeric"
                name="workingHours"
                value={formData.workingHours}
                onChange={handleInputChange}
                onKeyDown={handleNumericKeyDown}
                placeholder="Hrs Per Week"
              />
            </div>

            <div>
              <label className={labelClasses}>Notes</label>
              <FormTextarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="10"
                placeholder="Notes"
              />
            </div>

            {/* 8. Terms & Actions */}
            <div className="bg-gray-100/80 p-4 rounded-md border border-gray-200 flex items-center gap-3">
              <FormInput
                type="checkbox"
                id="terms"
                name="terms"
                checked={isTermsAccepted}
                readonly
                onClick={handleTermsClick}
                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="text-sm text-red-700 cursor-pointer select-none"
                onClick={handleTermsClick}
              >
                Please Accept Our Terms and Conditions.
              </label>
            </div>

            <div className="flex justify-center gap-4 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-10 py-2.5 text-white text-sm font-bold rounded-full transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                className="px-10 py-2.5 bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold rounded-full transition-all shadow-sm disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>

      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold font-serif uppercase tracking-tight text-gray-900">
                htky VOLUNTEER CODE OF CONDUCT
              </h3>
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-gray-700 text-[14px] leading-relaxed">
              <p>
                Volunteers are at the heart of htky. Outstanding Volunteerism is
                what makes htky a temple that is loved by all devotees. htky’s
                volunteers exemplify the sentiments in Bhagavad Gita 5.8 that
                talks about humble and selfless Karma Yogi. htky appreciates the
                time volunteers put in to serve the temple and acknowledges that
                their selfless service has sustained the temple operations and
                makes it one of the leading temples in the region. We thank you
                for your great service. We request the volunteers to abide by
                the temple code of conduct and sign this form for our record.
              </p>

              <p className="font-bold text-gray-900">
                I, {formData.firstName} {formData.lastName}, want to serve the
                Devatas at htky, and the devotee community at htky as a Seva. I
                recognize that my primary responsibility is to project a
                positive, professional image and provide the best possible
                assistance and information to the devotees, public, staff and
                other volunteers at all times (including through verbal and
                electronic communications). I understand that I will be held to
                each of the following:
              </p>

              <div className="space-y-4">
                {/* Section 1 */}
                <div>
                  <h4 className="font-bold text-gray-900">
                    1. Mutual Respect, Integrity and Courtesy
                  </h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>
                      As a Volunteer, I will treat each other, devotees and
                      employees (staff & Priests) of htky with respect, trust,
                      integrity and dignity.
                    </li>
                    <li>
                      I will abide by the following creed, "
                      <span className="font-bold">CARE</span> -{" "}
                      <span className="font-bold">
                        C(Courteous) A(Attentive) R(Responsive) and
                        E(Empathetic)
                      </span>
                      " while working with devotees, other volunteers, and
                      employees
                    </li>
                    <li>
                      I understand anger, outbursts, and abusive behavior are a
                      poison for spirituality; such unbecoming behavior will not
                      be tolerated in the temple, and by the Board of Trustees
                    </li>
                  </ul>
                </div>

                {/* Section 2 */}
                <div>
                  <h4 className="font-bold text-gray-900">
                    2. Use of Respectful Language
                  </h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>
                      I will abide by the following creed, "
                      <span className="font-bold">CARE</span> -{" "}
                      <span className="font-bold">
                        C(Courteous) A(Attentive) R(Responsive) and
                        E(Empathetic)
                      </span>
                      " while working with devotees, other volunteers, and
                      employees
                    </li>
                    <li>
                      I understand anger, outbursts, and abusive behavior are a
                      poison for spirituality; such unbecoming behavior will not
                      be tolerated in the temple, and by the Board of Trustees
                    </li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div>
                  <h4 className="font-bold text-gray-900">
                    3. Reporting Protocols
                  </h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>
                      Differences of opinion shall be resolved with mutual and
                      cordial discussions and by following appropriate reporting
                      protocols.
                    </li>
                    <li>
                      If the differences cannot be resolved with mutual
                      discussions, then I will escalate the issue to the General
                      Manager or Vice Chair of Operations.
                    </li>
                    <li>
                      Any violation of the code of conduct by the volunteer will
                      result in a warning notice that will be sent by the Vice
                      Chair of Operations to the volunteer.
                    </li>
                    <li>
                      Second such incident will result in a referral of the
                      incident to the Ombudsperson by the Chairperson.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="font-bold text-gray-900 mb-4">
                  I have read the htky Volunteer Code of Conduct and understand
                  that I will be held accountable for my actions.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-12">
                  <p>
                    Accepted:{" "}
                    <span className="underline font-medium px-2">
                      {`${formData.firstName} ${formData.lastName}`.trim() ||
                        "___________________"}
                    </span>
                  </p>
                  <p>
                    Date:{" "}
                    <span className="font-medium">
                      {new Date().toLocaleDateString("en-GB")}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsTermsAccepted(true);
                  setIsTermsModalOpen(false);
                }}
                className="px-8 py-2.5 text-white font-bold rounded-full transition-all hover:opacity-90 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
