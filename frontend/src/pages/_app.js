import "@/styles/globals.css";
import AppChrome from "@/components/AppChrome";
import {
  canAccessManagerRoutes,
  getStoredEmployee,
  hasStoredEmployee,
  isManagerRoute,
  isPublicRoute,
} from "@/lib/session";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const showChrome = !isPublicRoute(router.pathname);
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    if (isPublicRoute(router.pathname)) {
      setIsAuthorized(true);
      return;
    }

    if (!hasStoredEmployee()) {
      setIsAuthorized(false);
      router.replace("/clock-in");
      return;
    }

    if (!isManagerRoute(router.pathname)) {
      setIsAuthorized(true);
      return;
    }

    const employee = getStoredEmployee();
    if (canAccessManagerRoutes(employee)) {
      setIsAuthorized(true);
      return;
    }

    setIsAuthorized(false);
    router.replace("/tables");
  }, [router.pathname, router]);

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
