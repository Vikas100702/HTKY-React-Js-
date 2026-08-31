/**
 * @file src/api/client.js
 * @description Centralized Axios HTTP Client with AbortController safety,
 * memory-leak protections, and standard error mapping.
 */

import axios from 'axios';
import { BASE_URL, PRE_BASE_URL } from '../constants/apiConstants';

/**
 * Enterprise Axios Instance Config
 * All API calls route through here, never directly from components.
 */

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

/**
 * Global Request Interceptor
 */
apiClient.interceptors.request.use(
    (config) => {
        if(config.pre) {
            config.baseURL = PRE_BASE_URL
        }
        // Future proofing: Inject auth tokens here for Devotee Portal later
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Global Response Interceptor
 * Sanitizes server responses and normalizes error structures.
 */
apiClient.interceptors.response.use(
    (response) => {
        // Unpack data directly to simplify consumption in the services layer
        return response.data;
    },
    (error) => {
        // Rule #3: Check if the request was canceled explicitly by our AbortController
        if (axios.isCancel(error)) {
            console.warn('[API] Request safely aborted due to component unmount.');
            return Promise.reject({ isCanceled: true, message: 'Request aborted' });
        }

        // Log structured error for enterprise observability tools
        console.error('[API Failure]', error);
        return Promise.reject(error);
    }
);