import {
  adjustCustomerPoints,
  getActiveRewards,
  getCustomerLoyaltyInfo,
  redeemReward,
  lookupCustomerByPhone,
  staffAwardPoints,
  getAllRewards,
  createReward,
  updateReward,
  toggleReward,
} from "../services/loyalty.service.js";

// ── Customer-facing ──────────────────────────────────────────

async function getRewards(req, res) {
  try {
    const rewards = await getActiveRewards();
    res.json(rewards);
  } catch (error) {
    console.error("getRewards error:", error);
    res.status(500).json({ error: "Failed to fetch rewards." });
  }
}

async function getLoyaltyInfo(req, res) {
  try {
    const customerId = req.customer.customerId;
    const info = await getCustomerLoyaltyInfo(customerId);
    res.json(info);
  } catch (error) {
    console.error("getLoyaltyInfo error:", error);
    res.status(500).json({ error: "Failed to fetch loyalty info." });
  }
}

async function redeem(req, res) {
  try {
    const customerId = req.customer.customerId;
    const rewardId = Number(req.body.rewardId);

    if (!rewardId || rewardId <= 0) {
      return res.status(400).json({ error: "Valid rewardId required." });
    }

    const result = await redeemReward(customerId, rewardId);
    res.json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("redeem error:", error);
    res.status(500).json({ error: "Failed to redeem reward." });
  }
}

// ── POS staff ────────────────────────────────────────────────

async function lookupCustomer(req, res) {
  try {
    const { phone } = req.query;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "10-digit phone number required." });
    }

    const customer = await lookupCustomerByPhone(phone);

    if (!customer) {
      return res.status(404).json({ error: "Account does not exist." });
    }

    const rewards = await getActiveRewards();

    res.json({
      customerId: customer.customer_num_id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone_number,
      pointsBalance: customer.points_balance,
      availableRewards: rewards.filter(r => r.points_cost <= customer.points_balance),
      allRewards: rewards,
    });
  } catch (error) {
    console.error("lookupCustomer error:", error);
    res.status(500).json({ error: "Failed to look up customer." });
  }
}

async function awardPoints(req, res) {
  try {
    const { customerId, onlineOrderId, total } = req.body;

    if (!customerId || total == null) {
      return res.status(400).json({ error: "customerId and total are required." });
    }

    const result = await staffAwardPoints(
      Number(customerId),
      onlineOrderId ? Number(onlineOrderId) : null,
      Number(total)
    );

    res.json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("awardPoints error:", error);
    res.status(500).json({ error: "Failed to award points." });
  }
}

// ── Back-office ──────────────────────────────────────────────

async function listAllRewards(req, res) {
  try {
    const rewards = await getAllRewards();
    res.json(rewards);
  } catch (error) {
    console.error("listAllRewards error:", error);
    res.status(500).json({ error: "Failed to fetch rewards." });
  }
}

async function createLoyaltyReward(req, res) {
  try {
    const { name, pointsCost, menuItemId } = req.body;

    if (!name || !pointsCost) {
      return res.status(400).json({ error: "name and pointsCost are required." });
    }

    if (!Number.isInteger(Number(pointsCost)) || Number(pointsCost) < 1) {
      return res.status(400).json({ error: "pointsCost must be a positive integer." });
    }

    const rewardId = await createReward(name, Number(pointsCost), menuItemId ?? null);
    res.status(201).json({ rewardId });
  } catch (error) {
    console.error("createLoyaltyReward error:", error);
    res.status(500).json({ error: "Failed to create reward." });
  }
}

async function updateLoyaltyReward(req, res) {
  try {
    const rewardId = Number(req.params.id);
    const { name, pointsCost, menuItemId } = req.body;

    if (!rewardId || rewardId <= 0) {
      return res.status(400).json({ error: "Invalid reward ID." });
    }

    if (!name || !pointsCost) {
      return res.status(400).json({ error: "name and pointsCost are required." });
    }

    if (!Number.isInteger(Number(pointsCost)) || Number(pointsCost) < 1) {
      return res.status(400).json({ error: "pointsCost must be a positive integer." });
    }

    await updateReward(rewardId, name, Number(pointsCost), menuItemId ?? null);
    res.json({ success: true });
  } catch (error) {
    console.error("updateLoyaltyReward error:", error);
    res.status(500).json({ error: "Failed to update reward." });
  }
}

async function toggleLoyaltyReward(req, res) {
  try {
    const rewardId = Number(req.params.id);

    if (!rewardId || rewardId <= 0) {
      return res.status(400).json({ error: "Invalid reward ID." });
    }

    const isActive = await toggleReward(rewardId);
    res.json({ rewardId, isActive });
  } catch (error) {
    console.error("toggleLoyaltyReward error:", error);
    res.status(500).json({ error: "Failed to toggle reward." });
  }
}

async function adjustLoyaltyPoints(req, res) {
  try {
    const customerId = Number(req.params.customerId);
    const pointsDelta = Number(req.body?.pointsDelta);
    const reason = req.body?.reason;

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: "Invalid customer ID." });
    }

    if (!Number.isInteger(pointsDelta) || pointsDelta === 0) {
      return res.status(400).json({ error: "pointsDelta must be a non-zero whole number." });
    }

    const result = await adjustCustomerPoints(customerId, pointsDelta, reason);
    res.json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("adjustLoyaltyPoints error:", error);
    res.status(500).json({ error: "Failed to adjust customer points." });
  }
}

export {
  adjustLoyaltyPoints,
  getRewards,
  getLoyaltyInfo,
  redeem,
  lookupCustomer,
  awardPoints,
  listAllRewards,
  createLoyaltyReward,
  updateLoyaltyReward,
  toggleLoyaltyReward,
};
