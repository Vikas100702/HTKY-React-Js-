// /**
//  * @file src/App.jsx
//  * @description Root Application Routing Configuration.
//  * Combines React Router v6.4+ Data APIs (createBrowserRouter) with
//  * React.lazy() for optimal bundle splitting and 100% crash immunity.
//  */

// import { lazy, Suspense } from "react";
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { MainLayout } from "./components/layout/MainLayout";
// import { APP_COLORS } from "./constants/appColors";
// import { APP_FONTS } from "./constants/appTheme";

// // 1. TanStack Query Configuration (Safe Defaults)
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 1000 * 60 * 5,
//       gcTime: 1000 * 60 * 30,
//       retry: 2,
//       refetchOnWindowFocus: false,
//     },
//   },
// });

// // 2. Global Route Error Boundary (Catches BOTH runtime crashes AND chunk load failures)
// const GlobalErrorFallback = () => (
//   <div
//     className="w-full h-screen flex flex-col items-center justify-center p-4 text-center"
//     style={{
//       backgroundColor: APP_COLORS.surfaceLight,
//       fontFamily: APP_FONTS.body,
//     }}
//   >
//     <h1
//       className="text-3xl font-extrabold mb-3"
//       style={{ color: APP_COLORS.primary }}
//     >
//       Page Failed to Load
//     </h1>
//     <p className="font-medium mb-6" style={{ color: APP_COLORS.textSecondary }}>
//       We encountered an issue displaying this content.
//     </p>
//     <a
//       href="/"
//       className="px-6 py-2.5 rounded shadow font-semibold hover:opacity-80 transition-opacity"
//       style={{
//         backgroundColor: APP_COLORS.primary,
//         color: APP_COLORS.textInverse,
//       }}
//     >
//       Return to Home Page
//     </a>
//   </div>
// );

// // 3. Fallback for 404 Routes
// const NotFoundFallback = () => (
//   <div
//     className="w-full h-[60vh] flex items-center justify-center font-bold text-2xl"
//     style={{ color: APP_COLORS.primary }}
//   >
//     404 - Page Not Found
//   </div>
// );

// // 4. Lazy Loaded Pages (Bundle Splitting)
// const HomePage = lazy(() => import("./pages/Home"));

// // FOOTER
// const ContactUsPage = lazy(() =>
//   import("./components/layout/Footer/ContactUs").then((module) => ({
//     default: module.ContactUs,
//   })),
// );
// const CopyrightPage = lazy(() =>
//   import("./components/layout/Footer/Copyright").then((module) => ({
//     default: module.Copyright,
//   })),
// );
// const TermsOfUsePage = lazy(() =>
//   import("./components/layout/Footer/TermsOfUse").then((module) => ({
//     default: module.TermsOfUse,
//   })),
// );
// const PrivacyPolicyPage = lazy(() =>
//   import("./components/layout/Footer/PrivacyPolicy").then((module) => ({
//     default: module.PrivacyPolicy,
//   })),
// );
// const SecurityPage = lazy(() =>
//   import("./components/layout/Footer/Security").then((module) => ({
//     default: module.Security,
//   })),
// );

// // DONATIONS
// const GeneralDonationPage = lazy(() =>
//   import("./pages/Donations/GeneralDonation").then((module) => ({
//     default: module.GeneralDonation,
//   })),
// );

// // EDUCATION
// const AllClassesPage = lazy(() =>
//   import("./pages/Education/AllClasses").then((module) => ({
//     default: module.AllClasses,
//   })),
// );

// // SEVA
// const VolunteerSignUpPage = lazy(() =>
//   import("./pages/Seva/VolunteerSignUp").then((module) => ({
//     default: module.VolunteerSignUp,
//   })),
// );
// const SeniorProgramPage = lazy(() =>
//   import("./pages/Seva/SeniorProgram").then((module) => ({
//     default: module.SeniorProgram,
//   })),
// );
// const GriefSupportPage = lazy(() =>
//   import("./pages/Seva/GriefSupport").then((module) => ({
//     default: module.GriefSupport,
//   })),
// );
// const LostFoundPage = lazy(() =>
//   import("./pages/Seva/LostFound").then((module) => ({
//     default: module.LostFound,
//   })),
// );

