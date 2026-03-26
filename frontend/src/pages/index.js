import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="logo-page">
      <div className="logo-page__panel">
        <div className="logo-image-wrap">
          <Image
            src="/lumii2.png"
            alt="POS logo"
            width={1200}
            height={1200}
            priority
            className="logo-image"
          />
        </div>

        <div className="logo-page__actions">
          <p className="logo-page__copy">Start the shift and move into the POS.</p>
          <Link href="/clock-in" className="logo-page__login">
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
