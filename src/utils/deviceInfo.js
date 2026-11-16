let cachedDeviceIp = null;

export const getDeviceIpAddress = async ({ timeoutMs = 2500 } = {}) => {
    // Return cached IP immediately if already resolved in the current session
    if (cachedDeviceIp) {
        return cachedDeviceIp;
    }

    // Primary: Cloudflare Anycast Trace endpoints (Ad-blocker immune, highly available)
    const traceEndpoints = [
        'https://www.cloudflare.com/cdn-cgi/trace',
        'https://1.1.1.1/cdn-cgi/trace',
    ];

    for (const endpoint of traceEndpoints) {
        try {
            const abortController = new AbortController();
            const timerId = setTimeout(() => abortController.abort(), timeoutMs);

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: { Accept: 'text/plain' },
                signal: abortController.signal,
            });

            clearTimeout(timerId);

            if (response.ok) {
                const textPayload = await response.text();
                // Parse the key-value trace output: "ip=xxx.xxx.xxx.xxx"
                const ipMatch = textPayload.match(/^ip=(.+)$/m);
                if (ipMatch && ipMatch[1]) {
                    const sanitizedIp = ipMatch[1].trim();
                    if (sanitizedIp.length > 0) {
                        cachedDeviceIp = sanitizedIp;
                        return cachedDeviceIp;
                    }
                }
            }
        } catch  {
            // Continue to next provider fallback if timed out or unreachable
        }
    }

    // Secondary Safe Fallback: Prevents payload rejection if offline or firewalled
    return '127.0.0.1';
};

export default getDeviceIpAddress;
