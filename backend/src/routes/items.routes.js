import express from "express";
import { getItems } from "../controllers/items.controller.js";

const router = express.Router();

router.get("/", getItems);

export default router;
