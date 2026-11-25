/**
 * @file src/constants/routes.js
 * @description Single Source of Truth for all application routes across API navigation,
 * static pages, cart/checkout flows, and protected account dashboard routes.
 */

export const ROUTES = Object.freeze({
    // ================= HOME & DYNAMIC DETAIL ROUTES =================
    home: "/",
    eventDetails: "/event/:eventSlug/:eventId",
    makePayment: "/make-a-payment/:serviceId",

    // ================= SERVICES & SPONSORSHIPS =================
    services: "/services",
    bookService: "/book-service",
    sponsorships: "/sponsorships",
    sponsorshipsCategory: "/sponsorships/:serviceType",

    // ================= DONATIONS =================
    donations: "/donations/general",
    generalDonations: "/donations/general",
    recurringDonations: "/recurring-donation",
    recurringDonationCheckout: "/recurring-donation/checkout",

    // ================= CART & CHECKOUT =================
    cart: "/cart",
    checkout: "/checkout",
    checkoutSuccess: "/checkout/success",

    // ================= CALENDAR & COMMUNITY =================
    calendar: "/calendar",
    communityEvents: "/community-events",
    newsletters: "/newsletters",

    // ================= EDUCATION =================
    education: "/all-classes",
    hinduSchool: "/all-classes",
    allClasses: "/all-classes",

    // ================= SEVA =================
    seva: "/volunteer-signup",
    volunteerSignUp: "/volunteer-signup",
    seniorPage: "/senior-program",
    griefSupport: "/grief-support",
    lostAndFound: "/lost-found",

    // ================= ABOUT TEMPLE =================
    aboutTemple: "/about-temple",
    aboutDeities: "/about-deities",
    aboutPriests: "/about-priests",
    landDonors: "/land-donors",
    committeeMembers: "/board-committee-members",
    etiquetteAndVisits: "/etiquette-visits",
    jainSangh: "/jain-sangh",
    shirsiSaiSatsang: "/shirdi-sai-satsang",

    // ================= ACCOUNT & MEMBERSHIP =================
    membership: "/membership",
    account: "/account",
    myAccount: "/account/dashboard",
    accountDashboard: "/account/dashboard",
    accountPujaBookings: "/account/puja-bookings",
    accountDonations: "/account/donations",
    accountSponsors: "/account/sponsors",
    accountPayments: "/account/payments",
    accountPaymentReceipt: "/account/payments/receipt/:receiptId",
    accountProfile: "/account/profile",

    // ================= LEGACY ALIASES & FALLBACK =================
    legacyDashboard: "/dashboard",
    legacyProfile: "/profile",
    notFound: "*",
});

/**
 * Converts an absolute route path (e.g. "/checkout/success")
 * into a relative React Router child path (e.g. "checkout/success").
 */
export const toRelativeRoute = (routePath) =>
    String(routePath || "").replace(/^\/+/, "");

/**
 * Extracts a nested child path relative to its parent route
 * (e.g. toChildRoute("/account/puja-bookings", "/account") -> "puja-bookings").
 */
export const toChildRoute = (fullPath, parentPath) => {
    const cleanFull = toRelativeRoute(fullPath);
    const cleanParent = toRelativeRoute(parentPath);
    return cleanFull.startsWith(`${cleanParent}/`)
        ? cleanFull.slice(cleanParent.length + 1)
        : cleanFull;
};