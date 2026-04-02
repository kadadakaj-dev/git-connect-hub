import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Papi Hair Design - Rezervacia",
  description: "Online rezervacia terminu - Papi Hair Design",
  manifest: "/manifest.json",
  applicationName: "Papi Hair Design",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PHD",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Papi Hair Design - Rezervacia",
    description: "Online rezervacia terminu - Papi Hair Design",
    type: "website",
    siteName: "Papi Hair Design",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" suppressHydrationWarning className={inter.className}>
      <body className="relative min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {/* Ambient floating background blobs */}
            <div
              className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
              aria-hidden="true"
            >
              <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/[0.07] animate-float blur-3xl" />
              <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-primary/[0.05] animate-float-delayed blur-3xl" />
              <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-primary/[0.04] animate-float-slow blur-3xl" />
            </div>

            <div className="relative z-10">
              <Header />
              {children}
            </div>

            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
