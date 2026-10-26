import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { FIREBASE_CONFIG } from "./envConfig";

let app;
try {
    app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
} catch (error) {
    console.error(`[HTKY_APM][FIREBASE_INIT_ERROR] ${new Date().toISOString()}`, {
        message: error?.message || error
    });
    throw error;
}

export const auth = getAuth(app);
export default app;
