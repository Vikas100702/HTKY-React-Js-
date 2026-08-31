/**
 * @file src/components/layout/Footer.jsx
 * @description Footer updated to match the 5-column layout with increased logo size
 * to remove empty space, and strict center alignment for mobile/tablet views.
 * Built exactly on the provided structural pattern without unnecessary UI changes.
 */

import { NavLink, useNavigate } from "react-router-dom";
import {
  useGetFooterSettings,
  useGetBackgroundMusic,
} from "../../../hooks/queries/Footer/useGetFooterSettings";
import { APP_COLORS } from "../../../constants/appColors";
import { APP_STRINGS } from "../../../constants/appStrings";

export const Footer = () => {
  const navigate = useNavigate();
  const { data: footerData, isLoading } = useGetFooterSettings();
  const { data: musicData } = useGetBackgroundMusic();

  // Skeleton Loader
  if (isLoading) {
    return (
      <footer
        className="w-full border-t-4 mt-auto py-6"
        style={{
          backgroundColor: APP_COLORS.surfaceLight,
          borderColor: APP_COLORS.primary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-pulse">
          <div className="h-28 bg-gray-200 rounded"></div>
          <div className="h-28 bg-gray-200 rounded"></div>
          <div className="h-28 bg-gray-200 rounded"></div>
          <div className="h-28 bg-gray-200 rounded"></div>
          <div className="h-28 bg-gray-200 rounded"></div>
        </div>
      </footer>
    );
  }

  // Safety Fallback
  if (!footerData) {
    return (
      <footer
        className="w-full border-t-4 mt-auto py-4 text-center text-base font-bold shadow-inner"
        style={{
          backgroundColor: APP_COLORS.surfaceLight,
          borderColor: APP_COLORS.primary,
          color: APP_COLORS.primary,
        }}
      >
        <p>
          {APP_STRINGS.fallbackCopyright?.replace(
            "{year}",
            new Date().getFullYear(),
          ) ||
            `Sree Devi Peetham © ${new Date().getFullYear()}. All Rights Reserved.`}
        </p>
      </footer>
    );
  }

  return (
    <footer
      className="w-full bg-[url('/src/assets/header-bg.png')] bg-repeat bg-center text-gray-900 border-t-4 mt-auto font-sans shadow-md"
      style={{
        backgroundColor: APP_COLORS.surfaceLight,
        borderColor: APP_COLORS.primary,
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* 5-Column Grid with updated responsive alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-8 items-start">
          {/* Column 1: Logo & Audio Player */}
          <div className="space-y-4 flex flex-col items-center lg:items-center   text-center lg:text-left w-full">
            {footerData.logoUrl && (
              <img
                src={footerData.logoUrl}
                alt="Sree Devi Peetham Logo"
                className="h-32 md:h-40 lg:h-44 w-auto object-contain my-2 drop-shadow-sm"
                loading="lazy"
              />
            )}
            {musicData?.url && (
              <audio
                controls
                src={musicData.url}
                className="w-full max-w-[240px] h-10 mt-2"
                title={musicData.musicName}
              />
            )}
          </div>

          {/* Column 2: Static ABOUT US Links */}
          <div className="space-y-3 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h3
              className="text-lg md:text-xl font-extrabold tracking-wide uppercase border-b-2 pb-1 inline-block"
              style={{
                color: APP_COLORS.primary,
                borderColor: APP_COLORS.secondary,
              }}
            >
              {APP_STRINGS.footerAboutUs}
            </h3>
            <ul className="space-y-2 text-base font-bold text-gray-900 w-full">
              <li>
                <NavLink
                  to="/about-temple"
                  className="hover:opacity-75 sm:hover:translate-x-1 inline-block transition-all duration-200"
                >
                  HINDU SCHOOL
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about-temple"
                  className="hover:opacity-75 sm:hover:translate-x-1 inline-block transition-all duration-200"
                >
                  MEMBERSHIP
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about-temple"
                  className="hover:opacity-75 sm:hover:translate-x-1 inline-block transition-all duration-200"
                >
                  ABOUT TEMPLE
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/events"
                  className="hover:opacity-75 sm:hover:translate-x-1 inline-block transition-all duration-200"
                >
                  EVENTS
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/services"
                  className="hover:opacity-75 sm:hover:translate-x-1 inline-block transition-all duration-200"
                >
                  SERVICES
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/donations"
                  className="hover:opacity-75 sm:hover:translate-x-1 inline-block transition-all duration-200"
                >
                  DONATIONS
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/gallery"
                  className="hover:opacity-75 sm:hover:translate-x-1 inline-block transition-all duration-200"
                >
                  GALLERY
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/calendar"
                  className="hover:opacity-75 sm:hover:translate-x-1 inline-block transition-all duration-200"
                >
                  DOWNLOAD APK
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Column 3: Temple Timings */}
          <div className="space-y-3 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h3
              className="text-lg md:text-xl font-extrabold tracking-wide uppercase border-b-2 pb-1 inline-block"
              style={{
                color: APP_COLORS.primary,
                borderColor: APP_COLORS.secondary,
              }}
            >
              {APP_STRINGS.footerTimings}
            </h3>
            <div className="space-y-3 text-base text-gray-900 w-full">
              <div>
                <p
                  className="font-extrabold"
                  style={{ color: APP_COLORS.primary }}
                >
                  {APP_STRINGS.weekdayTimingsLabel}
                </p>
                <p className="font-semibold">{footerData.weekdayMorningTime}</p>
                <p className="font-semibold">{footerData.weekDayEveningTime}</p>
              </div>
              <div>
                <p
                  className="font-extrabold"
                  style={{ color: APP_COLORS.primary }}
                >
                  {APP_STRINGS.weekendTimingsLabel}
                </p>
                <p className="font-semibold">{footerData.weekEndMorningTime}</p>
                <p className="font-semibold">{footerData.weekEndEveningTime}</p>
              </div>
            </div>
          </div>

          {/* Column 4: Quick Links & Social Media */}
          <div className="space-y-3 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h3
              className="text-lg md:text-xl font-extrabold tracking-wide uppercase border-b-2 pb-1 inline-block"
              style={{
                color: APP_COLORS.primary,
                borderColor: APP_COLORS.secondary,
              }}
            >
              {APP_STRINGS.footerConnect}
            </h3>

            <div className="flex space-x-4 pt-1 justify-center lg:justify-start w-full">
              {footerData.facebookLink && (
                <a
                  href={footerData.facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity p-1"
                  style={{ color: APP_COLORS.primary }}
                  aria-label="Facebook"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.325V1.325C24 .597 23.403 0 22.675 0z" />
                  </svg>
                </a>
              )}
              {footerData.instagramLink && (
                <a
                  href={footerData.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity p-1"
                  style={{ color: APP_COLORS.primary }}
                  aria-label="Instagram"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              )}
              {footerData.youtubeLink && (
                <a
                  href={footerData.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity p-1"
                  style={{ color: APP_COLORS.primary }}
                  aria-label="YouTube"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Policies Header */}
            <h3
              className="text-lg md:text-xl font-extrabold tracking-wide uppercase border-b-2 pb-1 inline-block mt-4"
              style={{
                color: APP_COLORS.primary,
                borderColor: APP_COLORS.secondary,
              }}
            >
              POLICIES
            </h3>
            <div className="pt-1 flex flex-col space-y-1.5 text-base font-bold text-gray-900 w-full items-center lg:items-start">
              <NavLink
                to="/copyright"
                className="hover:opacity-75 hover:underline inline-block w-fit"
                style={{ color: APP_COLORS.primary }}
              >
                {APP_STRINGS.copyright}
              </NavLink>
              <NavLink
                to="/terms-of-use"
                className="hover:opacity-75 hover:underline inline-block w-fit"
                style={{ color: APP_COLORS.primary }}
              >
                {APP_STRINGS.termsConditions}
              </NavLink>
              <NavLink
                to="/privacy-policy"
                className="hover:opacity-75 hover:underline inline-block w-fit"
                style={{ color: APP_COLORS.primary }}
              >
                {APP_STRINGS.privacyPolicy}
              </NavLink>
              <NavLink
                to="/security"
                className="hover:opacity-75 hover:underline inline-block w-fit"
                style={{ color: APP_COLORS.primary }}
              >
                {APP_STRINGS.security}
              </NavLink>
            </div>
          </div>

          {/* Column 5: Contact Us */}
          <div className="space-y-3 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h3
              className="text-lg md:text-xl font-extrabold tracking-wide uppercase border-b-2 pb-1 inline-block"
              style={{
                color: APP_COLORS.primary,
                borderColor: APP_COLORS.secondary,
              }}
            >
              {APP_STRINGS.footerContactUs}
            </h3>
            <p
              className="text-base font-semibold text-gray-900 leading-snug"
              dangerouslySetInnerHTML={{ __html: footerData.address }}
            ></p>

            <div className="space-y-1.5 text-base font-semibold text-gray-900 flex flex-col items-center lg:items-start">
              {footerData.phone && (
                <p>
                  <span
                    className="font-extrabold"
                    style={{ color: APP_COLORS.primary }}
                  >
                    {APP_STRINGS.phoneLabel}
                  </span>{" "}
                  {footerData.phone}
                </p>
              )}
              {footerData.email && (
                <p>
                  <span
                    className="font-extrabold"
                    style={{ color: APP_COLORS.primary }}
                  >
                    {APP_STRINGS.emailLabel}
                  </span>{" "}
                  <a
                    href={`mailto:${footerData.email}`}
                    className="hover:opacity-75 decoration-2 transition-all"
                  >
                    {footerData.email}
                  </a>
                </p>
              )}

              <button
                className="px-6 py-2 rounded text-sm font-bold uppercase tracking-wider text-white shadow-md hover:opacity-90 transition-opacity mt-1 mb-2"
                style={{ backgroundColor: APP_COLORS.primary }}
                onClick={() => {
                  navigate("/contact-us");
                  window.scrollTo({ top: 0, behavior: "smooth" }); // Smooth scroll to top of new page
                }}
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div
        className="w-full py-3 text-center px-4"
        style={{ backgroundColor: APP_COLORS.primary }}
      >
        <p
          className="text-xs md:text-sm tracking-widest uppercase font-bold"
          style={{ color: APP_COLORS.textInverse }}
        >
          Copyright &copy; VAAP Technologies Inc, All rights reserved.
        </p>
      </div>
    </footer>
  );
};
