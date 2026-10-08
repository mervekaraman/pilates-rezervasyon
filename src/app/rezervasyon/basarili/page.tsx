import Link from "next/link";
import { redirect } from "next/navigation";
import { FlowlyIcon, type FlowlyIconName } from "@/components/flowly/icons";
import { PushPrompt } from "@/components/flowly/push";
import { AppShell } from "@/components/flowly/shell";
import { Brand, ButtonLink } from "@/components/flowly/ui";
import { requireUser } from "@/lib/dal";
import { formatDayLong, formatTime } from "@/lib/format";
import { pushPublicKey } from "@/lib/push";
import { studio } from "@/lib/studio";
import { studioRequestMessage, whatsappLink } from "@/lib/whatsapp";
import { getMemberBooking } from "@/lib/queries";

export const metadata = { title: "Talebin alındı" };

export default async function BookingSuccessPage({ searchParams }: PageProps<"/rezervasyon/basarili">) {
  const { r } = await searchParams;
  const user = await requireUser({ role: "member", next: "/rezervasyonlar" });
  const booking = typeof r === "string" ? await getMemberBooking(user.id, r) : null;
  if (!booking) redirect("/rezervasyonlar");
  const publicKey = pushPublicKey();
  const whatsapp = whatsappLink(studio.phone, studioRequestMessage({ memberName: user.name, startsAt: booking.startsAt }));

  return <AppShell bare className="success-screen">
    <div className="success-photo"/>
    <section>
      <div className="success-check"><FlowlyIcon name="check" size={36}/></div>
      <h1>Talebin alındı.</h1>
      <p>Eğitmen onayladığında rezervasyonun kesinleşecek; sana e-postayla haber vereceğiz.</p>
      {whatsapp && <p className="success-reminder">Stüdyoya WhatsApp&apos;tan bildirmeyi unutma.</p>}
      <div className="success-details">
        <Line icon="calendar" label="Tarih" value={formatDayLong(booking.startsAt)}/>
        <Line icon="clock" label="Saat" value={`${formatTime(booking.startsAt)} · ${booking.durationMin} dk`}/>
        <Line icon="user" label="Eğitmen" value={booking.trainerName}/>
      </div>
      {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flowly-button whatsapp-button"><FlowlyIcon name="chat" size={20}/>Stüdyoya WhatsApp&apos;tan Bildir</a>}
      {publicKey && <PushPrompt publicKey={publicKey}/>}
      <ButtonLink href={`/rezervasyonlar/${booking.id}`} variant="outline">Talebi Gör</ButtonLink>
      <Link href="/dersler">Ders programına dön</Link>
      <Brand light/>
    </section>
  </AppShell>;
}

function Line({ icon, label, value }: { icon: FlowlyIconName; label: string; value: string }) {
  return <div><FlowlyIcon name={icon}/><p><span>{label}</span><strong>{value}</strong></p></div>;
}
