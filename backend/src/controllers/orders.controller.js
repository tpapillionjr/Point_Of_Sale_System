import { cancelOrder, createOrder, addItemsToOrder, findActiveOrderByTableNumber, getActiveTakeoutOrders } from "../services/orders.service.js";

async function postOrder(req, res) {
  try {
    const order = await createOrder({
      ...req.body,
      createdBy: req.user?.sub,
    });
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
    const result = await cancelOrder({
      ...req.body,
      voidedBy: req.user?.sub ?? req.user?.userId ?? req.body?.voidedBy,
    });
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to cancel order.",
      details: error.details ?? [],
    });
  }
}

async function getActiveOrderByTable(req, res) {
  try {
    const result = await findActiveOrderByTableNumber(req.params.tableNumber);
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to find active order.",
      details: error.details ?? [],
    });
  }
}

async function postAddItems(req, res) {
  try {
    const { orderId } = req.params;
    const { items, userId } = req.body;
    const result = await addItemsToOrder(orderId, items, userId);
    res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to add items to order.",
      details: error.details ?? [],
    });
  }
}

async function getActiveTakeoutOrdersHandler(_req, res) {
  try {
    const result = await getActiveTakeoutOrders();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch takeout orders." });
  }
}

export { postOrder, postCancelOrder, postAddItems, getActiveOrderByTable, getActiveTakeoutOrdersHandler };
