import {
  createLaborShift,
  createInventoryItem,
  deleteInventoryItem,
  getBackOfficeDashboard,
  getBackOfficeData,
  receivePurchasingStock,
  updateLaborShift,
  updateInventoryItemAmount,
} from "../services/back-office.service.js";
import {
  getBackOfficeSettings,
  updateBackOfficeSettings,
} from "../services/settings.service.js";

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

async function postReceivePurchasingStock(req, res) {
  try {
    const result = await receivePurchasingStock(req.body);
    res.json(result);
  } catch (error) {
    console.error("Failed to receive purchasing stock:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.statusCode ? error.message : "Failed to receive purchasing stock" });
  }
}

async function getSettings(_req, res) {
  try {
    const result = await getBackOfficeSettings();
    res.json(result);
  } catch (error) {
    console.error("Failed to get back-office settings:", error.message);
    res.status(error.statusCode ?? 500).json({
      error: error.statusCode ? error.message : "Failed to get back-office settings",
    });
  }
}

async function patchSettings(req, res) {
  try {
    const result = await updateBackOfficeSettings(req.body, req.user?.userId ?? null);
    res.json(result);
  } catch (error) {
    console.error("Failed to update back-office settings:", error.message);
    res.status(error.statusCode ?? 500).json({
      error: error.statusCode ? error.message : "Failed to update back-office settings",
    });
  }
}

async function postLaborShift(req, res) {
  try {
    const result = await createLaborShift(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Failed to create labor shift:", error.message);
    res.status(error.statusCode ?? 500).json({
      error: error.statusCode ? error.message : "Failed to create labor shift",
    });
  }
}

async function patchLaborShift(req, res) {
  try {
    const result = await updateLaborShift(req.params.shiftId, req.body);
    res.json(result);
  } catch (error) {
    console.error("Failed to update labor shift:", error.message);
    res.status(error.statusCode ?? 500).json({
      error: error.statusCode ? error.message : "Failed to update labor shift",
    });
  }
}

export {
  getDashboard,
  getData,
  getSettings,
  patchInventoryItemAmount,
  patchLaborShift,
  patchSettings,
  postInventoryItem,
  postLaborShift,
  postReceivePurchasingStock,
  removeInventoryItem,
};
