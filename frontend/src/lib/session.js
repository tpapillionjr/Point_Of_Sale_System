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

export function isManagerRoute(pathname) {
  return pathname.startsWith("/back-office") || pathname.startsWith("/reports");
}

export function canAccessManagerRoutes(employee) {
  return employee?.role === "manager";
}
