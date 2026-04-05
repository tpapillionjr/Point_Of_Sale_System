import express from "express";
import { getAllUsers, postCreateUser, putDeactivateUser, postVerifyManager } from "../controllers/users.controller.js";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/", postCreateUser);
router.post("/verify-manager", postVerifyManager);
router.put("/:userId/deactivate", putDeactivateUser);

export default router;
