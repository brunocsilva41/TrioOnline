"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { colyseusService } from "../../networking/ColyseusService";
import { useGameStore, RoomInfo } from "../../store/useGameStore";

export default function LobbyScreen() {
  const [view, setView] = useState<"main" | "create" | "join" | "browse">("main");
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const availableRooms = useGameStore((s) => s.availableRooms);

  // Load saved name on mount (client-only to avoid hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("trinity_name");
    if (saved) setPlayerName(saved);
    setMounted(true);
  }, []);

  // Persist name changes
  useEffect(() => {
    if (mounted && playerName) {
      localStorage.setItem("trinity_name", playerName);
    }
  }, [playerName, mounted]);

  // Poll rooms when browsing
  useEffect(() => {
    if (view === "browse") {
      colyseusService.fetchRooms();
      const interval = setInterval(() => colyseusService.fetchRooms(), 3000);
      return () => clearInterval(interval);
    }
  }, [view]);

  const displayName = playerName || `Guest_${Math.random().toString(36).slice(2, 6)}`;

  const handleCreateRoom = async () => {
    setError("");
    setLoading(true);
    try {
      await colyseusService.createRoom({
        isPrivate,
        maxPlayers,
        displayName,
      });
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    }
    setLoading(false);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setError("");
    setLoading(true);
    try {
      await colyseusService.joinByCode(joinCode.trim(), { displayName });
    } catch (e: any) {
      setError(e.message || "Room not found");
    }
    setLoading(false);
  };

  const handleJoinRoom = async (roomId: string) => {
    setError("");
    setLoading(true);
    try {
      await colyseusService.joinRoom(roomId, { displayName });
    } catch (e: any) {
      setError(e.message || "Failed to join room");
    }
    setLoading(false);
  };

  const handleQuickMatch = async () => {
    setError("");
    setLoading(true);
    try {
      await colyseusService.quickMatch({ displayName });
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
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(52,211,153,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(251,191,36,0.04)_0%,_transparent_40%)]" />
        <ParticleField />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center mb-12"
      >
        <h2 className="text-amber-500/80 font-black tracking-[0.6em] text-[10px] sm:text-xs mb-3 italic">
          JOGO DE CARTAS MULTIPLAYER
        </h2>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight">
          <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">TRIO</span>
          <span className="text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">ONLINE</span>
        </h1>
      </motion.div>

      {/* Content Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="z-10 w-full max-w-md px-6"
      >
        {view === "main" && (
          <MainMenu
            playerName={playerName}
            onNameChange={setPlayerName}
            onCreateRoom={() => setView("create")}
            onJoinCode={() => setView("join")}
            onBrowse={() => setView("browse")}
            onQuickMatch={handleQuickMatch}
            loading={loading}
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
            onBack={() => setView("main")}
            loading={loading}
          />
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-400 text-xs text-center mt-4 font-medium"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[9px] font-mono tracking-widest text-white/20 z-10">
        <span>TRINITY ENGINE v3.0</span>
        <span>2-8 JOGADORES</span>
      </div>
    </motion.div>
  );
}

// === SUB-COMPONENTS ===

function MainMenu({ playerName, onNameChange, onCreateRoom, onJoinCode, onBrowse, onQuickMatch, loading }: {
  playerName: string;
  onNameChange: (v: string) => void;
  onCreateRoom: () => void;
  onJoinCode: () => void;
  onBrowse: () => void;
  onQuickMatch: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Name Input */}
      <div className="relative">
        <input
          type="text"
          value={playerName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Seu nome..."
          maxLength={16}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-sm
            placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07]
            transition-all duration-200"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-mono">
          {playerName.length}/16
        </div>
      </div>

      {/* Quick Match */}
      <motion.button
        onClick={onQuickMatch}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-black text-black
          text-sm tracking-wider uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)]"
      >
        {loading ? "CONECTANDO..." : "PARTIDA RÁPIDA"}
      </motion.button>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <LobbyButton onClick={onCreateRoom} label="CRIAR" sublabel="Sala" />
        <LobbyButton onClick={onJoinCode} label="ENTRAR" sublabel="Código" />
        <LobbyButton onClick={onBrowse} label="BUSCAR" sublabel="Salas" />
      </div>
    </div>
  );
}

