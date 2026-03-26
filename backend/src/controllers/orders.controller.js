import { createOrder } from "../services/orders.service.js";

async function postOrder(req, res) {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to create order.",
      details: error.details ?? [],
    });
  }
}

export { postOrder };
