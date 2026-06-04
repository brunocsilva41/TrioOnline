"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { compressImage } from "../../utils/image";

const HTTP_URL = (process.env.NEXT_PUBLIC_GAME_SERVER_URL || "ws://localhost:2567").replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://").replace(/\/$/, "");

export default function AuthWidget() {
  const authUser = useGameStore((s) => s.authUser);
  const setAuthUser = useGameStore((s) => s.setAuthUser);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"login" | "register" | "profile">("login");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [loginInput, setLoginInput] = useState(""); // Email or Username
  const [username, setUsername] = useState(""); // Used only if loginInput is an email during registration
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEmail = loginInput.includes("@");

  const openWidget = () => {
    setIsOpen(true);
    setView(authUser ? "profile" : "login");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${HTTP_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginInput, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuthUser(data);
      localStorage.setItem("trinity_auth", JSON.stringify(data));
      setView("profile");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        username: isEmail ? username : loginInput,
        email: isEmail ? loginInput : undefined,
        password
      };

      if (!payload.username) throw new Error("Nome de usuário é obrigatório");

      const res = await fetch(`${HTTP_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuthUser(data);
      localStorage.setItem("trinity_auth", JSON.stringify(data));
      setView("profile");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    setUploading(true);
    try {
      const compressedBase64 = await compressImage(file, 128, 128, 0.6);
      
      // Update local storage and store
      const updatedUser = { ...authUser, avatar_url: compressedBase64 };
      setAuthUser(updatedUser);
      localStorage.setItem("trinity_auth", JSON.stringify(updatedUser));
      
      // In a real app, we would also POST to /api/profile/avatar
      // fetch(`${HTTP_URL}/api/profile/avatar`, { ... })
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setError("Erro ao processar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem("trinity_auth");
    setIsOpen(false);
  };

  // Initial load
  React.useEffect(() => {
    const saved = localStorage.getItem("trinity_auth");
    if (saved) {
      try { setAuthUser(JSON.parse(saved)); } catch {}
    }
  }, [setAuthUser]);

  return (
    <>
      <motion.button
        onClick={openWidget}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 left-8 z-50 flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-full hover:bg-white/10 transition-colors shadow-2xl"
      >
        <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-black font-display text-base overflow-hidden
          ${authUser ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-white/50'}`}>
          {authUser?.avatar_url ? (
            <img src={authUser.avatar_url} alt={authUser.username} className="w-full h-full object-cover" />
          ) : (
            authUser ? authUser.username.charAt(0).toUpperCase() : "?"
          )}
        </div>
        <div className="text-left hidden sm:block pr-3">
          <p className="text-xs font-bold text-white leading-tight">
            {authUser ? authUser.username : "Entrar / Cadastrar"}
          </p>
          {authUser && <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase mt-0.5">Painel do Jogador</p>}
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900/90 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden my-auto"
            >
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-6 right-6 text-white/30 hover:text-white z-10 w-10 h-10 flex items-center justify-center bg-white/5 rounded-full transition-colors"
              >
                ✕
              </button>
              
               <div className="max-h-[80vh] overflow-y-auto pr-1 custom-scroll">
                 {view === "profile" && authUser ? (
                   <div className="text-center">
                     <div className="relative group mx-auto w-32 h-32 mb-6">
                       <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center text-4xl font-black font-display text-black shadow-[0_0_40px_rgba(16,185,129,0.3)] overflow-hidden">
                         {authUser.avatar_url ? (
                           <img src={authUser.avatar_url} alt={authUser.username} className="w-full h-full object-cover" />
                         ) : (
                           authUser.username.charAt(0).toUpperCase()
                         )}
                       </div>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                         disabled={uploading}
                       >
                         <span className="text-xs font-bold text-white uppercase tracking-tighter">
                           {uploading ? "..." : "Trocar Foto"}
                         </span>
                       </button>
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleAvatarUpload} 
                         accept="image/*" 
                         className="hidden" 
                       />
                     </div>

                     <h2 className="text-3xl font-black font-display text-white mb-2">{authUser.username}</h2>
                     <p className="text-xs text-emerald-400 font-mono tracking-widest uppercase mb-8">Membro desde {new Date(authUser.created_at).getFullYear()}</p>
                     
                     <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                         <p className="text-3xl font-black font-display text-white">{authUser.total_matches}</p>
                         <p className="text-[10px] text-white/40 uppercase tracking-wider mt-2">Partidas</p>
                       </div>
                       <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                         <p className="text-3xl font-black font-display text-emerald-400">{authUser.total_wins}</p>
                         <p className="text-[10px] text-white/40 uppercase tracking-wider mt-2">Vitórias</p>
                       </div>
                       <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                         <p className="text-3xl font-black font-display text-amber-400">{authUser.total_trios}</p>
                         <p className="text-[10px] text-white/40 uppercase tracking-wider mt-2">Trios Feitos</p>
                       </div>
                       <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                         <p className="text-3xl font-black font-display text-sky-400">{(authUser.total_playtime_seconds / 3600).toFixed(1)}h</p>
                         <p className="text-[10px] text-white/40 uppercase tracking-wider mt-2">Horas Jogadas</p>
                       </div>
                     </div>

                     <button onClick={handleLogout} className="w-full py-5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-sm font-bold text-red-400 uppercase tracking-widest transition-colors">
                       Sair da Conta
                     </button>
                   </div>
                 ) : (
                   <div className="py-4">
                     <h2 className="text-2xl font-black font-display text-white mb-3 text-center uppercase tracking-widest">
                       {view === "login" ? "Acessar Conta" : "Criar Conta"}
                     </h2>
                     <p className="text-xs text-white/40 text-center mb-8">Jogue com amigos e salve seu progresso</p>
                     
                     <form onSubmit={view === "login" ? handleLogin : handleRegister} className="space-y-6">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black font-display text-white/30 uppercase tracking-widest ml-2">Email ou Nome de Usuário</label>
                         <input
                           type="text"
                           placeholder="nome@email.com ou usuario"
                           value={loginInput}
                           onChange={e => setLoginInput(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-base focus:border-emerald-500/50 outline-none transition-all"
                           required
                         />
                       </div>

                       {view === "register" && isEmail && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           className="space-y-2"
                         >
                           <label className="text-[10px] font-black font-display text-emerald-400/50 uppercase tracking-widest ml-2">Nome no Jogo</label>
                           <input
                             type="text"
                             placeholder="Como quer ser chamado?"
                             value={username}
                             onChange={e => setUsername(e.target.value)}
                             className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-6 py-5 text-white text-base focus:border-emerald-500/50 outline-none transition-all"
                             required
                           />
                         </motion.div>
                       )}

                       <div className="space-y-2">
                         <label className="text-[10px] font-black font-display text-white/30 uppercase tracking-widest ml-2">Senha</label>
                         <input
                           type="password"
                           placeholder="••••••••"
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-base focus:border-emerald-500/50 outline-none transition-all"
                           required
                         />
                       </div>
                       
                       {error && <p className="text-rose-400 text-xs font-bold text-center mt-3">⚠️ {error}</p>}
                       
                       <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-display text-sm uppercase tracking-widest rounded-2xl disabled:opacity-50 transition-all shadow-[0_15px_30px_rgba(16,185,129,0.3)] active:scale-95 mt-4">
                         {loading ? "Aguarde..." : view === "login" ? "Entrar" : "Criar Minha Conta"}
                       </button>
                     </form>
                     
                     <div className="mt-10 text-center">
                       <button onClick={() => { setView(view === "login" ? "register" : "login"); setError(""); }} className="text-xs text-white/40 hover:text-white uppercase tracking-widest transition-colors p-3">
                         {view === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça Login"}
                       </button>
                     </div>
                   </div>
                 )}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
