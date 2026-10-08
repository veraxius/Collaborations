import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified: now, priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: now, priority: 0.9 },
    { url: `${BASE_URL}/faq`, lastModified: now, priority: 0.8 },
    { url: `${BASE_URL}/tools/dot-compliance-calendar`, lastModified: now, priority: 0.9 },
    { url: `${BASE_URL}/enterprise`, lastModified: now, priority: 0.7 },
    { url: `${BASE_URL}/guides`, lastModified: now, priority: 0.8 },
    ...GUIDES.map((g) => ({
      url: `${BASE_URL}/guides/${g.slug}`,
      lastModified: new Date(g.updated),
      priority: 0.8,
    })),
    { url: `${BASE_URL}/contact`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: now, priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, priority: 0.3 },
  ];
}
