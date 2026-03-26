import express from "express";
import { postCloseOrder } from "../controllers/payments.controller.js";

const router = express.Router();

router.post("/close-order", postCloseOrder);

export default router;
