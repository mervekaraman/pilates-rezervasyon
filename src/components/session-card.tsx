import Link from "next/link";
import type { PilatesSession } from "@/lib/schedule";
import { ArrowIcon, ClockIcon, UserIcon } from "@/components/icons";

export function SessionCard({ session, compact = false }: { session: PilatesSession; compact?: boolean }) {
  const nearlyFull = session.available <= 2;

  return (
    <article className={`session-card${compact ? " session-card-compact" : ""}`}>
      <div className="session-time">
        <ClockIcon size={17} />
        <strong>{session.time}</strong>
      </div>
      <div className="session-content">
        <div className="session-title-row">
          <h3>{session.title}</h3>
          <span className="level-tag">{session.level}</span>
        </div>
        <p className="session-instructor"><UserIcon size={16} /> {session.instructor}</p>
        <div className="session-footer">
          <span className={nearlyFull ? "availability availability-low" : "availability"}>
            {session.available} yer kaldı
          </span>
          <Link href={`/giris?redirect=/takvim&session=${session.id}`} className="session-action" aria-label={`${session.title} dersini seç`}>
            Seç <ArrowIcon size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
