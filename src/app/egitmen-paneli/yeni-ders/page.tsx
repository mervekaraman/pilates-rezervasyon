import { NewLessonForm } from "@/components/flowly/forms";
import { AppShell } from "@/components/flowly/shell";
import { TopBar } from "@/components/flowly/ui";
import { requireUser } from "@/lib/dal";
import { atStudioTime, formatDayLong, fromNow, isDayKey, openDays } from "@/lib/format";
import { listBusySlots } from "@/lib/queries";
import { lessonDefaults, lessonStartTimes } from "@/lib/studio";

export const metadata = { title: "Yeni ders saati" };

export default async function NewLessonPage({ searchParams }: PageProps<"/egitmen-paneli/yeni-ders">) {
  await requireUser({ role: "trainer", next: "/egitmen-paneli/yeni-ders" });
  const { gun } = await searchParams;
  const days = openDays(36).map((key) => ({ key, label: formatDayLong(atStudioTime(key, "12:00")) }));
  // Every class from now until the last day a weekly repeat can reach (36 open days + 8 weeks).
  const now = fromNow();
  const busy = await listBusySlots(now, fromNow(100));
  return <AppShell className="new-class-screen" nav={false}>
    <TopBar back="/egitmen-paneli"/>
    <section>
      <h1>Yeni ders saati</h1>
      <p>Reformer dersi için gün, saat ve kontenjanı seç. Dersler saat başında başlar; dolu ve geçmiş saatler listede kapalı görünür.</p>
      <NewLessonForm days={days} times={lessonStartTimes} busy={busy.map((slot) => [slot.startsAt.getTime(), slot.endsAt.getTime()])} now={now.getTime()} defaults={{ ...lessonDefaults, day: isDayKey(gun) ? gun : undefined }}/>
    </section>
  </AppShell>;
}
