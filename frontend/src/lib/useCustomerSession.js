import { useState, useEffect, startTransition } from "react";

export function useCustomerSession() {
  const [customer, setCustomer] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("customerInfo");
    startTransition(() => {
      setCustomer(stored ? JSON.parse(stored) : null);
      setLoaded(true);
    });
  }, []);

  return { customer, loaded };
}
