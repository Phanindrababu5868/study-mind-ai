import rateLimit from 'express-rate-limit';

// Applied to every /api request. Generous enough not to bother normal usage
// (page loads fan out into several calls at once), but caps sustained abuse
// or a runaway client-side retry loop.
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true, // adds RateLimit-* response headers
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
    },
});

// Tighter limit on login/register specifically — these are the routes worth
// protecting against credential stuffing and account-creation abuse, so they
// get a much lower ceiling than the general API limiter above.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    // Successful logins don't count against the limit, so a legitimate user
    // who mistypes their password a couple of times isn't at risk of being
    // locked out — only repeated failures are.
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many attempts. Please try again in a few minutes.',
        statusCode: 429,
    },
});