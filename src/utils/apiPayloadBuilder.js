/**
 * @file src/utils/apiPayloadBuilder.js
 * @description Centralized utility to dynamically construct standard API payloads.
 * Eliminates repetitive boilerplate while allowing full flexibility for dynamic queries.
 * use highly secure ENV_CONFIG, preventing secret leakage.
 * * Architectural Rule: Ensures fail-safe, predictable, and memory-safe network requests.
 */

import { ENV_CONFIG } from '../config/envConfig';

/**
 * Builds the standard componentConfig payload for the Filter API.
 * @param {Object} params - Configuration parameters
 * @param {string} params.moduleName - Name of the module (Required)
 * @param {string} params.aspectType - Aspect type identifier (Required)
 * @param {Object} [params.query] - Optional dynamic query object. 
 * @param {number} [params.skip=0] - Pagination skip limit
 * @param {number} [params.next=1220] - Pagination fetch limit
 * @param {Object} [params.additionalProps] - Any other extra fields required by specific APIs
 * @returns {Object} A strictly formatted payload object for the API client
 */

export const buildComponentConfigPayload = ({ moduleName, aspectType, query, skip = 0, next = 1220, ...additionalProps }) => {
    // Ensure required fields are provided to prevent API crashes
    if (!moduleName || !aspectType) {
        console.error('[Payload Builder] Missing required parameters: moduleName and aspectType are mandatory.');
    }

    const payload = {
        componentConfig: {
            moduleName,
            aspectType,
            productID: ENV_CONFIG.PRODUCT_ID,
            clientID: ENV_CONFIG.CLIENT_ID,
            skip: skip,
            next: next,
            ...additionalProps, // Spread any additional properties for flexibility
        }
    };

    if (query !== undefined) {
        payload.componentConfig.query = query;
    }

    return payload;
};