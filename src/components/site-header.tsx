import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Nefes Pilates ana sayfa">
          <span>nefes</span><i>.</i>
        </Link>
        <nav className="desktop-nav" aria-label="Ana menü">
          <Link href="/takvim">Dersler</Link>
          <Link href="/#nasil-calisir">Nasıl çalışır?</Link>
          <Link href="/#stüdyo">Stüdyo</Link>
        </nav>
        <div className="header-actions">
          <Link href="/giris" className="text-link">Giriş yap</Link>
          <Link href="/takvim" className="button button-small">Yerini ayır</Link>
        </div>
      </div>
    </header>
  );
}
