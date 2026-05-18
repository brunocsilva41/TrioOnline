import type { Metadata } from "next";
import "./globals.css";
import AssetPreloader from "../components/AssetPreloader";

export const metadata: Metadata = {
  title: "Trio Online - Trinity",
  description: "Experience the ultimate Triple Match game.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white overflow-hidden">
        <AssetPreloader>
          {children}
        </AssetPreloader>
      </body>
    </html>
  );
}
