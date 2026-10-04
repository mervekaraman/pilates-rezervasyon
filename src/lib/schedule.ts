export type SessionLevel = "Başlangıç" | "Orta" | "Tüm seviyeler";

export type PilatesSession = {
  id: number;
  day: string;
  shortDay: string;
  date: string;
  isoDate: string;
  time: string;
  title: string;
  level: SessionLevel;
  instructor: string;
  available: number;
  capacity: number;
};

export const sessions: PilatesSession[] = [
  {
    id: 1,
    day: "Pazartesi",
    shortDay: "Pzt",
    date: "5 Eki",
    isoDate: "2026-10-05",
    time: "09:00",
    title: "Reformer Flow",
    level: "Başlangıç",
    instructor: "Ece Yılmaz",
    available: 3,
    capacity: 8,
  },
  {
    id: 2,
    day: "Pazartesi",
    shortDay: "Pzt",
    date: "5 Eki",
    isoDate: "2026-10-05",
    time: "18:30",
    title: "Core & Balance",
    level: "Orta",
    instructor: "Ece Yılmaz",
    available: 1,
    capacity: 8,
  },
  {
    id: 3,
    day: "Salı",
    shortDay: "Sal",
    date: "6 Eki",
    isoDate: "2026-10-06",
    time: "10:30",
    title: "Mat Pilates",
    level: "Tüm seviyeler",
    instructor: "Derya Akın",
    available: 5,
    capacity: 10,
  },
  {
    id: 4,
    day: "Çarşamba",
    shortDay: "Çar",
    date: "7 Eki",
    isoDate: "2026-10-07",
    time: "17:00",
    title: "Reformer Basics",
    level: "Başlangıç",
    instructor: "Ece Yılmaz",
    available: 4,
    capacity: 8,
  },
  {
    id: 5,
    day: "Perşembe",
    shortDay: "Per",
    date: "8 Eki",
    isoDate: "2026-10-08",
    time: "19:00",
    title: "Power Pilates",
    level: "Orta",
    instructor: "Derya Akın",
    available: 2,
    capacity: 8,
  },
  {
    id: 6,
    day: "Cuma",
    shortDay: "Cum",
    date: "9 Eki",
    isoDate: "2026-10-09",
    time: "09:30",
    title: "Morning Stretch",
    level: "Tüm seviyeler",
    instructor: "Ece Yılmaz",
    available: 6,
    capacity: 10,
  },
  {
    id: 7,
    day: "Cumartesi",
    shortDay: "Cmt",
    date: "10 Eki",
    isoDate: "2026-10-10",
    time: "11:00",
    title: "Weekend Reformer",
    level: "Tüm seviyeler",
    instructor: "Derya Akın",
    available: 2,
    capacity: 8,
  },
];

export const weekDays = [
  { day: "Pazartesi", shortDay: "Pzt", date: "5 Eki" },
  { day: "Salı", shortDay: "Sal", date: "6 Eki" },
  { day: "Çarşamba", shortDay: "Çar", date: "7 Eki" },
  { day: "Perşembe", shortDay: "Per", date: "8 Eki" },
  { day: "Cuma", shortDay: "Cum", date: "9 Eki" },
  { day: "Cumartesi", shortDay: "Cmt", date: "10 Eki" },
];
