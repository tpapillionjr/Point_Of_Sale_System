import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/router";
import { isCustomerPreviewMode, readStoredCustomerInfo, subscribeToCustomerSession } from "./customerSession";

export function useCustomerSession() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function syncSession() {
      startTransition(() => {
        setCustomer(readStoredCustomerInfo());
        setIsPreview(isCustomerPreviewMode());
        setLoaded(true);
      });
    }

    syncSession();
    return subscribeToCustomerSession(syncSession);
  }, [router.asPath]);

  return { customer, loaded, isPreview };
}
