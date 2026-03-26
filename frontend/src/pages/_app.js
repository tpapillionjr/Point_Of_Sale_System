import "@/styles/globals.css";
import AppChrome from "@/components/AppChrome";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const showChrome = router.pathname !== "/" && router.pathname !== "/clock-in";

  if (!showChrome) {
    return <Component {...pageProps} />;
  }

  return (
    <AppChrome>
      <Component {...pageProps} />
    </AppChrome>
  );
}
