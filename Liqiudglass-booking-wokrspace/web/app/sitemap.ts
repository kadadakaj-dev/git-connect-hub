import { MetadataRoute } from "next";

export const runtime = 'edge';


export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookingpro.app";

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0
        },
        {
            url: `${baseUrl}/admin`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3
        }
    ];
}
