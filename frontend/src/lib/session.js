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

export function isPublicRoute(pathname) {
  return pathname === "/" || pathname === "/clock-in" || pathname.startsWith("/customer");
}

export function isManagerRoute(pathname) {
  return pathname.startsWith("/back-office") || pathname.startsWith("/reports");
}

export function canAccessManagerRoutes(employee) {
  return employee?.role === "manager";
}
