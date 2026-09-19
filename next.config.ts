import type { NextConfig } from "next";

/**
 * Optional deployment sub-path. GitHub Pages serves a repository site under
 * /<owner>/<repo>/, so the Pages workflow builds with
 * NEXT_BASE_PATH=/<repo-name>. Local dev, the Node server and root-level
 * hosts (custom domain, Vercel) build without it.
 */
function normalizeBasePath(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let path = raw.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+$/, "");
  return path || undefined;
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.NEXT_BASE_PATH);

const nextConfig: NextConfig = {
  // Static export: the app ships as plain files (out/) and runs on GitHub
  // Pages or any other static host — no Node server, no database required.
  output: "export",
  basePath,
  // GitHub Pages serves each repository under /<owner>/<repo>/; with
  // trailing slashes every route maps to <route>/index.html.
  trailingSlash: true,
  // Arena's preview proxy uses a generated *.e2b.app origin in development.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
  // Bake the sub-path for client-side fetches of /data/*.json (catalog).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath ?? "",
  },
  // Security headers are not applied by static hosts; the Node server
  // (src/server/server.ts) sends the same set on every response.
};

export default nextConfig;
