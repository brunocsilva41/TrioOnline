"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colyseusService } from "../../networking/ColyseusService";
import { useGameStore, RoomInfo } from "../../store/useGameStore";
import AuthWidget from "./AuthWidget";
import LeaderboardWidget from "./LeaderboardWidget";
import { useServerStatus } from "../../hooks/useServerStatus";
import { Plus, Hash, Search, HelpCircle, Swords, User, LayoutGrid } from "lucide-react";

/**
 * PROJECT TRINITY - LobbyScreen Component (Professional & Compact)
 */
export default function LobbyScreen() {
  const [view, setView] = useState<"main" | "create" | "join" | "browse">("main");
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [guestName] = useState(() => `Guest_${Math.random().toString(36).slice(2, 6)}`);
  const serverStatus = useServerStatus();

  const availableRooms = useGameStore((s) => s.availableRooms);
  const authUser = useGameStore((s) => s.authUser);
  const setShowTutorial = useGameStore((s) => s.setShowTutorial);
  const isServerOnline = serverStatus.status === "online";

  useEffect(() => {
    const saved = localStorage.getItem("trinity_name");
    if (saved) setPlayerName(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authUser) {
      setPlayerName(authUser.username);
    }
  }, [authUser]);

  useEffect(() => {
    if (mounted && playerName && !authUser) {
      localStorage.setItem("trinity_name", playerName);
    }
  }, [playerName, mounted, authUser]);

  useEffect(() => {
    if (view === "browse" && isServerOnline) {
      colyseusService.fetchRooms();
      const interval = setInterval(() => colyseusService.fetchRooms(), 3000);
      return () => clearInterval(interval);
    }
  }, [view, isServerOnline]);

  const displayName = playerName || guestName;
  const userId = authUser ? authUser.id : undefined;

  const assertServerOnline = () => {
    if (isServerOnline) return true;
    setError(`Servidor offline. Tente novamente em instantes.`);
    void serverStatus.checkNow();
    return false;
  };

  const handleCreateRoom = async () => {
    if (!assertServerOnline()) return;
    setError("");
    setLoading(true);
    try {
      await colyseusService.createRoom({ isPrivate, maxPlayers, displayName, userId });
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    }
    setLoading(false);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    if (!assertServerOnline()) return;
    setError("");
    setLoading(true);
    try {
      await colyseusService.joinByCode(joinCode.trim(), { displayName, userId });
    } catch (e: any) {
      setError(e.message || "Room not found");
    }
    setLoading(false);
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!assertServerOnline()) return;
    setError("");
    setLoading(true);
    try {
      await colyseusService.joinRoom(roomId, { displayName, userId });
    } catch (e: any) {
      setError(e.message || "Failed to join room");
    }
    setLoading(false);
  };

  const handleObserveRoom = async (roomId: string) => {
    if (!assertServerOnline()) return;
    setError("");
    setLoading(true);
    try {
      await colyseusService.observeRoom(roomId, { displayName, userId });
    } catch (e: any) {
      setError(e.message || "Failed to observe room");
    }
    setLoading(false);
  };

  const handleQuickMatch = async () => {
    if (!assertServerOnline()) return;
    setError("");
    setLoading(true);
    try {
      await colyseusService.quickMatch({ displayName, userId });
    } catch (e: any) {
      setError(e.message || "No rooms available");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
      className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-8 lg:p-12"
    >
      <div className="fixed top-4 left-4 sm:top-8 sm:left-8 z-50">
        <AuthWidget />
      </div>

      {/* Leaderboard fixed at top-right for desktop */}
      <div className="hidden lg:block lg:fixed lg:top-8 lg:right-8 z-40 w-[380px] xl:w-[480px] pointer-events-none">
        <LeaderboardWidget />
      </div>

      <div className="w-full max-w-6xl flex flex-col items-center relative z-10 py-12 sm:py-0">
        {/* Compact Centered Title */}
        <div className="text-center mb-8 sm:mb-16 relative">
          <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black font-display tracking-tighter flex items-center justify-center gap-2 sm:gap-4 leading-none">
            <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">TRIO</span>
            <span className="text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.2)]">ONLINE</span>
          </h1>
          <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent mx-auto mt-4 sm:mt-6 rounded-full" />
        </div>

        {/* Content Area - Optimized Width */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-[800px]"
        >
          <div className="bg-slate-900/50 backdrop-blur-[60px] border border-white/5 rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-14 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
             
             <AnimatePresence mode="wait">
               {view === "main" && (
                 <MainMenu
                   playerName={playerName}
                   onNameChange={setPlayerName}
                   onCreateRoom={() => setView("create")}
                   onJoinCode={() => setView("join")}
                   onBrowse={() => setView("browse")}
                   onQuickMatch={handleQuickMatch}
                   onShowTutorial={() => setShowTutorial(true)}
                   loading={loading}
                   isLoggedIn={!!authUser}
                   serverStatus={serverStatus.status}
                   onRetryServer={serverStatus.checkNow}
                 />
               )}
               {view === "create" && (
                 <CreateRoomPanel
                   isPrivate={isPrivate}
                   setIsPrivate={setIsPrivate}
                   maxPlayers={maxPlayers}
                   setMaxPlayers={setMaxPlayers}
                   onConfirm={handleCreateRoom}
                   onBack={() => setView("main")}
                   loading={loading}
                 />
               )}
               {view === "join" && (
                 <JoinByCodePanel
                   code={joinCode}
                   setCode={setJoinCode}
                   onJoin={handleJoinByCode}
                   onBack={() => setView("main")}
                   loading={loading}
                 />
               )}
               {view === "browse" && (
                 <BrowseRoomsPanel
                   rooms={availableRooms}
                   onJoin={handleJoinRoom}
                   onObserve={handleObserveRoom}
                   onBack={() => setView("main")}
                   loading={loading}
                 />
               )}
             </AnimatePresence>
          </div>

          {/* Mobile Leaderboard Only */}
          <div className="mt-12 w-full lg:hidden">
            <LeaderboardWidget />
          </div>

          {error && (
            <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] text-center mt-10 bg-rose-500/10 py-4 px-8 rounded-full border border-rose-500/20 max-w-sm mx-auto">⚠️ {error}</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function MainMenu({ 
  playerName, onNameChange, onCreateRoom, onJoinCode, onBrowse, 
  onQuickMatch, onShowTutorial, loading, isLoggedIn, serverStatus, onRetryServer 
}: any) {
  return (
    <div className="flex flex-col md:flex-row gap-8 sm:gap-12 items-center md:items-stretch">
      {/* LEFT: Compact Actions */}
      <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-fit">
        <SideButton onClick={onBrowse} label="BUSCAR" icon={<Search size={18} />} color="emerald" />
        <SideButton onClick={onCreateRoom} label="CRIAR" icon={<Plus size={18} />} color="emerald" />
        <SideButton onClick={onJoinCode} label="ENTRAR" icon={<Hash size={18} />} color="emerald" />
        <SideButton onClick={onShowTutorial} label="TREINO" icon={<HelpCircle size={18} />} color="amber" />
      </div>

      {/* DIVIDER */}
      <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/5 to-transparent my-4" />

      {/* RIGHT: Identity & Hero Action */}
      <div className="flex-1 flex flex-col gap-6 justify-center w-full">
        {serverStatus !== "online" && (
            <button onClick={onRetryServer} className="w-full rounded-full border border-amber-400/20 bg-amber-500/10 p-4 text-amber-300 text-[9px] font-black tracking-[0.3em] uppercase animate-pulse">
                CONEXÃO PERDIDA - RECONECTAR
            </button>
        )}

        <div className="space-y-4">
            <label className="text-xs font-black font-display text-indigo-400 uppercase tracking-[0.3em] ml-8 block">Insira seu Nickname</label>
            <div className="relative group">
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Ex: MestreTrio"
                    maxLength={16}
                    disabled={isLoggedIn}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500/40 rounded-full p-6 pl-10 text-white text-lg font-bold placeholder:text-white/10 outline-none transition-all shadow-inner"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors">
                    <User size={18} />
                </div>
            </div>
        </div>

        <button
            onClick={onQuickMatch}
            disabled={loading || serverStatus !== "online"}
            className="group relative w-full py-8 bg-emerald-500 rounded-full font-black text-black text-lg tracking-[0.3em] uppercase overflow-hidden shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 neon-border-emerald"
        >
            <div className="relative z-10 flex items-center justify-center gap-4">
                <Swords size={22} className="group-hover:rotate-12 transition-transform" />
                {serverStatus !== "online" ? "OFFLINE" : loading ? "BUSCANDO..." : "PARTIDA RÁPIDA"}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '2s' }} />
        </button>
      </div>
    </div>
  );
}

