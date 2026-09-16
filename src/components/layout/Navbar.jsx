/**
 * @file src/components/layout/Navbar.jsx
 * @description Dynamic Navigation Bar component driven by the useGetNavMenu hook
 * and synchronized reactively with the global Zustand cart store (useCartStore).
 * Resolves path collisions for General Donation routes and connects interactive cart triggers.
 */

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useGetNavMenu } from "../../hooks/queries/useGetNavMenu";
import { APP_COLORS } from "../../constants/appColors";
import { APP_FONTS } from "../../constants/appTheme";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";

/**
 * Resolves canonical route destinations for dynamic menu items.
 * Neutralizes dead-hash '#' collisions for unconfigured backend items.
 *
 * @param {Object} item - Menu item configuration from Master Data
 * @returns {string} Sanitized destination URL path
 */
const resolveSafePath = (item) => {
  if (!item) return "/";

  const title = (item.title || "").trim().toUpperCase();

  // Canonical fallback mappings for Donation sub-items
  if (title === "GENERAL DONATION" || title === "GENERAL DONATIONS") {
    return item.path && item.path !== "/" ? item.path : "/donations/general";
  }
  if (title === "RECURRING DONATION" || title === "RECURRING DONATIONS") {
    return item.path && item.path !== "/" ? item.path : "/donations/recurring";
  }

  const isHome = title === "HOME";
  const rawPath = item.path || "/";

  if (rawPath === "/" && !isHome) {
    return `#${item.id || item._id || "menu"}`;
  }

  return rawPath;
};

