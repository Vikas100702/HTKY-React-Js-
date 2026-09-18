import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useRouteError,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import { APP_COLORS } from "./constants/appColors";
import { APP_FONTS } from "./constants/appTheme";

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

const GlobalErrorFallback = () => {
  const error = useRouteError();

  const errorTelemetry = {
    timestamp: new Date().toISOString(),
    module: "HTKY_ROUTER_ERROR_BOUNDARY",
    message:
      error?.message || error?.statusText || "Chunk loading or render failure",
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
        style={{ color: APP_COLORS.textSecondary || "#666" }}
      >
        We encountered a temporary issue displaying this section. Temple
        administrators have been alerted.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
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

const HomePage = lazy(() =>
  import("./pages/Home").catch(() => ({
    default: () => <div>Home Module Failed to Load</div>,
  })),
);
const GeneralDonationPage = lazy(() =>
  import("./pages/Donations/GeneralDonation").then((m) => ({
    default: m.GeneralDonation,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/Dashboard/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const UserProfilePage = lazy(() =>
  import("./pages/Auth/UserProfile").then((m) => ({ default: m.UserProfile })),
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <GlobalErrorFallback />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "donations/general",
        element: (
          <Suspense fallback={<RouteSuspenseFallback />}>
            <GeneralDonationPage />
          </Suspense>
        ),
      },
      {
        path: "donations",
        element: <Navigate to="/donations/general" replace />,
      },
      {
        path: "general-donation",
        element: <Navigate to="/donations/general" replace />,
      },
      // Protected Routes requiring Authentication via AuthGuard
      {
        path: "dashboard",
        element: (
          <AuthGuard>
            <Suspense fallback={<RouteSuspenseFallback />}>
              <DashboardPage />
            </Suspense>
          </AuthGuard>
        ),
      },
      {
        path: "profile",
        element: (
          <AuthGuard>
            <Suspense fallback={<RouteSuspenseFallback />}>
              <UserProfilePage />
            </Suspense>
          </AuthGuard>
        ),
      },
      {
        path: "*",
        element: <NotFoundFallback />,
      },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;

