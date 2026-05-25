"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";

const HTTP_URL = (process.env.NEXT_PUBLIC_GAME_SERVER_URL || "ws://localhost:2567").replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://").replace(/\/$/, "");

export default function AuthWidget() {
  const authUser = useGameStore((s) => s.authUser);
  const setAuthUser = useGameStore((s) => s.setAuthUser);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"login" | "register" | "profile">("login");
  
  // Form states
  const [loginInput, setLoginInput] = useState(""); // Email or Username
  const [username, setUsername] = useState(""); // Used only if loginInput is an email during registration
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-full hover:bg-white/10 transition-colors shadow-2xl"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
          ${authUser ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-white/50'}`}>
          {authUser ? authUser.username.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="text-left hidden sm:block pr-2">
          <p className="text-[10px] font-bold text-white leading-tight">
            {authUser ? authUser.username : "Entrar / Cadastrar"}
          </p>
          {authUser && <p className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase mt-0.5">Painel do Jogador</p>}
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
              className="bg-slate-900/90 border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden my-auto"
            >
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-4 right-4 text-white/30 hover:text-white z-10 w-8 h-8 flex items-center justify-center bg-white/5 rounded-full transition-colors"
              >
                ✕
              </button>
              
              <div className="max-h-[80vh] overflow-y-auto pr-1 custom-scroll">
                {view === "profile" && authUser ? (
                  <div className="text-center py-2">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-3xl font-black text-black shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-4">
                      {authUser.username.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-2xl font-black text-white mb-1">{authUser.username}</h2>
                    <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase mb-6">Membro desde {new Date(authUser.created_at).getFullYear()}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-2xl font-black text-white">{authUser.total_matches}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-wider mt-1">Partidas</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-2xl font-black text-emerald-400">{authUser.total_wins}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-wider mt-1">Vitórias</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-2xl font-black text-amber-400">{authUser.total_trios}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-wider mt-1">Trios Feitos</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-2xl font-black text-sky-400">{(authUser.total_playtime_seconds / 3600).toFixed(1)}h</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-wider mt-1">Horas Jogadas</p>
                      </div>
                    </div>

                    <button onClick={handleLogout} className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 uppercase tracking-widest transition-colors">
                      Sair da Conta
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <h2 className="text-xl font-black text-white mb-2 text-center uppercase tracking-widest">
                      {view === "login" ? "Acessar Conta" : "Criar Conta"}
                    </h2>
                    <p className="text-[10px] text-white/40 text-center mb-6">Jogue com amigos e salve seu progresso</p>
                    
                    <form onSubmit={view === "login" ? handleLogin : handleRegister} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Email ou Nome de Usuário</label>
                        <input
                          type="text"
                          placeholder="nome@email.com ou usuario"
                          value={loginInput}
                          onChange={e => setLoginInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
                          required
                        />
                      </div>

                      {view === "register" && isEmail && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-1"
                        >
                          <label className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest ml-1">Nome no Jogo</label>
                          <input
                            type="text"
                            placeholder="Como quer ser chamado?"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-5 py-4 text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
                            required
                          />
                        </motion.div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Senha</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
                          required
                        />
                      </div>
                      
                      {error && <p className="text-rose-400 text-[10px] font-bold text-center mt-2">⚠️ {error}</p>}
                      
                      <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] active:scale-95 mt-2">
                        {loading ? "Aguarde..." : view === "login" ? "Entrar" : "Criar Minha Conta"}
                      </button>
                    </form>
                    
                    <div className="mt-8 text-center">
                      <button onClick={() => { setView(view === "login" ? "register" : "login"); setError(""); }} className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest transition-colors p-2">
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
