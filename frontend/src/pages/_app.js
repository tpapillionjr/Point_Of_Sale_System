import "@/styles/globals.css";
import AppChrome from "@/components/AppChrome";
import {
  canAccessManagerRoutes,
  isManagerRoute,
  isPublicRoute,
} from "@/lib/session";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/router";

const EMPTY_SESSION_SNAPSHOT = JSON.stringify({ token: null, employee: null });

function subscribeToSession(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", listener);
  window.addEventListener("pos-session-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("pos-session-change", listener);
  };
}

function getSessionSnapshot() {
  if (typeof window === "undefined") {
    return EMPTY_SESSION_SNAPSHOT;
  }

  return JSON.stringify({
    token: window.localStorage.getItem("authToken"),
    employee: window.localStorage.getItem("currentEmployee"),
  });
}

function parseSession(snapshot) {
  try {
    const parsed = JSON.parse(snapshot);
    return {
      token: parsed.token,
      employee: parsed.employee ? JSON.parse(parsed.employee) : null,
    };
  } catch {
    return { token: null, employee: null };
  }
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const pathname = router.pathname;
  const isPublic = isPublicRoute(pathname);
  const showChrome = !isPublic;
  const sessionSnapshot = useSyncExternalStore(subscribeToSession, getSessionSnapshot, () => EMPTY_SESSION_SNAPSHOT);
  const session = useMemo(() => parseSession(sessionSnapshot), [sessionSnapshot]);

  const hasStaffSession = Boolean(session.token && session.employee);
  const isAuthorized =
    isPublic ||
    (hasStaffSession && (!isManagerRoute(pathname) || canAccessManagerRoutes(session.employee)));

  useEffect(() => {
    if (isPublic) {
      return;
    }

    if (!hasStaffSession) {
      router.replace("/login");
      return;
    }

    if (isManagerRoute(pathname) && !canAccessManagerRoutes(session.employee)) {
      router.replace("/tables");
    }
  }, [hasStaffSession, isPublic, pathname, router, session.employee]);

  if (!showChrome) {
    return <Component {...pageProps} />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <AppChrome>
      <Component {...pageProps} />
    </AppChrome>
  );
}
