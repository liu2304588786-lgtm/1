import Link from "next/link";

export function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <Link href="/" className="brand-title">
          alt.fun
        </Link>
        <div className="brand-subtitle">Launch alt coins backed by leveraged token perps on HyperEVM</div>
      </div>

      <nav className="nav">
        <Link href="/">Market</Link>
        <Link href="/launch">Launch</Link>
        <Link href="/graduated">Graduated</Link>
      </nav>
    </header>
  );
}

