import type { Metadata } from "next";
import "./globals.css";
import AssetPreloader from "../components/AssetPreloader";
import PWARegistry from "../components/PWARegistry";
import { CARD_ASSET_PATHS } from "../lib/cardAssets";

export const metadata: Metadata = {
  title: "Trio Online - Trinity",
  description: "Experience the ultimate Triple Match game.",
  icons: {
    icon: [{ url: "/icon.webp", type: "image/webp" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {CARD_ASSET_PATHS.map((src) => (
          <link key={src} rel="preload" as="image" href={src} type="image/webp" />
        ))}
      </head>
      <body className="bg-slate-950 text-white overflow-hidden">
        <PWARegistry />
        <AssetPreloader>
          {children}
        </AssetPreloader>
      </body>
    </html>
  );
}
