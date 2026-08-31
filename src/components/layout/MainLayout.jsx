/**
 * @file src/components/layout/MainLayout.jsx
 * @description Centralized SPA Layout Shell that encapsulates static site frames
 * dynamically swaps pages via React Router's Outlet.
 */

import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer/Footer";
import { APP_COLORS } from "../../constants/appColors";
import { APP_STRINGS } from "../../constants/appStrings";
import { APP_FONTS } from "../../constants/appTheme";

const PageLoadingFallback = () => (
  <div className="w-full h-64 flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-3">
      {/* Spinner mapped to APP_COLORS.primary */}
      <div
        className="w-10 h-10 border-4 rounded-full animate-spin"
        style={{
          borderColor: APP_COLORS.primary,
          borderTopColor: "transparent",
        }}
      ></div>
      <p
        className="text-xs font-semibold tracking-wider uppercase"
        style={{ color: APP_COLORS.primary, fontFamily: APP_FONTS.body }}
      >
        {APP_STRINGS.loadingContent || "Loading Page Content..."}
      </p>
    </div>
  </div>
);

export const MainLayout = () => {
  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased"
      style={{ fontFamily: APP_FONTS.body }}
    >
      {/* Dynamically injected style tag for pseudo-selectors (like ::selection)
        Ensures strict centralization without breaking inline-style limitations.
      */}
      <style>
        {`
          ::selection {
            background-color: ${APP_COLORS.primary};
            color: ${APP_COLORS.textInverse};
          }
          ::-moz-selection {
            background-color: ${APP_COLORS.primary};
            color: ${APP_COLORS.textInverse};
          }
        `}
      </style>
      <Header />
      <Navbar />
      {/* Dynamic Page Outlet Container */}
      <main className="flex-grow w-full">
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};
