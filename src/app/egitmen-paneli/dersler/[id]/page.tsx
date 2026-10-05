import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelLessonForm } from "@/components/flowly/forms";
import { FlowlyIcon } from "@/components/flowly/icons";
import { AppShell } from "@/components/flowly/shell";
import { Avatar, EmptyState, InfoRow, Notice, StatusBadge, TopBar, WhatsAppLink, bookingTone } from "@/components/flowly/ui";
import { requireUser } from "@/lib/dal";
import { bookingStatusLabels, dayKey, formatDayLong, formatTime, hasStarted, lessonLevelLabels } from "@/lib/format";
import { formatPhone } from "@/lib/forms";
import { appUrl } from "@/lib/mail";
import { getTrainerLesson } from "@/lib/queries";
import { whatsappLink, whatsappMessage } from "@/lib/whatsapp";

export const metadata = { title: "Ders listesi" };

export default async function TrainerLessonPage({ params }: PageProps<"/egitmen-paneli/dersler/[id]">) {
  const { id } = await params;
  const user = await requireUser({ role: "trainer", next: `/egitmen-paneli/dersler/${id}` });
  const data = await getTrainerLesson(user.id, id);
  if (!data) notFound();
  const { lesson, roster } = data;
  const upcoming = !hasStarted(lesson.startsAt);
  const active = roster.filter((row) => row.status === "approved" || row.status === "pending");
  const order = { approved: 0, pending: 1, cancelled: 2, rejected: 3 } as const;
  // Upcoming class: a reminder to confirmed members; cancelled class: let the affected members know.
  const whatsapp = (row: (typeof roster)[number]) => {
    const topic = lesson.status === "cancelled" ? (row.status === "cancelled" ? "lessonCancelled" : null) : upcoming && row.status === "approved" ? "reminder" : null;
    return topic ? whatsappLink(row.memberPhone, whatsappMessage({ topic, memberName: row.memberName, trainerName: user.name, startsAt: lesson.startsAt, siteUrl: appUrl() })) : null;
  };

  return <AppShell className="roster-screen" nav={false}>
    <TopBar back={`/egitmen-paneli/takvim?gun=${dayKey(lesson.startsAt)}`} title="Ders listesi"/>
    <section>
      <div className="roster-head">
        <p className="eyebrow">Reformer · {lessonLevelLabels[lesson.level]}</p>
        <h1>{formatDayLong(lesson.startsAt)}<br/>{formatTime(lesson.startsAt)}</h1>
        {lesson.status === "cancelled" && <Notice>Bu ders iptal edildi. Üyelere e-posta gönderildi; aşağıdan WhatsApp&apos;tan da haber verebilirsin.</Notice>}
        <div className="detail-list">
          <InfoRow icon="users" label="Doluluk" value={`${lesson.taken}/${lesson.capacity} · ${Math.max(lesson.capacity - lesson.taken, 0)} yer boş`}/>
          <InfoRow icon="hourglass" label="Süre" value={`${lesson.durationMin} dk`}/>
          {lesson.note && <InfoRow icon="document" label="Not" value={lesson.note}/>}
        </div>
        {upcoming && lesson.status === "published" && <CancelLessonForm lessonId={lesson.id} booked={active.length}/>}
      </div>
      <div className="roster-list">
        <h2>Katılımcılar</h2>
        {roster.length ? [...roster].sort((a, b) => order[a.status] - order[b.status]).map((row) => <div key={row.id} className={`roster-row${row.status === "cancelled" ? " is-cancelled" : ""}`}>
          <Avatar name={row.memberName} src={row.memberAvatar} size={44}/>
          <div><strong>{row.memberName}</strong>{row.memberPhone && <span className="roster-contact"><a href={`tel:${row.memberPhone}`}>{formatPhone(row.memberPhone)}</a><WhatsAppLink href={whatsapp(row)}>{lesson.status === "cancelled" ? "İptali bildir" : "Hatırlat"}</WhatsAppLink></span>}{row.memberNote && <q>{row.memberNote}</q>}</div>
          {row.status === "pending" ? <Link href={`/egitmen-paneli/talepler/${row.id}`} className="see-all">Talebi incele<FlowlyIcon name="arrow-right" size={15}/></Link> : <StatusBadge tone={bookingTone[row.status]} dot>{bookingStatusLabels[row.status]}</StatusBadge>}
        </div>) : <EmptyState icon="users" title="Henüz katılımcı yok." text="Talepler geldikçe burada listelenecek."/>}
      </div>
    </section>
  </AppShell>;
}