function SideButton({ onClick, label, icon, color }: any) {
  const isEmerald = color === "emerald";
  return (
    <button 
        onClick={onClick} 
        className={`group flex items-center gap-4 px-7 py-4 rounded-full border transition-all active:scale-95 w-full md:w-fit min-w-[165px] neon-border-${color}
            ${isEmerald ? 'bg-white/[0.02] border-white/5 hover:bg-emerald-500/5' : 'bg-white/[0.02] border-white/5 hover:bg-amber-500/5'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all 
        ${isEmerald ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black' : 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black'}`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <span className="text-[11px] font-black tracking-[0.2em] text-white/50 group-hover:text-white transition-colors whitespace-nowrap">{label}</span>
    </button>
  );
}


function CreateRoomPanel({ onConfirm, onBack, maxPlayers, setMaxPlayers, loading }: any) {
  return (
    <div className="space-y-12 py-6 max-w-sm mx-auto">
      <h3 className="text-xs font-black text-white/60 uppercase text-center tracking-[0.5em]">Configurar Sala</h3>
      <div className="flex gap-4 justify-center">
        {[2, 3, 4, 8].map(n => (
          <button key={n} onClick={() => setMaxPlayers(n)} className={`w-14 h-14 rounded-2xl font-black text-base transition-all border ${maxPlayers === n ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}>{n}</button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-5 bg-white/5 border border-white/10 rounded-full font-black text-[9px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">Voltar</button>
        <button onClick={onConfirm} disabled={loading} className="flex-[2] py-5 bg-emerald-500 rounded-full font-black text-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all neon-border-emerald">Confirmar</button>
      </div>
    </div>
  );
}

function JoinByCodePanel({ code, setCode, onJoin, onBack, loading }: any) {
  return (
    <div className="space-y-10 py-6 max-w-sm mx-auto">
      <div className="text-center space-y-3">
        <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.5em]">Código da Sala</h3>
        <p className="text-[8px] text-white/20 uppercase tracking-[0.3em]">Insira os 4 dígitos</p>
      </div>
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="----" className="w-full bg-white/[0.02] border border-white/5 p-8 text-center text-5xl font-black rounded-[2rem] tracking-[0.6em] focus:border-amber-500/40 outline-none transition-all shadow-inner text-amber-400" maxLength={4} />
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-5 bg-white/5 border border-white/10 rounded-full font-black text-[9px] uppercase tracking-[0.2em] text-white/40">Voltar</button>
        <button onClick={onJoin} disabled={loading} className="flex-[2] py-5 bg-amber-500 rounded-full font-black text-black text-[10px] uppercase tracking-[0.3em] shadow-xl neon-border-amber">Entrar</button>
      </div>
    </div>
  );
}

function BrowseRoomsPanel({ rooms, onJoin, onBack }: any) {
  return (
    <div className="space-y-10 py-4 w-full">
      <h3 className="text-xs font-black text-white/60 uppercase text-center tracking-[0.5em]">Salas Ativas</h3>
      <div className="max-h-[300px] overflow-y-auto space-y-3 pr-4 custom-scroll">
        {rooms.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.01] rounded-[2.5rem] border border-dashed border-white/5">
                <LayoutGrid className="mx-auto text-white/5 mb-4" size={40} />
                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em]">Nenhuma sala no momento</p>
            </div>
        ) : rooms.map((r: any) => (
          <button key={r.roomId} onClick={() => onJoin(r.roomId)} className="group w-full p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-emerald-500/30 rounded-[1.5rem] flex justify-between items-center transition-all">
            <div className="flex flex-col items-start">
                <span className="font-black text-white/80 group-hover:text-emerald-400 transition-colors uppercase tracking-widest text-xs">{r.hostName}</span>
                <span className="text-[8px] text-white/20 font-mono tracking-[0.3em] mt-2 uppercase">ID: {r.roomId.substring(0, 4)}</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="bg-emerald-500/5 text-emerald-400/60 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-emerald-500/10">{r.playerCount}/{r.maxPlayers}</span>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="w-full py-5 bg-white/5 border border-white/10 rounded-full font-black text-[9px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">Voltar</button>
    </div>
  );
}
