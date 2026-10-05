import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/auth/password.ts";
import { addDays, atStudioTime, dayKey, formatDayLong, isDayKey, isSunday, openDays, startOfWeek } from "../src/lib/format.ts";
import { formatPhone, normalizePhone } from "../src/lib/forms.ts";
import { lessonDefaults, lessonStartTimes } from "../src/lib/studio.ts";
import { whatsappLink, whatsappMessage } from "../src/lib/whatsapp.ts";

test("şifreler tuzlanarak hash'lenir ve yalnızca doğru şifre eşleşir", async () => {
  const hash = await hashPassword("reformer-2026");
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.notEqual(hash, await hashPassword("reformer-2026"), "aynı şifre her seferinde farklı tuzla hash'lenmeli");
  assert.equal(await verifyPassword("reformer-2026", hash), true);
  assert.equal(await verifyPassword("Reformer-2026", hash), false);
  assert.equal(await verifyPassword("reformer-2026", "bozuk-hash"), false);
});

test("Türkiye cep telefonları E.164 biçimine çevrilir", () => {
  assert.equal(normalizePhone("0532 123 45 67"), "+905321234567");
  assert.equal(normalizePhone("532-123-4567"), "+905321234567");
  assert.equal(normalizePhone("+90 (532) 123 45 67"), "+905321234567");
  assert.equal(normalizePhone("12345"), null);
  assert.equal(formatPhone("+905321234567"), "+90 532 123 45 67");
});

test("tarihler stüdyo saatine (İstanbul, UTC+3) göre hesaplanır", () => {
  assert.equal(atStudioTime("2026-10-08", "18:30").toISOString(), "2026-10-08T15:30:00.000Z");
  assert.equal(dayKey(new Date("2026-10-07T22:30:00Z")), "2026-10-08", "İstanbul'da gece 01:30 yeni güne aittir");
  assert.equal(formatDayLong(atStudioTime("2026-10-08", "12:00")), "8 Ekim Perşembe");
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(isDayKey("2026-10-08"), true);
  assert.equal(isDayKey("08.10.2026"), false);
});

test("ders günleri pazartesi–cumartesi; pazar atlanır", () => {
  assert.equal(isSunday("2026-10-11"), true);
  const days = openDays(7, "2026-10-05");
  assert.deepEqual(days, ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-12"]);
  assert.equal(startOfWeek("2026-10-11"), "2026-10-05");
  assert.equal(startOfWeek("2026-10-05"), "2026-10-05");
});

test("dersler yalnızca saat başında açılır; varsayılan kontenjan 4 kişi", () => {
  assert.equal(lessonStartTimes[0], "07:00");
  assert.equal(lessonStartTimes.at(-1), "21:00");
  assert.equal(lessonStartTimes.length, 15);
  for (const time of lessonStartTimes) assert.match(time, /^\d{2}:00$/);
  assert.equal(lessonDefaults.capacity, 4);
  assert.equal("priceTl" in lessonDefaults, false, "ders başına ücret tutulmaz");
});

test("WhatsApp bağlantısı üyenin numarasına hazır mesajla açılır", () => {
  const text = whatsappMessage({ topic: "approved", memberName: "Elif Yılmaz", trainerName: "Duygu Kaya", startsAt: new Date("2026-10-06T15:00:00Z"), siteUrl: "https://smeda.test" });
  assert.match(text, /^Merhaba Elif, 6 Ekim Salı 18:00 reformer dersin için rezervasyonun onaylandı\./);
  assert.match(text, /Duygu · Smeda Pilates$/);
  const link = whatsappLink("+905321234567", text);
  assert.ok(link.startsWith("https://wa.me/905321234567?text="));
  assert.equal(new URL(link).searchParams.get("text"), text);
  assert.equal(whatsappLink(null, text), null);
  assert.equal(whatsappLink("123", text), null);
  const rejected = whatsappMessage({ topic: "rejected", memberName: "Selin", trainerName: "Ece Sarı", startsAt: new Date("2026-10-06T15:00:00Z"), trainerNote: "Bu saat dolu.", siteUrl: "https://smeda.test" });
  assert.match(rejected, /Notum: Bu saat dolu\./);
  assert.match(rejected, /https:\/\/smeda\.test\/dersler/);
});
