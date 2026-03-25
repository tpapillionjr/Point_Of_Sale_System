import Image from "next/image";

export default function Home() {
  return (
    <main className="logo-page">
      <Image
        src="/lumii.png"
        alt="POS logo"
        width={1200}
        height={1200}
        priority
        className="logo-image"
      />
    </main>
  );
}