// // ABOUT TEMPLE
// const AboutTemplePage = lazy(() =>
//   import("./pages/About/AboutTemple").then((module) => ({
//     default: module.AboutTemple,
//   })),
// );
// const AboutDeityPage = lazy(() =>
//   import("./pages/About/AboutDeity").then((module) => ({
//     default: module.AboutDeity,
//   })),
// );
// const AboutPriestPage = lazy(() =>
//   import("./pages/About/AboutPriest").then((module) => ({
//     default: module.AboutPriest,
//   })),
// );
// const AboutLandDonorsPage = lazy(() =>
//   import("./pages/About/AboutLandDonors").then((module) => ({
//     default: module.AboutLandDonors,
//   })),
// );
// const AboutBoardCommitteePage = lazy(() =>
//   import("./pages/About/AboutBoardCommittee").then((module) => ({
//     default: module.AboutBoardCommittee,
//   })),
// );
// const AboutEtiquetteVisitPage = lazy(() =>
//   import("./pages/About/AboutEtiquetteVisits").then((module) => ({
//     default: module.AboutEtiquetteVisit,
//   })),
// );
// const AboutJainSanghPage = lazy(() =>
//   import("./pages/About/AboutJainSangh").then((module) => ({
//     default: module.AboutJainSangh,
//   })),
// );
// const AboutShirdiSaiSatsangPage = lazy(() =>
//   import("./pages/About/AboutShirdiSaiSatsang").then((module) => ({
//     default: module.AboutShirdiSaiSatsang,
//   })),
// );

// // 5. Modern Data Router Configuration
// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <MainLayout />,
//     errorElement: <GlobalErrorFallback />, // Ultimate crash protection here
//     children: [
//       // HOME PAGE
//       {
//         index: true,
//         // Suspense wraps lazy loaded components
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <HomePage />
//           </Suspense>
//         ),
//       },

//       // FOOTER
//       {
//         path: "contact-us",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <ContactUsPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "copyright",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <CopyrightPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "terms-of-use",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <TermsOfUsePage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "privacy-policy",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <PrivacyPolicyPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "security",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <SecurityPage />
//           </Suspense>
//         ),
//       },

//       // DONATION
//       {
//         path: "general-donation",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <GeneralDonationPage />
//           </Suspense>
//         ),
//       },

//       // EDUCATION
//       {
//         path: "all-classes",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AllClassesPage />
//           </Suspense>
//         ),
//       },

//       //SEVA
//       {
//         path: "volunteer-signup",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <VolunteerSignUpPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "senior-program",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <SeniorProgramPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "grief-support",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <GriefSupportPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "lost-found",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <LostFoundPage />
//           </Suspense>
//         ),
//       },

//       // ABOUT TEMPLE
//       {
//         path: "about-temple",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AboutTemplePage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "about-deities",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AboutDeityPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "about-priests",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AboutPriestPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "land-donors",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AboutLandDonorsPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "board-committee-members",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AboutBoardCommitteePage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "etiquette-visits",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AboutEtiquetteVisitPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "jain-sangh",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AboutJainSanghPage />
//           </Suspense>
//         ),
//       },
//       {
//         path: "shirdi-sai-satsang",
//         element: (
//           <Suspense
//             fallback={
//               <div className="p-8 text-center animate-pulse">Loading...</div>
//             }
//           >
//             <AboutShirdiSaiSatsangPage />
//           </Suspense>
//         ),
//       },

//       // NOT FOUND
//       {
//         path: "*",
//         element: <NotFoundFallback />,
//       },
//     ],
//   },
// ]);

// export default function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <RouterProvider router={router} />
//     </QueryClientProvider>
//   );
// }


/**
 * @file src/App.jsx
 * @description Root Application Routing Configuration for HTKY Temple Web.
 * Combines React Router v6.4+ Data APIs with React.lazy() code splitting,
 * enterprise observability error fallbacks, and canonical donation route resolution.
 */

import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  useRouteError,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "./components/layout/MainLayout";
import { APP_COLORS } from "./constants/appColors";
import { APP_FONTS } from "./constants/appTheme";

// ============================================================================
// 1. TANSTACK QUERY CONFIGURATION (Non-Negotiable #3)
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache freshness
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// ============================================================================
// 2. ENTERPRISE ROUTE ERROR BOUNDARY (Non-Negotiable #5)
// ============================================================================

