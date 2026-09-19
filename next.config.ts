import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by the Docker/GHCR deployment profile; Vercel still detects Next.js normally.
  output: "standalone",
  // Arena's preview proxy uses a generated *.e2b.app origin in development.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
