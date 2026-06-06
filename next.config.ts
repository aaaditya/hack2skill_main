import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,

  // Production security headers (also set in vercel.json for edge delivery)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },

  // Emit standalone output for Vercel (automatically used in Next.js on Vercel)
  // output: "standalone", // Uncomment if self-hosting with Docker

  // Suppress noisy telemetry opt-out warning in CI
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },

  // Image optimization — no external images used, safe to keep defaults
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
