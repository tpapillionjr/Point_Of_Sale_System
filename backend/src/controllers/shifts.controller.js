import { authenticatePin, clockIn, clockOut, getClockSession } from "../services/shifts.service.js";

async function authShift(req, res) {
  try {
    await authenticatePin(req.body?.pin);
    const session = await getClockSession(req.body?.pin);
    res.json(session);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to authenticate shift session.",
      details: error.details ?? [],
    });
  }
}

async function postClockIn(req, res) {
  try {
    const session = await clockIn(req.user?.sub);
    res.json(session);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to clock in.",
      details: error.details ?? [],
    });
  }
}

async function postClockOut(req, res) {
  try {
    const session = await clockOut(req.user?.sub, req.body?.tipDeclaredAmount);
    res.json(session);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to clock out.",
      details: error.details ?? [],
    });
  }
}

export { authShift, postClockIn, postClockOut };
