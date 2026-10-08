import { ConfirmEmailForm } from "@/components/flowly/forms";
import { AppShell } from "@/components/flowly/shell";
import { Brand, Notice, TopBar } from "@/components/flowly/ui";

export const metadata = { title: "E-posta onayı" };

// Opened from the link in the new mailbox. Nothing changes on page load (mail scanners prefetch
// links); the member confirms with the button.
export default async function ConfirmEmailPage({ searchParams }: PageProps<"/eposta-dogrula">) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  return <AppShell bare className="auth-screen">
    <TopBar back="/" action={<Brand/>}/>
    <section>
      <h1>E-postanı<br/>onayla.</h1>
      <p>Hesabının giriş e-postasını bu adresle değiştirmek için onayla.</p>
      {token ? <ConfirmEmailForm token={token}/> : <Notice tone="error">Bağlantı eksik. E-postadaki bağlantıyı tam olarak açtığından emin ol.</Notice>}
    </section>
  </AppShell>;
}
