const CUSTOMER_SESSION_EVENT = "pos-customer-session-change";

const LIVE_KEYS = {
  authToken: "customerAuthToken",
  customerInfo: "customerInfo",
  cart: "customerCart",
  estimatedPoints: "estimatedPoints",
};

const PREVIEW_KEYS = {
  authToken: "previewCustomerAuthToken",
  customerInfo: "previewCustomerInfo",
  cart: "previewCustomerCart",
  estimatedPoints: "previewEstimatedPoints",
};

const PREVIEW_CUSTOMER = {
  customerId: null,
  firstName: "Preview",
  lastName: "Guest",
  email: "preview@lumi.local",
  phone: "7135550182",
  pointsBalance: 0,
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function dispatchCustomerSessionChange() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event(CUSTOMER_SESSION_EVENT));
}

function getPreviewQueryValue() {
  if (!canUseStorage()) {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const preview = params.get("preview");
  return preview === "1" || preview === "true";
}

export function isCustomerPreviewMode() {
  return getPreviewQueryValue();
}

export function getCustomerStorageKeys(preview = isCustomerPreviewMode()) {
  return preview ? PREVIEW_KEYS : LIVE_KEYS;
}

function readJson(key, fallback) {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function readStoredCustomerInfo(preview = isCustomerPreviewMode()) {
  return readJson(getCustomerStorageKeys(preview).customerInfo, null);
}

export function writeStoredCustomerInfo(customer, preview = isCustomerPreviewMode()) {
  if (!canUseStorage()) {
    return;
  }

  const { customerInfo } = getCustomerStorageKeys(preview);
  if (!customer) {
    window.localStorage.removeItem(customerInfo);
  } else {
    window.localStorage.setItem(customerInfo, JSON.stringify(customer));
  }
  dispatchCustomerSessionChange();
}

export function readStoredCustomerToken(preview = isCustomerPreviewMode()) {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(getCustomerStorageKeys(preview).authToken);
}

export function writeStoredCustomerToken(token, preview = isCustomerPreviewMode()) {
  if (!canUseStorage()) {
    return;
  }

  const { authToken } = getCustomerStorageKeys(preview);
  if (!token) {
    window.localStorage.removeItem(authToken);
  } else {
    window.localStorage.setItem(authToken, token);
  }
  dispatchCustomerSessionChange();
}

export function readStoredCustomerCart(preview = isCustomerPreviewMode()) {
  return readJson(getCustomerStorageKeys(preview).cart, []);
}

export function writeStoredCustomerCart(cart, preview = isCustomerPreviewMode()) {
  if (!canUseStorage()) {
    return;
  }

  const { cart: cartKey } = getCustomerStorageKeys(preview);
  if (!Array.isArray(cart) || cart.length === 0) {
    window.localStorage.removeItem(cartKey);
  } else {
    window.localStorage.setItem(cartKey, JSON.stringify(cart));
  }
  dispatchCustomerSessionChange();
}

export function writeStoredEstimatedPoints(points, preview = isCustomerPreviewMode()) {
  if (!canUseStorage()) {
    return;
  }

  const { estimatedPoints } = getCustomerStorageKeys(preview);
  if (points == null) {
    window.localStorage.removeItem(estimatedPoints);
  } else {
    window.localStorage.setItem(estimatedPoints, String(points));
  }
  dispatchCustomerSessionChange();
}

export function clearCustomerSession(preview = isCustomerPreviewMode()) {
  if (!canUseStorage()) {
    return;
  }

  const keys = getCustomerStorageKeys(preview);
  Object.values(keys).forEach((key) => {
    window.localStorage.removeItem(key);
  });
  dispatchCustomerSessionChange();
}

export function seedCustomerPreviewSession() {
  if (!canUseStorage()) {
    return;
  }

  writeStoredCustomerInfo(PREVIEW_CUSTOMER, true);
  writeStoredCustomerToken(null, true);
  writeStoredCustomerCart([], true);
  writeStoredEstimatedPoints(null, true);
}

export function ensureCustomerPreviewSession() {
  if (!readStoredCustomerInfo(true)) {
    seedCustomerPreviewSession();
  }
}

export function withCustomerPreview(path, preview = isCustomerPreviewMode()) {
  if (!preview || !path) {
    return path;
  }

  const [pathname, hash = ""] = path.split("#");
  const [base, query = ""] = pathname.split("?");
  const params = new URLSearchParams(query);
  params.set("preview", "1");
  if (canUseStorage()) {
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get("embed") === "1") {
      params.set("embed", "1");
    }
  }
  const next = `${base}?${params.toString()}`;
  return hash ? `${next}#${hash}` : next;
}

export function subscribeToCustomerSession(listener) {
  if (!canUseStorage()) {
    return () => {};
  }

  window.addEventListener("storage", listener);
  window.addEventListener(CUSTOMER_SESSION_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CUSTOMER_SESSION_EVENT, listener);
  };
}
