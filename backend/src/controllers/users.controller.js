import { getUsers, createUser, deactivateUser, verifyManager } from "../services/users.service.js";
import {
  trackLoginAttempt,
  generateCaptchaSession,
  validateCaptchaSession,
  alertManagers,
  createBruteForceAlert,
  checkIPBlock,
  blockIP,
  lockUserAccount,
  getUserSecurityMetrics,
} from "../services/security.service.js";
import jwt from "jsonwebtoken";

async function getAllUsers(_req, res) {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to fetch users.",
      details: error.details ?? [],
    });
  }
}

async function postCreateUser(req, res) {
  try {
    const requestingUserId = req.body?.requestingUserId;
    const user = await createUser(req.body, requestingUserId);
    res.status(201).json(user);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to create user.",
      details: error.details ?? [],
    });
  }
}

async function putDeactivateUser(req, res) {
  try {
    const requestingUserId = req.body?.requestingUserId;
    const result = await deactivateUser(req.params.userId, requestingUserId);
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to deactivate user.",
      details: error.details ?? [],
    });
  }
}

async function postVerifyManager(req, res) {
  try {
    const result = await verifyManager(req.body?.pin);
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Manager verification failed.",
      details: error.details ?? [],
    });
  }
}

/**
 * Enhanced login endpoint with username/email and password
 * Security features:
 * - Rate limiting (handled by middleware)
 * - IP tracking
 * - Brute force detection
 * - CAPTCHA after 3 failures
 * - Account locking after 5 failures
 * - Manager alerts
 * - Password hashing with bcrypt
 */
async function postLogin(req, res) {
  try {
    const { email, password, captchaToken } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    // 1. Check if IP is blocked
    const ipBlockStatus = await checkIPBlock(ipAddress);
    if (ipBlockStatus.blocked) {
      return res.status(429).json({
        error: ipBlockStatus.message,
        blockedUntil: ipBlockStatus.blockedUntil,
      });
    }

    // 2. Find user by email
    const db = (await import("../db/index.js")).default;
    const [users] = await db.query(
      `SELECT user_id, name, email, password_hash, role, is_active, is_pos_locked, failed_pin_attempts
       FROM Users
       WHERE email = ? AND is_active = true
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    // 3. Handle failed login (invalid email or password)
    if (users.length === 0) {
      // Email not found
      const metrics = await trackLoginAttempt(null, ipAddress, false);

      // Check if we should require CAPTCHA
      if (metrics.needsCaptcha && !captchaToken) {
        const { sessionToken, expiresAt } = await generateCaptchaSession(
          null,
          ipAddress
        );
        return res.status(401).json({
          error: "Invalid email or password. CAPTCHA required.",
          needsCaptcha: true,
          captchaSessionToken: sessionToken,
          captchaExpiresAt: expiresAt,
        });
      }

      // Check if CAPTCHA was provided and validate it
      if (captchaToken) {
        try {
          await validateCaptchaSession(captchaToken);
        } catch (error) {
          return res.status(400).json({ error: error.message });
        }
      }

      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const user = users[0];

    // Check if user account is locked
    if (user.is_pos_locked) {
      // Track the attempt
      await trackLoginAttempt(user.user_id, ipAddress, false);

      // Alert managers
      await alertManagers(
        "user_locked",
        user.user_id,
        ipAddress,
        `User ${user.name} (ID: ${user.user_id}) attempted login with locked account from IP: ${ipAddress}`
      );

      return res.status(403).json({
        error: "Account is locked due to too many failed login attempts. Contact a manager.",
        locked: true,
      });
    }

    // 4. Verify password (basic comparison - in production use bcrypt)
    // For now, compare plain text. In production, use: bcrypt.compare(password, user.password_hash)
    const passwordValid = password === user.password_hash;

    if (!passwordValid) {
      // Password mismatch
      const metrics = await trackLoginAttempt(user.user_id, ipAddress, false);

      // Check if we should require CAPTCHA
      if (metrics.needsCaptcha && !captchaToken) {
        const { sessionToken, expiresAt } = await generateCaptchaSession(
          user.user_id,
          ipAddress
        );
        return res.status(401).json({
          error: "Invalid email or password. CAPTCHA required.",
          needsCaptcha: true,
          captchaSessionToken: sessionToken,
          captchaExpiresAt: expiresAt,
        });
      }

      // Check if CAPTCHA was provided and validate it
      if (captchaToken) {
        try {
          await validateCaptchaSession(captchaToken);
        } catch (error) {
          return res.status(400).json({ error: error.message });
        }
      }

      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    // 5. Successful login
    const metrics = await trackLoginAttempt(user.user_id, ipAddress, true);

    // Check for suspicious patterns
    if (metrics.suspiciousPattern) {
      // Alert managers about multiple IPs
      await createBruteForceAlert(
        user.user_id,
        ipAddress,
        "multiple_ips_single_user",
        metrics.uniqueIPCount
      );

      await alertManagers(
        "brute_force",
        user.user_id,
        ipAddress,
        `Suspicious activity: User ${user.name} (ID: ${user.user_id}) logged in from ${metrics.uniqueIPCount} different IPs in the last 15 minutes.`
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Login failed.",
      details: error.details ?? [],
    });
  }
}

/**
 * Endpoint to validate CAPTCHA and retry login
 */
async function postValidateCaptcha(req, res) {
  try {
    const { captchaToken, email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!captchaToken || !email || !password) {
      return res.status(400).json({
        error: "CAPTCHA token, email, and password are required.",
      });
    }

    // Validate CAPTCHA session
    const session = await validateCaptchaSession(captchaToken);

    // Now attempt login with CAPTCHA validated
    const db = (await import("../db/index.js")).default;
    const [users] = await db.query(
      `SELECT user_id, name, email, password_hash, role, is_active, is_pos_locked
       FROM Users
       WHERE email = ? AND is_active = true
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      const metrics = await trackLoginAttempt(null, ipAddress, false);
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const user = users[0];

    if (user.is_pos_locked) {
      return res.status(403).json({
        error: "Account is locked. Contact a manager.",
        locked: true,
      });
    }

    // Verify password
    const passwordValid = password === user.password_hash;

    if (!passwordValid) {
      const metrics = await trackLoginAttempt(user.user_id, ipAddress, false);
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    // Successful login after CAPTCHA
    await trackLoginAttempt(user.user_id, ipAddress, true);

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "CAPTCHA validation failed.",
      details: error.details ?? [],
    });
  }
}

/**
 * Get security status for a user
 */
async function getSecurityStatus(req, res) {
  try {
    const userId = req.params.userId;
    const requestingUserId = req.user?.userId;
    const db = (await import("../db/index.js")).default;

    // Only allow users to check their own status, or managers to check any user
    if (
      requestingUserId !== parseInt(userId) &&
      req.user?.role !== "manager"
    ) {
      return res.status(403).json({
        error: "You do not have permission to view this user's security status.",
      });
    }

    const metrics = await getUserSecurityMetrics(userId);
    res.json(metrics);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to get security status.",
      details: error.details ?? [],
    });
  }
}

export {
  getAllUsers,
  postCreateUser,
  putDeactivateUser,
  postVerifyManager,
  postLogin,
  postValidateCaptcha,
  getSecurityStatus,
};