function LobbyButton({ onClick, label, sublabel }: { onClick: () => void; label: string; sublabel: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="py-3 px-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30
        rounded-lg transition-all duration-200 group"
    >
      <span className="block text-xs font-black tracking-wider text-white group-hover:text-emerald-400 transition-colors">
        {label}
      </span>
      <span className="block text-[9px] text-white/40 mt-0.5">{sublabel}</span>
    </motion.button>
  );
}

function CreateRoomPanel({ isPrivate, setIsPrivate, maxPlayers, setMaxPlayers, onConfirm, onBack, loading }: {
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  maxPlayers: number;
  setMaxPlayers: (v: number) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-black tracking-wider text-center text-white/70 uppercase">Criar Sala</h3>

      {/* Private Toggle */}
      <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
        <span className="text-xs text-white/70">Sala Privada</span>
        <button
          onClick={() => setIsPrivate(!isPrivate)}
          className={`w-10 h-5 rounded-full transition-colors relative ${isPrivate ? 'bg-emerald-500' : 'bg-white/20'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Max Players */}
      <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/10">
        <span className="text-xs text-white/70 block mb-2">Máximo de Jogadores: {maxPlayers}</span>
        <div className="flex gap-1">
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => setMaxPlayers(n)}
              className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                maxPlayers === n
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/70 transition-colors"
        >
          VOLTAR
        </motion.button>
        <motion.button
          onClick={onConfirm}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-black text-black text-xs
            tracking-wider uppercase transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
        >
          {loading ? "CRIANDO..." : "CRIAR SALA"}
        </motion.button>
      </div>
    </div>
  );
}

function JoinByCodePanel({ code, setCode, onJoin, onBack, loading }: {
  code: string;
  setCode: (v: string) => void;
  onJoin: () => void;
  onBack: () => void;
  loading: boolean;
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
          disabled={loading || code.length < 4}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-[2] py-3 bg-amber-500 hover:bg-amber-400 rounded-xl font-black text-black text-xs
            tracking-wider uppercase transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
        >
          {loading ? "ENTRANDO..." : "ENTRAR"}
        </motion.button>
      </div>
    </div>
  );
}

function BrowseRoomsPanel({ rooms, onJoin, onBack, loading }: {
  rooms: RoomInfo[];
  onJoin: (roomId: string) => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black tracking-wider text-white/70 uppercase">Salas Públicas</h3>
        <span className="text-[10px] text-emerald-400/60 font-mono">{rooms.length} encontradas</span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scroll">
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-xs">
            Nenhuma sala disponível. Crie uma!
          </div>
        ) : (
          rooms.map((room) => (
            <motion.button
              key={room.roomId}
              onClick={() => onJoin(room.roomId)}
              disabled={loading || room.status !== "waiting"}
              whileHover={{ scale: 1.01 }}
              className="w-full flex items-center justify-between bg-white/5 hover:bg-white/[0.08] border border-white/10
                hover:border-emerald-500/30 rounded-lg px-4 py-3 transition-all disabled:opacity-40"
            >
              <div className="text-left">
                <p className="text-xs font-bold text-white">{room.hostName}&apos;s Room</p>
                <p className="text-[10px] text-white/40 mt-0.5">{room.status}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-400">{room.playerCount}/{room.maxPlayers}</p>
              </div>
            </motion.button>
          ))
        )}
      </div>

      <motion.button
        onClick={onBack}
        whileTap={{ scale: 0.95 }}
        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/70 transition-colors"
      >
        VOLTAR
      </motion.button>
    </div>
  );
}

// Ambient particle effect - uses deterministic positions to avoid hydration mismatch
const PARTICLE_SEEDS = Array.from({ length: 20 }, (_, i) => ({
  x: ((i * 37 + 13) % 100),
  y: ((i * 53 + 7) % 100),
  scale: 0.5 + ((i * 17) % 50) / 100,
  targetX: ((i * 61 + 29) % 100),
  targetY: ((i * 43 + 19) % 100),
  duration: 10 + ((i * 31) % 15),
}));

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_SEEDS.map((seed, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400/20 rounded-full"
          initial={{
            x: `${seed.x}%`,
            y: `${seed.y}%`,
            scale: seed.scale,
          }}
          animate={{
            y: [null, `${seed.targetY}%`],
            x: [null, `${seed.targetX}%`],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: seed.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
