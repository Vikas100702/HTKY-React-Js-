import { Component, Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer/Footer";
import { SignInModal } from "../auth/SignInModal";
import { useModalStore } from "../../store/useModalStore";
import { APP_COLORS } from "../../constants/appColors";
import { APP_STRINGS } from "../../constants/appStrings";
import { APP_FONTS } from "../../constants/appTheme";

// LOCALIZED SECTION ERROR BOUNDARY
// Keeps Header, Navbar, and Footer intact if an individual page crashes.
class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorTelemetry = {
      timestamp: new Date().toISOString(),
      module: "HTKY_SECTION_ERROR_BOUNDARY",
      message: error?.message || "Unknown page crash",
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    };

    console.error("[HTKY_APM][PAGE_SECTION_CRASH]", errorTelemetry);
  }

  componentDidUpdate(prevProps) {
    // Automatically reset error state when devotee navigates to another route
    if (
      this.state.hasError &&
      prevProps.locationKey !== this.props.locationKey
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="w-full min-h-[60vh] flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-red-200 p-6 sm:p-8 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-red-50 text-[#900000] border border-red-100 flex items-center justify-center mx-auto text-xl font-serif font-bold mb-3 shadow-xs">
              ॐ
            </div>
            <h2
              className="text-lg sm:text-xl font-serif font-bold mb-2"
              style={{ color: APP_COLORS?.primary || "#900000" }}
            >
              Unable to Display Section
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
              This page encountered a temporary issue. You can retry loading
              this section or choose another service from the navigation above.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: APP_COLORS?.primary || "#900000" }}
              >
                Return Home
              </a>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

const PageLoadingFallback = () => (
  <div className="w-full min-h-[60vh] flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-3">
      <div
        className="w-10 h-10 border-4 rounded-full animate-spin"
        style={{
          borderColor: APP_COLORS?.primary || "#900000",
          borderTopColor: "transparent",
        }}
        role="status"
        aria-label="Loading content"
      />
      <p
        className="text-xs font-semibold tracking-wider uppercase"
        style={{
          color: APP_COLORS?.primary || "#900000",
          fontFamily: APP_FONTS?.body,
        }}
      >
        {APP_STRINGS?.loadingContent || "Loading Page Content..."}
      </p>
    </div>
  </div>
);

// SCROLL RESTORATION HELPER
const ScrollToTopOnNavigation = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

// MAIN LAYOUT SHELL
export const MainLayout = () => {
  const location = useLocation();
  const { activeModal, modalPayload, closeModal } = useModalStore();

  const handleSignInSubmit = (data) => {
    console.log("[HTKY_AUTH] Sign In Dispatch:", data);
    closeModal();
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased selection:bg-[#900000] selection:text-white"
      style={{ fontFamily: APP_FONTS?.body }}
    >
      {/* Scroll restoration guard across route changes */}
      <ScrollToTopOnNavigation />

      {/* Persistent Static Site Frames */}
      <Header />
      <Navbar />

      {/* Dynamic Page Outlet with Isolated Error & Suspense Safety Nets */}
      <main className="flex-grow w-full">
        <SectionErrorBoundary locationKey={location.key}>
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </SectionErrorBoundary>
      </main>

      <Footer />

      <SignInModal
        isOpen={activeModal === "SIGN_IN"}
        onClose={closeModal}
        logoUrl={modalPayload?.logoUrl}
        onSubmit={handleSignInSubmit}
      />
    </div>
  );
};

