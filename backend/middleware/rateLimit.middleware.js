// Rate limiting middleware for login endpoint
// Max 5 requests per minute per IP

const loginAttempts = new Map(); // { ip: { count, resetTime } }
const MAX_REQUESTS = 5;
const TIME_WINDOW = 60 * 1000; // 1 minute in milliseconds

export function loginRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (!attempt) {
    // First attempt from this IP
    loginAttempts.set(ip, {
      count: 1,
      resetTime: now + TIME_WINDOW,
    });
    return next();
  }

  if (now > attempt.resetTime) {
    // Time window expired, reset counter
    loginAttempts.set(ip, {
      count: 1,
      resetTime: now + TIME_WINDOW,
    });
    return next();
  }

  // Within time window
  if (attempt.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many login attempts. Please try again after 1 minute.",
      retryAfter: Math.ceil((attempt.resetTime - now) / 1000),
    });
  }

  attempt.count++;
  next();
}

// Optional: Get rate limit status for an IP
export function getRateLimitStatus(ip) {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return { remaining: MAX_REQUESTS, resetTime: null };

  const now = Date.now();
  if (now > attempt.resetTime) {
    loginAttempts.delete(ip); // Clean up
    return { remaining: MAX_REQUESTS, resetTime: null };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS - attempt.count),
    resetTime: attempt.resetTime,
  };
}

// Cleanup: Remove old entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempt] of loginAttempts.entries()) {
    if (now > attempt.resetTime) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);
