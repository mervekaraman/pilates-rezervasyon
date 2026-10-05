import { AppShell } from "@/components/flowly/shell";
import { PageHeading } from "@/components/flowly/ui";
import { studio } from "@/lib/studio";

export const metadata = { title: "Gizlilik ve kullanım koşulları" };

export default function PrivacyPage() {
  return <AppShell className="legal-screen">
    <section>
      <PageHeading eyebrow="Gizlilik" title="Gizlilik ve kullanım koşulları" sub={`${studio.name} rezervasyon uygulamasının kişisel verilerini nasıl kullandığını burada sade bir dille anlatıyoruz.`}/>
      <article className="prose">
        <h2>Hangi bilgileri topluyoruz?</h2>
        <p>Hesap açarken verdiğin ad soyad, e-posta adresi ve cep telefonu numarası; oluşturduğun rezervasyon talepleri, eğitmene bıraktığın notlar ve yayınladığın yorumlar. Şifren yalnızca geri döndürülemez biçimde (hash) saklanır; kimse göremez.</p>
        <h2>Bu bilgileri ne için kullanıyoruz?</h2>
        <ul>
          <li>Rezervasyonlarını oluşturmak, eğitmen onayına sunmak ve yönetmek,</li>
          <li>Talep, onay ve iptal gibi durumlarda sana e-posta ve uygulama içi bildirim göndermek,</li>
          <li>Eğitmenin derse hazırlanabilmesi için notlarını ve iletişim bilgini ilgili eğitmenle paylaşmak.</li>
        </ul>
        <h2>Kimlerle paylaşıyoruz?</h2>
        <p>Bilgilerin yalnızca {studio.name} ekibi ve rezervasyon yaptığın dersin eğitmeniyle paylaşılır. Reklam ya da pazarlama amacıyla üçüncü kişilere aktarılmaz. E-postalar, gönderim hizmeti sağlayıcımız aracılığıyla iletilir.</p>
        <h2>Ne kadar süre saklıyoruz?</h2>
        <p>Hesabın açık olduğu sürece. Hesabının ve verilerinin silinmesini istediğinde stüdyoya bildirmen yeterli; yasal olarak saklanması gerekenler dışındaki tüm kayıtların silinir.</p>
        <h2>Hakların</h2>
        <p>Verilerine erişme, düzeltilmesini ya da silinmesini isteme hakkın var. Ad ve telefon bilgini profil ayarlarından kendin güncelleyebilirsin.</p>
        <h2>Kullanım koşulları</h2>
        <ul>
          <li>Rezervasyon talebi, eğitmen onayladığında kesinleşir; onay bekleyen talepler de derste yer tutar.</li>
          <li>Onaylanmış bir dersi, ders saatine {studio.cancellationHours} saat kalana kadar iptal edebilirsin.</li>
          <li>Ödemeler üyelik başında toplu olarak alınır; uygulama üzerinden ödeme alınmaz ve kart bilgisi istenmez.</li>
          <li>Yorumlar gerçek deneyimine dayanmalı; hakaret ya da kişisel bilgi içeren yorumlar kaldırılabilir.</li>
        </ul>
      </article>
    </section>
  </AppShell>;
}