export const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Reactive Cart Badge Subscription (Atomic Selector)
  const totalCartCount = useCartStore((state) => state.totalCount);

  // Dynamic Menu Query
  const { data: navItems, isLoading } = useGetNavMenu();

  const toggleMobileDropdown = (id) => {
    setOpenDropdownId((prevId) => (prevId === id ? null : id));
  };

  if (isLoading) {
    return (
      <nav
        className="w-full px-4 md:px-8 py-3 shadow-md"
        style={{
          backgroundColor: APP_COLORS.primary,
          color: APP_COLORS.textInverse,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between md:justify-center space-x-6 animate-pulse">
          <div className="h-5 w-16 bg-white/20 rounded"></div>
          <div className="h-5 w-20 bg-white/20 rounded hidden md:block"></div>
          <div className="h-5 w-24 bg-white/20 rounded hidden md:block"></div>
          <div className="h-5 w-20 bg-white/20 rounded hidden md:block"></div>
          <div className="h-5 w-28 bg-white/20 rounded hidden md:block"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="w-full shadow-md sticky top-0 z-50 border-t border-yellow-600/30"
      style={{
        backgroundColor: APP_COLORS.primary,
        color: APP_COLORS.textInverse,
        fontFamily: APP_FONTS.body,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between md:justify-center h-12">
          {/* Mobile View: Menu Toggle Button */}
          <div className="flex items-center md:hidden w-full justify-between">
            <button
              onClick={() => setIsMobileOpen((prev) => !prev)}
              className="p-1.5 rounded-md hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors cursor-pointer"
              style={{ color: APP_COLORS.textInverse }}
              aria-label="Toggle Navigation Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop View: Horizontal Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-3 text-xs lg:text-sm font-semibold tracking-wide">
            {navItems?.map((item) => {
              const hasSubMenu =
                Array.isArray(item?.subMenu) && item.subMenu.length > 0;

              const safePath = resolveSafePath(item);

              return (
                <div key={item.id} className="relative group">
                  <NavLink
                    to={safePath}
                    end
                    className="px-3 py-3 transition-opacity duration-200 flex items-center space-x-1 uppercase tracking-wider hover:opacity-80"
                    style={({ isActive }) => {
                      const active = isActive && !safePath.startsWith("#");
                      return {
                        color: active
                          ? APP_COLORS.secondary
                          : APP_COLORS.textInverse,
                        borderBottom: active
                          ? `2px solid ${APP_COLORS.secondary}`
                          : "2px solid transparent",
                      };
                    }}
                  >
                    <span>{item.title}</span>
                    {hasSubMenu && (
                      <svg
                        className="w-3.5 h-3.5 ml-0.5 group-hover:rotate-180 transition-transform duration-200"
                        style={{ color: APP_COLORS.secondary }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </NavLink>

                  {/* Desktop Submenu / Dropdown */}
                  {hasSubMenu && (
                    <div
                      className="absolute left-0 top-full hidden group-hover:block w-48 shadow-xl rounded-b-md overflow-hidden z-50 border-t-2"
                      style={{
                        backgroundColor: APP_COLORS.surfaceDark,
                        color: APP_COLORS.textInverse,
                        borderColor: APP_COLORS.secondary,
                      }}
                    >
                      {item.subMenu.map((sub) => {
                        const safeSubPath = resolveSafePath(sub);

                        return (
                          <NavLink
                            key={sub.id}
                            to={safeSubPath}
                            end
                            className="block px-4 py-2.5 text-xs transition-colors uppercase tracking-wider hover:bg-black/20"
                            style={({ isActive }) => {
                              const active =
                                isActive && !safeSubPath.startsWith("#");
                              return {
                                color: active
                                  ? APP_COLORS.secondary
                                  : APP_COLORS.textInverse,
                                fontWeight: active ? "bold" : "normal",
                                backgroundColor: active
                                  ? "rgba(0,0,0,0.3)"
                                  : "transparent",
                              };
                            }}
                          >
                            {sub.title}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Desktop Cart Action Trigger with Reactive Zustand Count */}
            <NavLink
              to="/donations/general"
              className="flex items-center ml-2 lg:ml-6 pl-2 lg:pl-4 border-l border-white/30 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: APP_COLORS.textInverse }}
              aria-label={`Donation Cart containing ${totalCartCount} items`}
            >
              <ShoppingCart
                className="w-5 h-5 lg:w-6 lg:h-6"
                strokeWidth={2.5}
              />
              <span className="ml-1.5 text-lg lg:text-xl font-bold">
                {totalCartCount}
              </span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mobile View: Collapsible Drawer Content */}
      {isMobileOpen && (
        <div
          className="md:hidden border-t px-4 pt-2 pb-4 space-y-1"
          style={{
            backgroundColor: APP_COLORS.surfaceDark,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          {navItems?.map((item) => {
            const hasSubMenu =
              Array.isArray(item?.subMenu) && item.subMenu.length > 0;
            const isSubMenuOpen = openDropdownId === item.id;
            const safePath = resolveSafePath(item);

            return (
              <div
                key={item.id}
                className="border-b border-white/10 last:border-none"
              >
                <div className="flex items-center justify-between py-2">
                  <NavLink
                    to={safePath}
                    end
                    onClick={() => setIsMobileOpen(false)}
                    className="text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
                    style={({ isActive }) => {
                      const active = isActive && !safePath.startsWith("#");
                      return {
                        color: active
                          ? APP_COLORS.secondary
                          : APP_COLORS.textInverse,
                        fontWeight: active ? "bold" : "600",
                      };
                    }}
                  >
                    {item.title}
                  </NavLink>

                  {hasSubMenu && (
                    <button
                      onClick={() => toggleMobileDropdown(item.id)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                      style={{ color: APP_COLORS.secondary }}
                      aria-label={`Toggle ${item.title} submenu`}
                    >
                      <svg
                        className={`w-4 h-4 transform transition-transform duration-200 ${
                          isSubMenuOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Mobile Submenu Accordion */}
                {hasSubMenu && isSubMenuOpen && (
                  <div className="pl-4 pb-2 space-y-1 bg-black/20 rounded my-1">
                    {item.subMenu.map((sub) => {
                      const safeSubPath = resolveSafePath(sub);

                      return (
                        <NavLink
                          key={sub.id}
                          to={safeSubPath}
                          end
                          onClick={() => setIsMobileOpen(false)}
                          className="block py-1.5 text-[11px] uppercase tracking-wider transition-opacity hover:opacity-80"
                          style={({ isActive }) => {
                            const active =
                              isActive && !safeSubPath.startsWith("#");
                            return {
                              color: active
                                ? APP_COLORS.secondary
                                : "rgba(255,255,255,0.7)",
                              fontWeight: active ? "bold" : "normal",
                            };
                          }}
                        >
                          {sub.title}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Mobile Cart Action Trigger */}
          <NavLink
            to="/donations/general"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center justify-between py-2 cursor-pointer hover:opacity-80 border-t border-white/10 mt-2"
            aria-label={`Donation Cart containing ${totalCartCount} items`}
          >
            <div className="flex items-center space-x-2">
              <ShoppingCart
                className="w-5 h-5"
                strokeWidth={2.5}
                style={{ color: APP_COLORS.secondary }}
              />
              <span
                className="text-xs uppercase tracking-wider font-bold"
                style={{ color: APP_COLORS.secondary }}
              >
                MY CART
              </span>
            </div>
            <span
              className="font-bold text-lg"
              style={{ color: APP_COLORS.textInverse }}
            >
              {totalCartCount}
            </span>
          </NavLink>
        </div>
      )}
    </nav>
  );
};
