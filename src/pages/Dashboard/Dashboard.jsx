/**
 * @file src/pages/Dashboard/Dashboard.jsx
 * @description Pure Presentational View for the Devotee Dashboard.
 * Consumes pre-normalized server state exclusively from `useDashboard` hook
 * with zero inline business logic or direct API/store coupling.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useDashboard } from "../../hooks/queries/Dashboard/useDashboard";
import { APP_COLORS } from "../../constants/appColors";
import membershipImage from "../../assets/membership.png";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { membership, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-sm animate-pulse space-y-6"
        aria-busy="true"
        aria-label="Loading Devotee Dashboard"
      >
        <div className="h-6 bg-stone-200 rounded w-2/3" />
        <div className="h-12 bg-emerald-50 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="h-44 bg-stone-100 rounded-xl" />
          <div className="md:col-span-2 h-44 bg-stone-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <section
        aria-labelledby="dashboard-greeting-heading"
        className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 sm:p-7 space-y-5"
      >
        {/* Welcome Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <h1
            id="dashboard-greeting-heading"
            className="text-lg sm:text-xl md:text-xl font-serif font-bold tracking-wide"
            style={{ color: APP_COLORS.primary }}
          >
            Namaskaram {membership.fullName}, Welcome To The Devotee Dashboard
          </h1>
        </div>

        {/* Non-Blocking API Fallback Alert */}
        {isError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Unable to refresh latest membership details. Showing cached
              session info.
            </span>
          </div>
        )}

        {/* Lifetime Membership Accumulated Banner */}
        <div
          role="status"
          aria-live="polite"
          className="w-full rounded-xl bg-emerald-100/90 border border-emerald-200 px-4 py-3 flex items-center justify-center gap-2.5 text-center shadow-2xs"
        >
          <img
            src={membershipImage}
            alt="Lifetime Membership Medal"
            className="w-6 h-6 object-contain shrink-0"
          />
          <p className="text-xs sm:text-sm font-bold text-[#900000]">
            Your total transactions accumulated towards Lifetime Membership with
            HTKY so far is
            <span className="font-extrabold">
              $ {membership.accumulatedAmount}
            </span>
          </p>
        </div>

        {/* Membership Details Card */}
        <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-[#fdfbf8] to-[#f8f4ec] p-5 sm:p-7 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Column: Membership Medal Badge */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center md:border-r md:border-stone-200/80 md:pr-6">
              <div className="flex items-center justify-center mb-3">
                <img
                  src={membershipImage}
                  alt={membership.membershipName}
                  className="w-20 h-20 object-contain mb-3 drop-shadow-xs"
                />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-800 uppercase tracking-wide leading-snug">
                {membership.membershipName}
              </h2>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-1">
                {membership.membershipType}
              </span>
            </div>

            {/* Right Column: Membership Status Table & Renew CTA */}
            <div className="md:col-span-8 space-y-4">
              <div className="divide-y divide-stone-200/80 border-t border-b border-stone-200/80 text-xs sm:text-sm">
                <div className="py-3 px-2 flex items-center justify-between gap-4">
                  <span className="font-bold text-stone-700">
                    Membership Status
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider text-white shadow-2xs ${
                      membership.isActive ? "bg-emerald-600" : "bg-amber-600"
                    }`}
                  >
                    {membership.membershipStatus}
                  </span>
                </div>

                <div className="py-3 px-2 flex items-center justify-between gap-4">
                  <span className="font-bold text-stone-700">
                    Membership Start Date
                  </span>
                  <span className="font-semibold text-stone-800">
                    {membership.membershipStartDate}
                  </span>
                </div>

                <div className="py-3 px-2 flex items-center justify-between gap-4">
                  <span className="font-bold text-stone-700">
                    Membership Expiry Date
                  </span>
                  <span className="font-semibold text-stone-800">
                    {membership.memberShipExpiryDate}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex justify-center md:justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/membership")}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
                >
                  {membership.isActive ? "UPGRADE / RENEW" : "RENEW NOW"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
