import express from "express";
import { postCancelOrder, postOrder } from "../controllers/orders.controller.js";

const router = express.Router();

router.post("/", postOrder);
router.post("/cancel", postCancelOrder);

export default router;
