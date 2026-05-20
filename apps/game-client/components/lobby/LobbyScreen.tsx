"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colyseusService } from "../../networking/ColyseusService";
import { useGameStore, RoomInfo } from "../../store/useGameStore";
import AuthWidget from "./AuthWidget";
import LeaderboardWidget from "./LeaderboardWidget";
import CardImage from "../CardImage";
import { ServerStatus, useServerStatus } from "../../hooks/useServerStatus";

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
  const isServerOnline = serverStatus.status === "online";

  // Load saved name on mount (client-only to avoid hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("trinity_name");
    if (saved) setPlayerName(saved);
    setMounted(true);
  }, []);

  // Sync authUser to playerName if logged in
  useEffect(() => {
    if (authUser) {
      setPlayerName(authUser.username);
    }
  }, [authUser]);

  // Persist name changes
  useEffect(() => {
    if (mounted && playerName && !authUser) {
      localStorage.setItem("trinity_name", playerName);
    }
  }, [playerName, mounted, authUser]);

  // Poll rooms when browsing
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
    setError(`Servidor offline. Inicie o game-server e tente novamente.`);
    void serverStatus.checkNow();
    return false;
  };

  const handleCreateRoom = async () => {
    if (!assertServerOnline()) return;
    setError("");
    setLoading(true);
    try {
      await colyseusService.createRoom({
        isPrivate,
        maxPlayers,
        displayName,
        userId
      });
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
      className="relative w-full min-h-[100dvh] h-full flex flex-col items-center justify-start sm:justify-center overflow-y-auto overflow-x-hidden pt-12 pb-24 sm:py-0"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(52,211,153,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(251,191,36,0.04)_0%,_transparent_40%)]" />
        <FloatingCardsLounge />
        <ParticleField />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="z-10 text-center mb-12 relative"
      >
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-10 bg-emerald-500/10 blur-[60px] rounded-full -z-10"
        />
        <h2 className="text-amber-500/80 font-black tracking-[0.6em] text-[10px] sm:text-xs mb-3 italic">
          TRINITY_DECK_ENGINE_V3
        </h2>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter flex items-center justify-center gap-1">
          <motion.span 
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            TRIO
          </motion.span>
          <motion.span 
            animate={{ 
              textShadow: [
                "0 0 20px rgba(52,211,153,0.4)",
                "0 0 40px rgba(52,211,153,0.6)",
                "0 0 20px rgba(52,211,153,0.4)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.4)]"
          >
            ONLINE
          </motion.span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/10" />
          <span className="text-[8px] font-mono text-white/20 tracking-[0.4em] uppercase">Multiplayer Experience</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/10" />
        </div>
      </motion.div>

      <LeaderboardWidget />

      {/* Content Card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.3,
          type: "spring",
          stiffness: 100,
          damping: 20
        }}
        className="z-10 w-full max-w-md px-6"
      >
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-1 shadow-2xl overflow-hidden">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {view === "main" && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <MainMenu
                    playerName={playerName}
                    onNameChange={setPlayerName}
                    onCreateRoom={() => setView("create")}
                    onJoinCode={() => setView("join")}
                    onBrowse={() => setView("browse")}
                    onQuickMatch={handleQuickMatch}
                    loading={loading}
                    isLoggedIn={!!authUser}
                    serverStatus={serverStatus.status}
                    onRetryServer={serverStatus.checkNow}
                  />
                </motion.div>
              )}

              {view === "create" && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
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
                </motion.div>
              )}

              {view === "join" && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <JoinByCodePanel
                    code={joinCode}
                    setCode={setJoinCode}
                    onJoin={handleJoinByCode}
                    onBack={() => setView("main")}
                    loading={loading}
                    serverStatus={serverStatus.status}
                  />
                </motion.div>
              )}

              {view === "browse" && (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <BrowseRoomsPanel
                    rooms={availableRooms}
                    onJoin={handleJoinRoom}
                    onBack={() => setView("main")}
                    loading={loading}
                    serverStatus={serverStatus.status}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-400 text-[10px] text-center mt-4 font-bold tracking-widest uppercase"
          >
            ⚠️ {error}
          </motion.p>
        )}
      </motion.div>

      <ServerStatusDock
        status={serverStatus.status}
        database={serverStatus.database}
        latencyMs={serverStatus.latencyMs}
        onRetry={serverStatus.checkNow}
      />

      {/* Footer & Widgets */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end text-right gap-1 text-[9px] font-mono tracking-widest text-white/20 z-10 pointer-events-none">
        <span>TRINITY ENGINE v3.0</span>
        <span>2-8 JOGADORES</span>
      </div>

      <AuthWidget />
    </motion.div>
  );
}

// === SUB-COMPONENTS ===

function MainMenu({ playerName, onNameChange, onCreateRoom, onJoinCode, onBrowse, onQuickMatch, loading, isLoggedIn, serverStatus, onRetryServer }: {
  playerName: string;
  onNameChange: (v: string) => void;
  onCreateRoom: () => void;
  onJoinCode: () => void;
  onBrowse: () => void;
  onQuickMatch: () => void;
  loading: boolean;
  isLoggedIn: boolean;
  serverStatus: ServerStatus;
  onRetryServer: () => void;
}) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {serverStatus !== "online" && (
        <motion.button
          variants={item}
          onClick={onRetryServer}
          className="w-full rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left transition-colors hover:bg-amber-500/15"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
                {serverStatus === "checking" ? "Conectando ao servidor" : "Servidor offline"}
              </span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-200/80">Testar</span>
          </div>
        </motion.button>
      )}

      {/* Name Input */}
      <motion.div variants={item} className="relative group">
        <input
          type="text"
          value={playerName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Seu apelido..."
          maxLength={16}
          disabled={isLoggedIn}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm
            placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.08]
            transition-all duration-300 group-hover:bg-white/[0.06] disabled:opacity-50"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] text-white/20 font-mono tracking-tighter">
          NAME_ID: {playerName.length}/16
        </div>
        {!isLoggedIn && (
          <div className="absolute -bottom-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
        )}
      </motion.div>

      {/* Quick Match */}
      <motion.div variants={item}>
        <motion.button
          onClick={onQuickMatch}
          disabled={loading || serverStatus !== "online"}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 
            rounded-2xl font-black text-black text-sm tracking-[0.2em] uppercase transition-all 
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-[0_10px_40px_rgba(16,185,129,0.25)] hover:shadow-[0_15px_50px_rgba(16,185,129,0.4)]"
        >
          {serverStatus !== "online" ? (
            "SERVIDOR OFFLINE"
          ) : loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              <span>BUSCANDO...</span>
            </div>
          ) : "PARTIDA RÁPIDA"}
        </motion.button>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        <LobbyButton onClick={onCreateRoom} label="CRIAR" sublabel="SALA" icon="+" />
        <LobbyButton onClick={onJoinCode} label="ENTRAR" sublabel="CÓDIGO" icon="#" />
        <LobbyButton onClick={onBrowse} label="BUSCAR" sublabel="LISTA" icon="☰" />
      </motion.div>
    </motion.div>
  );
}

