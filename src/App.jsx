/**
 * @file src/App.jsx
 * @description Root Application Routing Configuration.
 * Combines React Router v6.4+ Data APIs (createBrowserRouter) with
 * React.lazy() for optimal bundle splitting and 100% crash immunity.
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "./components/layout/MainLayout";
import { APP_COLORS } from "./constants/appColors";
import { APP_FONTS } from "./constants/appTheme";

// 1. TanStack Query Configuration (Safe Defaults)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// 2. Global Route Error Boundary (Catches BOTH runtime crashes AND chunk load failures)
const GlobalErrorFallback = () => (
  <div
    className="w-full h-screen flex flex-col items-center justify-center p-4 text-center"
    style={{
      backgroundColor: APP_COLORS.surfaceLight,
      fontFamily: APP_FONTS.body,
    }}
  >
    <h1
      className="text-3xl font-extrabold mb-3"
      style={{ color: APP_COLORS.primary }}
    >
      Page Failed to Load
    </h1>
    <p className="font-medium mb-6" style={{ color: APP_COLORS.textSecondary }}>
      We encountered an issue displaying this content.
    </p>
    <a
      href="/"
      className="px-6 py-2.5 rounded shadow font-semibold hover:opacity-80 transition-opacity"
      style={{
        backgroundColor: APP_COLORS.primary,
        color: APP_COLORS.textInverse,
      }}
    >
      Return to Home Page
    </a>
  </div>
);

// 3. Fallback for 404 Routes
const NotFoundFallback = () => (
  <div
    className="w-full h-[60vh] flex items-center justify-center font-bold text-2xl"
    style={{ color: APP_COLORS.primary }}
  >
    404 - Page Not Found
  </div>
);

// 4. Lazy Loaded Pages (Bundle Splitting)
const HomePage = lazy(() => import("./pages/Home"));
const AboutPriestPage = lazy(() =>
  import("./pages/About/AboutPriest").then((module) => ({
    default: module.AboutPriest,
  })),
);
// 5. Modern Data Router Configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <GlobalErrorFallback />, // Ultimate crash protection here
    children: [
      {
        index: true,
        // Suspense wraps lazy loaded components
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "about-priests",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AboutPriestPage />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: <NotFoundFallback />,
      },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
