import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nefes Pilates | Dersini seç, yerini ayır",
    template: "%s | Nefes Pilates",
  },
  description: "Pilates derslerini keşfet, uygun saatini seç ve rezervasyon talebini kolayca oluştur.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
