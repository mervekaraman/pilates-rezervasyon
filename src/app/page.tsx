import Link from "next/link";
import { ArrowIcon, CalendarIcon, CheckIcon, StarIcon } from "@/components/icons";
import { SessionCard } from "@/components/session-card";
import { SiteHeader } from "@/components/site-header";
import { sessions } from "@/lib/schedule";

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <section className="hero">
        <div className="container hero-frame">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light">Pilates · Kadıköy</span>
            <p className="hero-index">01 / 03</p>
            <h1>Hareket<br />sana <em>iyi gelir.</em></h1>
            <p className="hero-description">Kendi ritmine uyan dersi seç. Rezervasyonunu kolayca oluştur, değiştir veya iptal et.</p>
            <div className="hero-actions">
              <Link href="/takvim" className="button button-ivory button-large">Dersleri keşfet <ArrowIcon /></Link>
              <Link href="/giris" className="hero-login">Üye girişi</Link>
            </div>
            <div className="trust-row">
              <span><CheckIcon size={15} /> Eğitmen onayı</span>
              <span><CheckIcon size={15} /> Esnek değişiklik</span>
            </div>
          </div>

          <div className="hero-photo" role="img" aria-label="Gün ışığı alan modern pilates stüdyosu ve beyaz kala çiçeği">
            <div className="hero-photo-meta"><span>NEFES STUDIO</span><span>İSTANBUL</span></div>
            <div className="next-class">
              <div className="next-class-date"><strong>05</strong><span>EKİ<br />PZT</span></div>
              <div><span className="card-kicker">Sıradaki ders</span><h2>Reformer Flow</h2><p>09:00 · Ece Yılmaz · 3 yer kaldı</p></div>
              <Link href="/takvim" aria-label="Dersi görüntüle"><ArrowIcon /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="discover-section">
        <div className="container discover-grid">
          <div className="discover-intro">
            <span className="eyebrow">Bu hafta</span>
            <h2>Ritmine uyan<br /><em>dersi bul.</em></h2>
            <p>Pazartesiden cumartesiye açık dersleri, eğitmeni ve kalan kontenjanı tek bakışta gör.</p>
            <Link href="/takvim" className="inline-link">Tüm program <ArrowIcon /></Link>
          </div>
          <div className="discover-schedule" aria-label="Yaklaşan dersler">
            <div className="schedule-card-header">
              <span><CalendarIcon size={17} /> 5–10 Ekim</span>
              <span>3 ders gösteriliyor</span>
            </div>
            <div className="hero-session-list">
              {sessions.slice(0, 3).map((session) => <SessionCard key={session.id} session={session} compact />)}
            </div>
          </div>
        </div>
      </section>

      <section className="manifesto-section">
        <div className="container manifesto-grid">
          <article className="manifesto-card manifesto-image">
            <span>01</span><h3>Bedeninle<br />yeniden bağ kur.</h3><i />
          </article>
          <article className="manifesto-card manifesto-dark">
            <span>02</span><h3>Kendine<br /><em>alan aç.</em></h3><i />
          </article>
          <article className="manifesto-card manifesto-ivory">
            <span>03</span><h3>Akışında<br />kal.</h3><i />
          </article>
        </div>
      </section>

      <section className="process-section" id="nasil-calisir">
        <div className="container process-layout">
          <div className="section-heading">
            <span className="eyebrow">Nasıl çalışır?</span>
            <h2>Planla. Katıl.<br /><em>Hisset.</em></h2>
          </div>
          <div className="process-list">
            <article><span>01</span><div><CalendarIcon /><h3>Dersini seç</h3><p>Takvimden sana uygun gün ve saati bul.</p></div></article>
            <article><span>02</span><div><CheckIcon /><h3>Onayı bekle</h3><p>Eğitmen onayladığında yerin kesinleşsin.</p></div></article>
            <article><span>03</span><div><StarIcon /><h3>Deneyimini paylaş</h3><p>Ders sonrası puanını ve yorumunu bırak.</p></div></article>
          </div>
        </div>
      </section>

      <section className="studio-section" id="stüdyo">
        <div className="container studio-panel">
          <div className="studio-visual" role="img" aria-label="Nefes Pilates stüdyosu" />
          <div className="studio-copy">
            <span className="eyebrow">Senin programın</span>
            <h2>Plan değişir.<br /><em>Akış devam eder.</em></h2>
            <p>Rezervasyonunu tek ekrandan takip et; uygun başka bir saate taşı veya ihtiyaç duyduğunda iptal et.</p>
            <Link href="/giris" className="inline-link">Hesabını oluştur <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div><div className="brand"><span>nefes</span><i>.</i></div><small>PILATES · KADIKÖY</small></div>
          <p>Hareket sana iyi gelir.</p>
          <span>© 2026 NEFES</span>
        </div>
      </footer>
    </main>
  );
}