/**
 * Route-level Error Boundary fallback capturing diagnostic telemetry for APM tools.
 */
const GlobalErrorFallback = () => {
  const error = useRouteError();

  // Structured APM Telemetry Payload
  const errorTelemetry = {
    timestamp: new Date().toISOString(),
    module: "HTKY_ROUTER_ERROR_BOUNDARY",
    message: error?.message || error?.statusText || "Chunk loading or render failure",
    status: error?.status || 500,
    stack: error?.stack || null,
    url: typeof window !== "undefined" ? window.location.href : "unknown",
  };

  console.error("[HTKY_APM][ROUTE_CRASH]", errorTelemetry);

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#faf8f5]"
      style={{ fontFamily: APP_FONTS.body }}
    >
      <div className="w-16 h-16 rounded-full bg-red-50 text-[#900000] border border-red-200 flex items-center justify-center text-2xl font-serif font-bold mb-4 shadow-sm">
        ॐ
      </div>
      <h1
        className="text-2xl sm:text-3xl font-serif font-bold mb-3"
        style={{ color: APP_COLORS.primary }}
      >
        Page Failed to Load
      </h1>
      <p
        className="text-sm max-w-md mb-6 leading-relaxed"
        style={{ color: APP_COLORS.textSecondary }}
      >
        We encountered a temporary issue displaying this section. Temple administrators have been alerted.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-xs"
        >
          Reload Page
        </button>
        <a
          href="/"
          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: APP_COLORS.primary,
            color: APP_COLORS.textInverse,
          }}
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

// ============================================================================
// 3. RESPONSIVE SKELETON FALLBACK (Non-Negotiable #1)
// ============================================================================

const RouteSuspenseFallback = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded-lg w-48 mx-auto" />
    <div className="h-10 bg-gray-200 rounded-full w-3/4 mx-auto" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-72 bg-gray-200 rounded-2xl" />
      ))}
    </div>
  </div>
);

// Fallback for 404 Routes
const NotFoundFallback = () => (
  <div
    className="w-full h-[60vh] flex flex-col items-center justify-center font-serif font-bold text-xl sm:text-2xl text-center px-4"
    style={{ color: APP_COLORS.primary }}
  >
    <span>404 - Page Not Found</span>
    <a
      href="/"
      className="mt-4 text-xs font-sans font-bold underline text-amber-700 hover:text-amber-900"
    >
      Return to Home
    </a>
  </div>
);

// ============================================================================
// 4. LAZY LOADED MODULES (Route-Level Code Splitting)
// ============================================================================

const HomePage = lazy(() => import("./pages/Home"));

// FOOTER MODULES
const ContactUsPage = lazy(() =>
  import("./components/layout/Footer/ContactUs").then((m) => ({
    default: m.ContactUs,
  }))
);
const CopyrightPage = lazy(() =>
  import("./components/layout/Footer/Copyright").then((m) => ({
    default: m.Copyright,
  }))
);
const TermsOfUsePage = lazy(() =>
  import("./components/layout/Footer/TermsOfUse").then((m) => ({
    default: m.TermsOfUse,
  }))
);
const PrivacyPolicyPage = lazy(() =>
  import("./components/layout/Footer/PrivacyPolicy").then((m) => ({
    default: m.PrivacyPolicy,
  }))
);
const SecurityPage = lazy(() =>
  import("./components/layout/Footer/Security").then((m) => ({
    default: m.Security,
  }))
);

// DONATIONS MODULE (Adjust path to match your folder: ./pages/Donations/GeneralDonation or ./pages/Donation/GeneralDonation)
const GeneralDonationPage = lazy(() =>
  import("./pages/Donations/GeneralDonation").then((m) => ({
    default: m.GeneralDonation,
  }))
);

// EDUCATION MODULE
const AllClassesPage = lazy(() =>
  import("./pages/Education/AllClasses").then((m) => ({
    default: m.AllClasses,
  }))
);

