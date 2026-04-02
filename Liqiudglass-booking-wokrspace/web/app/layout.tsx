import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "../context/AuthContext";
import { SwUpdateToast } from "../components/pwa/SwUpdateToast";
import Header from "../components/layout/Header";
import { ThemeProvider } from "../components/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Papi Hair Design – Rezervácia",
  description: "Online rezervácia termínu – Papi Hair Design",
  manifest: "/manifest.json",
  applicationName: "Papi Hair Design",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PHD"
  },
  other: {
    "mobile-web-app-capable": "yes"
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon-180.png", sizes: "180x180" },
      { url: "/apple-touch-icon-167.png", sizes: "167x167" },
      { url: "/apple-touch-icon-152.png", sizes: "152x152" },
      { url: "/apple-touch-icon-120.png", sizes: "120x120" },
      { url: "/apple-touch-icon-76.png", sizes: "76x76" }
    ]
  },
  openGraph: {
    title: "Papi Hair Design – Rezervácia",
    description: "Online rezervácia termínu – Papi Hair Design",
    type: "website",
    siteName: "Papi Hair Design"
  },
  twitter: {
    card: "summary",
    title: "Papi Hair Design – Rezervácia",
    description: "Online rezervácia termínu – Papi Hair Design"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <AuthProvider>
            <Header />
            {children}
            <SwUpdateToast />
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
