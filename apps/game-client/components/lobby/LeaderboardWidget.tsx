"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HTTP_URL = (process.env.NEXT_PUBLIC_GAME_SERVER_URL || "ws://localhost:2567").replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://").replace(/\/$/, "");

interface LeaderboardEntry {
  id: string;
  username: string;
  total_matches: number;
  total_wins: number;
  total_playtime_seconds: number;
  total_trios: number;
}

export default function LeaderboardWidget() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${HTTP_URL}/api/leaderboard`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
          setError(null);
        }
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
        setError("Servidor Offline");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-6 right-6 z-40 w-[calc(100%-48px)] sm:w-full sm:max-w-[440px] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 pointer-events-auto"
          >
            <span className="text-xl">🏆</span>
            <h3 className="text-[11px] font-black tracking-[0.3em] text-white uppercase">Ranking Global</h3>
          </button>
          <div className="h-px flex-1 bg-white/10 mx-4 hidden sm:block" />
          <div className="flex items-center gap-3">
            {error ? (
              <span className="text-[9px] font-mono text-rose-500 uppercase">{error}</span>
            ) : (
              <span className="text-[9px] font-mono text-emerald-400 animate-pulse uppercase">Live</span>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white/20 hover:text-white transition-colors"
            >
              {isCollapsed ? "▼" : "▲"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 max-h-[280px] sm:max-h-[320px] overflow-y-auto pr-2 custom-scroll">
                {loading && leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-5 h-5 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">Carregando Ranking...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-center py-8 text-[10px] text-white/20 uppercase tracking-widest italic">Ainda não há dados suficientes</p>
                ) : (
                  <>
                    {/* Table Header */}
                    <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-1 mb-1 border-b border-white/5">
                      <span className="text-[8px] font-black text-white/30 uppercase">Nome</span>
                      <span className="text-[8px] font-black text-white/30 uppercase text-center">Partidas</span>
                      <span className="text-[8px] font-black text-white/30 uppercase text-center">Vitórias</span>
                      <span className="text-[8px] font-black text-white/30 uppercase text-center">Horas</span>
                      <span className="text-[8px] font-black text-white/30 uppercase text-center">Trios</span>
                    </div>
                    
                    {leaderboard.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-2 rounded-xl transition-colors
                          ${i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 
                            i === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                            i === 2 ? 'bg-amber-700/10 border border-amber-700/20' : 'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent'}
                        `}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`text-[9px] font-black w-3 ${
                            i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/20'
                          }`}>{i + 1}</span>
                          <span className="text-[10px] font-bold text-white truncate">{entry.username}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50 text-center">{entry.total_matches}</span>
                        <span className="text-[10px] font-mono text-emerald-400 text-center font-bold">{entry.total_wins}</span>
                        <span className="text-[10px] font-mono text-white/50 text-center">{(entry.total_playtime_seconds / 3600).toFixed(1)}h</span>
                        <span className="text-[10px] font-mono text-amber-400 text-center font-bold">{entry.total_trios}</span>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center">
                <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Top 10 Jogadores Mundiais</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
