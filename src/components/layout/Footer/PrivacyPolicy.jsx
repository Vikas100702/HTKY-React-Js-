import { useGetFooterSettings } from "../../../hooks/queries/Footer/useGetFooterSettings";
import { APP_COLORS } from "../../../constants/appColors";

export const PrivacyPolicy = () => {
  const { data: footerData, isLoading } = useGetFooterSettings();

  // Skeleton loader for smooth UX
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse min-h-[50vh]">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[50vh]">
      <h1
        className="text-2xl md:text-3xl font-extrabold mb-6 uppercase border-b-2 pb-2"
        style={{ color: APP_COLORS.primary, borderColor: APP_COLORS.secondary }}
      >
        Privacy Policy
      </h1>

      {/* Safely rendering the HTML string from the API */}
      <div
        className="prose prose-sm md:prose-base max-w-none text-gray-800"
        dangerouslySetInnerHTML={{
          __html:
            footerData?.privacyPolicy ||
            "<p>Security is currently unavailable.</p>",
        }}
      />
    </div>
  );
};
