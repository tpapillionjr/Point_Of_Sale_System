import db from "../db/index.js";
import { createValidationError } from "../validation/business-rules.js";

function validateUserPayload(payload) {
  const issues = [];

  if (!payload?.name || typeof payload.name !== "string" || payload.name.trim().length === 0) {
    issues.push("name is required.");
  }

  if (!payload?.email || typeof payload.email !== "string" || !payload.email.includes("@")) {
    issues.push("a valid email is required.");
  }

  if (!payload?.pin_code || !/^\d{4}$/.test(payload.pin_code)) {
    issues.push("pin_code must be exactly 4 digits.");
  }

  const allowedRoles = new Set(["employee", "manager", "kitchen"]);
  if (!payload?.role || !allowedRoles.has(payload.role)) {
    issues.push("role must be employee, manager, or kitchen.");
  }

  if (issues.length > 0) {
    throw createValidationError("User validation failed.", issues);
  }
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

    // Check for duplicate PIN
    const [pinRows] = await connection.execute(
      `SELECT user_id 
      FROM Users 
      WHERE pin_code = ? LIMIT 1`,
      [payload.pin_code]
    );

    if (pinRows.length > 0) {
      throw createValidationError("That PIN is already in use.");
    }

    const [result] = await connection.execute(
      `INSERT INTO Users (name, email, pin_code, password_hash, role)
       VALUES (?, ?, ?, '', ?)`,
      [payload.name.trim(), payload.email.trim(), payload.pin_code, payload.role]
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
  const passwordValid = password === user.password_hash;
  if (!passwordValid) {
    throw createValidationError("Incorrect email or password.");
  }

  if (user.role !== "manager") {
    throw createValidationError("That account does not belong to a manager.");
  }

  return { approved: true, name: user.name };
}

export { getUsers, createUser, deactivateUser, verifyManager };
