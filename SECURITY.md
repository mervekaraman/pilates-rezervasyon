# Güvenlik notları

## Uygulanan korumalar

- Şifreler scrypt ile, oturum ve parola yenileme anahtarları yalnızca SHA-256 özetiyle saklanır.
- Parola yenileme bağlantılarının ham içeriği canlı e-posta kutusunda tutulmaz ve yeniden gönderim kuyruğuna girmez.
- Giriş ve parola yenileme hız sınırı PostgreSQL'de tutulur; birden çok sunucu örneğinde ortaktır.
- Parola değişince diğer cihazlardaki oturumlar kapatılır.
- Server Action'lar rol, sahiplik, saat ve kontenjan kurallarını sunucuda yeniden doğrular.
- CSP (yalnızca kendi alan adı + Spotify oynatıcısı), HSTS, frame, MIME, referrer ve tarayıcı izin başlıkları ayarlıdır.
- Supabase veri API'sine karşı bütün tablolarda RLS açıktır; test, RLS'siz tablo eklenmesine izin vermez.
- Kayıt, giriş (hesap ve IP), davet kodu (IP ve günlük toplam) ve e-posta değişikliği için deneme sınırları vardır.
- Giriş sonrası yönlendirme yalnızca site içi yollara izin verir (kontrol karakteri ve başka alan adı reddedilir).
- Herkese açık yorumlarda üye adı "Elif Y." biçimindedir, fotoğraf gösterilmez; sunucu kayıtlarında e-posta maskelenir.
- Rezervasyon notu (sağlık verisi olabilir) yalnızca açık rızayla saklanır ve dersten 6 ay sonra silinir; e-posta kopyaları 30 gün tutulur.
- Üye; verilerini indirebilir, e-postasını onay bağlantısıyla değiştirebilir ve hesabını kalıcı silebilir. Çıkışta cihazın telefon bildirimleri durur.
- Veritabanı bağlantısı TLS'lidir; `DATABASE_CA_CERT` tanımlıysa sunucu sertifikası doğrulanır. Haftalık yedekler şifrelenerek saklanır.

## İşletim

- `npm run check` her değişiklikten önce çalıştırılmalıdır; GitHub Actions bunu push ve pull request'lerde tekrarlar.
- `npm audit --omit=dev` canlıya giden bağımlılıklar için sıfır açık vermelidir.
- Vercel'deki günlük görev temizlik ve e-posta yeniden denemesini yapar; `npm run db:cleanup` / `npm run mail:retry` elle çalıştırılabilir.
- Canlı ortam `npm run check:production` ile doğrulanmalıdır.

## Geliştirme bağımlılığı uyarıları

5 Ekim 2026 denetiminde canlı bağımlılıklarda açık bulunmadı. Tam `npm audit`, yalnızca geliştirme zincirinde `eslint-config-next` üzerinden `braces` ve `drizzle-kit` içindeki eski loader üzerinden `esbuild` uyarıları verdi. NPM'in önerdiği `--force` çözümü Next.js ve Drizzle Kit'i uyumsuz eski ana sürümlere düşürdüğü için uygulanmadı. Bu paketler yeni uyumlu sürüm yayımladığında kontrollü olarak yükseltilmeli; geliştirme sunucusu güvenilmeyen ağlara açılmamalıdır.

Güvenlik bildirimlerinde hassas bilgi içermeden depo yöneticisiyle özel kanaldan iletişime geçin.
