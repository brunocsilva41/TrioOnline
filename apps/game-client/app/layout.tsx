import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body className="bg-slate-950 text-white overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
