import { getUsers, createUser, deactivateUser, verifyManager } from "../services/users.service.js";

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

export { getAllUsers, postCreateUser, putDeactivateUser, postVerifyManager };
