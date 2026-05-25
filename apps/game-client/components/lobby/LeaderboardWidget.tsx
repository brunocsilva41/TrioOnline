"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SERVER_ENDPOINTS, getRetryDelayMs } from "../../lib/serverEndpoint";

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
    let failureCount = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${SERVER_ENDPOINTS.httpUrl}/api/leaderboard`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (disposed) return;
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
          setError(null);
        }
        failureCount = 0;
      } catch (e) {
        if (disposed) return;
        failureCount += 1;
        if (process.env.NODE_ENV !== "development") {
          console.error("Failed to fetch leaderboard", e);
        }
        setError("Servidor Offline");
      } finally {
        if (disposed) return;
        setLoading(false);
        timeoutId = setTimeout(fetchLeaderboard, failureCount > 0 ? getRetryDelayMs(failureCount) : 10000);
      }
    };

    fetchLeaderboard();
    return () => {
      disposed = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 w-[calc(100%-32px)] sm:w-full sm:max-w-[440px] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 sm:p-5 shadow-2xl pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 pointer-events-auto"
          >
            <span className="text-lg sm:text-xl">🏆</span>
            <h3 className="text-[10px] sm:text-[11px] font-black tracking-[0.2em] sm:tracking-[0.3em] text-white uppercase">Ranking Global</h3>
          </button>
          <div className="h-px flex-1 bg-white/10 mx-2 sm:mx-4 hidden sm:block" />
          <div className="flex items-center gap-2 sm:gap-3">
            {error ? (
              <span className="text-[8px] sm:text-[9px] font-mono text-rose-500 uppercase">{error}</span>
            ) : (
              <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400 animate-pulse uppercase">Live</span>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white/20 hover:text-white transition-colors p-1"
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
              <div className="space-y-1 sm:space-y-1.5 max-h-[220px] sm:max-h-[320px] overflow-y-auto pr-1 sm:pr-2 custom-scroll">
                {loading && leaderboard.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-5 h-5 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-[9px] sm:text-[10px] text-white/20 uppercase tracking-widest">Carregando...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-center py-6 sm:py-8 text-[9px] sm:text-[10px] text-white/20 uppercase tracking-widest italic">Sem dados</p>
                ) : (
                  <>
                    {/* Table Header */}
                    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-1 sm:gap-2 px-2 sm:px-3 py-1 mb-1 border-b border-white/5">
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase">Nome</span>
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase text-center">Pts</span>
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase text-center">Vits</span>
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase text-center">Hrs</span>
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase text-center">Trios</span>
                    </div>
                    
                    {leaderboard.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors
                          ${i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 
                            i === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                            i === 2 ? 'bg-amber-700/10 border border-amber-700/20' : 'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent'}
                        `}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 truncate">
                          <span className={`text-[8px] sm:text-[9px] font-black w-2 sm:w-3 ${
                            i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/20'
                          }`}>{i + 1}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold text-white truncate">{entry.username}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-mono text-white/50 text-center">{entry.total_matches}</span>
                        <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 text-center font-bold">{entry.total_wins}</span>
                        <span className="text-[9px] sm:text-[10px] font-mono text-white/50 text-center">{(entry.total_playtime_seconds / 3600).toFixed(0)}h</span>
                        <span className="text-[9px] sm:text-[10px] font-mono text-amber-400 text-center font-bold">{entry.total_trios}</span>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5 flex items-center justify-center">
                <p className="text-[7px] sm:text-[8px] font-black text-white/10 uppercase tracking-[0.2em] sm:tracking-[0.4em]">Mundial (Top 10)</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
