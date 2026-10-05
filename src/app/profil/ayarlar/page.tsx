import { PasswordForm, ProfileForm } from "@/components/flowly/forms";
import { PushSettings } from "@/components/flowly/push";
import { AppShell } from "@/components/flowly/shell";
import { Avatar, TopBar } from "@/components/flowly/ui";
import { requireUser } from "@/lib/dal";
import { formatPhone } from "@/lib/forms";
import { pushPublicKey } from "@/lib/push";

export const metadata = { title: "Profil ve ayarlar" };

export default async function SettingsPage() {
  const user = await requireUser({ next: "/profil/ayarlar" });
  const publicKey = pushPublicKey();
  return <AppShell className="settings-screen" nav={false}>
    <TopBar back="/profil" title="Profil ve ayarlar"/>
    <section>
      <div className="edit-photo"><Avatar name={user.name} src={user.avatarUrl} size={112}/><p className="muted-note">Profil fotoğrafını stüdyo ekler.</p></div>
      <div className="settings-columns">
        <div><h2>Kişisel bilgiler</h2><ProfileForm name={user.name} phone={formatPhone(user.phone)} email={user.email} emailNotifications={user.emailNotifications}/></div>
        <div>
          {publicKey && <><h2>Bildirimler</h2><PushSettings publicKey={publicKey}/></>}
          <h2>Şifre</h2><PasswordForm/>
        </div>
      </div>
    </section>
  </AppShell>;
}
