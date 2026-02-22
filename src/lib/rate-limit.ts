/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding-window counter stored in a Map.
 * Suitable for single-process deployments (Vercel serverless, standalone Node).
 * For multi-instance deployments, swap this for a Redis-backed solution.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically to prevent memory leak
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    for (const [key, entry] of rateLimitMap) {
        if (now > entry.resetAt) {
            rateLimitMap.delete(key);
        }
    }
}

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Check and apply rate limiting for a given identifier (e.g. IP address).
 */
export function rateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    cleanupExpiredEntries();

    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    if (!entry || now > entry.resetAt) {
        // First request in window or window expired
        rateLimitMap.set(identifier, {
            count: 1,
            resetAt: now + config.windowMs,
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetAt: now + config.windowMs,
        };
    }

    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetAt: entry.resetAt,
    };
}

/**
 * Get rate limit headers to include in API responses.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    };
}
