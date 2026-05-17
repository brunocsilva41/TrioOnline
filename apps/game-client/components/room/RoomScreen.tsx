"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { colyseusService } from "../../networking/ColyseusService";
import PlayerSlot from "./PlayerSlot";

export default function RoomScreen() {
  const players = useGameStore((s) => s.players);
  const maxPlayers = useGameStore((s) => s.maxPlayers);
  const roomCode = useGameStore((s) => s.roomCode);
  const isPrivate = useGameStore((s) => s.isPrivate);
  const hostSessionId = useGameStore((s) => s.hostSessionId);
  const mySessionId = useGameStore((s) => s.mySessionId);

  const isHost = mySessionId === hostSessionId;
  const playerList = useMemo(() => Object.values(players), [players]);
  const allReady = playerList.length >= 2 && playerList.every((p) => p.isHost || p.isReady);

  const handleToggleReady = () => colyseusService.sendReady();
  const handleStartGame = () => colyseusService.sendStartGame();
  const handleLeave = () => colyseusService.leaveRoom();
  const handleKick = (sessionId: string) => colyseusService.sendKickPlayer(sessionId);

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  // Generate slots (filled + empty)
  const slots = useMemo(() => {
    const filled = playerList.sort((a, b) => a.seatingPosition - b.seatingPosition);
    const emptyCount = maxPlayers - filled.length;
    return { filled, emptyCount };
  }, [playerList, maxPlayers]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
      transition={{ duration: 0.4 }}
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden px-4"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,_rgba(52,211,153,0.06)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[image:var(--casino-grid)] opacity-[0.03]"
          style={{ "--casino-grid": "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)" } as any}
        />
        {/* Animated neon line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Room Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 text-center mb-8"
      >
        <h2 className="text-xs font-black tracking-[0.5em] text-emerald-400/60 uppercase mb-2">
          {isPrivate ? "SALA PRIVADA" : "SALA PÚBLICA"}
        </h2>

        {isPrivate && roomCode && (
          <motion.button
            onClick={copyCode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-amber-500/30 rounded-lg px-4 py-2 mb-3
              hover:border-amber-500/60 transition-colors group"
          >
            <span className="text-2xl font-black tracking-[0.4em] text-amber-400">{roomCode}</span>
            <span className="text-[9px] text-white/40 group-hover:text-white/60">COPIAR</span>
          </motion.button>
        )}

        <p className="text-[10px] text-white/30 font-mono tracking-wider">
          {playerList.length} / {maxPlayers} JOGADORES
        </p>
      </motion.div>

      {/* Player Slots Grid */}
      <div className="z-10 w-full max-w-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AnimatePresence>
            {slots.filled.map((player) => (
              <PlayerSlot
                key={player.sessionId}
                player={player}
                isMe={player.sessionId === mySessionId}
                isHost={isHost}
                onKick={() => handleKick(player.sessionId)}
              />
            ))}
            {Array.from({ length: slots.emptyCount }).map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-[3/4] rounded-xl border border-dashed border-white/10 flex items-center justify-center
                  bg-white/[0.02]"
              >
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-full border border-white/10 flex items-center justify-center mb-2">
                    <span className="text-white/20 text-lg">+</span>
                  </div>
                  <span className="text-[9px] text-white/20 font-mono">VAGA ABERTA</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="z-10 mt-8 flex items-center gap-3"
      >
        <motion.button
          onClick={handleLeave}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30
            rounded-xl text-xs font-bold text-white/60 hover:text-rose-400 transition-all"
        >
          SAIR
        </motion.button>

        {isHost ? (
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleStartGame}
              disabled={!allReady}
              whileHover={allReady ? { scale: 1.03 } : {}}
              whileTap={allReady ? { scale: 0.97 } : {}}
              className={`px-10 py-3.5 rounded-xl font-black text-sm tracking-wider uppercase transition-all ${
                allReady
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(52,211,153,0.4)] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)]'
                  : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
              }`}
            >
              INICIAR PARTIDA
            </motion.button>
            <motion.button
              onClick={() => colyseusService.sendCloseRoom()}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/20 text-xs font-bold text-red-400/70 hover:bg-red-900/40 hover:text-red-300 transition-all"
            >
              Fechar Sala
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={handleToggleReady}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`px-10 py-3.5 rounded-xl font-black text-sm tracking-wider uppercase transition-all ${
              players[mySessionId]?.isReady
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'bg-white/5 hover:bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            {players[mySessionId]?.isReady ? "NÃO PRONTO" : "PRONTO"}
          </motion.button>
        )}
      </motion.div>

      {/* Waiting indicator */}
      {!isHost && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="z-10 mt-4 text-[10px] text-white/30 font-mono tracking-wider"
        >
          AGUARDANDO O HOST INICIAR...
        </motion.p>
      )}
    </motion.div>
  );
}
