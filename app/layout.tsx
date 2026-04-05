import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title:       { default: "Findesk", template: "%s — Findesk" },
  description: "Управленческий финансовый учёт для малого бизнеса Казахстана",
  manifest:    "/manifest.webmanifest",
  appleWebApp: {
    capable:         true,
    statusBarStyle:  "default",
    title:           "Findesk",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type:        "website",
    siteName:    "Findesk",
    locale:      "ru_RU",
    title:       "Findesk — Финансовый учёт с ИИ-агентом",
    description: "ДДС, ОПиУ, Баланс — автоматически. ИИ отвечает на вопросы по вашим финансам.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Findesk",
    description: "Финансовый учёт для бизнеса Казахстана",
    images:      ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" translate="no">
      <head>
        <meta httpEquiv="Content-Language" content="ru" />
        <meta name="language" content="Russian" />
        <meta name="google" content="notranslate" />
        <meta name="theme-color" content="#1A56DB" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
