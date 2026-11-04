export const encodeBase64 = (str) => {
    if (!str) return "";
    try {
        // Convert string to UTF-8 byte array, then encode to Base64
        const utf8Bytes = new TextEncoder().encode(String(str));
        let binaryString = "";
        const len = utf8Bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binaryString += String.fromCharCode(utf8Bytes[i]);
        }
        return btoa(binaryString);
    } catch (error) {
        console.error(`[HTKY_APM][BASE64_ENCODE_ERROR] ${new Date().toISOString()}`, error);
        return "";
    }
};

export const decodeBase64 = (base64Str) => {
    if (!base64Str) return "";
    try {
        const binaryString = atob(String(base64Str));
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch {
        // If the string is already plain text or invalid base64, fallback gracefully
        return base64Str;
    }
}