import db from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

// Constants for brute force detection
const FAILED_ATTEMPTS_THRESHOLD = 3; // Trigger CAPTCHA after 3 failures
const LOCK_THRESHOLD = 5; // Lock account after 5 failures (already in schema)
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes
const MULTIPLE_IPS_THRESHOLD = 3; // Alert if same user accessed from 3+ different IPs in 15 min

function securityTablesMissing(error) {
  return ["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR"].includes(error?.code);
}

function isSecurityError(error) {
  // Check for missing tables, bad fields, or NOT NULL constraint errors
  return ["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR", "ER_BAD_NULL_ERROR"].includes(error?.code);
}

function defaultSecurityMetrics() {
  return {
    failedCount: 0,
    uniqueIPCount: 0,
    needsCaptcha: false,
    shouldLock: false,
    suspiciousPattern: false,
  };
}

/**
 * Track a login attempt and return relevant security info
 */
export async function trackLoginAttempt(userId, ipAddress, success) {
  try {
    return await db.withTransaction(async (connection) => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now - TIME_WINDOW);

      // 1. Record the login attempt (only if userId is provided)
      if (userId !== null && userId !== undefined) {
        await connection.execute(
          `INSERT INTO Login_Audit (user_id, attempt_type, ip_address, attempted_at)
           VALUES (?, ?, ?, ?)`,
          [userId, success ? "success" : "failed", ipAddress, now]
        );
      }

      // 2. Update or create IP tracking
      const [existingTracking] = await connection.execute(
        `SELECT tracking_id, attempt_count, last_attempt 
         FROM IP_Address_Tracking 
         WHERE ip_address = ? AND user_id = ?
         LIMIT 1`,
        [ipAddress, userId]
      );

      if (existingTracking.length > 0) {
        await connection.execute(
          `UPDATE IP_Address_Tracking 
           SET attempt_count = attempt_count + 1, 
               last_attempt = ?
           WHERE tracking_id = ?`,
          [now, existingTracking[0].tracking_id]
        );
      } else {
        await connection.execute(
          `INSERT INTO IP_Address_Tracking (ip_address, user_id, attempt_count, last_attempt)
           VALUES (?, ?, 1, ?)`,
          [ipAddress, userId, now]
        );
      }

      // 3. Get user's failed attempts in the last 15 minutes (only if userId is provided)
      let failedCount = 0;
      let uniqueIPCount = 0;

      if (userId !== null && userId !== undefined) {
        const [recentFailures] = await connection.execute(
          `SELECT COUNT(*) as count FROM Login_Audit 
           WHERE user_id = ? AND attempt_type = 'failed' AND attempted_at > ?`,
          [userId, fifteenMinutesAgo]
        );

        failedCount = recentFailures[0].count;

        // 4. Check for multiple IPs hitting same user account
        const [uniqueIPs] = await connection.execute(
          `SELECT COUNT(DISTINCT ip_address) as ip_count FROM Login_Audit
           WHERE user_id = ? AND attempted_at > ?`,
          [userId, fifteenMinutesAgo]
        );

        uniqueIPCount = uniqueIPs[0].ip_count;
      }

      return {
        failedCount,
        uniqueIPCount,
        needsCaptcha: failedCount >= FAILED_ATTEMPTS_THRESHOLD,
        shouldLock: failedCount >= LOCK_THRESHOLD,
        suspiciousPattern: uniqueIPCount >= MULTIPLE_IPS_THRESHOLD,
      };
    });
  } catch (error) {
    // Log the error for debugging but don't expose it to the frontend
    console.error("trackLoginAttempt failed:", error.message);
    // Return safe defaults so login can continue
    return defaultSecurityMetrics();
  }
}

/**
 * Generate a CAPTCHA validation session
 */
