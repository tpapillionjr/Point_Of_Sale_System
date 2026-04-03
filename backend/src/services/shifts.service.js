import db from "../db/index.js";
import { createValidationError } from "../validation/business-rules.js";

function validatePin(pin) {
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    throw createValidationError("PIN must be exactly 4 digits.");
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

async function findUserByPin(connection, pin) {
  const [rows] = await connection.execute(
    `SELECT user_id, name, role, is_active
     FROM Users
     WHERE pin_code = ?
     LIMIT 1`,
    [pin]
  );

  if (rows.length === 0) {
    throw createValidationError("Incorrect PIN. Try again.");
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

async function getClockSession(pin) {
  validatePin(pin);

  return db.withTransaction(async (connection) => {
    const user = await findUserByPin(connection, pin);
    const shift = await findCurrentShift(connection, user.user_id);

    return {
      userId: user.user_id,
      name: user.name,
      role: user.role,
      roles: [formatRole(user.role)],
      scheduledToday: Boolean(shift),
      clockedIn: Boolean(shift?.clockIn && !shift?.clockOut),
      shift,
    };
  });
}

async function authenticatePin(pin) {
  validatePin(pin);

  return db.withTransaction(async (connection) => {
    const user = await findUserByPin(connection, pin);

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

async function clockIn(pin) {
  validatePin(pin);

  return db.withTransaction(async (connection) => {
    const user = await findUserByPin(connection, pin);
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

    return getClockSession(pin);
  });
}

async function clockOut(pin, tipDeclaredAmount = null) {
  validatePin(pin);

  return db.withTransaction(async (connection) => {
    const user = await findUserByPin(connection, pin);
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

export { authenticatePin, getClockSession, clockIn, clockOut };
