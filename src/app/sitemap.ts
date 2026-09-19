import type { MetadataRoute } from "next";

// Required for `output: "export"`: sitemap is generated once at build time.
export const dynamic = "force-static";

/**
 * Static sitemap for the four published-data sections.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  // Next.js does not rewrite sitemap URLs for static exports, so apply the
  // deployment sub-path (GitHub Pages) explicitly.
  const base = (process.env.NEXT_BASE_PATH ?? "").replace(/\/+$/, "");
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/guilds/`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/leads/`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/calculator/`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/sources/`, lastModified, changeFrequency: "weekly", priority: 0.9 },
  ];
}
