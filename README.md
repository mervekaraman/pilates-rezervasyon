# Smeda Pilates — Rezervasyon Uygulaması

Smeda Pilates için reformer ders rezervasyonu: üyeler programdan ders seçip talep gönderir, eğitmen onaylar ya da reddeder, her adımda e-posta ve uygulama içi bildirim gider. Pazartesi–cumartesi çalışır; şimdilik yalnızca reformer dersleri açılır.

İş kuralları için [docs/MVP.md](docs/MVP.md) dosyasına bakın.

## Neler var?

- **Üyelik:** e-posta + şifre ile kayıt/giriş, şifre sıfırlama (e-postayla, 1 saat geçerli tek kullanımlık bağlantı), profil ve bildirim tercihleri.
- **Roller:** danışan (üye) ve eğitmen. Eğitmen hesabı, kayıt formunda stüdyonun **davet kodu** girilerek açılır.
- **Danışan:** ders programı, ders detayı, rezervasyon talebi, rezervasyonlarım, iptal veya başka saate taşıma (derse 12 saat kalana kadar), katılımı doğrulanan dersi değerlendirme ve yorumu düzenleme.
- **Eğitmen:** özet paneli, yeni ders saati açma (saat başlarında, varsayılan 4 kişilik; haftalık tekrar dahil, stüdyoda saat çakışması engellenir), talepleri onaylama/reddetme, takvim, katıldı/katılmadı kaydı, ders iptali (üyelere otomatik haber verilir).
- **Bildirimler:** talep alındı, onay/ret, iptal ve ders iptali için e-posta + uygulama içi bildirim.
- **Telefon bildirimleri (Web Push, ücretsiz):** üye ya da eğitmen Profil › Ayarlar'dan (veya rezervasyon sonrası ekrandan) açar; aynı bildirimler telefona anında düşer. Android'de doğrudan, iPhone'da site ana ekrana eklenince çalışır. Yalnızca https'te (ve localhost'ta) çalışır.
- **WhatsApp'tan haber ver (ücretsiz):** eğitmen onay/ret sonrası, talepler listesinde ve ders katılımcı listesinde tek dokunuşla WhatsApp'ı üyenin numarası ve hazır mesajla açar; gönderen eğitmenin kendi WhatsApp'ıdır, API ya da ücret yoktur.
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
3. Vercel'de projeyi bağlayın ve `.env.example` içindeki canlı ortam değişkenlerini girin. `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` için `openssl rand -base64 32`, Web Push için `npx web-push generate-vapid-keys` kullanabilirsiniz.
4. Ortam değişkenlerini yerelde bir kez `npm run check:production` ile doğrulayın.
5. GitHub Actions her gönderimde lint, typecheck, test ve üretim derlemesini otomatik çalıştırır.
6. Canlıda demo veri oluşmaz. Eğitmenler davet koduyla kayıt olur, ilk dersleri eğitmen panelinden açar.

Şema değiştiğinde: `npm run db:generate` ile yeni migration üretin, `npm run db:migrate` ile canlıya uygulayın.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu (`:3040`) |
| `npm run build` / `npm start` | Üretim derlemesi ve sunucusu |
| `npm run lint` / `npm run typecheck` | ESLint ve TypeScript kontrolü |
| `npm test` | Rota, yetki ve yardımcı fonksiyon testleri |
| `npm run check` | Tüm kalite kontrollerini sırayla çalıştırır |
| `npm run check:production` | Canlı ortam değişkenlerini sır göstermeden doğrular |
| `npm run db:generate` | Şemadan yeni SQL migration üretir |
| `npm run db:migrate` | Migration'ları `DATABASE_URL` veritabanına uygular |
| `npm run db:reset` | Yerel veritabanını siler |
| `npm run db:cleanup` | Süresi dolan güvenlik kayıtlarını temizler (günlük zamanlanabilir) |
| `npm run mail:retry` | Başarısız, hassas olmayan e-postaları yeniden dener |

## Sonraki adımlar

- **Diğer ders türleri:** `lesson_type` enum'una değer eklemek yeterli (`ALTER TYPE ... ADD VALUE`).
- **Canlı operasyon:** `db:cleanup` komutunu günlük, `mail:retry` komutunu 5–15 dakikada bir çalıştırın. Şifre sıfırlama e-postaları güvenlik nedeniyle tekrar kuyruğuna alınmaz; kullanıcı yeni bağlantı ister.
- **Gizlilik metni:** `/gizlilik` gerçek veri kullanımını ve KVKK başlıklarını kapsar; yayına almadan önce işletmenin hukuk danışmanına onaylatılmalıdır.
