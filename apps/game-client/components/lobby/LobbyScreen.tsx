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
 * 
 * Main landing and room management interface.
 * Features:
 * - Dynamic view switching (Main, Create, Join, Browse)
 * - Server status monitoring
 * - Nickname persistence
 * - Room polling
 * - High-fidelity animations
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

  // Load saved name on mount
  useEffect(() => {
    const saved = localStorage.getItem("trinity_name");
    if (saved) setPlayerName(saved);
    setMounted(true);
  }, []);

  // Sync authUser to playerName
  useEffect(() => {
    if (authUser) {
      setPlayerName(authUser.username);
    }
  }, [authUser]);

  // Persist name
  useEffect(() => {
    if (mounted && playerName && !authUser) {
      localStorage.setItem("trinity_name", playerName);
    }
  }, [playerName, mounted, authUser]);

  // Poll rooms
  useEffect(() => {
    if (view === "browse" && isServerOnline) {
      colyseusService.fetchRooms();
      const interval = setInterval(() => colyseusService.fetchRooms(), 3000);
      return () => clearInterval(interval);
    }
  }, [view, isServerOnline]);

  const isProcessing = useGameStore((s) => s.isProcessing);
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
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
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
        className="z-10 text-center mb-6 sm:mb-12 relative px-4"
      >
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-10 bg-emerald-500/10 blur-[60px] rounded-full -z-10"
        />
        <h1 className="text-4xl sm:text-7xl font-black font-display tracking-tighter flex items-center justify-center gap-1">
          <motion.span 
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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
            className="text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]"
          >
            ONLINE
          </motion.span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
          <div className="h-px w-6 sm:w-8 bg-gradient-to-r from-transparent to-white/10" />
          <span className="text-[7px] sm:text-[8px] font-mono text-white/20 tracking-[0.3em] sm:tracking-[0.4em] uppercase">Multiplayer Experience</span>
          <div className="h-px w-6 sm:w-8 bg-gradient-to-l from-transparent to-white/10" />
        </div>
      </motion.div>

      {/* Leaderboard */}
      <div className="w-full max-w-md z-20">
        <LeaderboardWidget />
      </div>

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
        className="z-10 w-full max-w-lg px-4 sm:px-6"
      >
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-1.5 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-10">
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
                    onShowTutorial={() => setShowTutorial(true)}
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
                    onObserve={handleObserveRoom}
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
            className="text-rose-400 text-xs text-center mt-6 font-bold tracking-widest uppercase px-4"
          >
            ⚠️ {error}
          </motion.p>
        )}
      </motion.div>

      <AuthWidget />
    </motion.div>
  );
}

// === SUB-COMPONENTS ===

function MainMenu({ 
  playerName, onNameChange, onCreateRoom, onJoinCode, onBrowse, 
  onQuickMatch, onShowTutorial, loading, isLoggedIn, serverStatus, onRetryServer 
}: {
  playerName: string;
  onNameChange: (v: string) => void;
  onCreateRoom: () => void;
  onJoinCode: () => void;
  onBrowse: () => void;
  onQuickMatch: () => void;
  onShowTutorial: () => void;
  loading: boolean;
  isLoggedIn: boolean;
  serverStatus: string;
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {serverStatus !== "online" && (
        <motion.button
          variants={item}
          onClick={onRetryServer}
          className="w-full rounded-[1.5rem] border border-amber-400/20 bg-amber-500/10 px-6 py-4 text-left transition-colors hover:bg-amber-500/15"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="block text-xs font-black font-display uppercase tracking-[0.22em] text-amber-300">
                {serverStatus === "checking" ? "Conectando ao servidor..." : "Servidor em espera"}
              </span>
            </div>
            <span className="text-[10px] font-black font-display uppercase tracking-widest text-amber-200/80">Reconectar</span>
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
          className="w-full bg-white/5 border border-white/15 rounded-[1.5rem] px-8 py-6 text-white text-lg
            placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.08]
            transition-all duration-300 group-hover:bg-white/[0.06] disabled:opacity-50"
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-mono tracking-tighter">
          NAME_ID: {playerName.length}/16
        </div>
        {!isLoggedIn && (
          <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
        )}
      </motion.div>

      {/* Quick Match */}
      <motion.div variants={item}>
        <motion.button
          onClick={onQuickMatch}
          disabled={loading || serverStatus !== "online"}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-7 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 
            rounded-[1.5rem] font-black font-display text-black text-lg tracking-[0.2em] uppercase transition-all 
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-[0_15px_50px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.5)]"
        >
          {serverStatus !== "online" ? (
            "CONECTANDO..."
          ) : loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
              <span>BUSCANDO...</span>
            </div>
          ) : "PARTIDA RÁPIDA"}
        </motion.button>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4">
        <LobbyButton onClick={onCreateRoom} label="CRIAR" sublabel="SALA" icon={<Plus size={20} />} />
        <LobbyButton onClick={onJoinCode} label="ENTRAR" sublabel="CÓDIGO" icon={<Hash size={20} />} />
        <LobbyButton onClick={onBrowse} label="BUSCAR" sublabel="LISTA" icon={<Search size={20} />} />
        <LobbyButton onClick={onShowTutorial} label="TUTORIAL" sublabel="APRENDA" icon={<HelpCircle size={20} />} />
      </motion.div>
    </motion.div>
  );
}

