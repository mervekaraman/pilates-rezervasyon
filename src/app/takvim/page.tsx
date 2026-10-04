import type { Metadata } from "next";
import Link from "next/link";
import { CalendarIcon, CheckIcon } from "@/components/icons";
import { SessionCard } from "@/components/session-card";
import { SiteHeader } from "@/components/site-header";
import { sessions, weekDays } from "@/lib/schedule";

export const metadata: Metadata = { title: "Ders takvimi" };

export default function CalendarPage() {
  return (
    <main className="calendar-page">
      <SiteHeader />
      <section className="calendar-hero">
        <div className="container calendar-heading">
          <div>
            <span className="eyebrow">Haftalık program · 5–10 Ekim</span>
            <h1>Akışını<br /><em>planla.</em></h1>
          </div>
          <div className="calendar-note">
            <CheckIcon size={20} />
            <p>Seçtiğin ders, eğitmen onayından sonra kesinleşir.</p>
          </div>
        </div>
      </section>

      <section className="container calendar-content">
        <div className="calendar-toolbar">
          <div className="week-control">
            <button type="button" aria-label="Önceki hafta">‹</button>
            <strong><CalendarIcon size={17} /> 5–10 Ekim 2026</strong>
            <button type="button" aria-label="Sonraki hafta">›</button>
          </div>
          <div className="filter-pills">
            <button type="button" className="filter-pill filter-pill-active">Tüm dersler</button>
            <button type="button" className="filter-pill">Başlangıç</button>
            <button type="button" className="filter-pill">Orta</button>
          </div>
        </div>

        <div className="week-grid">
          {weekDays.map((day) => {
            const daySessions = sessions.filter((session) => session.day === day.day);
            return (
              <section className="day-column" key={day.day}>
                <header className="day-header">
                  <span>{day.shortDay}</span>
                  <strong>{day.date.split(" ")[0]}</strong>
                  <small>{day.date.split(" ")[1]}</small>
                </header>
                <div className="day-sessions">
                  {daySessions.map((session) => <SessionCard key={session.id} session={session} />)}
                  {daySessions.length === 0 && <p className="empty-day">Açık ders yok</p>}
                </div>
              </section>
            );
          })}
        </div>

        <div className="calendar-help">
          <div>
            <span className="eyebrow eyebrow-light">İlk rezervasyonun mu?</span>
            <h2>Yerini ayırmaya hazırsın.</h2>
          </div>
          <Link href="/giris" className="button button-ivory button-large">Giriş yap veya üye ol</Link>
        </div>
      </section>
    </main>
  );
}
