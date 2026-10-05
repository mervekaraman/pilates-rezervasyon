# MVP Kapsamı

## Roller

### Üye

- Kayıt olur ve giriş yapar.
- Pazartesi–cumartesi arasındaki dersleri görür.
- Uygun derse rezervasyon talebi gönderir.
- Talebinin durumunu takip eder.
- İptal süresi dolmadıysa rezervasyonunu iptal eder.
- Katıldığı ve tamamlanmış bir derse bir kez puan ve yorum bırakır.

### Eğitmen

- Kendi derslerini ve rezervasyon taleplerini görür.
- Bekleyen talebi onaylar veya reddeder.
- Dersin tamamlandığını ve üyenin katılım durumunu işaretler.
- Derslerine yazılan yorumları görür.

### Yönetici

İlk sürümde eğitmen aynı zamanda yönetici olabilir. İhtiyaç büyüdüğünde ayrı yönetici rolü açılır.

## Temel akış

1. Eğitmen ders günü, başlangıç/bitiş saati ve kontenjanı tanımlar.
2. Üye uygun bir ders için talep oluşturur.
3. Talep `bekliyor` durumunda görünür.
4. Eğitmen talebi onaylar veya reddeder.
5. Onaylanan rezervasyon kontenjandan yer kullanır.
6. Üye izin verilen süre içinde rezervasyonu iptal edebilir.
7. Ders tamamlanıp katılım doğrulandıktan sonra üye 1–5 yıldız ve yorum bırakabilir.

## Rezervasyon durumları

- `pending`: Eğitmen kararı bekleniyor.
- `approved`: Eğitmen onayladı.
- `rejected`: Eğitmen reddetti.
- `cancelled_by_member`: Üye iptal etti.
- `cancelled_by_instructor`: Eğitmen iptal etti.
- `completed`: Ders tamamlandı ve katılım doğrulandı.
- `no_show`: Üye derse katılmadı.

## İş kuralları

- Dersler yalnızca pazartesi–cumartesi planlanabilir.
- Dersler saat başında başlar (07:00–21:00); varsayılan kontenjan 4 kişidir.
- Ders başına ücret yoktur; üyeler ödemeyi üyelik başında toplu yapar. Uygulama ödeme almaz.
- Bir üye aynı ders için yalnızca bir aktif rezervasyon oluşturabilir.
- Bir üye saatleri çakışan iki derse rezervasyon yapamaz.
- Onay sırasında kontenjan sunucu tarafında tekrar kontrol edilir; böylece son yer iki kişiye verilmez.
- Geçmişteki bir derse rezervasyon yapılamaz.
- İptal sınırı yapılandırılabilir olmalıdır. Başlangıç varsayımı: ders saatinden 2 saat öncesi.
- Puanlama yalnızca `completed` durumundaki rezervasyon için yapılabilir.
- Her tamamlanan rezervasyon için yalnızca bir değerlendirme bırakılabilir; değerlendirme sonradan düzenlenebilir.
- Puan 1–5 arasında olmalıdır.

## İlk ekranlar

1. Giriş / kayıt
2. Haftalık ders programı
3. Ders detayı ve rezervasyon talebi
4. Üyenin rezervasyonları
5. Eğitmenin onay kuyruğu
6. Eğitmenin ders yönetimi
7. Ders değerlendirme formu

## İlk veri modeli

- `profiles`: kullanıcı, ad, iletişim bilgisi ve rol
- `classes`: ders adı, eğitmen, açıklama, süre ve kontenjan
- `class_sessions`: belirli tarih ve saatte gerçekleşecek ders
- `bookings`: üye, ders oturumu, durum ve zaman damgaları
- `reviews`: tamamlanan rezervasyon, puan ve yorum
- `app_settings`: iptal sınırı gibi işletme ayarları

## MVP dışında

- Online ödeme ve paket satışı
- Bekleme listesi
- Push/SMS/WhatsApp bildirimleri
- Tekrarlayan abonelikler
- Birden fazla şube
- Gelişmiş raporlama

Bu özellikler veri modeli genişlemeye uygun kurulduktan sonra eklenebilir.

## Açık kararlar

- İptal için son süre kaç saat önce olacak?
- Bir üyeye aynı anda kaç aktif rezervasyon hakkı verilecek?
- Eğitmen talebi ne kadar süre içinde yanıtlamalı?
- Uygulama tek eğitmenli mi, çok eğitmenli mi olacak?
- Üyelik davetle mi, herkese açık kayıtla mı başlayacak?

