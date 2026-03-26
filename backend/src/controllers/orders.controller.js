import { cancelOrder, createOrder } from "../services/orders.service.js";

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

async function postCancelOrder(req, res) {
  try {
    const result = await cancelOrder(req.body);
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to cancel order.",
      details: error.details ?? [],
    });
  }
}

export { postOrder, postCancelOrder };
