import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Pixelify_Sans, Press_Start_2P } from "next/font/google";
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

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin", "latin-ext"],
  display: "swap",
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
      className={`${inter.variable} ${jetbrainsMono.variable} ${pixelify.variable} ${pressStart.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://collect.ecem.fyi/tracker.js"
          data-host-url="https://collect.ecem.fyi"
          data-tenant-id="e4852499-1134-4f27-b64a-29a9237bf08f"
          data-source-id="2db31612-8d89-4bec-ac92-01a5de7c2f6f"
          data-auto-track="true"
          data-spa="true"
        />
      </head>
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
