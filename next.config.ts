import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// This Mac's current local-network addresses, so a phone on the same Wi-Fi can use the dev server
// whichever network the laptop is on (the address changes between home, office, etc.).
const lanAddresses = Object.values(networkInterfaces()).flat()
  .filter((address) => address && address.family === "IPv4" && !address.internal)
  .map((address) => address!.address);

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy: the page may only load code, styles, images and data from this site
// (plus the Spotify player members' playlists use). Even an injected script could not send
// anyone's data to another server, and no other site can frame these pages.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://open.spotify.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Browsers only honour HSTS over https, so it is harmless on the local http server.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Yerel ağdan (telefon / başka bilgisayar) geliştirme sunucusuna erişim.
  allowedDevOrigins: [...lanAddresses, "*.local"],
  // PGlite loads its WASM build from disk at runtime, so it must stay a plain Node dependency.
  serverExternalPackages: ["@electric-sql/pglite"],
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // The service worker must never be served from cache, or phones keep an outdated copy.
      { source: "/sw.js", headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
      ] },
    ];
  },
  async redirects() {
    // Multi-studio screens were retired when the app became single-studio (Smeda Pilates).
    return [
      { source: "/kesfet", destination: "/dersler", permanent: false },
      { source: "/arama", destination: "/dersler", permanent: false },
      { source: "/favoriler", destination: "/dersler", permanent: false },
      { source: "/konum-izni", destination: "/dersler", permanent: false },
      { source: "/rezervasyon/:slug(ders-sec|ozet)", destination: "/dersler", permanent: false },
      { source: "/harita", destination: "/hakkimizda", permanent: false },
      { source: "/studyo/:path*", destination: "/hakkimizda", permanent: false },
      { source: "/studyo", destination: "/hakkimizda", permanent: false },
      { source: "/takvim", destination: "/egitmen-paneli/takvim", permanent: false },
    ];
  },
};

export default nextConfig;
