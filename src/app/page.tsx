import Link from "next/link";
import { ArrowIcon, CalendarIcon, CheckIcon, LeafIcon, StarIcon } from "@/components/icons";
import { SessionCard } from "@/components/session-card";
import { SiteHeader } from "@/components/site-header";
import { sessions } from "@/lib/schedule";

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <section className="hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><LeafIcon size={16} /> Kendine ayırdığın zaman</span>
            <h1>Gücünü bul.<br /><em>Dengeni koru.</em></h1>
            <p>Haftalık programı incele, sana en uygun dersi seç ve rezervasyon talebini birkaç adımda tamamla.</p>
            <div className="hero-actions">
              <Link href="/takvim" className="button button-large">Takvimi incele <ArrowIcon /></Link>
              <Link href="/giris" className="button button-ghost button-large">Üye girişi</Link>
            </div>
            <div className="trust-row">
              <span><CheckIcon size={16} /> Kolay değişiklik</span>
              <span><CheckIcon size={16} /> Hızlı iptal</span>
              <span><CheckIcon size={16} /> Eğitmen onayı</span>
            </div>
          </div>

          <div className="hero-schedule" aria-label="Yaklaşan dersler">
            <div className="schedule-card-header">
              <div>
                <span className="card-kicker">Bu hafta</span>
                <h2>Yaklaşan dersler</h2>
              </div>
              <span className="date-chip"><CalendarIcon size={17} /> 5–10 Ekim</span>
            </div>
            <div className="hero-session-list">
              {sessions.slice(0, 3).map((session) => <SessionCard key={session.id} session={session} compact />)}
            </div>
            <Link href="/takvim" className="full-schedule-link">Tüm haftayı görüntüle <ArrowIcon size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="process-section" id="nasil-calisir">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Basit ve şeffaf</span>
            <h2>Dersine üç adımda katıl</h2>
            <p>Programını yönetmek için telefon trafiğine gerek yok.</p>
          </div>
          <div className="process-grid">
            <article className="process-card">
              <span className="step-number">01</span>
              <span className="process-icon"><CalendarIcon /></span>
              <h3>Uygun dersi seç</h3>
              <p>Pazartesiden cumartesiye açık dersleri ve kalan kontenjanı gör.</p>
            </article>
            <article className="process-card process-card-featured">
              <span className="step-number">02</span>
              <span className="process-icon"><CheckIcon /></span>
              <h3>Talebini gönder</h3>
              <p>Rezervasyonun eğitmen onayından sonra kesinleşsin.</p>
            </article>
            <article className="process-card">
              <span className="step-number">03</span>
              <span className="process-icon"><StarIcon /></span>
              <h3>Deneyimini paylaş</h3>
              <p>Ders tamamlandıktan sonra puanını ve yorumunu bırak.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="studio-section" id="stüdyo">
        <div className="container studio-panel">
          <div className="studio-visual" aria-hidden="true">
            <div className="studio-sun" />
            <div className="studio-arch"><LeafIcon size={64} /></div>
          </div>
          <div className="studio-copy">
            <span className="eyebrow">Nefes alan bir program</span>
            <h2>Plan değişirse, dersin de değişebilir.</h2>
            <p>Rezervasyonlarını tek ekrandan takip et, uygun başka bir saate taşı veya ihtiyaç duyduğunda iptal et.</p>
            <Link href="/giris" className="inline-link">Hesabını oluşturmaya başla <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="brand"><span className="brand-mark"><LeafIcon size={22} /></span><span>Nefes Pilates</span></div>
          <p>Hareket et. Güçlen. İyi hisset.</p>
          <span>© 2026</span>
        </div>
      </footer>
    </main>
  );
}
