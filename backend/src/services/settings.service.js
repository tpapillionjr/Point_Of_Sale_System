import db from "../db/index.js";
import {
  BACK_OFFICE_SETTINGS_FIELDS,
  DEFAULT_BACK_OFFICE_SETTINGS,
  SETTINGS_KEYS,
  validateBackOfficeSettingsPatch,
} from "../schema/settings.schema.js";

let settingsTableReadyPromise = null;

function parseStoredSettingValue(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

async function ensureBackOfficeSettingsTable() {
  if (!settingsTableReadyPromise) {
    settingsTableReadyPromise = db.pool.execute(
      `CREATE TABLE IF NOT EXISTS Back_Office_Settings (
         setting_key VARCHAR(120) PRIMARY KEY,
         setting_value JSON NOT NULL,
         updated_by INT NULL,
         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         CONSTRAINT fk_back_office_settings_user
           FOREIGN KEY (updated_by) REFERENCES Users(user_id)
           ON DELETE SET NULL
       )`
    );
  }

  await settingsTableReadyPromise;
}

async function getBackOfficeSettings() {
  await ensureBackOfficeSettingsTable();

  const rows = await db.query(
    `SELECT setting_key AS settingKey, setting_value AS settingValue, updated_by AS updatedBy, updated_at AS updatedAt
     FROM Back_Office_Settings
     WHERE setting_key IN (?, ?, ?, ?)`,
    [
      SETTINGS_KEYS.taxRate,
      SETTINGS_KEYS.receiptPrefix,
      SETTINGS_KEYS.requireManagerApprovalForVoids,
      SETTINGS_KEYS.requireManagerApprovalForRefunds,
    ]
  );

  const settings = { ...DEFAULT_BACK_OFFICE_SETTINGS };
  const metadata = {};

  for (const row of rows) {
    settings[row.settingKey] = parseStoredSettingValue(row.settingValue);
    metadata[row.settingKey] = {
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt,
    };
  }

  return {
    settings,
    metadata,
    persistedCount: rows.length,
    fields: BACK_OFFICE_SETTINGS_FIELDS,
  };
}

async function updateBackOfficeSettings(payload = {}, updatedBy = null) {
  const patch = validateBackOfficeSettingsPatch(payload);
  await ensureBackOfficeSettingsTable();

  await db.withTransaction(async (connection) => {
    for (const [settingKey, settingValue] of Object.entries(patch)) {
      const encodedValue = JSON.stringify(settingValue);
      await connection.execute(
        `INSERT INTO Back_Office_Settings (setting_key, setting_value, updated_by)
         VALUES (?, CAST(? AS JSON), ?)
         ON DUPLICATE KEY UPDATE
           setting_value = CAST(? AS JSON),
           updated_by = VALUES(updated_by),
           updated_at = CURRENT_TIMESTAMP`,
        [settingKey, encodedValue, updatedBy, encodedValue]
      );
    }
  });

  return getBackOfficeSettings();
}

export { getBackOfficeSettings, updateBackOfficeSettings };
