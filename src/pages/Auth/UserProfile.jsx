import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar as CalendarIcon,
  Mail,
  Phone,
  MapPin,
  FileText,
  Home,
  ChevronLeft,
  SquarePen,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Users,
  Check,
  Sparkles,
  Eye,
} from "lucide-react";
import { useProfile } from "../../hooks/queries/Profile/useProfile";
import { decodeBase64 } from "../../utils/base64";

/**
 * Normalizes any date string (YYYY-MM-DD, MM/DD/YYYY, or MM/DD) into strict MM/DD.
 */
const formatToMonthDay = (rawDob) => {
  if (!rawDob || typeof rawDob !== "string") return "";
  const trimmed = rawDob.trim();
  // Handle ISO format: YYYY-MM-DD -> MM/DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [, mm, dd] = trimmed.split("-");
    return `${mm}/${dd.slice(0, 2)}`;
  }
  // Handle MM/DD/YYYY or MM/DD -> MM/DD
  if (trimmed.includes("/")) {
    const [mm, dd] = trimmed.split("/");
    if (mm && dd) return `${mm.padStart(2, "0")}/${dd.padStart(2, "0")}`;
  }
  return trimmed;
};

/**
 * Normalizes backend devotee profile payload into local form state.
 */
const createFormStateFromProfile = (profileData) => {
  const rawFamilyList = Array.isArray(profileData?.memberDetail)
    ? profileData.memberDetail.map((member, index) => ({
        id: member._id || `member-${index}-${Date.now()}`,
        memberName: member.memberName || "",
        dob: formatToMonthDay(member.dob) || "",
        nakshatra: member.nakshatra || "",
        relationship: member.relationship?.trim() || "",
        member_email: decodeBase64(member.member_email) || "",
        householdInd: member.householdInd === "YES" ? "YES" : "NO",
        isCumulativeInd: member.isCumulativeInd === "YES" ? "YES" : "NO",
      }))
    : [];

  return {
    firstName: profileData?.firstName || "",
    lastName: profileData?.lastName || "",
    dob: formatToMonthDay(profileData?.dob) || "",
    gotraName: profileData?.gotraName || "",
    Nakshtra: profileData?.Nakshtra || "",
    rashi: profileData?.rashi || "",
    email: decodeBase64(profileData?.email),
    phone: decodeBase64(profileData?.phone) || "",
    addressLine1: profileData?.addressLine1 || "",
    addressLine2: profileData?.addressLine2 || "",
    stateTypes: profileData?.stateTypes || "VIRGINIA",
    cityTypes: profileData?.cityTypes || "CHANTILLY",
    zipCode: profileData?.zipCode || "",
    spouseName: profileData?.spouseName || "",
    spouseDob: formatToMonthDay(profileData?.spouseDob) || "",
    spouseNakshtra: profileData?.spouseNakshtra || "",
    spouseRashi: profileData?.spouseRashi || "",
    spouseEmail: decodeBase64(profileData?.spouseEmail) || "",
    spousePhone: decodeBase64(profileData?.spousePhone) || "",
    spouseGotra: profileData?.spouseGotra || "",
    householdInd: profileData?.householdInd === "YES" ? "YES" : "NO",
    isCumulativeInd: profileData?.isCumulativeInd === "YES" ? "YES" : "NO",
    languagePreferenceName: profileData?.languagePreferenceName || "",
    requestForPriestName: profileData?.requestForPriestName || "",
    newsletterEmail: Boolean(
      profileData?.emailPref === "YES" || profileData?.emailPref === "true",
    ),
    companyEmail: decodeBase64(profileData?.companyEmail) || "",
    companyPhone: decodeBase64(profileData?.companyPhone) || "",
    companyName: profileData?.companyName || "",
    website: profileData?.website || "",
    companyStatus: profileData?.companyStatus || "ACTIVE",
    companyCumulativeInd:
      profileData?.companyCumulativeInd === "YES" ? "YES" : "NO",
    memberDetail:
      rawFamilyList.length > 0
        ? rawFamilyList
        : [
            {
              id: "member-default-0",
              memberName: "",
              dob: "",
              nakshatra: "",
              relationship: "",
              householdInd: "NO",
              isCumulativeInd: "NO",
            },
          ],
  };
};

const RELATIONSHIP_OPTIONS = Object.freeze([
  "Spouse",
  "Son",
  "Daughter",
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Other",
]);

const COMPANY_STATUS_OPTIONS = Object.freeze(["ACTIVE", "INACTIVE"]);

