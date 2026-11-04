import { Plus, X } from "lucide-react";

export const FamilySankalpamForm = ({
  formData,
  errors,
  gotras = [],
  nakshatras = [],
  isLoading = false,
  updateField,
  addFamilyMember,
  removeFamilyMember,
  updateFamilyMember,
}) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
        Loading devotee profile and spiritual details...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Devotee Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.firstName || ""}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="Primary Devotee First Name"
            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#900000] ${
              errors?.firstName ? "border-red-400" : "border-gray-200"
            }`}
          />
          {errors?.firstName && (
            <p className="text-[10px] text-red-500 mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.lastName || ""}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Family Last Name"
            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#900000] ${
              errors?.lastName ? "border-red-400" : "border-gray-200"
            }`}
          />
          {errors?.lastName && (
            <p className="text-[10px] text-red-500 mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Gothram & Nakshatra */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Gothram <span className="text-red-500">*</span>
          </label>
          {gotras.length > 0 ? (
            <select
              value={formData.gothram || ""}
              onChange={(e) => updateField("gothram", e.target.value)}
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#900000] ${
                errors?.gothram ? "border-red-400" : "border-gray-200"
              }`}
            >
              <option value="">Select Gotra</option>
              {formData.gothram && !gotras.includes(formData.gothram) && (
                <option
                  key={`custom-gotra-${formData.gothram}`}
                  value={formData.gothram}
                >
                  {formData.gothram}
                </option>
              )}
              {gotras.map((g, index) => (
                <option key={`gotra-${g}-${index}`} value={g}>
                  {g}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.gothram || ""}
              onChange={(e) => updateField("gothram", e.target.value)}
              placeholder="Enter Gothram"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none"
            />
          )}
          {errors?.gothram && (
            <p className="text-[10px] text-red-500 mt-1">{errors.gothram}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Nakshatra <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.nakshatra || ""}
            onChange={(e) => updateField("nakshatra", e.target.value)}
            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#900000] ${
              errors?.nakshatra ? "border-red-400" : "border-gray-200"
            }`}
          >
            <option value="">Select Nakshatra</option>
            {formData.nakshatra && !nakshatras.includes(formData.nakshatra) && (
              <option
                key={`custom-nakshatra-${formData.nakshatra}`}
                value={formData.nakshatra}
              >
                {formData.nakshatra}
              </option>
            )}
            {nakshatras.map((n, index) => (
              <option key={`nakshatra-${n}-${index}`} value={n}>
                {n}
              </option>
            ))}
          </select>
          {errors?.nakshatra && (
            <p className="text-[10px] text-red-500 mt-1">{errors.nakshatra}</p>
          )}
        </div>
      </div>

      {/* Spouse Section */}
      <div className="pt-2 border-t border-gray-100">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(formData.noSpouse)}
            onChange={(e) => updateField("noSpouse", e.target.checked)}
            className="rounded text-[#900000] focus:ring-[#900000]"
          />
          No Spouse / Not Applicable
        </label>

        {!formData.noSpouse && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/60 mt-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Spouse Name
              </label>
              <input
                type="text"
                value={formData.spouseName || ""}
                onChange={(e) => updateField("spouseName", e.target.value)}
                placeholder="Spouse Name"
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-gray-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Spouse Nakshatra
              </label>
              <select
                value={formData.spouseNakshatra || ""}
                onChange={(e) => updateField("spouseNakshatra", e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-gray-200 outline-none"
              >
                <option value="">Select Nakshatra</option>
                {formData.spouseNakshatra &&
                  !nakshatras.includes(formData.spouseNakshatra) && (
                    <option
                      key={`custom-spouse-nakshatra-${formData.spouseNakshatra}`}
                      value={formData.spouseNakshatra}
                    >
                      {formData.spouseNakshatra}
                    </option>
                  )}
                {nakshatras.map((n, index) => (
                  <option key={`spouse-nakshatra-${n}-${index}`} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors?.spouseNakshatra && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.spouseNakshatra}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Other Family Members */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(formData.noFamilyMember)}
              onChange={(e) => updateField("noFamilyMember", e.target.checked)}
              className="rounded text-[#900000] focus:ring-[#900000]"
            />
            No Other Family Members
          </label>

          {!formData.noFamilyMember && (
            <button
              type="button"
              onClick={addFamilyMember}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#900000] hover:text-[#7a0000] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Member
            </button>
          )}
        </div>

        {!formData.noFamilyMember && formData.familyMembers?.length > 0 && (
          <div className="space-y-2 mt-3">
            {formData.familyMembers.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100"
              >
                <input
                  type="text"
                  value={member.name || ""}
                  onChange={(e) =>
                    updateFamilyMember(member.id, "name", e.target.value)
                  }
                  placeholder={`Member ${index + 1} Name`}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 bg-white focus:outline-none"
                />
                <select
                  value={member.nakshatra || ""}
                  onChange={(e) =>
                    updateFamilyMember(member.id, "nakshatra", e.target.value)
                  }
                  className="w-40 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 bg-white focus:outline-none"
                >
                  <option value="">Nakshatra</option>
                  {nakshatras.map((n, nIdx) => (
                    <option
                      key={`member-${member.id}-nakshatra-${n}-${nIdx}`}
                      value={n}
                    >
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeFamilyMember(member.id)}
                  className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
