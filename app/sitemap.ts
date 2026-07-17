import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified: now, priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: now, priority: 0.9 },
    { url: `${BASE_URL}/faq`, lastModified: now, priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: now, priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, priority: 0.3 },
  ];
}