function LobbyButton({ onClick, label, sublabel, icon }: { onClick: () => void; label: string; sublabel: string; icon: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
      whileTap={{ scale: 0.95 }}
      className="relative py-4 px-2 bg-white/[0.03] border border-white/5 hover:border-emerald-500/30
        rounded-2xl transition-all duration-300 group overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="text-xl font-black">{icon}</span>
      </div>
      <span className="block text-[10px] font-black tracking-widest text-white group-hover:text-emerald-400 transition-colors uppercase">
        {label}
      </span>
      <span className="block text-[8px] text-white/30 mt-0.5 font-mono">{sublabel}</span>
    </motion.button>
  );
}

function CreateRoomPanel({ isPrivate, setIsPrivate, maxPlayers, setMaxPlayers, onConfirm, onBack, loading, serverStatus }: {
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  maxPlayers: number;
  setMaxPlayers: (v: number) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  serverStatus: ServerStatus;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px flex-1 bg-white/10" />
        <h3 className="text-[10px] font-black tracking-[0.3em] text-white/50 uppercase">Configurar Sala</h3>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Private Toggle */}
      <motion.button
        whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        onClick={() => setIsPrivate(!isPrivate)}
        className="w-full flex items-center justify-between bg-white/[0.03] rounded-2xl px-5 py-4 border border-white/5 transition-colors"
      >
        <div className="text-left">
          <span className="text-xs font-bold text-white block">Sala Privada</span>
          <span className="text-[9px] text-white/30 uppercase tracking-tighter">Apenas com código de acesso</span>
        </div>
        <div className={`w-12 h-6 rounded-full transition-all duration-300 relative ${isPrivate ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`}>
          <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${isPrivate ? 'translate-x-7' : 'translate-x-1'}`} />
        </div>
      </motion.button>

      {/* Max Players */}
      <div className="bg-white/[0.03] rounded-2xl px-5 py-4 border border-white/5">
        <div className="flex justify-between items-end mb-4">
          <span className="text-xs font-bold text-white">Máximo de Jogadores</span>
          <span className="text-xl font-black text-emerald-400 leading-none">{maxPlayers}</span>
        </div>
        <div className="flex gap-1.5">
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => setMaxPlayers(n)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all duration-200 ${
                maxPlayers === n
                  ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <motion.button
          onClick={onBack}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/50 tracking-widest transition-colors uppercase"
        >
          Voltar
        </motion.button>
        <motion.button
          onClick={onConfirm}
          disabled={loading || serverStatus !== "online"}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-black text-black text-[10px]
            tracking-[0.2em] uppercase transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
        >
          {serverStatus !== "online" ? "SERVIDOR OFFLINE" : loading ? "CRIANDO..." : "CONFIRMAR"}
        </motion.button>
      </div>
    </div>
  );
}

function JoinByCodePanel({ code, setCode, onJoin, onBack, loading, serverStatus }: {
  code: string;
  setCode: (v: string) => void;
  onJoin: () => void;
  onBack: () => void;
  loading: boolean;
  serverStatus: ServerStatus;
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-black tracking-wider text-center text-white/70 uppercase">Entrar por Código</h3>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="CÓDIGO"
        maxLength={6}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-center text-2xl
          font-black tracking-[0.5em] placeholder:text-white/20 placeholder:text-sm placeholder:tracking-wider
          focus:outline-none focus:border-amber-500/50 transition-all"
      />

      <div className="flex gap-2">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/70 transition-colors"
        >
          VOLTAR
        </motion.button>
        <motion.button
          onClick={onJoin}
          disabled={loading || code.length < 4 || serverStatus !== "online"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-[2] py-3 bg-amber-500 hover:bg-amber-400 rounded-xl font-black text-black text-xs
            tracking-wider uppercase transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
        >
          {serverStatus !== "online" ? "OFFLINE" : loading ? "ENTRANDO..." : "ENTRAR"}
        </motion.button>
      </div>
    </div>
  );
}

function BrowseRoomsPanel({ rooms, onJoin, onBack, loading, serverStatus }: {
  rooms: RoomInfo[];
  onJoin: (roomId: string) => void;
  onBack: () => void;
  loading: boolean;
  serverStatus: ServerStatus;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px flex-1 bg-white/10" />
        <h3 className="text-[10px] font-black tracking-[0.3em] text-white/50 uppercase">Salas Públicas</h3>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scroll">
        {serverStatus !== "online" ? (
          <div className="text-center py-12 bg-amber-500/[0.06] border border-amber-400/10 rounded-2xl">
            <span className="text-3xl opacity-40 mb-2 block">!</span>
            <p className="text-xs font-bold text-amber-200/70 uppercase tracking-widest">Servidor offline</p>
            <p className="text-[9px] text-white/25 mt-1">Inicie o game-server para listar salas.</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
            <span className="text-3xl opacity-30 mb-2 block">📡</span>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Nenhuma sala ativa</p>
            <p className="text-[9px] text-white/20 mt-1">Crie a sua e convide amigos!</p>
          </div>
        ) : (
          rooms.map((room, i) => (
            <motion.button
              key={room.roomId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onJoin(room.roomId)}
              disabled={loading || room.status !== "waiting"}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between bg-white/[0.03] border border-white/5
                rounded-2xl px-5 py-4 transition-all disabled:opacity-40 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-left">
                <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
                  <span className="text-amber-500 mr-2 font-mono">[{room.roomCode}]</span>
                  {room.hostName}&apos;S MATCH
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${room.status === "waiting" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                  <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{room.status === "waiting" ? "Aguardando" : "Em Jogo"}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-emerald-400 leading-none">{room.playerCount}</span>
                  <span className="text-[10px] text-white/30 font-bold mb-0.5">/{room.maxPlayers}</span>
                </div>
                <p className="text-[8px] text-white/20 font-mono tracking-widest mt-1">JOGADORES</p>
              </div>
            </motion.button>
          ))
        )}
      </div>

      <div className="pt-2">
        <motion.button
          onClick={onBack}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/50 tracking-widest transition-colors uppercase"
        >
          Voltar
        </motion.button>
      </div>
    </div>
  );
}

function ServerStatusDock({ status, database, latencyMs, onRetry }: {
  status: ServerStatus;
  database: string;
  latencyMs: number | null;
  onRetry: () => void;
}) {
  const online = status === "online";
  const checking = status === "checking";

  return (
    <div className="fixed left-4 bottom-4 z-40 pointer-events-none">
      <button
        onClick={onRetry}
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all hover:scale-[1.02] ${
          online
            ? "border-emerald-400/20 bg-emerald-500/10"
            : checking
              ? "border-sky-400/20 bg-sky-500/10"
              : "border-amber-400/20 bg-amber-500/10"
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400" : checking ? "bg-sky-400 animate-pulse" : "bg-amber-400"}`} />
        <span className="text-left">
          <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-white/70">
            {online ? "Servidor online" : checking ? "Verificando servidor" : "Servidor offline"}
          </span>
          {online && (
            <span className="block text-[8px] font-mono text-white/30">
              DB {database}{latencyMs ? ` | ${latencyMs}ms` : ""}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

// Ambient particle effect - uses deterministic positions to avoid hydration mismatch
const PARTICLE_SEEDS = Array.from({ length: 30 }, (_, i) => ({
  x: ((i * 37 + 13) % 100),
  y: ((i * 53 + 7) % 100),
  scale: 0.2 + ((i * 17) % 80) / 100,
  targetX: ((i * 61 + 29) % 100),
  targetY: ((i * 43 + 19) % 100),
  duration: 15 + ((i * 31) % 25),
  delay: i * 0.1,
  color: i % 3 === 0 ? "rgba(52,211,153,0.3)" : i % 3 === 1 ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.1)",
}));

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_SEEDS.map((seed, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[1px]"
          style={{
            width: `${seed.scale * 4}px`,
            height: `${seed.scale * 4}px`,
            backgroundColor: seed.color,
          }}
          initial={{
            x: `${seed.x}%`,
            y: `${seed.y}%`,
            scale: seed.scale,
            opacity: 0,
          }}
          animate={{
            y: [`${seed.y}%`, `${seed.targetY}%`, `${seed.y}%`],
            x: [`${seed.x}%`, `${seed.targetX}%`, `${seed.x}%`],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: seed.duration,
            repeat: Infinity,
            delay: seed.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// 3D Lounge Floating Cards
function FloatingCardsLounge() {
  const cards = [1, 5, 8, 12, "back"] as const;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none perspective-[1000px]">
      {cards.map((val, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            y: "100vh", 
            x: `${10 + i * 20}vw`,
            rotateX: 45,
            rotateY: i % 2 === 0 ? -20 : 20,
            rotateZ: i * 15
          }}
          animate={{
            y: "-20vh",
            x: [`${10 + i * 20}vw`, `${15 + i * 15}vw`, `${10 + i * 20}vw`],
            rotateX: [45, 60, 45],
            rotateY: [i % 2 === 0 ? -20 : 20, i % 2 === 0 ? 10 : -10, i % 2 === 0 ? -20 : 20],
            rotateZ: [i * 15, i * 15 + 45, i * 15 + 90],
            opacity: [0, 0.15, 0]
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            delay: i * 2,
            ease: "linear"
          }}
          className="absolute w-24 h-36 rounded-xl shadow-2xl"
          style={{ transformStyle: "preserve-3d" }}
        >
          <CardImage
            value={typeof val === "number" ? val : undefined}
            src={val === "back" ? "/cards/trio_back_card.webp" : undefined}
            className="rounded-xl opacity-60"
            eager={false}
          />
        </motion.div>
      ))}
    </div>
  );
}
