import { notFound } from "next/navigation";
import { DecisionForm } from "@/components/flowly/forms";
import { AppShell } from "@/components/flowly/shell";
import { Avatar, ButtonLink, InfoRow, Notice, StatusBadge, TopBar, WhatsAppLink, bookingTone } from "@/components/flowly/ui";
import { requireUser } from "@/lib/dal";
import { bookingStatusLabels, formatDayLong, formatDayMonth, formatTime, hasStarted, lessonLevelLabels } from "@/lib/format";
import { formatPhone } from "@/lib/forms";
import { appUrl } from "@/lib/mail";
import { getTrainerRequest } from "@/lib/queries";
import { whatsappLink, whatsappMessage, type WhatsAppTopic } from "@/lib/whatsapp";

export const metadata = { title: "Talep detayı" };

export default async function RequestDetailPage({ params }: PageProps<"/egitmen-paneli/talepler/[id]">) {
  const { id } = await params;
  const user = await requireUser({ role: "trainer", next: `/egitmen-paneli/talepler/${id}` });
  const request = await getTrainerRequest(user.id, id);
  if (!request) notFound();
  const open = request.status === "pending" && !hasStarted(request.startsAt);
  const upcoming = !hasStarted(request.startsAt);
  const whatsapp = (topic: WhatsAppTopic) => whatsappLink(request.memberPhone, whatsappMessage({ topic, memberName: request.memberName, trainerName: user.name, startsAt: request.startsAt, trainerNote: request.trainerNote, siteUrl: appUrl() }));

  return <AppShell className="request-detail-screen" nav={false}>
    <TopBar back="/egitmen-paneli/talepler" title="Talep detayı"/>
    <section>
      <div className="request-profile">
        <Avatar name={request.memberName} src={request.memberAvatar} size={120}/>
        <div>
          <h1>{request.memberName}</h1>
          <StatusBadge tone={request.completedLessons ? "neutral" : "moss"}>{request.completedLessons ? `${request.completedLessons} tamamlanan ders` : "İlk dersi olacak"}</StatusBadge>
          <p className="muted-note">Üye: {formatDayMonth(request.memberSince)} tarihinden beri</p>
          <div className="contact-links">
            {request.memberPhone && <a href={`tel:${request.memberPhone}`} className="see-all">{formatPhone(request.memberPhone)}</a>}
            {open && <WhatsAppLink href={whatsapp("pending")}>WhatsApp&apos;tan yaz</WhatsAppLink>}
            <a href={`mailto:${request.memberEmail}`} className="see-all">{request.memberEmail}</a>
          </div>
        </div>
      </div>
      <div className="request-body">
        <h2>{formatDayLong(request.startsAt)}, {formatTime(request.startsAt)}</h2>
        <div className="request-detail-list">
          <InfoRow icon="level" label="Seviye" value={lessonLevelLabels[request.level]}/>
          <InfoRow icon="hourglass" label="Süre" value={`${request.durationMin} dk`}/>
          <InfoRow icon="users" label="Doluluk" value={`${request.taken}/${request.capacity} (onay bekleyenler dahil)`} href={`/egitmen-paneli/dersler/${request.lessonId}`}/>
        </div>
        <h3>Üyenin notu</h3>
        <p className={request.memberNote ? "member-note" : "muted-note"}>{request.memberNote ?? "Not bırakılmadı."}</p>
        {open ? <DecisionForm bookingId={request.id}/> : <>
          <div className="booking-state"><StatusBadge tone={bookingTone[request.status]} dot>{bookingStatusLabels[request.status]}</StatusBadge>{request.status === "pending" && <p>Ders başladığı için bu talep artık değiştirilemez.</p>}</div>
          {request.trainerNote && <Notice>Notun: {request.trainerNote}</Notice>}
          {upcoming && (request.status === "approved" || request.status === "rejected") && <div className="whatsapp-offer">
            <p>Üyeye e-posta ve bildirim gönderildi. İstersen WhatsApp&apos;tan da kısaca haber ver; mesaj hazır, sadece gönder&apos;e basman yeterli.</p>
            <WhatsAppLink href={whatsapp(request.status)} variant="button">WhatsApp&apos;tan Haber Ver</WhatsAppLink>
          </div>}
          <ButtonLink href={`/egitmen-paneli/dersler/${request.lessonId}`} variant="outline">Ders Listesine Git</ButtonLink>
        </>}
      </div>
    </section>
  </AppShell>;
}
