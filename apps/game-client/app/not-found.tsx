"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <h1 className="text-6xl font-black mb-4">404</h1>
      <p className="text-white/50 mb-8 uppercase tracking-widest">Página não encontrada</p>
      <Link href="/" className="px-8 py-4 bg-emerald-500 text-black font-black rounded-2xl">
        VOLTAR AO INÍCIO
      </Link>
    </div>
  );
}
