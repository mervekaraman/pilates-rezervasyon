# Smeda Pilates — Rezervasyon Uygulaması

Smeda Pilates için reformer ders rezervasyonu: üyeler programdan ders seçip talep gönderir, eğitmen onaylar ya da reddeder, her adımda e-posta ve uygulama içi bildirim gider. Pazartesi–cumartesi çalışır; şimdilik yalnızca reformer dersleri açılır.

İş kuralları için [docs/MVP.md](docs/MVP.md) dosyasına bakın.

## Neler var?

- **Üyelik:** e-posta + şifre ile kayıt/giriş, şifre sıfırlama (e-postayla, 1 saat geçerli tek kullanımlık bağlantı), profil ve bildirim tercihleri.
- **Roller:** danışan (üye) ve eğitmen. Eğitmen hesabı, kayıt formunda stüdyonun **davet kodu** girilerek açılır.
- **Danışan:** ders programı, ders detayı, rezervasyon talebi, rezervasyonlarım, iptal (derse 12 saat kalana kadar), katıldığı dersi değerlendirme.
- **Eğitmen:** özet paneli, yeni ders saati açma (saat başlarında, varsayılan 4 kişilik; haftalık tekrar dahil, stüdyoda saat çakışması engellenir), talepleri onaylama/reddetme, takvim, ders katılımcı listesi, ders iptali (üyelere otomatik haber verilir).
- **Bildirimler:** talep alındı, onay/ret, iptal ve ders iptali için e-posta + uygulama içi bildirim.
- **Telefon bildirimleri (Web Push, ücretsiz):** üye ya da eğitmen Profil › Ayarlar'dan (veya rezervasyon sonrası ekrandan) açar; aynı bildirimler telefona anında düşer. Android'de doğrudan, iPhone'da site ana ekrana eklenince çalışır. Yalnızca https'te (ve localhost'ta) çalışır.
- **WhatsApp'tan haber ver (ücretsiz):** eğitmen onay/ret sonrası, talepler listesinde ve ders katılımcı listesinde tek dokunuşla WhatsApp'ı üyenin numarası ve hazır mesajla açar; gönderen eğitmenin kendi WhatsApp'ıdır, API ya da ücret yoktur.
- **Katılım ve efor:** eğitmen ders başladıktan sonra "geldi / gelmedi" işaretler; derse giren üye 1–10 efor puanı verir.
- **Eğitmen üye ekler:** eğitmen kendi dersine kayıtlı bir üyeyi doğrudan (onaylı) ekler; WhatsApp mesajı hazır gelir.
- **Bekleme listesi:** dolu derste yer açılınca listedekilere bildirim ve e-posta gider; ilk talep gönderen alır.
- **Takvim:** onay e-postasında takvim daveti, rezervasyon sayfasında "Takvime ekle" ve Google Takvim bağlantısı.
- **Günlük görev:** derse bir gün kala hatırlatma ve eski kayıtların temizliği (Vercel Cron, `/api/cron/gunluk`).
- **Hesap:** e-posta değiştirme (yeni adrese onay bağlantısı) ve hesabı kalıcı silme (KVKK).
- **Ödeme yok:** üyeler ödemeyi üyelik başında toplu yapar; uygulamada ders başına ücret tutulmaz ve gösterilmez.
- **Sayfalar:** Hakkımızda, Yardım (SSS), Gizlilik ve kullanım koşulları, eğitmen profilleri, yorumlar.

## Teknoloji

- Next.js 16 (App Router, Server Actions) + TypeScript
- PostgreSQL + Drizzle ORM — yerelde gömülü PostgreSQL (PGlite), canlıda herhangi bir Postgres (Supabase önerilir)
- Oturumlar veritabanında; çerezde rastgele token, veritabanında yalnızca hash'i tutulur. Şifreler scrypt ile hash'lenir.
- E-posta: Nodemailer (SMTP)

## Yerel çalıştırma

```bash
npm install
cp .env.example .env.local   # TRAINER_INVITE_CODE'u doldur
npm run dev
```

Uygulama `http://localhost:3040` adresinde açılır. Hiçbir hesap ya da kurulum gerekmez: veritabanı ilk istekte `./data` klasöründe kendini kurar ve demo veriyle dolar.

### Demo hesaplar

Demo veri yalnızca yerel veritabanında oluşur. Hepsinin şifresi `src/db/seed.ts` içindeki `DEMO_PASSWORD` değeridir.

| Rol | E-posta |
| --- | --- |
| Eğitmen | `duygu@demo.smeda.test` |
| Eğitmen | `ece@demo.smeda.test` |
| Danışan | `elif@demo.smeda.test` (onaylı, bekleyen ve geçmiş rezervasyonları var) |
| Danışan | `selin@`, `zeynep@`, `ceren@`, `derya@demo.smeda.test` |

### E-postalar

`SMTP_HOST` boşsa e-postalar gönderilmez; geliştirme sırasında **`/gelistirici/e-postalar`** sayfasında önizlenir (şifre sıfırlama bağlantısı da buradan açılabilir). Gerçek gönderim için `.env.local` dosyasına SMTP bilgilerini ekleyin — örneğin Gmail için `smtp.gmail.com`, port `465` ve bir [uygulama şifresi](https://support.google.com/accounts/answer/185833).

### Yerel veritabanını sıfırlama

```bash
npm run db:reset
```

Sunucu kapalıyken çalıştırın; bir sonraki açılışta veritabanı yeniden kurulup demo veriyle dolar.

## Canlıya alma (Vercel + Supabase)

1. Supabase'te bir proje açın. **Project Settings › Database › Connection string** bölümünden *Transaction pooler* adresini kopyalayın.
2. Tabloları oluşturun:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:migrate
   ```
3. Vercel'de projeyi bağlayın ve ortam değişkenlerini girin: `DATABASE_URL`, `APP_URL` (sitenin adresi), `TRAINER_INVITE_CODE`, `SMTP_*`, `MAIL_FROM`, `VAPID_*` (`npx web-push generate-vapid-keys` ile üretin), isteğe bağlı `STUDIO_ADDRESS`, `STUDIO_PHONE`, `STUDIO_EMAIL`, `STUDIO_INSTAGRAM`.
4. Canlıda demo veri oluşmaz. Eğitmenler davet koduyla kayıt olur, ilk dersleri eğitmen panelinden açar.

### Günlük görev ve yedek

- `vercel.json` içindeki cron her gün 14:00 UTC'de (17:00 TR) `/api/cron/gunluk` adresini çağırır. Vercel'e `CRON_SECRET` ortam değişkenini ekleyin; Vercel bu anahtarla çağırır.
- `.github/workflows/yedek.yml` her pazartesi veritabanını yedekler ve şifreler. GitHub › Settings › Secrets › Actions'a `BACKUP_DATABASE_URL` (Supabase **Session pooler** ya da doğrudan bağlantı, port 5432) ve `BACKUP_PASSPHRASE` (uzun bir parola) ekleyin. Yedekler Actions › çalışma › Artifacts altında 30 gün durur.
- Geri yükleme: `gpg -d smeda-yedek-TARİH.dump.gpg | pg_restore --no-owner --clean -d "$DATABASE_URL"`

Şema değiştiğinde: `npm run db:generate` ile yeni migration üretin, `npm run db:migrate` ile canlıya uygulayın.

## Güvenlik ve KVKK

**Kodda olanlar**
- **Supabase veri API'si:** Bütün tablolarda satır düzeyi güvenlik (RLS) açık; dışarıdan erişilemez. Yeni tablo eklenirse test, RLS'nin unutulmasına izin vermez.
- **Gizli bilgiler:** Şifreler scrypt ile, oturum ve bağlantı belirteçleri, giriş sayaç anahtarları SHA-256 hash olarak tutulur. Gönderilen e-posta kopyalarında şifre ve onay bağlantıları gizlenir.
- **Tarayıcı korumaları:** Content-Security-Policy (sayfa başka sitelere veri gönderemez), çerçeveleme yasağı, HSTS ve izin kısıtlamaları.
- **Erişim:** Her işlem ve sayfa sahiplik kontrolü yapar (üye yalnızca kendi verisini, eğitmen yalnızca kendi derslerini görür). Giriş sonrası yönlendirme site dışına çıkamaz.
- **Deneme sınırları:** Giriş, kayıt, davet kodu ve şifre sıfırlama için IP ve hesap başına, veritabanında tutulan sınırlar.
- **Herkese açık yorumlar:** Üyeler yalnızca "Elif Y." biçiminde görünür, fotoğrafları gösterilmez.
- **Sağlık verisi:** Rezervasyon notu yalnızca açık rıza kutusu işaretlenince kaydedilir, rıza zamanı tutulur, dersten 6 ay sonra silinir.
- **Saklama:** E-posta kopyaları 30 gün, oturumlar 30 gün, okunmuş bildirimler 1 yıl. Günlük görev temizler.
- **Üye hakları (KVKK md. 11):** Profil › Ayarlar'dan bilgilerini düzeltme, "Verilerimi indir" ve hesabı kalıcı silme.
- **Oturumlar:** Şifre değişince bütün oturumlar kapanır. Çıkış yapınca cihazın telefon bildirimleri de durur.
- **Sunucu kayıtları:** Kayıtlarda e-posta adresleri maskelenir.

**Stüdyonun yapması gerekenler (hukuki)**
- **Aydınlatma metni:** `STUDIO_LEGAL_NAME`, `STUDIO_ADDRESS` ve `STUDIO_EMAIL` doldurulmalı. `/gizlilik` sayfasındaki metin bir hukukçuya kontrol ettirilmeli.
- **Yurt dışına aktarım (KVKK md. 9):** Vercel, Supabase ve Google ile standart sözleşmeler imzalanmalı ve Kurul'a bildirim yapılmalı (yükümlülüğü değerlendirin). VERBİS kaydı gerekip gerekmediği kontrol edilmeli.
- **Canlı ayarlar:** `DATABASE_CA_CERT` girilmeli (veritabanı sertifikası doğrulanır) ve uzun, rastgele bir `TRAINER_INVITE_CODE` kullanılmalı.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu (`:3040`) |
| `npm run build` / `npm start` | Üretim derlemesi ve sunucusu |
| `npm run lint` / `npm run typecheck` | ESLint ve TypeScript kontrolü |
| `npm test` | Rota, yetki ve yardımcı fonksiyon testleri |
| `npm run db:generate` | Şemadan yeni SQL migration üretir |
| `npm run db:migrate` | Migration'ları `DATABASE_URL` veritabanına uygular |
| `npm run db:reset` | Yerel veritabanını siler |

## Sonraki adımlar

- **Diğer ders türleri:** `lesson_type` enum'una değer eklemek yeterli (`ALTER TYPE ... ADD VALUE`).
- **Gizlilik metni:** `/gizlilik` sayfası uygulamanın gerçek veri kullanımını özetler; yayına almadan önce resmî KVKK aydınlatma metniyle güncellenmelidir.
