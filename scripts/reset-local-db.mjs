// Deletes the embedded development database (./data). It is recreated and re-seeded on the next request.
// Refuses while the dev server is listening, because PGlite keeps the files open.
import { rmSync } from "node:fs";
import { createConnection } from "node:net";

const port = Number(process.env.PORT ?? 3040);
const socket = createConnection({ port, host: "127.0.0.1" });
socket.on("connect", () => {
  console.error(`Geliştirme sunucusu ${port} portunda çalışıyor. Önce sunucuyu durdur, sonra tekrar dene.`);
  socket.destroy();
  process.exit(1);
});
socket.on("error", () => {
  rmSync("data", { recursive: true, force: true });
  console.log("Yerel veritabanı silindi; sunucu bir sonraki açılışta yeniden kurup demo veriyle dolduracak.");
});
