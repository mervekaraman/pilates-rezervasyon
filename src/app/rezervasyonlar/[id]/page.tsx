/* eslint-disable @next/next/no-img-element -- Local studio photo with a fixed crop. */
import { notFound } from "next/navigation";
import { CancelBookingForm } from "@/components/flowly/forms";
import { AppShell } from "@/components/flowly/shell";
import { ButtonLink, InfoRow, Notice, StatusBadge, TopBar, TrainerChip, bookingTone } from "@/components/flowly/ui";
import { requireUser } from "@/lib/dal";
import { bookingStatusLabels, formatDayLong, formatTime, hoursUntil, lessonLevelLabels, lessonTypeLabels } from "@/lib/format";
import { getMemberBooking } from "@/lib/queries";
import { studio } from "@/lib/studio";

export const metadata = { title: "Rezervasyon" };

export default async function BookingDetailPage({ params }: PageProps<"/rezervasyonlar/[id]">) {
  const { id } = await params;
  const user = await requireUser({ role: "member", next: `/rezervasyonlar/${id}` });
  const booking = await getMemberBooking(user.id, id);
  if (!booking) notFound();

  const hoursLeft = hoursUntil(booking.startsAt);
  const active = booking.status === "pending" || booking.status === "approved";
  const finished = hoursLeft <= 0;
  const lockedReason = booking.status === "approved" && hoursLeft < studio.cancellationHours
    ? `Derse ${studio.cancellationHours} saatten az kaldığı için çevrimiçi iptal kapandı. Gelemeyeceksen lütfen stüdyoya haber ver.` : undefined;
  const status = finished && booking.status === "approved" ? "Katıldın" : bookingStatusLabels[booking.status];

  return <AppShell className="booking-detail-screen" nav={false}>
    <TopBar back="/rezervasyonlar" title="Rezervasyon"/>
    <section>
      <img className="detail-studio-image" src={studio.heroImage} alt=""/>
      <div className="detail-heading"><h1>{lessonTypeLabels[booking.type]}</h1><StatusBadge tone={finished && booking.status === "approved" ? "neutral" : bookingTone[booking.status]} dot>{status}</StatusBadge></div>
      {booking.lessonStatus === "cancelled" && <Notice>Bu ders eğitmen tarafından iptal edildi.</Notice>}
      <div className="detail-list">
        <InfoRow icon="calendar" label="Tarih" value={formatDayLong(booking.startsAt)}/>
        <InfoRow icon="clock" label="Saat" value={`${formatTime(booking.startsAt)} · ${booking.durationMin} dk`}/>
        <InfoRow icon="level" label="Seviye" value={lessonLevelLabels[booking.level]}/>
        {studio.address && <InfoRow icon="pin" label="Adres" value={studio.address}/>}
      </div>
      <div className="detail-trainer"><TrainerChip id={booking.trainerId} name={booking.trainerName} avatarUrl={booking.trainerAvatar}/></div>
      {(booking.memberNote || booking.trainerNote) && <div className="note-pair">
        {booking.memberNote && <p><span>Senin notun</span>{booking.memberNote}</p>}
        {booking.trainerNote && <p><span>Eğitmenin notu</span>{booking.trainerNote}</p>}
      </div>}
      <div className="detail-actions">
        {finished && booking.status === "approved" && (booking.reviewId ? <p className="muted-note">Bu dersi değerlendirdin, teşekkürler.</p> : <ButtonLink href={`/yorum-yaz?r=${booking.id}`}>Dersi Değerlendir</ButtonLink>)}
        {!finished && active && <>
          <p className="policy-line">Derse {studio.cancellationHours} saat kalana kadar iptal edebilirsin.</p>
          {studio.address && <ButtonLink href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${studio.name} ${studio.address}`)}`} variant="outline">Yol Tarifi Al</ButtonLink>}
          <CancelBookingForm bookingId={booking.id} lockedReason={lockedReason}/>
        </>}
        {(booking.status === "cancelled" || booking.status === "rejected") && <ButtonLink href="/dersler">Başka Bir Ders Seç</ButtonLink>}
      </div>
    </section>
  </AppShell>;
}
