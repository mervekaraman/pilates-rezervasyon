import { AppShell } from "@/components/flowly/shell";
import { ButtonLink } from "@/components/flowly/ui";

export const metadata = { title: "Sayfa bulunamadı" };

export default function NotFound() {
  return <AppShell className="status-screen">
    <section>
      <p className="eyebrow">404</p>
      <h1>Bu sayfayı<br/>bulamadık.</h1>
      <p>Aradığın sayfa taşınmış ya da hiç var olmamış olabilir. Ders programından devam edebilirsin.</p>
      <ButtonLink href="/dersler">Ders Programına Git</ButtonLink>
    </section>
  </AppShell>;
}
