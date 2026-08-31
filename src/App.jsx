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

// FOOTER
const ContactUsPage = lazy(() =>
  import("./components/layout/Footer/ContactUs").then((module) => ({
    default: module.ContactUs,
  })),
);
const CopyrightPage = lazy(() =>
  import("./components/layout/Footer/Copyright").then((module) => ({
    default: module.Copyright,
  })),
);
const TermsOfUsePage = lazy(() =>
  import("./components/layout/Footer/TermsOfUse").then((module) => ({
    default: module.TermsOfUse,
  })),
);
const PrivacyPolicyPage = lazy(() =>
  import("./components/layout/Footer/PrivacyPolicy").then((module) => ({
    default: module.PrivacyPolicy,
  })),
);
const SecurityPage = lazy(() =>
  import("./components/layout/Footer/Security").then((module) => ({
    default: module.Security,
  })),
);

// EDUCATION
const AllClassesPage = lazy(() =>
  import("./pages/Education/AllClasses").then((module) => ({
    default: module.AllClasses,
  })),
);

// SEVA
const SeniorProgramPage = lazy(() =>
  import("./pages/Seva/SeniorProgram").then((module) => ({
    default: module.SeniorProgram,
  })),
);
const GriefSupportPage = lazy(() =>
  import("./pages/Seva/GriefSupport").then((module) => ({
    default: module.GriefSupport,
  })),
);
const LostFoundPage = lazy(() =>
  import("./pages/Seva/LostFound").then((module) => ({
    default: module.LostFound,
  })),
);

// ABOUT TEMPLE
const AboutTemplePage = lazy(() =>
  import("./pages/About/AboutTemple").then((module) => ({
    default: module.AboutTemple,
  })),
);
const AboutDeityPage = lazy(() =>
  import("./pages/About/AboutDeity").then((module) => ({
    default: module.AboutDeity,
  })),
);
const AboutPriestPage = lazy(() =>
  import("./pages/About/AboutPriest").then((module) => ({
    default: module.AboutPriest,
  })),
);
const AboutLandDonorsPage = lazy(() =>
  import("./pages/About/AboutLandDonors").then((module) => ({
    default: module.AboutLandDonors,
  })),
);
const AboutBoardCommitteePage = lazy(() =>
  import("./pages/About/AboutBoardCommittee").then((module) => ({
    default: module.AboutBoardCommittee,
  })),
);
const AboutEtiquetteVisitPage = lazy(() =>
  import("./pages/About/AboutEtiquetteVisits").then((module) => ({
    default: module.AboutEtiquetteVisit,
  })),
);
const AboutJainSanghPage = lazy(() =>
  import("./pages/About/AboutJainSangh").then((module) => ({
    default: module.AboutJainSangh,
  })),
);
const AboutShirdiSaiSatsangPage = lazy(() =>
  import("./pages/About/AboutShirdiSaiSatsang").then((module) => ({
    default: module.AboutShirdiSaiSatsang,
  })),
);

// 5. Modern Data Router Configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <GlobalErrorFallback />, // Ultimate crash protection here
    children: [
      // HOME PAGE
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

      // FOOTER
      {
        path: "contact-us",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <ContactUsPage />
          </Suspense>
        ),
      },
      {
        path: "copyright",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <CopyrightPage />
          </Suspense>
        ),
      },
      {
        path: "terms-of-use",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <TermsOfUsePage />
          </Suspense>
        ),
      },
      {
        path: "privacy-policy",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <PrivacyPolicyPage />
          </Suspense>
        ),
      },
      {
        path: "security",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <SecurityPage />
          </Suspense>
        ),
      },

      // EDUCATION
      {
        path: "all-classes",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AllClassesPage />
          </Suspense>
        ),
      },

      //SEVA
      {
        path: "senior-program",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <SeniorProgramPage />
          </Suspense>
        ),
      },
      {
        path: "grief-support",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <GriefSupportPage />
          </Suspense>
        ),
      },
      {
        path: "lost-found",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <LostFoundPage />
          </Suspense>
        ),
      },

      // ABOUT TEMPLE
      {
        path: "about-temple",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AboutTemplePage />
          </Suspense>
        ),
      },
      {
        path: "about-deities",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AboutDeityPage />
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
        path: "land-donors",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AboutLandDonorsPage />
          </Suspense>
        ),
      },
      {
        path: "board-committee-members",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AboutBoardCommitteePage />
          </Suspense>
        ),
      },
      {
        path: "etiquette-visits",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AboutEtiquetteVisitPage />
          </Suspense>
        ),
      },
      {
        path: "jain-sangh",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AboutJainSanghPage />
          </Suspense>
        ),
      },
      {
        path: "shirdi-sai-satsang",
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center animate-pulse">Loading...</div>
            }
          >
            <AboutShirdiSaiSatsangPage />
          </Suspense>
        ),
      },

      // NOT FOUND
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