function LobbyButton({ onClick, label, sublabel, icon }: { onClick: () => void; label: string; sublabel: string; icon: React.ReactNode }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
      whileTap={{ scale: 0.95 }}
      className="relative py-6 px-3 bg-white/[0.03] border border-white/10 hover:border-emerald-500/30
        rounded-[1.5rem] transition-all duration-300 group overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <span className="block text-xs font-black font-display tracking-widest text-white group-hover:text-emerald-400 transition-colors uppercase">
        {label}
      </span>
      <span className="block text-[10px] text-white/30 mt-1 font-mono">{sublabel}</span>
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
  serverStatus: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px flex-1 bg-white/10" />
        <h3 className="text-[10px] font-black font-display tracking-[0.3em] text-white/50 uppercase">Configurar Sala</h3>
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
          <span className="text-xl font-black font-display text-emerald-400 leading-none">{maxPlayers}</span>
        </div>
        <div className="flex gap-1.5">
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => setMaxPlayers(n)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black font-display transition-all duration-200 ${
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
          className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black font-display text-white/50 tracking-widest transition-colors uppercase"
        >
          Voltar
        </motion.button>
        <motion.button
          onClick={onConfirm}
          disabled={loading || serverStatus !== "online"}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-black font-display text-black text-[10px]
            tracking-[0.2em] uppercase transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
        >
          {serverStatus !== "online" ? "AGUARDE..." : loading ? "CRIANDO..." : "CONFIRMAR"}
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
  serverStatus: string;
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-black font-display tracking-wider text-center text-white/70 uppercase">Entrar por Código</h3>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="CÓDIGO"
        maxLength={6}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-center text-2xl
          font-black font-display tracking-[0.5em] placeholder:text-white/20 placeholder:text-sm placeholder:tracking-wider
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
          className="flex-[2] py-3 bg-amber-500 hover:bg-amber-400 rounded-xl font-black font-display text-black text-xs
            tracking-wider uppercase transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
        >
          {serverStatus !== "online" ? "OFFLINE" : loading ? "ENTRANDO..." : "ENTRAR"}
        </motion.button>
      </div>
    </div>
  );
}

function BrowseRoomsPanel({ rooms, onJoin, onObserve, onBack, loading, serverStatus }: {
  rooms: RoomInfo[];
  onJoin: (roomId: string) => void;
  onObserve: (roomId: string) => void;
  onBack: () => void;
  loading: boolean;
  serverStatus: string;
}) {
  // Separate rooms
  const waitingRooms = rooms.filter(r => r.status === "waiting");
  const ongoingRooms = rooms.filter(r => r.status !== "waiting");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px flex-1 bg-white/10" />
        <h3 className="text-[10px] font-black font-display tracking-[0.3em] text-white/50 uppercase">Salas Públicas</h3>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scroll">
        {serverStatus !== "online" ? (
          <div className="text-center py-12 bg-amber-500/[0.06] border border-amber-400/10 rounded-2xl">
            <span className="text-3xl opacity-40 mb-2 block">📡</span>
            <p className="text-xs font-bold text-amber-200/70 uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
            <span className="text-3xl opacity-30 mb-2 block">📡</span>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Nenhuma sala ativa</p>
          </div>
        ) : (
          <>
            {waitingRooms.map((room, i) => (
              <motion.button
                key={room.roomId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onJoin(room.roomId)}
                className="w-full flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4"
              >
                <div className="text-left">
                  <p className="text-sm font-black font-display text-white uppercase tracking-wider">
                    {room.hostName}&apos;S MATCH
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-display text-emerald-400">{room.playerCount}/{room.maxPlayers}</span>
                </div>
              </motion.button>
            ))}

            {ongoingRooms.length > 0 && (
              <div className="space-y-2">
                <p className="text-[8px] font-black text-amber-500/50 uppercase tracking-[0.2em] py-2">Em Andamento</p>
                {ongoingRooms.map((room) => (
                  <div key={room.roomId} className="w-full flex items-center justify-between bg-amber-500/[0.02] border border-amber-500/10 rounded-2xl px-5 py-4">
                    <span className="text-xs font-bold text-white/60">{room.hostName}&apos;s Game</span>
                    <button onClick={() => onObserve(room.roomId)} className="text-[10px] font-black text-amber-400 uppercase">Observar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <button onClick={onBack} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/50 uppercase">Voltar</button>
    </div>
  );
}

// Minimal implementations for visual compatibility
function ParticleField() { return null; }
function FloatingCardsLounge() { return null; }
