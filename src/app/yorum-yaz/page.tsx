/* eslint-disable @next/next/no-img-element -- Local studio photo with a fixed crop. */
import { redirect } from "next/navigation";
import { FlowlyIcon } from "@/components/flowly/icons";
import { ReviewForm } from "@/components/flowly/forms";
import { AppShell } from "@/components/flowly/shell";
import { TopBar } from "@/components/flowly/ui";
import { requireUser } from "@/lib/dal";
import { formatDayLong, formatTime, hasStarted, lessonTypeLabels } from "@/lib/format";
import { getMemberBooking } from "@/lib/queries";
import { studio } from "@/lib/studio";

export const metadata = { title: "Dersi değerlendir" };

export default async function WriteReviewPage({ searchParams }: PageProps<"/yorum-yaz">) {
  const { r } = await searchParams;
  const user = await requireUser({ role: "member", next: "/rezervasyonlar?sekme=gecmis" });
  const booking = typeof r === "string" ? await getMemberBooking(user.id, r) : null;
  if (!booking || booking.status !== "approved" || !hasStarted(booking.startsAt) || booking.reviewId) redirect("/rezervasyonlar?sekme=gecmis");

  return <AppShell className="write-review-screen" nav={false}>
    <TopBar back="/rezervasyonlar?sekme=gecmis" title="Deneyimini paylaş"/>
    <section>
      <div className="booking-overview"><img src={studio.heroImage} alt=""/><div><h2>{lessonTypeLabels[booking.type]}</h2><p>{booking.trainerName}</p><p><FlowlyIcon name="calendar" size={18}/>{formatDayLong(booking.startsAt)} · {formatTime(booking.startsAt)}</p></div></div>
      <h1>Dersin nasıldı?</h1>
      <ReviewForm bookingId={booking.id}/>
    </section>
  </AppShell>;
}
