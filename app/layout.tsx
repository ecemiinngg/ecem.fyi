import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Bungee, Press_Start_2P } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: "400",
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    // Used by the homepage, which shares this route segment and so isn't
    // covered by `template`.
    default: "ecem.fyi | Data & Analytics Engineer",
    // Child segments set a bare title and get the suffix appended.
    template: "%s | ecem.fyi",
  },
  description:
    "Portfolio and interactive server-side tracking sandbox — data, analytics, and tag management projects and writing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${bungee.variable} ${pressStart.variable} h-full antialiased`}
    >
      <GoogleTagManager gtmId="GTM-T7PSRCZK" />
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-T7PSRCZK"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
