// Rate limiting configuration
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

// In-memory rate limit storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every minute
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 60000);
}

/**
 * Check if a request from the given IP is within rate limits.
 * Returns true if the request is allowed, false if rate limited.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

