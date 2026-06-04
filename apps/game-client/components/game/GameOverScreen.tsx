"use client";

import { motion } from "framer-motion";
import { useGameStore, PlayerData } from "../../store/useGameStore";
import { colyseusService } from "../../networking/ColyseusService";
import PlayerAvatar from "../PlayerAvatar";
import { Trophy, Home, RotateCcw } from "lucide-react";
import { useMemo } from "react";

export default function GameOverScreen() {
  const players = useGameStore((s) => s.players);
  const mySid = useGameStore((s) => s.mySessionId);
  const roomCode = useGameStore((s) => s.roomCode);

  const sortedResults = useMemo(() => {
    return Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [players]);

  const winner = sortedResults[0];
  const isWinner = winner?.sessionId === mySid;

  const handleBackToLobby = () => {
    colyseusService.leaveRoom();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        {/* Winner Banner */}
        <div className="relative h-48 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-500/20 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(52,211,153,0.15)_0%,_transparent_70%)]" />
          
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="mb-4 text-emerald-400"
          >
            <Trophy size={64} />
          </motion.div>

          <h2 className="text-[10px] font-black font-display tracking-[0.5em] text-emerald-400 uppercase">
            Partida Finalizada
          </h2>
          <p className="text-2xl font-black font-display text-white mt-1">
            {isWinner ? "VOCÊ VENCEU!" : `${winner?.displayName || "Alguém"} Venceu!`}
          </p>
        </div>

        {/* Results List */}
        <div className="p-8 space-y-3">
          {sortedResults.map((player, i) => (
            <motion.div
              key={player.sessionId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.5 }}
              className={`flex items-center justify-between p-4 rounded-2xl border ${
                player.sessionId === mySid ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-black font-display text-white/20 w-4">#{i + 1}</span>
                <PlayerAvatar sessionId={player.sessionId} size="sm" showName={false} />
                <span className={`text-sm font-bold ${player.sessionId === mySid ? "text-emerald-400" : "text-white"}`}>
                  {player.displayName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-display text-white">{player.score || 0}</span>
                <span className="text-[8px] font-black font-display text-white/30 uppercase ml-1 tracking-widest">Trios</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-8 pt-0 flex gap-3">
          <motion.button
            onClick={handleBackToLobby}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black font-display text-white/60 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Home size={14} />
            Lobby
          </motion.button>
          
          <motion.button
            onClick={() => window.location.reload()} // Quick dirty fix to restart or rejoin
            whileHover={{ scale: 1.02, backgroundColor: "rgba(16,185,129,0.9)" }}
            whileTap={{ scale: 0.98 }}
            className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-black text-[10px] font-black font-display transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <RotateCcw size={14} />
            Jogar Novamente
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
