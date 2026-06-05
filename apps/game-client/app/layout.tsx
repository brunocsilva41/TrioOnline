import type { Metadata } from "next";
import { Kanit, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AssetPreloader from "../components/AssetPreloader";
import PWARegistry from "../components/PWARegistry";
import { CARD_ASSET_PATHS } from "../lib/cardAssets";

const kanit = Kanit({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-kanit",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Trio Online - Trinity",
  description: "Experience the ultimate Triple Match game.",
  icons: {
    icon: [{ url: "/cards/trio_back_card.webp", type: "image/webp" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${kanit.variable} ${poppins.variable} ${spaceGrotesk.variable}`}>
      <head>
        {CARD_ASSET_PATHS.map((src) => (
          <link key={src} rel="preload" as="image" href={src} type="image/webp" />
        ))}
      </head>
      <body className="bg-slate-950 text-white overflow-hidden font-sans">
        <PWARegistry />
        <AssetPreloader>
          {children}
        </AssetPreloader>
      </body>
    </html>
  );
}
