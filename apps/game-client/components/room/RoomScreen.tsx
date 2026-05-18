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
      className="relative w-full min-h-[100dvh] h-full flex flex-col items-center justify-start sm:justify-center overflow-y-auto overflow-x-hidden px-4 py-12 sm:py-0"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#020617]">
        {/* Radial light gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_50%_0%,_rgba(16,185,129,0.15)_0%,_transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_100%_100%,_rgba(251,191,36,0.08)_0%,_transparent_50%)]" />
        
        {/* Casino grid pattern */}
        <div className="absolute inset-0 bg-[image:var(--casino-grid)] opacity-[0.04]"
          style={{ "--casino-grid": "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "30px 30px" } as any}
        />

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-emerald-400/40 rounded-full blur-[1px]"
              animate={{
                y: ["-20vh", "120vh"],
                x: [
                  `${(i * 15) % 100}vw`,
                  `${((i * 15) + (i % 2 === 0 ? 10 : -10)) % 100}vw`
                ],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 10 + (i % 5) * 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Animated neon line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.5)]"
          animate={{ opacity: [0.3, 0.8, 0.3], scaleX: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Room Header */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="z-10 text-center mb-6 sm:mb-10 w-full max-w-4xl px-4"
      >
        <div className="flex items-center justify-center gap-3 mb-4 w-full">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/50" />
          <h2 className="text-[10px] sm:text-xs font-black tracking-[0.5em] text-emerald-400/80 uppercase whitespace-nowrap">
            {isPrivate ? "SALA PRIVADA" : "SALA PÚBLICA"}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/50" />
        </div>

        {roomCode && (
          <div className="flex justify-center">
            <motion.button
              onClick={copyCode}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(251,191,36,0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-amber-500/40 rounded-2xl px-6 py-3
                hover:border-amber-400 transition-all group shadow-[0_10px_30px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="text-3xl sm:text-4xl font-black tracking-[0.3em] text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">{roomCode}</span>
              <span className="text-[9px] font-bold text-white/40 group-hover:text-amber-300 tracking-widest uppercase">COPIAR</span>
            </motion.button>
          </div>
        )}

        <p className="text-[10px] sm:text-xs text-white/40 font-mono tracking-[0.3em] mt-6">
          <span className="text-emerald-400">{playerList.length}</span> / {maxPlayers} JOGADORES
        </p>
      </motion.div>

      {/* Player Slots Grid */}
      <div className="z-10 w-full max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center">
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
                className="aspect-[3/4] rounded-2xl border border-dashed border-white/15 flex items-center justify-center
                  bg-white/[0.01] backdrop-blur-sm shadow-inner transition-all hover:bg-white/[0.03]"
              >
                <div className="text-center opacity-40">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full border border-white/20 flex items-center justify-center mb-3">
                    <span className="text-white/40 text-xl font-light">+</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-white/40 font-mono tracking-widest uppercase">VAGA ABERTA</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Bar */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="z-10 mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-4xl px-4 sm:px-6"
      >
        <motion.button
          onClick={handleLeave}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40
            rounded-2xl text-[10px] sm:text-xs font-black tracking-widest text-white/60 hover:text-rose-400 transition-all uppercase"
        >
          SAIR
        </motion.button>

        {isHost ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <motion.button
              onClick={() => colyseusService.sendCloseRoom()}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-red-900/30 border border-red-500/30 text-[10px] sm:text-xs font-black tracking-widest uppercase text-red-400/80 hover:bg-red-900/50 hover:text-red-300 hover:border-red-400/50 transition-all shadow-lg"
            >
              FECHAR SALA
            </motion.button>
            <motion.button
              onClick={handleStartGame}
              disabled={!allReady}
              whileHover={allReady ? { scale: 1.02, y: -2 } : {}}
              whileTap={allReady ? { scale: 0.98 } : {}}
              className={`w-full sm:w-auto px-8 sm:px-12 py-4 rounded-2xl font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all ${
                allReady
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)]'
                  : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
              }`}
            >
              {allReady ? "INICIAR PARTIDA" : "AGUARDANDO JOGADORES"}
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={handleToggleReady}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full sm:w-auto px-10 sm:px-16 py-4 rounded-2xl font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all ${
              players[mySessionId]?.isReady
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-[0_10px_30px_rgba(251,191,36,0.3)]'
                : 'bg-white/5 hover:bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            }`}
          >
            {players[mySessionId]?.isReady ? "CANCELAR PRONTO" : "ESTOU PRONTO"}
          </motion.button>
        )}
      </motion.div>

      {/* Waiting indicator */}
      {!isHost && players[mySessionId]?.isReady && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 mt-6 text-[10px] text-amber-400/60 font-black tracking-[0.3em] uppercase drop-shadow-md"
        >
          AGUARDANDO O HOST INICIAR A PARTIDA...
        </motion.p>
      )}
    </motion.div>
  );
}
