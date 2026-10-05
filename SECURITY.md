# Güvenlik notları

## Uygulanan korumalar

- Şifreler scrypt ile, oturum ve parola yenileme anahtarları yalnızca SHA-256 özetiyle saklanır.
- Parola yenileme bağlantılarının ham içeriği canlı e-posta kutusunda tutulmaz ve yeniden gönderim kuyruğuna girmez.
- Giriş ve parola yenileme hız sınırı PostgreSQL'de tutulur; birden çok sunucu örneğinde ortaktır.
- Parola değişince diğer cihazlardaki oturumlar kapatılır.
- Server Action'lar rol, sahiplik, saat ve kontenjan kurallarını sunucuda yeniden doğrular.
- CSP, HSTS (canlıda), frame, MIME, referrer ve tarayıcı izin başlıkları ayarlıdır.

## İşletim

- `npm run check` her değişiklikten önce çalıştırılmalıdır; GitHub Actions bunu push ve pull request'lerde tekrarlar.
- `npm audit --omit=dev` canlıya giden bağımlılıklar için sıfır açık vermelidir.
- `npm run db:cleanup` günlük; `npm run mail:retry` 5–15 dakikada bir zamanlanmalıdır.
- Canlı ortam `npm run check:production` ile doğrulanmalıdır.

## Geliştirme bağımlılığı uyarıları

5 Ekim 2026 denetiminde canlı bağımlılıklarda açık bulunmadı. Tam `npm audit`, yalnızca geliştirme zincirinde `eslint-config-next` üzerinden `braces` ve `drizzle-kit` içindeki eski loader üzerinden `esbuild` uyarıları verdi. NPM'in önerdiği `--force` çözümü Next.js ve Drizzle Kit'i uyumsuz eski ana sürümlere düşürdüğü için uygulanmadı. Bu paketler yeni uyumlu sürüm yayımladığında kontrollü olarak yükseltilmeli; geliştirme sunucusu güvenilmeyen ağlara açılmamalıdır.

Güvenlik bildirimlerinde hassas bilgi içermeden depo yöneticisiyle özel kanaldan iletişime geçin.