export async function generateCaptchaSession(userId, ipAddress) {
  const sessionToken = `captcha_${uuidv4()}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await db.query(
      `INSERT INTO CAPTCHA_Validation (session_token, user_id, ip_address, expires_at)
       VALUES (?, ?, ?, ?)`,
      [sessionToken, userId, ipAddress, expiresAt]
    );
  } catch (error) {
    if (!isSecurityError(error)) {
      throw error;
    }
  }

  return { sessionToken, expiresAt };
}

/**
 * Validate CAPTCHA session (in production, this would verify actual CAPTCHA)
 */
export async function validateCaptchaSession(sessionToken) {
  let result;

  try {
    result = await db.query(
      `SELECT validation_id, user_id, ip_address, expires_at
       FROM CAPTCHA_Validation
       WHERE session_token = ? AND is_validated = false
       LIMIT 1`,
      [sessionToken]
    );
  } catch (error) {
    if (isSecurityError(error)) {
      throw { statusCode: 400, message: "CAPTCHA validation is not configured." };
    }

    throw error;
  }

  if (result.length === 0) {
    throw { statusCode: 400, message: "Invalid or expired CAPTCHA session" };
  }

  const session = result[0];

  // Check expiration
  if (new Date() > session.expires_at) {
    // Clean up expired session
    await db.query(
      `DELETE FROM CAPTCHA_Validation WHERE validation_id = ?`,
      [session.validation_id]
    );
    throw { statusCode: 400, message: "CAPTCHA session expired" };
  }

  // Mark as validated
  await db.query(
    `UPDATE CAPTCHA_Validation 
     SET is_validated = true, validated_at = ?
     WHERE validation_id = ?`,
    [new Date(), session.validation_id]
  );

  return session;
}

/**
 * Alert managers about suspicious activity
 */
export async function alertManagers(alertType, relatedUserId, ipAddress, message) {
  // Get all active managers
  let managers;

  try {
    managers = await db.query(
      `SELECT user_id FROM Users 
       WHERE role = 'manager' AND is_active = true`
    );
  } catch (error) {
    if (isSecurityError(error)) {
      return;
    }

    throw error;
  }

  if (managers.length === 0) return; // No managers to alert

  // Insert alert for each manager
  for (const manager of managers) {
    try {
      await db.query(
        `INSERT INTO Manager_Alert (manager_id, alert_type, related_user_id, ip_address, message)
         VALUES (?, ?, ?, ?, ?)`,
        [manager.user_id, alertType, relatedUserId || null, ipAddress, message]
      );
    } catch (error) {
      if (!isSecurityError(error)) {
        throw error;
      }
    }
  }
}

/**
 * Create brute force alert record
 */
export async function createBruteForceAlert(
  userId,
  ipAddress,
  alertType,
  attemptCount
) {
  try {
    const result = await db.query(
      `INSERT INTO Brute_Force_Alert (user_id, ip_address, alert_type, attempt_count)
       VALUES (?, ?, ?, ?)`,
      [userId, ipAddress, alertType, attemptCount]
    );

    return result.insertId;
  } catch (error) {
    if (isSecurityError(error)) {
      return null;
    }

    throw error;
  }
}

/**
 * Check if IP should be temporarily blocked
 */
export async function checkIPBlock(ipAddress) {
  let result;

  try {
    result = await db.query(
      `SELECT is_blocked, blocked_until FROM IP_Address_Tracking
       WHERE ip_address = ?
       LIMIT 1`,
      [ipAddress]
    );
  } catch (error) {
    if (isSecurityError(error)) {
      return { blocked: false };
    }

    throw error;
  }

  if (result.length === 0) return { blocked: false };

  const tracking = result[0];

  if (!tracking.is_blocked) {
    return { blocked: false };
  }

  if (new Date() > tracking.blocked_until) {
    // Unblock if time has expired
    await db.query(
      `UPDATE IP_Address_Tracking 
       SET is_blocked = false, blocked_until = null
       WHERE ip_address = ?`,
      [ipAddress]
    );
    return { blocked: false };
  }

  return {
    blocked: true,
    blockedUntil: tracking.blocked_until,
    message: `This IP has been temporarily blocked due to multiple failed login attempts. Try again after ${tracking.blocked_until.toISOString()}`,
  };
}

/**
 * Block an IP address temporarily
 */
export async function blockIP(ipAddress, durationMinutes = 15) {
  const blockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

  try {
    await db.query(
      `UPDATE IP_Address_Tracking 
       SET is_blocked = true, blocked_until = ?
       WHERE ip_address = ?`,
      [blockedUntil, ipAddress]
    );
  } catch (error) {
    if (!isSecurityError(error)) {
      throw error;
    }
  }
}

/**
 * Lock a user account
 */
export async function lockUserAccount(userId) {
  await db.query(
    `UPDATE Users 
     SET is_pos_locked = true 
     WHERE user_id = ?`,
    [userId]
  );
}

/**
 * Get security metrics for a user
 */
export async function getUserSecurityMetrics(userId) {
  const fifteenMinutesAgo = new Date(Date.now() - TIME_WINDOW);

  let failedAttempts;
  let uniqueIPs;
  let userInfo;

  try {
    // Get failed attempts in last 15 minutes
    failedAttempts = await db.query(
      `SELECT COUNT(*) as count FROM Login_Audit 
       WHERE user_id = ? AND attempt_type = 'failed' AND attempted_at > ?`,
      [userId, fifteenMinutesAgo]
    );

    // Get unique IPs in last 15 minutes
    uniqueIPs = await db.query(
      `SELECT COUNT(DISTINCT ip_address) as count FROM Login_Audit
       WHERE user_id = ? AND attempted_at > ?`,
      [userId, fifteenMinutesAgo]
    );

    // Get user info
    userInfo = await db.query(
      `SELECT is_pos_locked, failed_pin_attempts FROM Users WHERE user_id = ?`,
      [userId]
    );
  } catch (error) {
    if (isSecurityError(error)) {
      return {
        isLocked: false,
        failedAttempts: 0,
        totalFailedAttempts: 0,
        uniqueIPsLast15Min: 0,
      };
    }

    throw error;
  }

  return {
    isLocked: userInfo[0]?.is_pos_locked || false,
    failedAttempts: failedAttempts[0].count,
    totalFailedAttempts: userInfo[0]?.failed_pin_attempts || 0,
    uniqueIPsLast15Min: uniqueIPs[0].count,
  };
}
