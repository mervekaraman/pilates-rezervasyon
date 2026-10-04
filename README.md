# Pilates Rezervasyon Uygulaması

Pazartesi–cumartesi günleri için ders rezervasyonu, eğitmen onayı, iptal ve ders sonrası değerlendirme süreçlerini yöneten mobil uyumlu web uygulaması.

## İlk sürümün hedefi

- Üye ve eğitmen hesapları
- Haftalık ders programını görüntüleme
- Kontenjan dahilinde rezervasyon talebi oluşturma
- Eğitmenin talebi onaylaması veya reddetmesi
- Üyenin kurallara uygun biçimde rezervasyonu iptal etmesi
- Tamamlanan dersi puanlama ve yorumlama
- Üye ve eğitmen için ayrı kontrol panelleri

Detaylı kapsam ve iş kuralları için [docs/MVP.md](docs/MVP.md) dosyasına bakın.

## Önerilen teknoloji

- Next.js + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, kimlik doğrulama ve yetkilendirme)
- Vercel (yayınlama)
- Vitest/Playwright (testler)

Teknoloji seçimi uygulama iskeleti oluşturulmadan önce kesinleştirilecektir.

## Yol haritası

1. MVP kapsamı ve kuralları
2. Teknik iskelet ve veritabanı modeli
3. Üyelik ve roller
4. Ders programı ve rezervasyon
5. Eğitmen onay ekranı
6. İptal akışı
7. Puanlama ve yorumlar
8. Test, güvenlik ve yayınlama

