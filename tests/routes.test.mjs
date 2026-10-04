import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const routes = [
  ["splash", "splash"],
  ["onboarding", "onboarding"],
  ["uye-ol", "signup"],
  ["giris", "login"],
  ["sifre-sifirlama", "reset"],
  ["konum-izni", "location"],
  ["kesfet", "discover"],
  ["harita", "map"],
  ["arama", "search"],
  ["studyo/move-studio", "studio"],
  ["egitmen/duygu-kaya", "instructor"],
  ["rezervasyon/ders-sec", "class-select"],
  ["rezervasyon/ozet", "booking-summary"],
  ["rezervasyon/basarili", "success"],
  ["rezervasyonlar", "bookings"],
  ["rezervasyonlar/move-studio-4-ekim", "booking-detail"],
  ["favoriler", "favorites"],
  ["yorumlar", "reviews"],
  ["yorum-yaz", "write-review"],
  ["profil", "profile"],
  ["profil/ayarlar", "settings"],
  ["bildirimler", "notifications"],
  ["egitmen-paneli", "trainer-dashboard"],
  ["egitmen-paneli/yeni-ders", "new-class"],
  ["egitmen-paneli/talepler", "requests"],
  ["egitmen-paneli/talepler/[id]", "request-detail"],
  ["egitmen-paneli/takvim", "trainer-calendar"],
];

test("27 Flowly ekranının gerçek route dosyaları bulunur", () => {
  assert.equal(routes.length, 27);
  for (const [route, screen] of routes) {
    const file = new URL(`../src/app/${route}/page.tsx`, import.meta.url);
    assert.equal(existsSync(file), true, `${route} route'u eksik`);
    assert.match(readFileSync(file, "utf8"), new RegExp(`screen=["']${screen}["']`));
  }
});

test("ödeme route'u akışta bulunmaz", () => {
  const paymentRoute = new URL("../src/app/odeme/page.tsx", import.meta.url);
  assert.equal(existsSync(paymentRoute), false);
  const summary = readFileSync(new URL("../src/components/flowly/screens.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(summary.match(/function BookingSummaryScreen\(\).*?function SummaryRow/s)?.[0] ?? "", /\/odeme/);
  assert.doesNotMatch(summary, /PaymentScreen|Ödeme bilgileri|Kart numarası/);
});

test("masaüstü uyarlaması mobil kabuğu ve v4 tokenlarını korur", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /--ivory:#f1edda/);
  assert.match(css, /--cta:#28171a/);
  assert.match(css, /width:min\(100%,430px\)/);
  assert.match(css, /@media\(min-width:1024px\)/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /position:fixed;inset:0 auto 0 0;width:112px/);
});
