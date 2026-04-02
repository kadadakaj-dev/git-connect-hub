import { MetadataRoute } from "next";

export const runtime = 'edge';


export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/api"]
            }
        ],
        sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookingpro.app"}/sitemap.xml`
    };
}
