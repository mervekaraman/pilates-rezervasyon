import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Giriş yap" };

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Link href="/" className="brand auth-brand" aria-label="Ana sayfaya dön">
        <span>nefes</span><i>.</i>
      </Link>
      <div className="auth-shell">
        <section className="auth-aside">
          <div className="auth-aside-copy">
            <span className="eyebrow eyebrow-light">Sana ait bir alan</span>
            <h1>Programın,<br /><em>senin ritmin.</em></h1>
            <p>Derslerini seç, rezervasyonlarını yönet ve deneyimini tek bir yerden paylaş.</p>
          </div>
          <div className="auth-benefits">
            <span><CheckIcon /> Haftalık takvime anında erişim</span>
            <span><CheckIcon /> Kolay değiştirme ve iptal</span>
            <span><CheckIcon /> Geçmiş ders ve yorumların</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-heading">
            <span className="card-kicker">Tekrar hoş geldin.</span>
            <h2>Hesabına<br /><em>giriş yap.</em></h2>
            <p>Rezervasyonlarını görmek ve yönetmek için devam et.</p>
          </div>
          <div className="role-switch" aria-label="Hesap türü">
            <button type="button" className="role-button role-button-active">Üye</button>
            <button type="button" className="role-button">Eğitmen</button>
          </div>
          <form className="auth-form">
            <label>
              E-posta adresi
              <input type="email" name="email" placeholder="ornek@email.com" autoComplete="email" />
            </label>
            <label>
              Şifre
              <input type="password" name="password" placeholder="••••••••" autoComplete="current-password" />
            </label>
            <div className="form-row">
              <label className="checkbox-label"><input type="checkbox" /> Beni hatırla</label>
              <button type="button" className="link-button">Şifremi unuttum</button>
            </div>
            <button type="button" className="button button-large button-full">Devam et <ArrowIcon /></button>
          </form>
          <p className="auth-register">Henüz hesabın yok mu? <button type="button" className="link-button">Üye ol</button></p>
          <Link href="/takvim" className="demo-link">Giriş yapmadan demo takvimi gör</Link>
        </section>
      </div>
    </main>
  );
}