export const UserProfile = () => {
  const navigate = useNavigate();

  // const {
  //   profileData,
  //   gotras,
  //   nakshatras,
  //   rashis,
  //   states,
  //   cities,
  //   isLoading,
  //   isSaving,
  //   isError,
  //   errorMessage,
  //   saveProfile,
  // } = useProfile();

  // Mode controller: false = View Overview, true = Edit Form
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: "", text: "" });
  const [showCompanyNotFoundModal, setShowCompanyNotFoundModal] =
    useState(false);
  const [isCompanyLocked, setIsCompanyLocked] = useState(false);
  const [formState, setFormState] = useState(() =>
    createFormStateFromProfile(null),
  );

  const {
    profileData,
    gotras,
    nakshatras,
    rashis,
    states,
    cities,
    isCitiesLoading,
    isCheckingCompany,
    checkCompanyDetails,
    isLoading,
    isSaving,
    isError,
    errorMessage,
    saveProfile,
  } = useProfile(formState.stateTypes);

  const [syncedProfileData, setSyncedProfileData] = useState(null);

  useEffect(() => {
    if (feedbackMsg.text) {
      const dismissTimer = setTimeout(() => {
        setFeedbackMsg({ type: "", text: "" });
      }, 3000);

      return () => clearTimeout(dismissTimer);
    }
  }, [feedbackMsg.text]);

  // const [formState, setFormState] = useState(() =>
  //   createFormStateFromProfile(profileData),
  // );
  // const [syncedProfileData, setSyncedProfileData] = useState(profileData);

  // Sync state if new backend profile data arrives
  if (profileData && profileData !== syncedProfileData) {
    setSyncedProfileData(profileData);
    setFormState(createFormStateFromProfile(profileData));
  }

  const handleInputChange = (field, value) => {
    setFormState((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };
      if (field === "stateTypes") {
        next.cityTypes = "";
      }
      if (field === "spouseEmail" && !String(value || "").trim()) {
        next.isCumulativeInd = "NO";
      }
      if (field === "companyEmail" && !String(value || "").trim()) {
        next.companyCumulativeInd = "NO";
      }
      return next;
    });
  };

  const handleCompanyEmailBlur = async () => {
    const email = formState.companyEmail?.trim();
    if (!email) {
      setIsCompanyLocked(false);
      return;
    }
    // Basic format guard before triggering API call
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    try {
      const response = await checkCompanyDetails(email);
      const records = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

      if (records.length > 0) {
        const matched = records[0];
        const nestedComp = Array.isArray(matched?.companyDetail)
          ? matched.companyDetail[0]
          : null;

        const resolvedName =
          matched?.refDataName ||
          nestedComp?.companyFirstName ||
          matched?.firstName ||
          "";
        const resolvedPhone = matched?.phone || nestedComp?.companyPhone || "";
        const resolvedWebsite =
          matched?.website || nestedComp?.companyWebsite || "";
        const resolvedStatus =
          matched?.status || nestedComp?.status || "ACTIVE";

        setFormState((prev) => ({
          ...prev,
          companyName: resolvedName || prev.companyName,
          companyPhone: resolvedPhone || prev.companyPhone,
          website: resolvedWebsite || prev.website,
          companyStatus: resolvedStatus || prev.companyStatus,
        }));
        setIsCompanyLocked(true);
      } else {
        setIsCompanyLocked(false);
        setShowCompanyNotFoundModal(true);
      }
    } catch {
      setIsCompanyLocked(false);
      setShowCompanyNotFoundModal(true);
    }
  };

  const handleConfirmCompanyNotFound = () => {
    setShowCompanyNotFoundModal(false);
    setIsCompanyLocked(false);
    setFormState((prev) => ({
      ...prev,
      companyEmail: "",
      companyName: "",
      companyPhone: "",
      website: "",
      companyCumulativeInd: "NO",
    }));
  };

  const handleAddFamilyMember = () => {
    setFormState((prev) => ({
      ...prev,
      memberDetail: [
        ...prev.memberDetail,
        {
          id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          memberName: "",
          dob: "",
          nakshatra: "",
          relationship: "",
          householdInd: "NO",
          isCumulativeInd: "NO",
        },
      ],
    }));
  };

  const handleFamilyMemberChange = (id, field, value) => {
    setFormState((prev) => ({
      ...prev,
      memberDetail: prev.memberDetail.map((member) => {
        if (member.id !== id) return member;
        const nextMember = { ...member, [field]: value };
        if (field === "member_email" && !String(value || "").trim()) {
          nextMember.isCumulativeInd = "NO";
        }
        return nextMember;
      }),
    }));
  };

  const handleRemoveFamilyMember = (id) => {
    setFormState((prev) => ({
      ...prev,
      memberDetail: prev.memberDetail.filter((member) => member.id !== id),
    }));
  };

  const handleSubmitSave = async (e) => {
    if (e) e.preventDefault();
    setFeedbackMsg({ type: "", text: "" });

    if (!formState.firstName.trim()) {
      setFeedbackMsg({
        type: "error",
        text: "First Name anivarya (required) hai.",
      });
      return;
    }
    if (!formState.lastName.trim()) {
      setFeedbackMsg({
        type: "error",
        text: "Last Name anivarya (required) hai.",
      });
      return;
    }

    try {
      const sanitizedMembers = formState.memberDetail
        .filter((m) => m.memberName && m.memberName.trim().length > 0)
        .map((m) => ({
          memberName: m.memberName.trim(),
          dob: m.dob || "",
          nakshatra: m.nakshatra || "",
          relationship: m.relationship || "",
          member_email: m.member_email?.trim() || "",
          householdInd: m.householdInd || "NO",
          isCumulativeInd: m.member_email?.trim()
            ? m.isCumulativeInd || "NO"
            : "NO",
        }));

      const payload = {
        ...formState,
        emailPref: formState.newsletterEmail ? "YES" : "NO",
        memberDetail: sanitizedMembers,
      };

      await saveProfile(payload);
      setFeedbackMsg({
        type: "success",
        text: "Devotee profile updated successfully!",
      });
      setIsEditMode(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFeedbackMsg({
        type: "error",
        text:
          err?.message ||
          "Profile update mein samasya aayi. Kripya punah prayas karein.",
      });
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    setIsEditMode(false);
    setFormState(createFormStateFromProfile(profileData));
    setFeedbackMsg({ type: "", text: "" });
    setIsCompanyLocked(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-8 bg-[#faf7f2]">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#900000] mb-3" />
          <p className="text-base font-serif font-bold text-[#900000]">
            Loading Devotee Profile...
          </p>
          <span className="text-xs text-stone-500 mt-1">
            Please wait a moment
          </span>
        </div>
      </div>
    );
  }

  // Styles mirroring the Volunteer Registration Form
  const volunteerInputClass =
    "w-full px-4 py-2.5 text-sm bg-stone-50/50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#900000] focus:ring-2 focus:ring-[#900000]/10 outline-none transition-all";

  const volunteerSelectClass =
    "w-full px-3.5 py-2.5 text-sm bg-stone-50/50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:border-[#900000] focus:ring-2 focus:ring-[#900000]/10 outline-none transition-all cursor-pointer";

  const volunteerLabelClass =
    "block text-xs font-semibold text-stone-700 tracking-wide mb-1.5";

  const fullName =
    `${formState.firstName || ""} ${formState.lastName || ""}`.trim() ||
    "Devotee";

  return (
    <div className="w-full bg-[#faf7f2] min-h-screen py-8 sm:py-12 px-4 sm:px-6 antialiased">
      <div className="max-w-4xl mx-auto">
        {/* Top Floating Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-[#900000] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-[#900000] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg.text && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold shadow-sm animate-in fade-in duration-200 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-red-50 text-red-900 border-red-200"
            }`}
          >
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {isError && (
          <div className="mb-6 p-4 rounded-xl border bg-amber-50 text-amber-900 border-amber-200 flex items-center gap-3 text-sm font-semibold shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <span>{errorMessage || "Data fetch karne mein dikkat aayi."}</span>
          </div>
        )}

        {/* ================= MAIN VOLUNTEER-STYLE CARD CONTAINER ================= */}
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 border border-stone-200/80 p-6 sm:p-10 relative">
          {/* Volunteer-style Title & Ornate Decorative Flourish */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#900000] tracking-wide">
              {isEditMode
                ? "Update Devotee Profile"
                : "Devotee Profile Details"}
            </h1>
          </div>

          {/* VIEW MODE */}
          {!isEditMode && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Identity Banner */}
              <div className="bg-gradient-to-br from-[#faf6f0] via-[#f7f2ea] to-[#f4ede2] border border-amber-200/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                        {fullName}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-xs text-stone-600">
                      <span>
                        {formState.cityTypes}, {formState.stateTypes}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="bg-[#900000] hover:bg-[#7a0000] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-[#900000]/15 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                >
                  <SquarePen className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
              </div>

              {/* 1.1 Personal & Vedic Info Tiles */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#900000] mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Personal Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  <InfoTile
                    label="First Name"
                    value={formState.firstName}
                    icon={User}
                  />
                  <InfoTile
                    label="Last Name"
                    value={formState.lastName}
                    icon={User}
                  />
                  <InfoTile
                    label="Date of Birth"
                    value={formState.dob || "—"}
                    icon={CalendarIcon}
                  />
                  <InfoTile
                    label="Gothram"
                    value={formState.gotraName || "Not Specified"}
                    highlight
                  />
                  <InfoTile
                    label="Nakshatra"
                    value={formState.Nakshtra || "Not Specified"}
                    highlight
                  />
                  <InfoTile
                    label="Rashi"
                    value={formState.rashi || "Not Specified"}
                    highlight
                  />
                  {/* Household Indicator Toggle */}
                  <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/70 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Household Indicator
                    </span>
                    <div className="flex items-center justify-between">
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <ToggleSwitch
                        checked={formState.householdInd === "YES"}
                        disabled
                        label="Household Indicator"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/70 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Cumulative Indicator
                    </span>
                    <div className="flex items-center justify-end">
                      <ToggleSwitch
                        checked={formState.isCumulativeInd === "YES"}
                        disabled
                        label="Company Cumulative Indicator"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 1.2 Contact & Address Info Tiles */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#900000] mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Contact & Residence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <InfoTile
                    label="Verified Email"
                    value={formState.email}
                    icon={Mail}
                  />
                  <InfoTile
                    label="Contact Phone"
                    value={formState.phone}
                    icon={Phone}
                  />
                  <div></div> {/* Grid alignment spacing */}
                  <div className="sm:col-span-2">
                    <InfoTile
                      label="Address Line 1"
                      value={formState.addressLine1}
                      icon={MapPin}
                    />
                  </div>
                  <div>
                    <InfoTile
                      label="Address Line 2"
                      value={formState.addressLine2}
                      icon={MapPin}
                    />
                  </div>
                  <div>
                    <InfoTile label="State" value={formState.stateTypes} />
                  </div>
                  <div>
                    <InfoTile label="City" value={formState.cityTypes} />
                  </div>
                  <div>
                    <InfoTile
                      label="Zip Code"
                      value={formState.zipCode}
                      icon={FileText}
                    />
                  </div>
                </div>
              </div>

              {/* 1.3 Spouse Details */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#900000] mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  Spouse Details
                </h3>
                {formState.spouseName ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    <InfoTile
                      label="Spouse Name"
                      value={formState.spouseName}
                    />
                    <InfoTile
                      label="Date of Birth"
                      value={formState.spouseDob || "—"}
                    />
                    <InfoTile
                      label="Spouse Nakshatra"
                      value={formState.spouseNakshtra || "Not Specified"}
                    />
                    <InfoTile
                      label="Spouse Rashi"
                      value={formState.spouseRashi || "Not Specified"}
                    />
                    {formState.spouseEmail && (
                      <InfoTile label="Email" value={formState.spouseEmail} />
                    )}
                    {formState.spousePhone && (
                      <InfoTile label="Phone" value={formState.spousePhone} />
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-500 italic">
                    No spouse details are available.
                  </div>
                )}
              </div>

              {/* 1.4 Company Details */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#900000] mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Company Details
                </h3>
                {formState.companyName ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <InfoTile
                      label="Company Name"
                      value={formState.companyName}
                    />
                    <InfoTile
                      label="Company Email"
                      value={formState.companyEmail || "—"}
                    />
                    <InfoTile
                      label="Company Phone"
                      value={formState.companyPhone || "—"}
                    />
                    <InfoTile
                      label="Website"
                      value={formState.website || "—"}
                    />
                    <InfoTile
                      label="Status"
                      value={formState.companyStatus || "ACTIVE"}
                    />
                    <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/70 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                        Cumulative Indicator
                      </span>
                      <div className="flex items-center justify-between">
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <ToggleSwitch
                          checked={formState.companyCumulativeInd === "YES"}
                          disabled
                          label="Company Cumulative Indicator"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-500 italic">
                    No corporate or business affiliation is on record.
                  </div>
                )}
              </div>

              {/* 1.5 Family Members */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#900000] mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  Family Members
                </h3>
                {formState.memberDetail.filter((m) => m.memberName.trim())
                  .length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {formState.memberDetail
                      .filter((m) => m.memberName.trim())
                      .map((member, i) => (
                        <div
                          key={member.id || i}
                          className="p-4 rounded-xl bg-gradient-to-b from-white to-stone-50/60 border border-stone-200/80 shadow-xs flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-500/15 text-[#900000] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-bold text-stone-900 truncate">
                                {member.memberName}
                              </h4>
                              {member.relationship && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200/80 text-stone-700 px-2 py-0.5 rounded-md">
                                  {member.relationship}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-stone-600">
                              <div>
                                <span className="text-[10px] text-stone-400 block uppercase">
                                  Nakshatra
                                </span>
                                <span className="font-semibold">
                                  {member.nakshatra || "Not Specified"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-400 block uppercase">
                                  DOB
                                </span>
                                <span className="font-semibold">
                                  {member.dob || "—"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-200/70">
                              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                                Cumulative Ind.
                              </span>
                              <ToggleSwitch
                                checked={member.isCumulativeInd === "YES"}
                                disabled
                                label={`${member.memberName} Cumulative Indicator`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-500 italic">
                    No family members have been added.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. EDIT MODE (CLEAN VOLUNTEER-STYLE FORM VIEW)                           */}

          {isEditMode && (
            <form
              onSubmit={handleSubmitSave}
              className="space-y-8 animate-in fade-in duration-300"
            >
              {/* SECTION: PERSONAL DETAILS */}
              <div className="space-y-4">
                <div className="border-b border-stone-200 pb-2">
                  <h2 className="text-base font-serif font-bold text-[#900000] tracking-wide">
                    Personal Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className={volunteerLabelClass}>First Name *</label>
                    <input
                      type="text"
                      required
                      value={formState.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="First Name"
                      className={volunteerInputClass}
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>
                      Last Name (Head of Household) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Last Name"
                      className={volunteerInputClass}
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>
                      Date Of Birth (MM/DD)
                    </label>
                    <MonthDayPicker
                      value={formState.dob}
                      onChange={(val) => handleInputChange("dob", val)}
                      className={volunteerInputClass}
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Gothram</label>
                    <select
                      value={formState.gotraName}
                      onChange={(e) =>
                        handleInputChange("gotraName", e.target.value)
                      }
                      className={volunteerSelectClass}
                    >
                      <option value="">Select Gothram</option>
                      {gotras.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Nakshatra</label>
                    <select
                      value={formState.Nakshtra}
                      onChange={(e) =>
                        handleInputChange("Nakshtra", e.target.value)
                      }
                      className={volunteerSelectClass}
                    >
                      <option value="">Select Nakshatra</option>
                      {nakshatras.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Rashi</label>
                    <select
                      value={formState.rashi}
                      onChange={(e) =>
                        handleInputChange("rashi", e.target.value)
                      }
                      className={volunteerSelectClass}
                    >
                      <option value="">Select Rashi</option>
                      {rashis.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={formState.email}
                      className="w-full px-4 py-2.5 text-sm bg-stone-100 border border-stone-200 rounded-lg text-stone-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Phone Number</label>
                    <input
                      type="tel"
                      disabled
                      value={formState.phone}
                      className="w-full px-4 py-2.5 text-sm bg-stone-100 border border-stone-200 rounded-lg text-stone-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Zip Code *</label>
                    <input
                      type="text"
                      value={formState.zipCode}
                      onChange={(e) =>
                        handleInputChange("zipCode", e.target.value)
                      }
                      placeholder="Zip Code"
                      className={volunteerInputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={volunteerLabelClass}>
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={formState.addressLine1}
                      onChange={(e) =>
                        handleInputChange("addressLine1", e.target.value)
                      }
                      placeholder="Address Line 1"
                      className={volunteerInputClass}
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formState.addressLine2}
                      onChange={(e) =>
                        handleInputChange("addressLine2", e.target.value)
                      }
                      placeholder="Apt, Suite, Unit"
                      className={volunteerInputClass}
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>State *</label>
                    <select
                      value={formState.stateTypes}
                      onChange={(e) =>
                        handleInputChange("stateTypes", e.target.value)
                      }
                      className={volunteerSelectClass}
                    >
                      <option value="">Select State</option>
                      {states.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>City</label>
                    <select
                      value={formState.cityTypes}
                      disabled={!formState.stateTypes || isCitiesLoading}
                      onChange={(e) =>
                        handleInputChange("cityTypes", e.target.value)
                      }
                      className={`${volunteerSelectClass} disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {!formState.stateTypes
                          ? "Select State First"
                          : isCitiesLoading
                            ? "Loading Cities..."
                            : "Select City"}
                      </option>
                      {cities.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: SPOUSE DETAILS */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-stone-200 pb-2">
                  <h2 className="text-base font-serif font-bold text-[#900000] tracking-wide">
                    Spouse Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className={volunteerLabelClass}>Spouse Name</label>
                    <input
                      type="text"
                      value={formState.spouseName}
                      onChange={(e) =>
                        handleInputChange("spouseName", e.target.value)
                      }
                      placeholder="Spouse Name"
                      className={volunteerInputClass}
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>
                      Spouse Date Of Birth (MM/DD)
                    </label>
                    <MonthDayPicker
                      value={formState.spouseDob}
                      onChange={(val) => handleInputChange("spouseDob", val)}
                      className={volunteerInputClass}
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>
                      Spouse Nakshatra
                    </label>
                    <select
                      value={formState.spouseNakshtra}
                      onChange={(e) =>
                        handleInputChange("spouseNakshtra", e.target.value)
                      }
                      className={volunteerSelectClass}
                    >
                      <option value="">Select Nakshatra</option>
                      {nakshatras.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Spouse Rashi</label>
                    <select
                      value={formState.spouseRashi}
                      onChange={(e) =>
                        handleInputChange("spouseRashi", e.target.value)
                      }
                      className={volunteerSelectClass}
                    >
                      <option value="">Select Rashi</option>
                      {rashis.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Spouse Email</label>
                    <input
                      type="email"
                      value={formState.spouseEmail}
                      onChange={(e) =>
                        handleInputChange("spouseEmail", e.target.value)
                      }
                      placeholder="Spouse Email"
                      className={volunteerInputClass}
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Spouse Phone</label>
                    <input
                      type="tel"
                      value={formState.spousePhone}
                      onChange={(e) =>
                        handleInputChange("spousePhone", e.target.value)
                      }
                      placeholder="Spouse Phone"
                      className={volunteerInputClass}
                    />
                  </div>
                </div>

                {/* Toggles & Checkbox */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
                    <span className="text-xs font-semibold text-stone-700">
                      Household Indicator
                    </span>
                    <ToggleSwitch
                      checked={formState.householdInd === "YES"}
                      onChange={(nextVal) =>
                        handleInputChange(
                          "householdInd",
                          nextVal ? "YES" : "NO",
                        )
                      }
                      label="Household Indicator"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
                    <span className="text-xs font-semibold text-stone-700">
                      Cumulative Indicator
                    </span>
                    <ToggleSwitch
                      checked={formState.isCumulativeInd === "YES"}
                      disabled={!formState.spouseEmail?.trim()}
                      disabledHint={
                        !formState.spouseEmail?.trim()
                          ? "Enter Spouse Email to enable"
                          : ""
                      }
                      onChange={(nextVal) =>
                        handleInputChange(
                          "isCumulativeInd",
                          nextVal ? "YES" : "NO",
                        )
                      }
                      label="Spouse Cumulative Indicator"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-700 select-none">
                    <input
                      type="checkbox"
                      checked={formState.newsletterEmail}
                      onChange={(e) =>
                        handleInputChange("newsletterEmail", e.target.checked)
                      }
                      className="rounded border-stone-300 text-[#900000] focus:ring-[#900000] w-4 h-4 cursor-pointer"
                    />
                    <span>
                      Do you want to receive temple newsletter and
                      communications on Email?
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION: COMPANY DETAILS */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-stone-200 pb-2">
                  <h2 className="text-base font-serif font-bold text-[#900000] tracking-wide">
                    Company Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-start">
                  <div>
                    <label className={volunteerLabelClass}>Company Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formState.companyEmail}
                        onChange={(e) => {
                          if (isCompanyLocked) setIsCompanyLocked(false);
                          handleInputChange("companyEmail", e.target.value);
                        }}
                        onBlur={handleCompanyEmailBlur}
                        placeholder="Company Email"
                        className={`${volunteerInputClass} ${isCheckingCompany ? "pr-9" : ""}`}
                      />
                      {isCheckingCompany && (
                        <Loader2 className="w-4 h-4 animate-spin text-[#900000] absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Company Phone</label>
                    <input
                      type="tel"
                      disabled={isCompanyLocked}
                      value={formState.companyPhone}
                      onChange={(e) =>
                        handleInputChange("companyPhone", e.target.value)
                      }
                      placeholder="Company Phone"
                      className={
                        isCompanyLocked
                          ? "w-full px-4 py-2.5 text-sm bg-stone-100 border border-stone-200 rounded-lg text-stone-500 cursor-not-allowed"
                          : volunteerInputClass
                      }
                    />
                  </div>

                  <div>
                    <label className={volunteerLabelClass}>Company Name</label>
                    <input
                      type="text"
                      disabled={isCompanyLocked}
                      value={formState.companyName}
                      onChange={(e) =>
                        handleInputChange("companyName", e.target.value)
                      }
                      placeholder="Company Name"
                      className={
                        isCompanyLocked
                          ? "w-full px-4 py-2.5 text-sm bg-stone-100 border border-stone-200 rounded-lg text-stone-500 cursor-not-allowed"
                          : volunteerInputClass
                      }
                    />
                  </div>
                  <div>
                    <label className={volunteerLabelClass}>
                      Company Website
                    </label>
                    <input
                      type="text"
                      value={formState.website}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      placeholder="https://..."
                      className={volunteerInputClass}
                    />
                  </div>
                  <div>
                    <label className={volunteerLabelClass}>
                      Company Status
                    </label>
                    <select
                      value={formState.companyStatus}
                      onChange={(e) =>
                        handleInputChange("companyStatus", e.target.value)
                      }
                      className={volunteerSelectClass}
                    >
                      {COMPANY_STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* 2nd Row, 3rd Column: Cumulative Indicator
                  <div className="flex items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                    <div>
                      <span className="text-xs font-semibold text-stone-700 block leading-tight">
                        Cumulative Indicator
                      </span>
                      {!formState.companyEmail?.trim() && (
                        <span className="text-[10px] font-medium text-amber-700 block mt-0.5">
                          Enter Company Email to enable
                        </span>
                      )}
                    </div>
                    <ToggleSwitch
                      checked={formState.companyCumulativeInd === "YES"}
                      disabled={!formState.companyEmail?.trim()}
                      onChange={(nextVal) =>
                        handleInputChange(
                          "companyCumulativeInd",
                          nextVal ? "YES" : "NO",
                        )
                      }
                      label="Company Cumulative Indicator"
                    />
                  </div> */}
                  {/* 2nd Row, 3rd Column: Cumulative Indicator (Exact same baseline as inputs) */}
                  <div>
                    <span
                      aria-hidden="true"
                      className={`${volunteerLabelClass} invisible hidden md:block`}
                    >
                      Indicator
                    </span>
                    <div className="flex items-center justify-between gap-2 px-4 h-[42px] bg-stone-50/50 rounded-lg border border-stone-200">
                      <span className="text-xs font-semibold text-stone-700 whitespace-nowrap">
                        Cumulative Indicator
                      </span>
                      <ToggleSwitch
                        checked={formState.companyCumulativeInd === "YES"}
                        disabled={!formState.companyEmail?.trim()}
                        onChange={(nextVal) =>
                          handleInputChange(
                            "companyCumulativeInd",
                            nextVal ? "YES" : "NO",
                          )
                        }
                        label="Company Cumulative Indicator"
                      />
                    </div>
                    {!formState.companyEmail?.trim() && (
                      <p className="text-[11px] font-medium text-amber-700 mt-1">
                        Enter Company Email to enable
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION: FAMILY MEMBERS */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                  <h2 className="text-base font-serif font-bold text-[#900000] tracking-wide">
                    Family Members Details
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddFamilyMember}
                    className="text-[#900000] hover:text-[#7a0000] text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formState.memberDetail.map((member, idx) => (
                    <div
                      key={member.id}
                      className="p-4 sm:p-5 rounded-xl border border-stone-200 bg-stone-50/50 relative"
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200/70">
                        <span className="text-xs font-bold text-stone-700">
                          Family Member #{idx + 1}
                        </span>
                        {formState.memberDetail.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFamilyMember(member.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className={volunteerLabelClass}>Name</label>
                          <input
                            type="text"
                            value={member.memberName}
                            onChange={(e) =>
                              handleFamilyMemberChange(
                                member.id,
                                "memberName",
                                e.target.value,
                              )
                            }
                            placeholder="Name"
                            className={volunteerInputClass}
                          />
                        </div>

                        <div>
                          <label className={volunteerLabelClass}>
                            Date of Birth (MM/DD)
                          </label>
                          <MonthDayPicker
                            value={member.dob}
                            onChange={(val) =>
                              handleFamilyMemberChange(member.id, "dob", val)
                            }
                            className={volunteerInputClass}
                          />
                        </div>

                        <div>
                          <label className={volunteerLabelClass}>
                            Nakshatra
                          </label>
                          <select
                            value={member.nakshatra}
                            onChange={(e) =>
                              handleFamilyMemberChange(
                                member.id,
                                "nakshatra",
                                e.target.value,
                              )
                            }
                            className={volunteerSelectClass}
                          >
                            <option value="">Select Nakshatra</option>
                            {nakshatras.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={volunteerLabelClass}>
                            Relationship
                          </label>
                          <select
                            value={member.relationship}
                            onChange={(e) =>
                              handleFamilyMemberChange(
                                member.id,
                                "relationship",
                                e.target.value,
                              )
                            }
                            className={volunteerSelectClass}
                          >
                            <option value="">Select</option>
                            {RELATIONSHIP_OPTIONS.map((rel) => (
                              <option key={rel} value={rel}>
                                {rel}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Second Row inside Family Member Card: Email + Cumulative Indicator */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-stone-200/60 items-start">
                        <div>
                          <label className={volunteerLabelClass}>
                            Member Email
                          </label>
                          <input
                            type="email"
                            value={member.member_email || ""}
                            onChange={(e) =>
                              handleFamilyMemberChange(
                                member.id,
                                "member_email",
                                e.target.value,
                              )
                            }
                            placeholder="Member Email"
                            className={volunteerInputClass}
                          />
                        </div>
                        {/* <div className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-stone-200/80">
                          <div>
                            <span className="text-xs font-semibold text-stone-700 block leading-tight">
                              Cumulative Indicator
                            </span>
                            {!member.member_email?.trim() && (
                              <span className="text-[10px] font-medium text-amber-700 block mt-0.5">
                                Enter Member Email to enable
                              </span>
                            )}
                          </div>
                          <ToggleSwitch
                            checked={member.isCumulativeInd === "YES"}
                            disabled={!member.member_email?.trim()}
                            onChange={(nextVal) =>
                              handleFamilyMemberChange(
                                member.id,
                                "isCumulativeInd",
                                nextVal ? "YES" : "NO",
                              )
                            }
                            label={`Family Member ${idx + 1} Cumulative Indicator`}
                          />
                        </div> */}
                        <div>
                          <span
                            aria-hidden="true"
                            className={`${volunteerLabelClass} invisible hidden sm:block`}
                          >
                            Indicator
                          </span>
                          <div className="flex items-center justify-between gap-2 px-4 h-[42px] bg-white rounded-lg border border-stone-200">
                            <span className="text-xs font-semibold text-stone-700">
                              Cumulative Indicator
                            </span>
                            <ToggleSwitch
                              checked={member.isCumulativeInd === "YES"}
                              disabled={!member.member_email?.trim()}
                              onChange={(nextVal) =>
                                handleFamilyMemberChange(
                                  member.id,
                                  "isCumulativeInd",
                                  nextVal ? "YES" : "NO",
                                )
                              }
                              label={`Family Member ${idx + 1} Cumulative Indicator`}
                            />
                          </div>
                          {!member.member_email?.trim() && (
                            <p className="text-[11px] font-medium text-amber-700 mt-1">
                              Enter Member Email to enable
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION FOOTER BUTTONS */}
              <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto min-w-[160px] bg-[#900000] hover:bg-[#7a0000] text-white font-serif font-bold text-sm px-8 py-3 rounded-lg shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  disabled={isSaving}
                  className="w-full sm:w-auto min-w-[120px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ================= FLOATING BOTTOM-RIGHT ACTION PILL ================= */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-white/95 backdrop-blur-md p-2 rounded-full shadow-2xl shadow-stone-900/20 border border-stone-200/90">
        {!isEditMode ? (
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className="bg-[#900000] hover:bg-[#7a0000] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-md flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <SquarePen className="w-4 h-4" />
            <span>Edit Details</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={isSaving}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-colors cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitSave}
              disabled={isSaving}
              className="bg-[#900000] hover:bg-[#7a0000] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-md flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* ================= CANCEL CONFIRMATION MODAL ================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-stone-900 mb-1">
              Do you want to cancel the changes?
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Aapke dwara kiye gaye badlav save nahi honge aur pichla data
              barkarar rahega.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 bg-[#900000] hover:bg-[#7a0000] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Yes, Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPANY NOT REGISTERED MODAL ================= */}
      {showCompanyNotFoundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-800 mb-5 leading-snug">
              This company domain is not registered with HTKY.
            </h3>
            <button
              type="button"
              onClick={handleConfirmCompanyNotFound}
              className="min-w-[100px] bg-[#900000] hover:bg-[#7a0000] text-white text-xs sm:text-sm font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Reusable clean Info Tile for View Mode (No disabled input boxes).
 */
const InfoTile = ({ label, value, icon: Icon, highlight = false }) => {
  return (
    <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/70 transition-all hover:bg-white hover:shadow-xs">
      <div className="flex items-center justify-between text-stone-400 mb-1">
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-stone-400" />}
      </div>
      <p
        className={`text-xs sm:text-sm font-semibold truncate ${
          highlight ? "text-[#900000]" : "text-stone-800"
        }`}
        title={typeof value === "string" ? value : ""}
      >
        {value || "—"}
      </p>
    </div>
  );
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Lightweight MM/DD Calendar Picker (No Year, zero external dependencies).
 */
const MonthDayPicker = ({
  value,
  onChange,
  placeholder = "MM/DD",
  className,
}) => {
  const [open, setOpen] = useState(false);

  const initialMonth = (() => {
    if (value && value.includes("/")) {
      const m = parseInt(value.split("/")[0], 10);
      if (!Number.isNaN(m) && m >= 1 && m <= 12) return m - 1;
    }
    return 0;
  })();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const selectedDay =
    value && value.includes("/") ? parseInt(value.split("/")[1], 10) : null;
  const selectedMonthNum =
    value && value.includes("/") ? parseInt(value.split("/")[0], 10) - 1 : null;

  const handleSelectDay = (day) => {
    const mm = String(selectedMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${mm}/${dd}`);
    setOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setSelectedMonth(now.getMonth());
    onChange(`${mm}/${dd}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div
        onClick={() => {
          if (!open) setSelectedMonth(initialMonth);
          setOpen((prev) => !prev);
        }}
        className="relative cursor-pointer"
      >
        <input
          type="text"
          readOnly
          placeholder={placeholder}
          value={value || ""}
          className={`${className} cursor-pointer pr-10`}
        />
        <CalendarIcon className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-white border border-stone-300 rounded-xl shadow-2xl p-2.5 text-xs">
            {/* Maroon Header (Month only - No Year) */}
            <div className="bg-[#900000] text-white px-2 py-1.5 rounded-lg flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setSelectedMonth((m) => (m + 11) % 12)}
                className="w-6 h-6 rounded bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold cursor-pointer"
                aria-label="Previous Month"
              >
                ◀
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white text-stone-900 font-bold text-xs px-2.5 py-1 rounded outline-none cursor-pointer"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setSelectedMonth((m) => (m + 1) % 12)}
                className="w-6 h-6 rounded bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold cursor-pointer"
                aria-label="Next Month"
              >
                ▶
              </button>
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from(
                { length: DAYS_IN_MONTH[selectedMonth] },
                (_, i) => i + 1,
              ).map((day) => {
                const isSelected =
                  selectedMonthNum === selectedMonth && selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-stone-950 ring-1 ring-[#900000]"
                        : "bg-[#900000] text-white hover:bg-[#700000]"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer: Today & Done */}
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleToday}
                className="bg-stone-500 hover:bg-stone-600 text-white text-[11px] font-bold px-3 py-1 rounded cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-[#900000] hover:bg-[#700000] text-white text-[11px] font-bold px-3 py-1 rounded cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Accessible sliding track-and-thumb Toggle Switch (YES / NO).
 */
const ToggleSwitch = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  disabledHint = "",
}) => {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`text-[11px] font-bold tracking-wide ${
            checked ? "text-emerald-700" : "text-stone-500"
          }`}
        >
          {checked ? "YES" : "NO"}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => {
            if (!disabled && typeof onChange === "function") {
              onChange(!checked);
            }
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#900000]/20 ${
            disabled
              ? "cursor-not-allowed opacity-50 bg-stone-300"
              : "cursor-pointer"
          } ${
            !disabled && checked
              ? "bg-emerald-600"
              : !disabled
                ? "bg-stone-300"
                : ""
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {disabledHint && (
        <span className="text-[10px] font-medium text-amber-700">
          {disabledHint}
        </span>
      )}
    </div>
  );
};

export default UserProfile;
