import db from "../db/index.js";
import jwt from "jsonwebtoken";
import { createValidationError } from "../validation/business-rules.js";

function validateCredentials(identifier, password) {
  if (typeof identifier !== "string" || identifier.trim().length === 0) {
    throw createValidationError("Username or email is required.");
  }

  if (typeof password !== "string" || password.length === 0) {
    throw createValidationError("Password is required.");
  }
}

function formatRole(role) {
  if (role === "employee") {
    return "Server";
  }

  if (role === "manager") {
    return "Manager";
  }

  if (role === "kitchen") {
    return "Kitchen";
  }

  return role;
}

function createAuthToken(user) {
  return jwt.sign(
    {
      sub: user.user_id,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

function toSessionPayload(user, shift) {
  return {
    token: createAuthToken(user),
    userId: user.user_id,
    name: user.name,
    role: user.role,
    roles: [formatRole(user.role)],
    scheduledToday: Boolean(shift),
    clockedIn: Boolean(shift?.clockIn && !shift?.clockOut),
    shift,
  };
}

async function findUserByCredentials(connection, identifier, password) {
  const [rows] = await connection.execute(
    `SELECT user_id, name, email, role, is_active, password_hash
     FROM Users
     WHERE (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?))
     LIMIT 1`,
    [identifier.trim(), identifier.trim()]
  );

  if (rows.length === 0) {
    throw createValidationError("Incorrect username/email or password.");
  }

  if (!rows[0].is_active) {
    throw createValidationError("This employee account is inactive.");
  }

  if (password !== rows[0].password_hash) {
    throw createValidationError("Incorrect username/email or password.");
  }

  return rows[0];
}

async function findUserById(connection, userId) {
  const parsedUserId = Number.parseInt(userId, 10);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw createValidationError("Authenticated user ID is invalid.");
  }

  const [rows] = await connection.execute(
    `SELECT user_id, name, role, is_active
     FROM Users
     WHERE user_id = ?
     LIMIT 1`,
    [parsedUserId]
  );

  if (rows.length === 0) {
    throw createValidationError("Authenticated user does not exist.");
  }

  if (!rows[0].is_active) {
    throw createValidationError("This employee account is inactive.");
  }

  return rows[0];
}

async function findCurrentShift(connection, userId) {
  const [rows] = await connection.execute(
    `SELECT
      shift_id AS shiftId,
      scheduled_start AS scheduledStart,
      scheduled_end AS scheduledEnd,
      clock_in AS clockIn,
      clock_out AS clockOut,
      tip_declared_amount AS tipDeclaredAmount,
      tip_declared_at AS tipDeclaredAt
     FROM Employee_Shift
     WHERE user_id = ?
       AND DATE(scheduled_start) = CURRENT_DATE
     ORDER BY scheduled_start ASC
     LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}

async function getClockSession(credentials) {
  const identifier = credentials?.identifier ?? credentials?.email ?? credentials?.username;
  const password = credentials?.password;
  validateCredentials(identifier, password);

  return db.withTransaction(async (connection) => {
    const user = await findUserByCredentials(connection, identifier, password);
    const shift = await findCurrentShift(connection, user.user_id);

    return toSessionPayload(user, shift);
  });
}

async function authenticateCredentials(credentials) {
  const identifier = credentials?.identifier ?? credentials?.email ?? credentials?.username;
  const password = credentials?.password;
  validateCredentials(identifier, password);

  return db.withTransaction(async (connection) => {
    const user = await findUserByCredentials(connection, identifier, password);

    return {
      authenticated: true,
      user: {
        userId: user.user_id,
        name: user.name,
        role: user.role,
        roles: [formatRole(user.role)],
      },
    };
  });
}

async function clockIn(userId) {
  return db.withTransaction(async (connection) => {
    const user = await findUserById(connection, userId);
    const shift = await findCurrentShift(connection, user.user_id);

    if (!shift) {
      throw createValidationError("Employee must be scheduled to clock in today.");
    }

    if (shift.clockIn && !shift.clockOut) {
      throw createValidationError("Employee is already clocked in.");
    }

    const [workingRows] = await connection.execute(
      `SELECT COUNT(*) AS activeStaff
       FROM Employee_Shift
       WHERE clock_in IS NOT NULL
         AND clock_out IS NULL`,
      []
    );

    if (workingRows[0].activeStaff >= 8) {
      throw createValidationError("Maximum staffing level reached. No more than 8 staff can work at once.");
    }

    await connection.execute(
      `UPDATE Employee_Shift
       SET clock_in = CURRENT_TIMESTAMP,
           clock_out = NULL,
           tip_declared_amount = 0.00,
           tip_declared_at = NULL
       WHERE shift_id = ?`,
      [shift.shiftId]
    );

    const updatedShift = await findCurrentShift(connection, user.user_id);
    return toSessionPayload(user, updatedShift);
  });
}

async function clockOut(userId, tipDeclaredAmount = null) {
  return db.withTransaction(async (connection) => {
    const user = await findUserById(connection, userId);
    const shift = await findCurrentShift(connection, user.user_id);

    if (!shift || !shift.clockIn || shift.clockOut) {
      throw createValidationError("Employee is not currently clocked in.");
    }

    const tipAmount = tipDeclaredAmount == null ? null : Number(tipDeclaredAmount);
    if (user.role === "employee") {
      if (!Number.isFinite(tipAmount) || tipAmount < 0) {
        throw createValidationError("Servers must declare tips before clocking out.");
      }
    }

    await connection.execute(
      `UPDATE Employee_Shift
       SET clock_out = CURRENT_TIMESTAMP,
           tip_declared_amount = ?,
           tip_declared_at = CASE
             WHEN ? IS NULL THEN tip_declared_at
             ELSE CURRENT_TIMESTAMP
           END
       WHERE shift_id = ?`,
      [tipAmount ?? 0, tipAmount, shift.shiftId]
    );

    return {
      userId: user.user_id,
      name: user.name,
      role: user.role,
      roles: [formatRole(user.role)],
      scheduledToday: true,
      clockedIn: false,
      shift: {
        ...shift,
        clockOut: new Date().toISOString(),
        tipDeclaredAmount: tipAmount ?? 0,
      },
    };
  });
}

export { authenticateCredentials, getClockSession, clockIn, clockOut };
