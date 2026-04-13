import db from "../db/index.js";
import bcrypt from "bcryptjs";
import { createValidationError } from "../validation/business-rules.js";

function validateUserPayload(payload) {
  const issues = [];

  if (!payload?.name || typeof payload.name !== "string" || payload.name.trim().length === 0) {
    issues.push("name is required.");
  } else if (!/^[a-zA-Z0-9\s\-']*$/.test(payload.name.trim())) {
    issues.push("name contains invalid characters. Only letters, numbers, spaces, hyphens, and apostrophes are allowed.");
  }

  if (!payload?.email || typeof payload.email !== "string" || !payload.email.includes("@")) {
    issues.push("a valid email is required.");
  }

  if (!payload?.password || typeof payload.password !== "string" || payload.password.length < 6) {
    issues.push("password must be at least 6 characters.");
  }

  const allowedRoles = new Set(["employee", "manager", "kitchen"]);
  if (!payload?.role || !allowedRoles.has(payload.role)) {
    issues.push("role must be employee, manager, or kitchen.");
  }

  if (issues.length > 0) {
    throw createValidationError("User validation failed.", issues);
  }
}

function validatePasswordResetPayload(payload) {
  const issues = [];

  if (!payload?.email || typeof payload.email !== "string" || !payload.email.includes("@")) {
    issues.push("a valid email is required.");
  }

  if (!payload?.password || typeof payload.password !== "string" || payload.password.length < 6) {
    issues.push("password must be at least 6 characters.");
  }

  if (issues.length > 0) {
    throw createValidationError("Password reset validation failed.", issues);
  }
}

async function generateUniquePin(connection) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const [rows] = await connection.execute(
      `SELECT user_id FROM Users WHERE pin_code = ? LIMIT 1`,
      [pin]
    );

    if (rows.length === 0) {
      return pin;
    }
  }

  throw createValidationError("Could not generate a unique internal PIN. Try again.");
}

async function getUsers() {
  const rows = await db.query(
    `SELECT user_id, name, email, pin_code, role, is_active
     FROM Users
     ORDER BY is_active DESC, name ASC`
  );
  return rows;
}

async function createUser(payload, requestingUserId) {
  validateUserPayload(payload);

  return db.withTransaction(async (connection) => {
    // Verify the requesting user is a manager
    const [managerRows] = await connection.execute(
      `SELECT role 
      FROM Users 
      WHERE user_id = ? AND is_active = true LIMIT 1`,
      [requestingUserId]
    );

    if (managerRows.length === 0 || managerRows[0].role !== "manager") {
      throw createValidationError("Only managers can create accounts.");
    }

    // Check for duplicate email
    const [emailRows] = await connection.execute(
      `SELECT user_id 
      FROM Users 
      WHERE email = ? LIMIT 1`,
      [payload.email.trim()]
    );

    if (emailRows.length > 0) {
      throw createValidationError("An account with that email already exists.");
    }

    const pinCode = await generateUniquePin(connection);

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const [result] = await connection.execute(
      `INSERT INTO Users (name, email, pin_code, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [payload.name.trim(), payload.email.trim().toLowerCase(), pinCode, passwordHash, payload.role]
    );

    return { userId: result.insertId, name: payload.name.trim(), role: payload.role };
  });
}

async function deactivateUser(userId, requestingUserId) {
  return db.withTransaction(async (connection) => {
    const [managerRows] = await connection.execute(
      `SELECT role 
      FROM Users 
      WHERE user_id = ? 
      AND is_active = true 
      LIMIT 1`,
      [requestingUserId]
    );

    if (managerRows.length === 0 || managerRows[0].role !== "manager") {
      throw createValidationError("Only managers can deactivate accounts.");
    }

    await connection.execute(
      `UPDATE Users 
      SET is_active = false 
      WHERE user_id = ?`,
      [userId]
    );

    return { userId, status: "deactivated" };
  });
}

async function resetUserPassword(payload, requestingUserId) {
  validatePasswordResetPayload(payload);

  return db.withTransaction(async (connection) => {
    const [managerRows] = await connection.execute(
      `SELECT role
       FROM Users
       WHERE user_id = ? AND is_active = true
       LIMIT 1`,
      [requestingUserId]
    );

    if (managerRows.length === 0 || managerRows[0].role !== "manager") {
      throw createValidationError("Only managers can reset passwords.");
    }

    const email = payload.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const [result] = await connection.execute(
      `UPDATE Users
       SET password_hash = ?
       WHERE LOWER(email) = LOWER(?)`,
      [passwordHash, email]
    );

    if (result.affectedRows === 0) {
      throw createValidationError("No employee account was found for that email.");
    }

    return { email, status: "password_reset" };
  });
}

async function verifyManager(email, password) {
  if (!email || !password) {
    throw createValidationError("Email and password are required.");
  }

  const rows = await db.query(
    `SELECT user_id, name, role, password_hash
     FROM Users
     WHERE email = ? AND is_active = true
     LIMIT 1`,
    [email.trim().toLowerCase()]
  );

  if (rows.length === 0) {
    throw createValidationError("Incorrect email or password.");
  }

  const user = rows[0];

  // Verify password matches
  const passwordValid = user.password_hash?.startsWith("$2")
    ? await bcrypt.compare(password, user.password_hash)
    : password === user.password_hash;
  if (!passwordValid) {
    throw createValidationError("Incorrect email or password.");
  }

  if (user.role !== "manager") {
    throw createValidationError("That account does not belong to a manager.");
  }

  return { approved: true, name: user.name };
}

export { getUsers, createUser, deactivateUser, resetUserPassword, verifyManager };
