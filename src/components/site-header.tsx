import Link from "next/link";
import { LeafIcon } from "@/components/icons";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Nefes Pilates ana sayfa">
          <span className="brand-mark"><LeafIcon size={24} /></span>
          <span>Nefes Pilates</span>
        </Link>
        <nav className="desktop-nav" aria-label="Ana menü">
          <Link href="/takvim">Ders Takvimi</Link>
          <a href="#nasil-calisir">Nasıl Çalışır?</a>
          <a href="#stüdyo">Stüdyo</a>
        </nav>
        <div className="header-actions">
          <Link href="/giris" className="text-link">Giriş yap</Link>
          <Link href="/takvim" className="button button-small">Ders bul</Link>
        </div>
      </div>
    </header>
  );
}
