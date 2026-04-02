import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://findesk.kz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow:    ["/", "/login", "/register"],
      disallow: ["/dashboard/", "/api/", "/settings/", "/invite/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
