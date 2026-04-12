import db from "../db/index.js";

// ── Customer-facing ──────────────────────────────────────────

async function getActiveRewards() {
  return db.query(
    `SELECT r.reward_id, r.name, r.points_cost, r.menu_item_id,
            mi.name AS menu_item_name
     FROM Loyalty_Rewards r
     LEFT JOIN Menu_Item mi ON mi.menu_item_id = r.menu_item_id
     WHERE r.is_active = TRUE
     ORDER BY r.points_cost ASC`
  );
}

async function getCustomerLoyaltyInfo(customerId) {
  const [balanceRows, transactions] = await Promise.all([
    db.query(
      `SELECT points_balance FROM Customer WHERE customer_num_id = ? LIMIT 1`,
      [customerId]
    ),
    db.query(
      `SELECT transaction_id, type, points, description, created_at
       FROM Loyalty_Transactions
       WHERE customer_num_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [customerId]
    ),
  ]);

  return {
    pointsBalance: balanceRows[0]?.points_balance ?? 0,
    transactions,
  };
}

async function redeemReward(customerId, rewardId) {
  return db.withTransaction(async (connection) => {
    const [rewardRows] = await connection.execute(
      `SELECT reward_id, name, points_cost, is_active FROM Loyalty_Rewards WHERE reward_id = ? LIMIT 1`,
      [rewardId]
    );
    if (rewardRows.length === 0) throw { status: 404, message: "Reward not found." };
    const reward = rewardRows[0];
    if (!reward.is_active) throw { status: 400, message: "This reward is no longer available." };

    const [customerRows] = await connection.execute(
      `SELECT points_balance FROM Customer WHERE customer_num_id = ? LIMIT 1`,
      [customerId]
    );
    if (customerRows.length === 0) throw { status: 404, message: "Customer not found." };
    const { points_balance } = customerRows[0];

    if (points_balance < reward.points_cost) {
      throw { status: 400, message: `Not enough points. Need ${reward.points_cost}, have ${points_balance}.` };
    }

    await connection.execute(
      `UPDATE Customer SET points_balance = points_balance - ? WHERE customer_num_id = ?`,
      [reward.points_cost, customerId]
    );

    await connection.execute(
      `INSERT INTO Loyalty_Transactions (customer_num_id, online_order_id, type, points, description)
       VALUES (?, NULL, 'redeemed', ?, ?)`,
      [customerId, reward.points_cost, `Redeemed: ${reward.name}`]
    );

    return { newBalance: points_balance - reward.points_cost, rewardName: reward.name };
  });
}

// ── POS staff ────────────────────────────────────────────────

async function lookupCustomerByPhone(phone) {
  const rows = await db.query(
    `SELECT customer_num_id, first_name, last_name, phone_number, points_balance
     FROM Customer WHERE phone_number = ? LIMIT 1`,
    [phone]
  );
  return rows[0] ?? null;
}

async function staffAwardPoints(customerId, onlineOrderId, total) {
  const points = Math.floor(total) * 10;
  if (points <= 0) throw { status: 400, message: "Order total too low to earn points." };

  return db.withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE Customer SET points_balance = points_balance + ? WHERE customer_num_id = ?`,
      [points, customerId]
    );

    const description = onlineOrderId
      ? `Points earned from online order #${onlineOrderId}`
      : "Points earned from in-store order";

    await connection.execute(
      `INSERT INTO Loyalty_Transactions (customer_num_id, online_order_id, type, points, description)
       VALUES (?, ?, 'earned', ?, ?)`,
      [customerId, onlineOrderId ?? null, points, description]
    );

    const [rows] = await connection.execute(
      `SELECT points_balance FROM Customer WHERE customer_num_id = ? LIMIT 1`,
      [customerId]
    );

    return { pointsAwarded: points, newBalance: rows[0].points_balance };
  });
}

// ── Back-office ──────────────────────────────────────────────

async function getAllRewards() {
  return db.query(
    `SELECT r.reward_id, r.name, r.points_cost, r.menu_item_id, r.is_active, r.created_at,
            mi.name AS menu_item_name
     FROM Loyalty_Rewards r
     LEFT JOIN Menu_Item mi ON mi.menu_item_id = r.menu_item_id
     ORDER BY r.points_cost ASC`
  );
}

async function createReward(name, pointsCost, menuItemId) {
  const result = await db.query(
    `INSERT INTO Loyalty_Rewards (name, points_cost, menu_item_id) VALUES (?, ?, ?)`,
    [name.trim(), pointsCost, menuItemId ?? null]
  );
  return result.insertId;
}

async function updateReward(rewardId, name, pointsCost, menuItemId) {
  await db.query(
    `UPDATE Loyalty_Rewards SET name = ?, points_cost = ?, menu_item_id = ? WHERE reward_id = ?`,
    [name.trim(), pointsCost, menuItemId ?? null, rewardId]
  );
}

async function toggleReward(rewardId) {
  await db.query(
    `UPDATE Loyalty_Rewards SET is_active = NOT is_active WHERE reward_id = ?`,
    [rewardId]
  );
  const rows = await db.query(
    `SELECT is_active FROM Loyalty_Rewards WHERE reward_id = ? LIMIT 1`,
    [rewardId]
  );
  return rows[0]?.is_active ?? false;
}

export {
  getActiveRewards,
  getCustomerLoyaltyInfo,
  redeemReward,
  lookupCustomerByPhone,
  staffAwardPoints,
  getAllRewards,
  createReward,
  updateReward,
  toggleReward,
};
