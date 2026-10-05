const required = [
  "DATABASE_URL", "APP_URL", "TRAINER_INVITE_CODE", "SMTP_HOST", "SMTP_PORT", "MAIL_FROM",
  "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
  "STUDIO_ADDRESS", "STUDIO_PHONE", "STUDIO_EMAIL", "LEGAL_ENTITY_NAME", "KVKK_CONTACT_EMAIL",
];
const missing = required.filter((key) => !process.env[key]?.trim());
const errors = [...missing.map((key) => `${key} eksik`)];
if (process.env.APP_URL && !process.env.APP_URL.startsWith("https://")) errors.push("APP_URL canlıda https:// ile başlamalı");
if (process.env.TRAINER_INVITE_CODE && process.env.TRAINER_INVITE_CODE.length < 16) errors.push("TRAINER_INVITE_CODE en az 16 karakter olmalı");
if (process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) {
  try {
    const size = Buffer.from(process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY, "base64").length;
    if (![16, 24, 32].includes(size)) errors.push("NEXT_SERVER_ACTIONS_ENCRYPTION_KEY 16/24/32 bayt Base64 olmalı");
  } catch { errors.push("NEXT_SERVER_ACTIONS_ENCRYPTION_KEY geçerli Base64 değil"); }
}
if (errors.length) {
  console.error(`Canlı ortam hazır değil:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("Canlı ortam değişkenleri hazır.");
