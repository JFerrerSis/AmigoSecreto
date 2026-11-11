import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";

import { CookieConsent } from "@/components/cookie-consent";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/ui/toast";
import { LocalUserProvider } from "@/hooks/use-local-user";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Amigo Secreto | Sorteos privados sin enredos",
    template: "%s | Amigo Secreto",
  },
  description:
    "Organiza tu amigo secreto en minutos: invitaciones con un link, sorteo justo con exclusiones y resultados privados para cada participante.",
  openGraph: {
    title: "Amigo Secreto | Sorteos privados sin enredos",
    description:
      "Invitaciones con un link, sorteo justo con exclusiones y resultados privados para cada participante.",
    type: "website",
    locale: "es_MX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${manrope.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <ToastProvider>
          <LocalUserProvider>
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <CookieConsent />
          </LocalUserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
