/* eslint-disable @next/next/no-img-element -- Reference PNG crops require exact native image sizing. */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FlowlyIcon, type FlowlyIconName } from "./icons";
import { studios } from "@/lib/flowly-data";

export function Brand({ light = false }: { light?: boolean }) { return <span className={`flowly-brand${light ? " is-light" : ""}`}>flowly</span>; }

export function TopBar({ title, back = true, action }: { title?: string; back?: boolean; action?: React.ReactNode }) {
  const router = useRouter();
  return <header className="flowly-topbar">{back ? <button className="icon-button" onClick={() => router.back()} aria-label="Geri"><FlowlyIcon name="arrow-left" size={30}/></button> : <span/>}<strong>{title}</strong><div>{action}</div></header>;
}

export function PrimaryButton({ children, href, disabled, loading, onClick, outline = false }: { children: React.ReactNode; href?: string; disabled?: boolean; loading?: boolean; onClick?: () => void; outline?: boolean }) {
  const cls = `flowly-button${outline ? " is-outline" : ""}`;
  if (href && !disabled) return <Link href={href} className={cls}>{children}<FlowlyIcon name="arrow-right" size={20}/></Link>;
  return <button type="submit" className={cls} disabled={disabled || loading} onClick={onClick}>{loading ? "Bekle..." : children}{!loading && <FlowlyIcon name="arrow-right" size={20}/>}</button>;
}

export function Field({ label, icon, type = "text", value, onChange, placeholder, error, name }: { label: string; icon?: FlowlyIconName; type?: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; name?: string }) {
  return <label className={`flowly-field${error ? " has-error" : ""}`}><span>{label}</span><div>{icon && <FlowlyIcon name={icon} size={21}/>}<input name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/></div>{error && <small>{error}</small>}</label>;
}

const memberItems = [
  { href: "/kesfet", label: "Keşfet", icon: "home" as const },
  { href: "/rezervasyonlar", label: "Rezervasyonlar", icon: "calendar" as const },
  { href: "/favoriler", label: "Favoriler", icon: "heart" as const },
  { href: "/profil", label: "Profil", icon: "user" as const },
];
const trainerItems = [
  { href: "/egitmen-paneli", label: "Özet", icon: "home" as const },
  { href: "/egitmen-paneli/takvim", label: "Takvim", icon: "calendar" as const },
  { href: "/egitmen-paneli/talepler", label: "Talepler", icon: "users" as const },
  { href: "/profil", label: "Profil", icon: "user" as const },
];

export function BottomNav({ trainer = false }: { trainer?: boolean }) {
  const pathname = usePathname();
  const items = trainer ? trainerItems : memberItems;
  return <nav className="flowly-bottom-nav" aria-label="Alt navigasyon">{items.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "is-active" : ""}><FlowlyIcon name={item.icon}/><span>{item.label}</span></Link>)}</nav>;
}

export function StatusBadge({ children, tone = "moss" }: { children: React.ReactNode; tone?: "moss" | "plum" | "blue" | "neutral" }) { return <span className={`status-badge ${tone}`}>{children}</span>; }

export function DatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const dates = [{ d: "Pzt", n: "28" }, { d: "Sal", n: "29" }, { d: "Çar", n: "30" }, { d: "Per", n: "1" }, { d: "Cum", n: "2" }, { d: "Cmt", n: "4" }, { d: "Paz", n: "5" }];
  return <div className="date-picker">{dates.map((date) => <button key={date.n} className={value === date.n ? "is-selected" : ""} onClick={() => onChange(date.n)}><span>{date.d}</span><strong>{date.n}</strong></button>)}</div>;
}

export function StudioRow({ studio = studios[0], favorite, onFavorite }: { studio?: typeof studios[number]; favorite?: boolean; onFavorite?: () => void }) {
  return <article className="studio-row"><Link href="/studyo/move-studio" className="studio-row-main"><img src={studio.image} alt=""/><div><div className="row-title"><strong>{studio.name}</strong><span>{studio.distance}</span></div><p>{studio.type}</p><p>{studio.time} · {studio.duration}</p><p className="rating">★ <span>{studio.rating} ({studio.reviews})</span></p></div></Link>{onFavorite && <button className={`favorite-button${favorite ? " is-active" : ""}`} onClick={onFavorite} aria-label="Favoriye ekle"><FlowlyIcon name="heart"/></button>}</article>;
}

export function InstructorRow({ compact = false }: { compact?: boolean }) {
  return <Link href="/egitmen/duygu-kaya" className={`instructor-row${compact ? " is-compact" : ""}`}><img src="/images/flowly/instructor.webp" alt="Duygu Kaya"/><div><strong>Duygu Kaya</strong><span>Pilates Eğitmeni</span></div><FlowlyIcon name="arrow-right"/></Link>;
}

export function SettingRow({ icon, label, value, href = "#" }: { icon: FlowlyIconName; label: string; value?: string; href?: string }) { return <Link href={href} className="setting-row"><FlowlyIcon name={icon}/><strong>{label}</strong>{value && <span>{value}</span>}<FlowlyIcon name="arrow-right" size={19}/></Link>; }
