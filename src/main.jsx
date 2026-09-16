// /**
//  * @file src/main.jsx
//  * @description Absolute entry point of the React application.
//  * Initializes the app with React.StrictMode for highlighting potential problems in an application.
//  */

// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.jsx";
// import "./index.css"; // Tailwind and global styles

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// );

/**
 * @file src/main.jsx
 * @description Enterprise Application Bootstrap & Root Mount Entry Point for HTKY Temple Web.
 * Implements defensive DOM root container verification, global unhandled exception
 * observability telemetry, and React 18+ concurrent root initialization.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ============================================================================
// GLOBAL OBSERVABILITY TELEMETRY (Non-Negotiable #5)
// Intercepts async Promise rejections & uncaught window errors outside React
// ============================================================================

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const errorTelemetry = {
      timestamp: new Date().toISOString(),
      module: "GLOBAL_UNHANDLED_REJECTION",
      reason:
        event?.reason?.message ||
        event?.reason ||
        "Unhandled Promise rejection",
      stack: event?.reason?.stack || null,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    console.error("[HTKY_APM][ASYNC_PROMISE_REJECTION]", errorTelemetry);
  });

  window.addEventListener("error", (event) => {
    const errorTelemetry = {
      timestamp: new Date().toISOString(),
      module: "GLOBAL_WINDOW_ERROR",
      message: event?.message || "Uncaught browser exception",
      filename: event?.filename || null,
      lineno: event?.lineno || null,
      colno: event?.colno || null,
      stack: event?.error?.stack || null,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    console.error("[HTKY_APM][UNCAUGHT_WINDOW_ERROR]", errorTelemetry);
  });
}

// ============================================================================
// DEFENSIVE ROOT CONTAINER INITIALIZATION (Non-Negotiable #2)
// ============================================================================

const rootElement = document.getElementById("root");

if (!rootElement) {
  const fatalError = {
    timestamp: new Date().toISOString(),
    module: "HTKY_BOOTSTRAP_FAILURE",
    message:
      'Fatal: Root DOM element with id "root" was not found in the document.',
  };
  console.error("[HTKY_APM][FATAL_DOM_ERROR]", fatalError);
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
