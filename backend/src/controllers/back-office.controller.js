import {
  createInventoryItem,
  deleteInventoryItem,
  getBackOfficeDashboard,
  getBackOfficeData,
  updateInventoryItemAmount,
} from "../services/back-office.service.js";

async function getDashboard(req, res) {
  try {
    const dashboard = await getBackOfficeDashboard();
    res.json(dashboard);
  } catch (error) {
    console.error("Failed to fetch back office dashboard:", error.message);
    res.status(500).json({ error: "Failed to fetch back office dashboard" });
  }
}

async function getData(req, res) {
  try {
    const data = await getBackOfficeData(req.query);
    res.json(data);
  } catch (error) {
    console.error("Failed to fetch back office data:", error.message);
    res.status(500).json({ error: "Failed to fetch back office data" });
  }
}

async function postInventoryItem(req, res) {
  try {
    const result = await createInventoryItem(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Failed to create inventory item:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.statusCode ? error.message : "Failed to create inventory item" });
  }
}

async function removeInventoryItem(req, res) {
  try {
    const result = await deleteInventoryItem(req.params.type, decodeURIComponent(req.params.name));
    res.json(result);
  } catch (error) {
    console.error("Failed to delete inventory item:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.statusCode ? error.message : "Failed to delete inventory item" });
  }
}

async function patchInventoryItemAmount(req, res) {
  try {
    const result = await updateInventoryItemAmount(
      req.params.type,
      decodeURIComponent(req.params.name),
      req.body?.amountAvailable
    );
    res.json(result);
  } catch (error) {
    console.error("Failed to update inventory count:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.statusCode ? error.message : "Failed to update inventory count" });
  }
}

export { getDashboard, getData, patchInventoryItemAmount, postInventoryItem, removeInventoryItem };
