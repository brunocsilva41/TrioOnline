"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colyseusService } from "../../networking/ColyseusService";
import { useGameStore, RoomInfo } from "../../store/useGameStore";
import AuthWidget from "./AuthWidget";
import LeaderboardWidget from "./LeaderboardWidget";
import CardImage from "../CardImage";
import { useServerStatus } from "../../hooks/useServerStatus";
import { Eye, Users, Plus, Hash, Search, HelpCircle } from "lucide-react";

/**
 * PROJECT TRINITY - LobbyScreen Component
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
      className="relative w-full min-h-[100dvh] flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden pt-8 pb-32 sm:py-12"
    >
      <div className="z-10 text-center mb-6 sm:mb-12 relative px-4">
        <h1 className="text-4xl sm:text-7xl font-black font-display tracking-tighter flex items-center justify-center gap-1">
          <span className="text-white">TRIO</span>
          <span className="text-emerald-400">ONLINE</span>
        </h1>
      </div>

      <div className="w-full max-w-md z-20">
        <LeaderboardWidget />
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 w-full max-w-lg px-4 sm:px-6"
      >
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
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
                serverStatus={serverStatus.status}
              />
            )}
            {view === "join" && (
              <JoinByCodePanel
                code={joinCode}
                setCode={setJoinCode}
                onJoin={handleJoinByCode}
                onBack={() => setView("main")}
                loading={loading}
                serverStatus={serverStatus.status}
              />
            )}
            {view === "browse" && (
              <BrowseRoomsPanel
                rooms={availableRooms}
                onJoin={handleJoinRoom}
                onObserve={handleObserveRoom}
                onBack={() => setView("main")}
                loading={loading}
                serverStatus={serverStatus.status}
              />
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p className="text-rose-400 text-xs text-center mt-6 font-bold tracking-widest uppercase">⚠️ {error}</p>
        )}
      </motion.div>

      <AuthWidget />
    </motion.div>
  );
}

function MainMenu({ 
  playerName, onNameChange, onCreateRoom, onJoinCode, onBrowse, 
  onQuickMatch, onShowTutorial, loading, isLoggedIn, serverStatus, onRetryServer 
}: any) {
  return (
    <div className="space-y-8">
      {serverStatus !== "online" && (
        <button onClick={onRetryServer} className="w-full rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-amber-300 text-xs font-black">
          SERVIDOR EM ESPERA - RECONECTAR
        </button>
      )}

      <input
        type="text"
        value={playerName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Seu apelido..."
        maxLength={16}
        disabled={isLoggedIn}
        className="w-full bg-white/5 border border-white/15 rounded-2xl p-6 text-white text-lg placeholder:text-white/20"
      />

      <button
        onClick={onQuickMatch}
        disabled={loading || serverStatus !== "online"}
        className="w-full py-7 bg-emerald-500 rounded-2xl font-black text-black text-lg tracking-widest uppercase disabled:opacity-50"
      >
        {serverStatus !== "online" ? "CONECTANDO..." : loading ? "BUSCANDO..." : "PARTIDA RÁPIDA"}
      </button>

      <div className="grid grid-cols-2 gap-4">
        <LobbyButton onClick={onCreateRoom} label="CRIAR" icon={<Plus size={20} />} />
        <LobbyButton onClick={onJoinCode} label="ENTRAR" icon={<Hash size={20} />} />
        <LobbyButton onClick={onBrowse} label="BUSCAR" icon={<Search size={20} />} />
        <LobbyButton onClick={onShowTutorial} label="TUTORIAL" icon={<HelpCircle size={20} />} />
      </div>
    </div>
  );
}

function LobbyButton({ onClick, label, icon }: any) {
  return (
    <button onClick={onClick} className="py-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-all">
      {icon}
      <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
    </button>
  );
}

function CreateRoomPanel({ onConfirm, onBack, maxPlayers, setMaxPlayers, loading }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black text-white/40 uppercase text-center">Configurar Sala</h3>
      <div className="flex gap-2 justify-center">
        {[2, 3, 4, 8].map(n => (
          <button key={n} onClick={() => setMaxPlayers(n)} className={`w-10 h-10 rounded-lg font-black ${maxPlayers === n ? 'bg-emerald-500 text-black' : 'bg-white/5'}`}>{n}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-4 bg-white/5 rounded-xl font-bold text-xs uppercase">Voltar</button>
        <button onClick={onConfirm} className="flex-2 py-4 bg-emerald-500 rounded-xl font-black text-black text-xs uppercase">Confirmar</button>
      </div>
    </div>
  );
}

function JoinByCodePanel({ code, setCode, onJoin, onBack }: any) {
  return (
    <div className="space-y-4">
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" className="w-full bg-white/5 border border-white/10 p-4 text-center text-2xl font-black rounded-xl" />
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs uppercase">Voltar</button>
        <button onClick={onJoin} className="flex-2 py-3 bg-amber-500 rounded-xl font-black text-black text-xs uppercase">Entrar</button>
      </div>
    </div>
  );
}

function BrowseRoomsPanel({ rooms, onJoin, onBack }: any) {
  return (
    <div className="space-y-4">
      <div className="max-h-60 overflow-y-auto space-y-2">
        {rooms.length === 0 ? <p className="text-center text-white/20 py-8">Nenhuma sala ativa</p> : rooms.map((r: any) => (
          <button key={r.roomId} onClick={() => onJoin(r.roomId)} className="w-full p-4 bg-white/5 rounded-xl flex justify-between items-center">
            <span className="font-bold">{r.hostName}</span>
            <span className="text-emerald-400 font-black">{r.playerCount}/{r.maxPlayers}</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="w-full py-4 bg-white/5 rounded-xl font-bold text-xs uppercase">Voltar</button>
    </div>
  );
}
