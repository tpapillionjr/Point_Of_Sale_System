import { closeOrder } from "../services/payments.service.js";

async function postCloseOrder(req, res) {
  try {
    const result = await closeOrder(req.body);
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to close order.",
      details: error.details ?? [],
    });
  }
}

export { postCloseOrder };
