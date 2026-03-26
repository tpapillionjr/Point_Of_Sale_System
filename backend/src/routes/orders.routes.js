import express from "express";
import { postOrder } from "../controllers/orders.controller.js";

const router = express.Router();

router.post("/", postOrder);

export default router;