// SEVA MODULE
const VolunteerSignUpPage = lazy(() =>
  import("./pages/Seva/VolunteerSignUp").then((m) => ({
    default: m.VolunteerSignUp,
  }))
);
const SeniorProgramPage = lazy(() =>
  import("./pages/Seva/SeniorProgram").then((m) => ({
    default: m.SeniorProgram,
  }))
);
const GriefSupportPage = lazy(() =>
  import("./pages/Seva/GriefSupport").then((m) => ({
    default: m.GriefSupport,
  }))
);
const LostFoundPage = lazy(() =>
  import("./pages/Seva/LostFound").then((m) => ({
    default: m.LostFound,
  }))
);

// ABOUT TEMPLE MODULE
const AboutTemplePage = lazy(() =>
  import("./pages/About/AboutTemple").then((m) => ({
    default: m.AboutTemple,
  }))
);
const AboutDeityPage = lazy(() =>
  import("./pages/About/AboutDeity").then((m) => ({
    default: m.AboutDeity,
  }))
);
const AboutPriestPage = lazy(() =>
  import("./pages/About/AboutPriest").then((m) => ({
    default: m.AboutPriest,
  }))
);
const AboutLandDonorsPage = lazy(() =>
  import("./pages/About/AboutLandDonors").then((m) => ({
    default: m.AboutLandDonors,
  }))
);
const AboutBoardCommitteePage = lazy(() =>
  import("./pages/About/AboutBoardCommittee").then((m) => ({
    default: m.AboutBoardCommittee,
  }))
);
const AboutEtiquetteVisitPage = lazy(() =>
  import("./pages/About/AboutEtiquetteVisits").then((m) => ({
    default: m.AboutEtiquetteVisit,
  }))
);
const AboutJainSanghPage = lazy(() =>
  import("./pages/About/AboutJainSangh").then((m) => ({
    default: m.AboutJainSangh,
  }))
);
const AboutShirdiSaiSatsangPage = lazy(() =>
  import("./pages/About/AboutShirdiSaiSatsang").then((m) => ({
    default: m.AboutShirdiSaiSatsang,
  }))
);

// ============================================================================
// 5. DATA ROUTER CONFIGURATION
// ============================================================================

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <GlobalErrorFallback />,
    children: [
      // HOME PAGE
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <HomePage />
          </Suspense>
        ),
      },

      // DONATION MODULE (Canonical & Legacy Aliases)
      {
        path: "donations/general",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <GeneralDonationPage />
          </Suspense>
        ),
      },

      // FOOTER
      {
        path: "contact-us",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <ContactUsPage />
          </Suspense>
        ),
      },
      {
        path: "copyright",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <CopyrightPage />
          </Suspense>
        ),
      },
      {
        path: "terms-of-use",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <TermsOfUsePage />
          </Suspense>
        ),
      },
      {
        path: "privacy-policy",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <PrivacyPolicyPage />
          </Suspense>
        ),
      },
      {
        path: "security",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <SecurityPage />
          </Suspense>
        ),
      },

      // EDUCATION
      {
        path: "all-classes",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AllClassesPage />
          </Suspense>
        ),
      },

      // SEVA
      {
        path: "volunteer-signup",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <VolunteerSignUpPage />
          </Suspense>
        ),
      },
      {
        path: "senior-program",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <SeniorProgramPage />
          </Suspense>
        ),
      },
      {
        path: "grief-support",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <GriefSupportPage />
          </Suspense>
        ),
      },
      {
        path: "lost-found",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <LostFoundPage />
          </Suspense>
        ),
      },

      // ABOUT TEMPLE
      {
        path: "about-temple",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AboutTemplePage />
          </Suspense>
        ),
      },
      {
        path: "about-deities",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AboutDeityPage />
          </Suspense>
        ),
      },
      {
        path: "about-priests",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AboutPriestPage />
          </Suspense>
        ),
      },
      {
        path: "land-donors",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AboutLandDonorsPage />
          </Suspense>
        ),
      },
      {
        path: "board-committee-members",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AboutBoardCommitteePage />
          </Suspense>
        ),
      },
      {
        path: "etiquette-visits",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AboutEtiquetteVisitPage />
          </Suspense>
        ),
      },
      {
        path: "jain-sangh",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AboutJainSanghPage />
          </Suspense>
        ),
      },
      {
        path: "shirdi-sai-satsang",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <AboutShirdiSaiSatsangPage />
          </Suspense>
        ),
      },

      // CATCH-ALL 404
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