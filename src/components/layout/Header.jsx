import { useGetHeaderSettings } from "../../hooks/queries/useGetHeaderSettings";
import { useModalStore } from "../../store/useModalStore";
import { useAuthStore } from "../../store/useAuthStore";
import { APP_COLORS } from "../../constants/appColors";
import { APP_STRINGS } from "../../constants/appStrings";
import { APP_FONTS } from "../../constants/appTheme";
import { Phone, Mail, LogOut } from "lucide-react";

export const Header = () => {
  const {
    data: headerData,
    isLoading: isHeaderLoading,
    isError: isHeaderError,
  } = useGetHeaderSettings();

  const openModal = useModalStore((state) => state.openModal);
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  if (isHeaderLoading) {
    return (
      <header
        className="w-full bg-white px-3 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between shadow-sm animate-pulse border-b-4"
        style={{ borderColor: APP_COLORS.primary }}
      >
        <div className="flex flex-row items-center space-x-3 w-full md:w-auto mb-3 md:mb-0">
          <div className="w-12 h-12 md:w-20 md:h-20 bg-gray-200 rounded-full"></div>
          <div className="w-40 md:w-64 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full md:w-48 h-12 md:h-16 bg-gray-200 rounded"></div>
      </header>
    );
  }

  if (isHeaderError || !headerData) {
    return (
      <header className="w-full bg-red-50 p-4 text-center text-red-600 font-bold border-b border-red-200">
        {APP_STRINGS.errorLoadingConfig}
      </header>
    );
  }

  return (
    <header className="w-full px-3 md:px-8 py-4 flex flex-col xl:flex-row items-center justify-between bg-[url('/src/assets/header-bg.png')] bg-repeat bg-center">
      {/* 
        ROW 1 (Mobile): Logo + Temple Name Wrapper.
        'xl:contents' restores the flex children to the main header on desktop.
      */}
      <div className="flex flex-col xl:flex-row items-center justify-center space-y-3 xl:space-y-0 w-full xl:contents mb-4 xl:mb-0 text-center">
        {/* Logo: Center on Mobile, Left on Desktop (w-1/4 to perfectly balance the right side) */}
        <div
          className="flex-shrink-0 flex justify-center w-full xl:w-[18%]"
          style={{ color: APP_COLORS.primary }}
        >
          {headerData.logoUrl ? (
            <img
              src={headerData.logoUrl}
              alt={`${headerData.templeName} Logo`}
              className="h-15 w-15 sm:h-24 sm:w-24 md:h-48 md:w-48 xl:max-h-[8rem] xl:max-w-[8rem] object-contain p-0.5"
              loading="lazy"
            />
          ) : (
            <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-gray-500">
                {APP_STRINGS.noLogoText}
              </span>
            </div>
          )}
        </div>

        {/* Temple Name: Center on Mobile, Center on Desktop (Takes up remaining space safely) */}
        <div className="flex flex-col items-center xl:items-center justify-center xl:flex-grow text-center">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl xl:text-3xl font-bold uppercase leading-tight"
            style={{
              color: APP_COLORS.primary,
              fontFamily: APP_FONTS.heading,
            }}
          >
            {headerData.templeName}
          </h1>

          <h2
            className="text-sm sm:text-base md:text-lg xl:text-lg font-bold tracking-wider leading-tight"
            style={{
              color: APP_COLORS.primary,
              fontFamily: APP_FONTS.heading,
            }}
          >
            {headerData.address}
          </h2>

          <h2
            className="flex flex-col sm:flex-row flex-wrap items-center font-bold justify-center gap-x-4 gap-y-2 text-sm sm:text-base md:text-lg xl:text-lg tracking-wider"
            style={{
              color: APP_COLORS.primary,
              fontFamily: APP_FONTS.heading,
            }}
          >
            {headerData.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
                {headerData.phone}
              </span>
            )}

            {headerData.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
                {headerData.email}
              </span>
            )}
          </h2>

          {headerData.subHeading3 && (
            <h2
              className="text-sm sm:text-base md:text-lg xl:text-lg font-bold tracking-wider leading-relaxed mt-2 max-w-4xl"
              style={{
                color: APP_COLORS.primary,
                fontFamily: APP_FONTS.heading,
              }}
            >
              {headerData.subHeading3}
            </h2>
          )}
        </div>
      </div>

      {/* Button / User Session Widget: Center on Mobile, Right on Desktop */}
      <div className="flex flex-col items-center xl:items-end justify-center w-full xl:w-[18%] mt-2 xl:mt-0">
        <div className="flex flex-row justify-center w-full max-w-sm xl:max-w-none">
          {isAuthenticated ? (
            <div
              className="flex items-center gap-2 bg-white/90 border border-yellow-600/30 py-1.5 px-3 rounded-md shadow-md"
              style={{ backgroundColor: APP_COLORS.primary }}
            >
              <span
                className="text-xs md:text-sm font-bold tracking-wide uppercase"
                style={{ color: APP_COLORS.background }}
              >
                Welcome, {user?.firstName || user?.name || "Devotee"}
              </span>
              <button
                onClick={handleLogout}
                title="Logout"
                className="ml-1 p-1 text-gray-600 hover:text-red-600 rounded transition-all cursor-pointer"
                aria-label="Logout"
              >
                <LogOut
                  className="w-4 h-4"
                  style={{ color: APP_COLORS.background }}
                />
              </button>
            </div>
          ) : (
            <button
              className="text-white px-4 py-3 md:px-8 md:py-2 text-sm md:text-base font-bold tracking-wide transition-opacity w-full xl:w-auto rounded-sm cursor-pointer"
              style={{ backgroundColor: APP_COLORS.primary }}
              onClick={() =>
                openModal("SIGN_IN", { logoUrl: headerData?.logoUrl })
              }
            >
              {APP_STRINGS.btnSignIn}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
