import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Yerel ağdan (telefon / başka bilgisayar) geliştirme sunucusuna erişim.
  allowedDevOrigins: ["192.168.1.220", "*.local"],
  // PGlite loads its WASM build from disk at runtime, so it must stay a plain Node dependency.
  serverExternalPackages: ["@electric-sql/pglite"],
  async headers() {
    return [
      { source: "/(.*)", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ] },
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
