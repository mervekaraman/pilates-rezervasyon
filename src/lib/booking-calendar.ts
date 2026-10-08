import "server-only";
import { bookingIcs, googleCalendarLink, type CalendarEvent } from "@/lib/calendar";
import { lessonLevelLabels } from "@/lib/format";
import { appUrl } from "@/lib/mail";
import { studio } from "@/lib/studio";
import type { LessonLevel } from "@/db/schema";

type BookingForCalendar = { id: string; startsAt: Date; durationMin: number; level: LessonLevel; trainerName: string; cancelled?: boolean; changedAt?: Date };

export function bookingCalendarEvent(booking: BookingForCalendar): CalendarEvent {
  const url = `${appUrl()}/rezervasyonlar/${booking.id}`;
  return {
    uid: `booking-${booking.id}@smeda-pilates`,
    startsAt: booking.startsAt,
    endsAt: new Date(booking.startsAt.getTime() + booking.durationMin * 60_000),
    title: `Reformer Pilates · ${studio.name}`,
    description: [`${lessonLevelLabels[booking.level]} · Eğitmen: ${booking.trainerName}`, `Derse ${studio.cancellationHours} saat kalana kadar uygulamadan iptal edebilirsin.`].join("\n"),
    location: studio.address ? `${studio.name}, ${studio.address}` : studio.name,
    url,
    cancelled: booking.cancelled,
    // Seconds since epoch only ever grow, so every change outranks the copy already in the calendar.
    sequence: Math.floor((booking.changedAt ?? new Date()).getTime() / 1000) - 1_700_000_000,
  };
}

export const bookingIcsFile = (booking: BookingForCalendar) => bookingIcs(bookingCalendarEvent(booking));
export const bookingGoogleLink = (booking: BookingForCalendar) => googleCalendarLink(bookingCalendarEvent(booking));
