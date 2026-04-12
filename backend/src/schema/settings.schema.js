const SETTINGS_KEYS = {
  taxRate: "taxRate",
  receiptPrefix: "receiptPrefix",
  requireManagerApprovalForVoids: "requireManagerApprovalForVoids",
  requireManagerApprovalForRefunds: "requireManagerApprovalForRefunds",
};

const DEFAULT_BACK_OFFICE_SETTINGS = {
  taxRate: 0.0825,
  receiptPrefix: "POS",
  requireManagerApprovalForVoids: true,
  requireManagerApprovalForRefunds: true,
};

const BACK_OFFICE_SETTINGS_FIELDS = [
  {
    key: SETTINGS_KEYS.taxRate,
    label: "Tax Rate",
    description: "Applied as a decimal rate. Example: 0.0825 for 8.25%.",
    type: "number",
  },
  {
    key: SETTINGS_KEYS.receiptPrefix,
    label: "Receipt Prefix",
    description: "Prepended to generated receipt references and operational displays.",
    type: "string",
  },
  {
    key: SETTINGS_KEYS.requireManagerApprovalForVoids,
    label: "Manager Approval For Voids",
    description: "Requires manager approval before voiding checks or removing sent items.",
    type: "boolean",
  },
  {
    key: SETTINGS_KEYS.requireManagerApprovalForRefunds,
    label: "Manager Approval For Refunds",
    description: "Requires manager approval before refund actions are completed.",
    type: "boolean",
  },
];

function validateBackOfficeSettingsPatch(payload = {}) {
  const patch = {};

  if (Object.hasOwn(payload, SETTINGS_KEYS.taxRate)) {
    const taxRate = Number(payload.taxRate);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
      const error = new Error("taxRate must be a decimal between 0 and 1.");
      error.statusCode = 400;
      throw error;
    }

    patch.taxRate = Number(taxRate.toFixed(4));
  }

  if (Object.hasOwn(payload, SETTINGS_KEYS.receiptPrefix)) {
    const receiptPrefix = String(payload.receiptPrefix ?? "").trim().toUpperCase();
    if (!receiptPrefix || receiptPrefix.length > 12) {
      const error = new Error("receiptPrefix is required and must be at most 12 characters.");
      error.statusCode = 400;
      throw error;
    }

    patch.receiptPrefix = receiptPrefix;
  }

  if (Object.hasOwn(payload, SETTINGS_KEYS.requireManagerApprovalForVoids)) {
    patch.requireManagerApprovalForVoids = Boolean(payload.requireManagerApprovalForVoids);
  }

  if (Object.hasOwn(payload, SETTINGS_KEYS.requireManagerApprovalForRefunds)) {
    patch.requireManagerApprovalForRefunds = Boolean(payload.requireManagerApprovalForRefunds);
  }

  if (Object.keys(patch).length === 0) {
    const error = new Error("At least one settings field is required.");
    error.statusCode = 400;
    throw error;
  }

  return patch;
}

export {
  BACK_OFFICE_SETTINGS_FIELDS,
  DEFAULT_BACK_OFFICE_SETTINGS,
  SETTINGS_KEYS,
  validateBackOfficeSettingsPatch,
};
