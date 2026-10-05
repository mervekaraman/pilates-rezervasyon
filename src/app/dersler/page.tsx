import Link from "next/link";
import { FlowlyIcon } from "@/components/flowly/icons";
import { DateStrip, LessonRow } from "@/components/flowly/lessons";
import { AppShell } from "@/components/flowly/shell";
import { Brand, EmptyState, PageHeading, SeeAll } from "@/components/flowly/ui";
import { getCurrentUser } from "@/lib/dal";
import { atStudioTime, dayRange, formatDayLong, isDayKey, notBeforeNow, openDays } from "@/lib/format";
import { lessonCountsByDay, listLessons } from "@/lib/queries";
import { studio } from "@/lib/studio";

export const metadata = { title: "Ders programı" };

export default async function SchedulePage({ searchParams }: PageProps<"/dersler">) {
  const user = await getCurrentUser();
  const days = openDays(12);
  const counts = await lessonCountsByDay(days);
  const requested = (await searchParams).gun;
  const selected = isDayKey(requested) && days.includes(requested) ? requested : days.find((day) => counts[day]?.total) ?? days[0];
  const [start, end] = dayRange(selected);
  const lessons = await listLessons({ from: notBeforeNow(start), to: end, viewerId: user?.role === "member" ? user.id : undefined });
  const nextDay = days.slice(days.indexOf(selected) + 1).find((day) => counts[day]?.open);

  return <AppShell className="schedule-screen">
    <header className="feed-header"><div><Brand/><p className="location-link"><FlowlyIcon name="studio" size={20}/>{studio.name}</p></div>{user ? <Link href="/bildirimler" aria-label="Bildirimler"><FlowlyIcon name="bell" size={26}/></Link> : <Link href="/giris" className="see-all">Giriş yap</Link>}</header>
    <section className="page-content">
      <PageHeading eyebrow="Reformer pilates" title="Ders programı" sub="Sana uyan saati seç, yerini ayır. Talebin eğitmen onayıyla kesinleşir." action={<SeeAll href="/hakkimizda">Stüdyoyu tanı</SeeAll>}/>
      <DateStrip days={days} selected={selected} counts={counts} hrefFor={(day) => `/dersler?gun=${day}`}/>
      <div className="schedule-layout">
        <div>
          <h2 className="day-title">{formatDayLong(atStudioTime(selected, "12:00"))}</h2>
          {lessons.length
            ? <div className="lesson-list">{lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} href={`/dersler/${lesson.id}`}/>)}</div>
            : <EmptyState icon="calendar" title="Bu gün için açık ders yok." text={nextDay ? "Sonraki günlerde boş yerler var." : "Yeni ders saatleri açıldığında burada görünecek."} action={nextDay ? <Link href={`/dersler?gun=${nextDay}`} className="see-all">{formatDayLong(atStudioTime(nextDay, "12:00"))}<FlowlyIcon name="arrow-right" size={15}/></Link> : undefined}/>}
        </div>
        <aside className="side-card how-it-works">
          <h2>Nasıl çalışır?</h2>
          <ol>
            <li><strong>Dersini seç.</strong><span>Gün ve saati seç; kalan yerleri anlık görürsün.</span></li>
            <li><strong>Talebini gönder.</strong><span>Yerin, eğitmen karar verene kadar senin için ayrılır.</span></li>
            <li><strong>Onayı bekle.</strong><span>Eğitmen onayladığında e-postayla haber veririz.</span></li>
          </ol>
          <p className="muted-note">Derse {studio.cancellationHours} saat kalana kadar iptal edebilirsin.</p>
        </aside>
      </div>
    </section>
  </AppShell>;
}
