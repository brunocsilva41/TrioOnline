"use client";

import { motion } from "framer-motion";
import { useGameStore, PlayerData } from "../../store/useGameStore";
import { colyseusService } from "../../networking/ColyseusService";
import PlayerAvatar from "../PlayerAvatar";
import { Trophy, Home, RotateCcw, Target } from "lucide-react";
import { useMemo } from "react";

export default function GameOverScreen() {
  const players = useGameStore((s) => s.players);
  const mySid = useGameStore((s) => s.mySessionId);

  const sortedResults = useMemo(() => {
    return Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [players]);

  const winner = sortedResults[0];
  const isWinner = winner?.sessionId === mySid;

  const handleFinish = () => {
    colyseusService.leaveRoom();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#020617]/98 backdrop-blur-2xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/40 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative"
      >
        {/* winner glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.1)_0%,_transparent_70%)] pointer-events-none" />

        {/* Winner Banner */}
        <div className="relative h-44 flex flex-col items-center justify-center pt-8">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-4"
          >
            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <Trophy size={48} className="text-amber-400" />
            </div>
          </motion.div>

          <h2 className="text-[10px] font-black font-display tracking-[0.5em] text-emerald-400 uppercase">
            Fim de Jogo
          </h2>
          <p className="text-2xl font-black font-display text-white mt-1 tracking-tight">
            {isWinner ? "VITÓRIA BRILHANTE!" : `${winner?.displayName || "Jogador"} VENCEU!`}
          </p>
        </div>

        {/* Results List */}
        <div className="p-6 sm:p-8 space-y-2">
          {sortedResults.map((player, i) => (
            <motion.div
              key={player.sessionId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                player.sessionId === mySid ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.02] border-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black font-display text-white/20 w-4">#{i + 1}</span>
                <PlayerAvatar sessionId={player.sessionId} size="sm" showName={false} showStatus={false} />
                <span className={`text-sm font-black uppercase tracking-tight ${player.sessionId === mySid ? "text-emerald-400" : "text-white/80"}`}>
                  {player.displayName}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-lg font-black font-display text-white leading-none">{player.score || 0}</span>
                <Target size={12} className="text-white/30" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 sm:p-8 pt-0 flex gap-3">
          <motion.button
            onClick={handleFinish}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black font-display text-white/40 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Home size={14} />
            Lobby
          </motion.button>
          
          <motion.button
            onClick={handleFinish}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(16,185,129,0.9)" }}
            whileTap={{ scale: 0.98 }}
            className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-black text-[10px] font-black font-display transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:shadow-none"
          >
            <RotateCcw size={14} />
            Novo Jogo
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
