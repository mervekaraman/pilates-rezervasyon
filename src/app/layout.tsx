import type { Metadata } from "next";
import { Instrument_Sans, Inter_Tight } from "next/font/google";
import { FlowlyProvider } from "@/components/flowly/app-state";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin-ext"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin-ext"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Flowly | Pilates. Nearby. On your terms.",
    template: "%s | Flowly",
  },
  description: "Yakınındaki pilates stüdyolarını keşfet, dersini seç ve yerini ayır.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${instrumentSans.variable} ${interTight.variable}`} data-scroll-behavior="smooth">
      <body><FlowlyProvider>{children}</FlowlyProvider></body>
    </html>
  );
}
