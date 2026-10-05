"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword, createReview, updateProfile } from "@/app/actions/account";
import { login, requestPasswordReset, resetPassword, signup } from "@/app/actions/auth";
import { cancelBooking, decideBooking, requestBooking } from "@/app/actions/bookings";
import { cancelLesson, createLesson } from "@/app/actions/lessons";
import { addDays, atStudioTime } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { FlowlyIcon, type FlowlyIconName } from "./icons";
import { Notice } from "./ui";

export function SubmitButton({ children, pendingLabel = "Lütfen bekle…", variant = "primary", icon = true, name, value }: { children: React.ReactNode; pendingLabel?: string; variant?: "primary" | "outline"; icon?: boolean; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" name={name} value={value} className={`flowly-button${variant === "outline" ? " is-outline" : ""}`} disabled={pending} aria-busy={pending}>{pending ? pendingLabel : children}{!pending && icon && <FlowlyIcon name="arrow-right" size={20}/>}</button>;
}

type FieldProps = { label: string; name: string; icon?: FlowlyIconName; type?: string; defaultValue?: string; placeholder?: string; error?: string; hint?: string; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] };

export function Field({ label, name, icon, type = "text", defaultValue, placeholder, error, hint, autoComplete, inputMode }: FieldProps) {
  const id = `field-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return <div className={`flowly-field${error ? " has-error" : ""}`}>
    <label htmlFor={id}>{label}</label>
    <div>{icon && <FlowlyIcon name={icon} size={21}/>}<input id={id} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={Boolean(error)} aria-describedby={describedBy}/></div>
    {error ? <small id={`${id}-error`}>{error}</small> : hint ? <small id={`${id}-hint`} className="field-hint">{hint}</small> : null}
  </div>;
}

function PasswordField(props: Omit<FieldProps, "type" | "icon" | "defaultValue">) {
  const [visible, setVisible] = useState(false);
  const id = `field-${props.name}`;
  const describedBy = props.error ? `${id}-error` : props.hint ? `${id}-hint` : undefined;
  return <div className={`flowly-field${props.error ? " has-error" : ""}`}>
    <label htmlFor={id}>{props.label}</label>
    <div><FlowlyIcon name="lock" size={21}/><input id={id} name={props.name} type={visible ? "text" : "password"} placeholder={props.placeholder} autoComplete={props.autoComplete} aria-invalid={Boolean(props.error)} aria-describedby={describedBy}/>
      <button type="button" className="field-toggle" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={visible}><FlowlyIcon name="eye" size={20}/></button></div>
    {props.error ? <small id={`${id}-error`}>{props.error}</small> : props.hint ? <small id={`${id}-hint`} className="field-hint">{props.hint}</small> : null}
  </div>;
}

function FormMessage({ state }: { state: FormState }) {
  if (state?.error) return <Notice tone="error">{state.error}</Notice>;
  if (state?.ok && state.message) return <Notice tone="success">{state.message}</Notice>;
  return null;
}

/* ——— Authentication ——— */

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  return <form action={action} className="auth-form-v4" noValidate>
    {next && <input type="hidden" name="sonra" value={next}/>}
    <FormMessage state={state}/>
    <Field label="E-posta" name="email" type="email" icon="mail" autoComplete="email" placeholder="ornek@eposta.com" defaultValue={state?.values?.email} error={state?.fieldErrors?.email}/>
    <PasswordField label="Şifre" name="password" autoComplete="current-password" placeholder="Şifreni gir" error={state?.fieldErrors?.password}/>
    <Link href="/sifre-sifirlama" className="auth-forgot">Şifremi unuttum</Link>
    <SubmitButton pendingLabel="Giriş yapılıyor…">Giriş Yap</SubmitButton>
  </form>;
}

export function SignupForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signup, undefined);
  const [trainer, setTrainer] = useState(false);
  const showInvite = trainer || Boolean(state?.values?.inviteCode) || Boolean(state?.fieldErrors?.inviteCode);
  return <form action={action} className="auth-form-v4" noValidate>
    {next && <input type="hidden" name="sonra" value={next}/>}
    <FormMessage state={state}/>
    <Field label="Ad Soyad" name="name" icon="user" autoComplete="name" placeholder="Adın ve soyadın" defaultValue={state?.values?.name} error={state?.fieldErrors?.name}/>
    <Field label="E-posta" name="email" type="email" icon="mail" autoComplete="email" placeholder="ornek@eposta.com" defaultValue={state?.values?.email} error={state?.fieldErrors?.email} hint="Rezervasyon bildirimleri bu adrese gelir."/>
    <Field label="Cep telefonu" name="phone" type="tel" icon="phone" autoComplete="tel" inputMode="tel" placeholder="0532 123 45 67" defaultValue={state?.values?.phone} error={state?.fieldErrors?.phone}/>
    <PasswordField label="Şifre" name="password" autoComplete="new-password" placeholder="En az 8 karakter" error={state?.fieldErrors?.password}/>
    {showInvite
      ? <Field label="Eğitmen davet kodu" name="inviteCode" icon="tag" autoComplete="off" placeholder="Stüdyonun verdiği kod" defaultValue={state?.values?.inviteCode} error={state?.fieldErrors?.inviteCode} hint="Danışan olarak kayıt oluyorsan bu alanı boş bırak."/>
      : <button type="button" className="inline-link" onClick={() => setTrainer(true)}>Eğitmen misin? Davet kodunu gir</button>}
    <label className={`check-row${state?.fieldErrors?.terms ? " has-error" : ""}`}><input type="checkbox" name="terms"/><span><Link href="/gizlilik" target="_blank">Kullanım koşullarını ve gizlilik metnini</Link> okudum, kabul ediyorum.</span></label>
    {state?.fieldErrors?.terms && <small className="check-error">{state.fieldErrors.terms}</small>}
    <SubmitButton pendingLabel="Hesap açılıyor…">Üye Ol</SubmitButton>
  </form>;
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  if (state?.ok) return <div className="auth-form-v4"><Notice tone="success">{state.message}</Notice><Link href="/giris" className="center-link">Girişe dön</Link></div>;
  return <form action={action} className="auth-form-v4" noValidate>
    <FormMessage state={state}/>
    <Field label="E-posta" name="email" type="email" icon="mail" autoComplete="email" placeholder="ornek@eposta.com" defaultValue={state?.values?.email} error={state?.fieldErrors?.email}/>
    <SubmitButton pendingLabel="Gönderiliyor…">Bağlantı Gönder</SubmitButton>
  </form>;
}

export function NewPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, undefined);
  return <form action={action} className="auth-form-v4" noValidate>
    <input type="hidden" name="token" value={token}/>
    <FormMessage state={state}/>
    <PasswordField label="Yeni şifre" name="password" autoComplete="new-password" placeholder="En az 8 karakter" error={state?.fieldErrors?.password}/>
    <PasswordField label="Yeni şifre (tekrar)" name="confirm" autoComplete="new-password" placeholder="Şifreni tekrar yaz" error={state?.fieldErrors?.confirm}/>
    <SubmitButton pendingLabel="Kaydediliyor…">Şifremi Güncelle</SubmitButton>
  </form>;
}

/* ——— Member ——— */

export function BookingRequestForm({ lessonId }: { lessonId: string }) {
  const [state, action] = useActionState(requestBooking, undefined);
  return <form action={action} className="booking-form" noValidate>
    <input type="hidden" name="lessonId" value={lessonId}/>
    <FormMessage state={state}/>
    <label className="note-field"><span>Eğitmenine not <small>(isteğe bağlı)</small></span><textarea name="memberNote" maxLength={300} placeholder="Ör. bel hassasiyetim var, ilk reformer dersim…"/></label>
    {state?.fieldErrors?.memberNote && <small className="check-error">{state.fieldErrors.memberNote}</small>}
    <SubmitButton pendingLabel="Talep gönderiliyor…">Rezervasyon Talebi Gönder</SubmitButton>
  </form>;
}

export function CancelBookingForm({ bookingId, lockedReason }: { bookingId: string; lockedReason?: string }) {
  const [state, action] = useActionState(cancelBooking, undefined);
  const [confirming, setConfirming] = useState(false);
  if (state?.ok) return <Notice tone="success">{state.message}</Notice>;
  if (lockedReason) return <p className="muted-note">{lockedReason}</p>;
  return <form action={action} className="confirm-form">
    <input type="hidden" name="bookingId" value={bookingId}/>
    <FormMessage state={state}/>
    {confirming
      ? <div className="confirm-box"><p>Rezervasyonunu iptal etmek istediğine emin misin? Yerin diğer üyelere açılacak.</p><div><SubmitButton variant="outline" icon={false} pendingLabel="İptal ediliyor…">Evet, iptal et</SubmitButton><button type="button" className="text-button" onClick={() => setConfirming(false)}>Vazgeç</button></div></div>
      : <button type="button" className="danger-link" onClick={() => setConfirming(true)}>Rezervasyonu iptal et</button>}
  </form>;
}

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(createReview, undefined);
  const [rating, setRating] = useState(5);
  const [length, setLength] = useState(state?.values?.comment?.length ?? 0);
  const words = ["", "Hiç beğenmedim", "Beklentimin altında", "İdare eder", "Çok iyiydi", "Harikaydı"];
  return <form action={action} noValidate>
    <input type="hidden" name="bookingId" value={bookingId}/>
    <input type="hidden" name="rating" value={rating}/>
    <FormMessage state={state}/>
    <div className="star-picker" role="radiogroup" aria-label="Puan">{[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} role="radio" aria-checked={rating === star} aria-label={`${star} yıldız`} className={star <= rating ? "is-on" : ""} onClick={() => setRating(star)}><FlowlyIcon name="star" size={34}/></button>)}<span>{words[rating]}</span></div>
    <label className="review-input"><span>Yorumun</span><textarea name="comment" maxLength={500} defaultValue={state?.values?.comment} onChange={(event) => setLength(event.target.value.length)} placeholder="Ders, eğitmen ve stüdyo hakkında deneyimini birkaç cümleyle anlat…" aria-invalid={Boolean(state?.fieldErrors?.comment)}/><small>{length}/500</small></label>
    {state?.fieldErrors?.comment && <small className="check-error">{state.fieldErrors.comment}</small>}
    <label className="check-row"><input type="checkbox" name="recommendsTrainer" defaultChecked/>Eğitmeni öneririm</label>
    <label className="check-row"><input type="checkbox" name="recommendsStudio" defaultChecked/>Stüdyoyu öneririm</label>
    <SubmitButton pendingLabel="Yayınlanıyor…">Yorumu Yayınla</SubmitButton>
  </form>;
}

export function ProfileForm({ name, phone, email, emailNotifications }: { name: string; phone: string; email: string; emailNotifications: boolean }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return <form action={action} className="settings-form" noValidate>
    <FormMessage state={state}/>
    <Field label="Ad Soyad" name="name" icon="user" autoComplete="name" defaultValue={state?.values?.name ?? name} error={state?.fieldErrors?.name}/>
    <div className="flowly-field is-readonly"><label htmlFor="field-email-readonly">E-posta</label><div><FlowlyIcon name="mail" size={21}/><input id="field-email-readonly" value={email} readOnly aria-describedby="email-hint"/></div><small id="email-hint" className="field-hint">E-posta adresini değiştirmek için stüdyoyla iletişime geç.</small></div>
    <Field label="Cep telefonu" name="phone" type="tel" icon="phone" autoComplete="tel" inputMode="tel" defaultValue={state?.values?.phone ?? phone} error={state?.fieldErrors?.phone}/>
    <label className="preference-row"><FlowlyIcon name="bell"/><p><strong>E-posta bildirimleri</strong><span>Talep, onay ve iptal haberlerini e-postayla al.</span></p><input className="toggle" type="checkbox" name="emailNotifications" defaultChecked={emailNotifications}/></label>
    <SubmitButton pendingLabel="Kaydediliyor…" icon={false}>Değişiklikleri Kaydet</SubmitButton>
  </form>;
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return <form action={action} className="settings-form" noValidate>
    <FormMessage state={state}/>
    <PasswordField label="Mevcut şifre" name="current" autoComplete="current-password" error={state?.fieldErrors?.current}/>
    <PasswordField label="Yeni şifre" name="password" autoComplete="new-password" placeholder="En az 8 karakter" error={state?.fieldErrors?.password}/>
    <SubmitButton pendingLabel="Güncelleniyor…" variant="outline" icon={false}>Şifreyi Güncelle</SubmitButton>
  </form>;
}

/* ——— Trainer ——— */

export function DecisionForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(decideBooking, undefined);
  return <form action={action} className="decision-form" noValidate>
    <input type="hidden" name="bookingId" value={bookingId}/>
    <input type="hidden" name="back" value="detail"/>
    <FormMessage state={state}/>
    <label className="note-field"><span>Üyeye not <small>(isteğe bağlı, e-postada görünür)</small></span><textarea name="trainerNote" maxLength={300} placeholder="Ör. derse 10 dakika erken gelirsen aletleri birlikte ayarlarız."/></label>
    <div className="decision-actions"><SubmitButton name="decision" value="approve" pendingLabel="Kaydediliyor…">Talebi Onayla</SubmitButton><SubmitButton name="decision" value="reject" variant="outline" icon={false} pendingLabel="Kaydediliyor…">Reddet</SubmitButton></div>
  </form>;
}

export function QuickApproveForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(decideBooking, undefined);
  return <form action={action} className="quick-approve">
    <input type="hidden" name="bookingId" value={bookingId}/>
    <input type="hidden" name="decision" value="approve"/>
    <SubmitButton icon={false} pendingLabel="…">Onayla</SubmitButton>
    {state?.error && <small className="check-error">{state.error}</small>}
  </form>;
}

const levels = [["tum", "Tüm seviyeler"], ["baslangic", "Başlangıç"], ["orta", "Orta"], ["ileri", "İleri"]] as const;

type SelectOption = [value: string, text: string, disabled?: boolean];
type SelectRowProps = { icon: FlowlyIconName; label: string; name: string; options: SelectOption[]; value: string; onChange?: (value: string) => void; placeholder?: string; invalid?: boolean };

/** A settings-style row; clicking anywhere on it (label, value or chevron) opens the native picker. */
function SelectRow({ icon, label, name, options, value, onChange, placeholder, invalid }: SelectRowProps) {
  const select = useRef<HTMLSelectElement>(null);
  const open = (event: React.MouseEvent<HTMLLabelElement>) => {
    const element = select.current;
    if (!element || element.contains(event.target as Node) || typeof element.showPicker !== "function") return;
    try {
      element.focus();
      element.showPicker();
      event.preventDefault();
    } catch {
      // Browsers that refuse showPicker() fall back to the label focusing the select.
    }
  };
  return <label className={`form-row${invalid ? " has-error" : ""}`} onClick={open}>
    <FlowlyIcon name={icon}/><strong>{label}</strong>
    <span className="select-control">
      {/* Uncontrolled on purpose: React resets a form after its action runs, and only `defaultValue` survives that reset. */}
      <select ref={select} name={name} defaultValue={value} onChange={onChange && ((event) => onChange(event.target.value))}>
        {placeholder && <option value="" disabled hidden>{placeholder}</option>}
        {options.map(([optionValue, text, disabled]) => <option key={optionValue} value={optionValue} disabled={disabled}>{text}</option>)}
      </select>
      <FlowlyIcon name="chevron-down" size={18}/>
    </span>
  </label>;
}

type SlotState = { state: "free" } | { state: "past" } | { state: "busy"; week: number };

/** Whether `time` on `day` (and the same slot in the following weeks) is open in the studio. */
function slotState(day: string, time: string, durationMin: number, weeks: number, busy: [number, number][], now: number): SlotState {
  for (let week = 0; week < weeks; week++) {
    const start = atStudioTime(addDays(day, week * 7), time).getTime();
    const end = start + durationMin * 60_000;
    if (week === 0 && start <= now) return { state: "past" };
    if (busy.some(([busyStart, busyEnd]) => busyStart < end && busyEnd > start)) return { state: "busy", week };
  }
  return { state: "free" };
}

const durations = [30, 45, 50, 55, 60, 75, 90];
const repeatOptions = [2, 3, 4, 6, 8];

type NewLessonFormProps = { days: { key: string; label: string }[]; times: string[]; busy: [number, number][]; now: number; defaults: { day?: string; durationMin: number; capacity: number } };

export function NewLessonForm({ days, times, busy, now, defaults }: NewLessonFormProps) {
  const [state, action] = useActionState(createLesson, undefined);
  const value = (key: string, fallback: string) => state?.values?.[key] ?? fallback;
  const invalid = (name: string) => Boolean(state?.fieldErrors?.[name]);
  const hasFreeTime = (day: string, durationMin: number) => times.some((time) => slotState(day, time, durationMin, 1, busy, now).state === "free");

  const [duration, setDuration] = useState(() => value("durationMin", String(defaults.durationMin)));
  const [day, setDay] = useState(() => value("day", defaults.day ?? days.find((option) => hasFreeTime(option.key, Number(duration)))?.key ?? days[0]?.key ?? ""));
  const [time, setTime] = useState(() => value("time", ""));
  const [repeat, setRepeat] = useState(false);
  const [weeks, setWeeks] = useState("4");

  const span = repeat ? Number(weeks) : 1;
  const timeOptions: SelectOption[] = times.map((option) => {
    const slot = slotState(day, option, Number(duration), span, busy, now);
    if (slot.state === "free") return [option, option];
    return [option, `${option} · ${slot.state === "past" ? "geçti" : slot.week === 0 ? "dolu" : `${slot.week + 1}. hafta dolu`}`, true];
  });
  // A time that became unavailable (other day, longer class, more weeks, or just taken) is dropped.
  const selectedTime = timeOptions.some(([option, , disabled]) => option === time && !disabled) ? time : "";
  const dayIsFull = !timeOptions.some(([, , disabled]) => !disabled);

  return <form action={action} noValidate>
    <FormMessage state={state}/>
    <div className="new-class-list">
      <SelectRow icon="calendar" label="Gün" name="day" options={days.map((option) => [option.key, hasFreeTime(option.key, Number(duration)) ? option.label : `${option.label} · dolu`])} value={day} onChange={setDay} invalid={invalid("day")}/>
      {/* Remounts when availability changes so a time that just became unavailable is dropped from the select. */}
      <SelectRow key={`${day}|${duration}|${span}|${selectedTime === time}`} icon="clock" label="Başlangıç" name="time" options={timeOptions} value={selectedTime} onChange={setTime} placeholder={dayIsFull ? "Boş saat yok" : "Saat seç"} invalid={invalid("time")}/>
      <SelectRow icon="hourglass" label="Süre" name="durationMin" options={durations.map((minutes) => [String(minutes), `${minutes} dk`])} value={duration} onChange={setDuration} invalid={invalid("durationMin")}/>
      <SelectRow icon="users" label="Kontenjan" name="capacity" options={Array.from({ length: 12 }, (_, index) => [String(index + 1), `${index + 1} kişi`])} value={value("capacity", String(defaults.capacity))} invalid={invalid("capacity")}/>
      <label className="form-row is-toggle"><FlowlyIcon name="repeat"/><strong>Her hafta tekrarla</strong><input type="checkbox" className="toggle" name="repeat" checked={repeat} onChange={(event) => setRepeat(event.target.checked)}/></label>
      {repeat && <SelectRow icon="repeat" label="Kaç hafta" name="repeatWeeks" options={repeatOptions.map((count) => [String(count), `${count} hafta`])} value={weeks} onChange={setWeeks} invalid={invalid("repeatWeeks")}/>}
    </div>
    {dayIsFull && <small className="form-hint">Bu günde {repeat ? "seçtiğin haftalar için " : ""}boş saat kalmadı; başka bir gün seç.</small>}
    {Object.entries(state?.fieldErrors ?? {}).filter(([key]) => key !== "level" && key !== "note").map(([key, message]) => <small key={key} className="check-error">{message}</small>)}
    <fieldset className="level-picker"><legend>Seviye</legend><div className="chip-group">{levels.map(([level, label]) => <label key={level} className="chip-radio"><input type="radio" name="level" value={level} defaultChecked={value("level", "tum") === level}/><span>{label}</span></label>)}</div></fieldset>
    <label className="note-field"><span><FlowlyIcon name="document" size={20}/>Not <small>(isteğe bağlı, üyeler görür)</small></span><textarea name="note" maxLength={300} defaultValue={state?.values?.note} placeholder="Ör. yeni başlayanlara uygun, havlu ve çorap getirmeyi unutmayın."/></label>
    <SubmitButton pendingLabel="Yayınlanıyor…">Dersi Yayınla</SubmitButton>
  </form>;
}

export function CancelLessonForm({ lessonId, booked }: { lessonId: string; booked: number }) {
  const [state, action] = useActionState(cancelLesson, undefined);
  const [confirming, setConfirming] = useState(false);
  return <form action={action} className="confirm-form">
    <input type="hidden" name="lessonId" value={lessonId}/>
    <FormMessage state={state}/>
    {confirming
      ? <div className="confirm-box"><p>{booked ? `${booked} üyenin rezervasyonu iptal edilecek ve kendilerine e-postayla haber verilecek.` : "Bu derste henüz rezervasyon yok."} Dersi iptal etmek istediğine emin misin?</p><div><SubmitButton variant="outline" icon={false} pendingLabel="İptal ediliyor…">Evet, dersi iptal et</SubmitButton><button type="button" className="text-button" onClick={() => setConfirming(false)}>Vazgeç</button></div></div>
      : <button type="button" className="danger-link" onClick={() => setConfirming(true)}>Dersi iptal et</button>}
  </form>;
}
