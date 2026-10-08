import { retryFailedEmails } from "../src/lib/mail";

async function main() {
  const result = await retryFailedEmails();
  console.log(`${result.attempted} e-posta yeniden denendi; ${result.sent} tanesi gönderildi.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
