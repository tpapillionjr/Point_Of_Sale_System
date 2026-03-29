import express from "express";
import { getAllUsers, postCreateUser, putDeactivateUser } from "../controllers/users.controller.js";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/", postCreateUser);
router.put("/:userId/deactivate", putDeactivateUser);

export default router;
