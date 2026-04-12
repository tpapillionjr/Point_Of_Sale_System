export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem("authToken");
  } catch {
    return null;
  }
}

export function getStoredEmployee() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem("currentEmployee");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasStoredEmployee() {
  return Boolean(getStoredEmployee() && getStoredAuthToken());
}

export function notifyStaffSessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("pos-session-change"));
}

export function saveStaffSession(token, employee) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("authToken", token);
  window.localStorage.setItem("currentEmployee", JSON.stringify(employee));
  notifyStaffSessionChange();
}

export function clearStaffSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("currentEmployee");
  window.localStorage.removeItem("currentOrder");
  window.localStorage.removeItem("authToken");
  notifyStaffSessionChange();
}

export function isPublicRoute(pathname) {
  return pathname === "/" || pathname === "/login" || pathname.startsWith("/customer");
}

export function isManagerRoute(pathname) {
  return pathname.startsWith("/back-office") || pathname.startsWith("/reports");
}

export function canAccessManagerRoutes(employee) {
  return employee?.role === "manager";
}
