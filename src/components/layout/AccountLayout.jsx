import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, User, Home, Flame, HandHeart, Sparkles, CreditCard } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { APP_COLORS } from "../../constants/appColors";

const ACCOUNT_MENU_ITEMS = [
  {
    id: "dashboard",
    label: "Devotee Dashboard",
    path: "/account/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "puja-bookings",
    label: "My Puja Bookings",
    path: "/account/puja-bookings",
    icon: Flame,
  },
  {
    id: "donations",
    label: "My Donations",
    path: "/account/donations",
    icon: HandHeart,
  },
  {
    id: "sponsors",
    label: "My Sponsors",
    path: "/account/sponsors",
    icon: Sparkles,
  },
  {
    id: "payments",
    label: "My Payments",
    path: "/account/payments",
    icon: CreditCard,
  },
  {
    id: "profile",
    label: "My Profile",
    path: "/account/profile",
    icon: User,
  },
];

export const AccountLayout = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const displayName = user?.firstName || user?.name || "Devotee";

  return (
    <div className="w-full min-h-[80vh] bg-[#faf7f2] bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-cover bg-top bg-fixed py-6 px-3 sm:px-5 lg:px-6">
      <div className="w-full max-w-none flex flex-col md:flex-row gap-6 items-start">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden md:sticky md:top-16">
          {/* Welcome Header */}
          <div className="p-4 border-b border-stone-200/80 bg-[#fdfbf7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-white shadow-xs"
                style={{ backgroundColor: APP_COLORS.primary }}
              >
                {displayName[0]?.toUpperCase() || "D"}
              </div>
              <div>
                <span className="text-[11px] font-medium text-stone-500 block">
                  Welcome!
                </span>
                <span className="text-sm font-bold text-stone-900">
                  {displayName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              title="Return to Home"
              className="p-2 rounded-lg text-stone-500 hover:text-[#900000] hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links (Responsive: Horizontal scroll on mobile, Vertical stack on desktop) */}
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 gap-1.5">
            {ACCOUNT_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-[#900000] text-white shadow-sm"
                        : "text-stone-700 hover:bg-stone-100 hover:text-[#900000]"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* ================= RIGHT CONTENT AREA ================= */}
        <section className="flex-1 w-full min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
};
