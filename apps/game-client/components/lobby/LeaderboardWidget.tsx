"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SERVER_ENDPOINTS, getRetryDelayMs } from "../../lib/serverEndpoint";
import PlayerAvatar from "../PlayerAvatar";
import { Trophy, Crown, Flame, Star, ChevronDown, ChevronUp, Zap, Target, Award } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url?: string;
  total_matches: number;
  total_wins: number;
  total_playtime_seconds: number;
  total_trios: number;
}

export default function LeaderboardWidget() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

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
        setError("Sync Error");
      } finally {
        if (disposed) return;
        setLoading(false);
        timeoutId = setTimeout(fetchLeaderboard, failureCount > 0 ? getRetryDelayMs(failureCount) : 15000);
      }
    };

    fetchLeaderboard();
    return () => {
      disposed = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="relative sm:fixed sm:top-8 sm:right-8 z-40 w-full sm:w-[540px] pointer-events-none mb-12 sm:mb-0 px-4 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-black/40 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.6)] pointer-events-auto overflow-hidden relative aurora-bg"
      >
        {/* Subtle Top Inner Glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Header Container */}
        <div className="p-6 sm:p-10 bg-white/[0.01] border-b border-white/5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-500 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                   <Trophy className="text-emerald-400 z-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" size={32} />
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-black/80 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black font-display tracking-[0.15em] text-white uppercase leading-none antialiased">Mundial</h3>
                <p className="text-[10px] font-black font-display text-emerald-400/50 tracking-[0.4em] uppercase mt-3 antialiased">Temporada 01</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-14 h-14 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-all border border-white/5 active:scale-95 group"
              >
                {isCollapsed ? 
                  <ChevronDown className="text-white/30 group-hover:text-white/60 transition-colors" size={24} /> : 
                  <ChevronUp className="text-white/30 group-hover:text-white/60 transition-colors" size={24} /> 
                }
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-4 sm:p-8">
                {/* Table Header Labels */}
                <div className="grid grid-cols-[0.8fr_3.5fr_1fr_1fr_1fr] gap-4 px-8 py-4 mb-4 bg-white/[0.02] rounded-2xl border border-white/5 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '2s' }} />
                   <span className="text-[10px] font-black font-display text-white/30 uppercase text-center tracking-widest">#</span>
                   <span className="text-[10px] font-black font-display text-white/30 uppercase tracking-[0.2em]">Jogador</span>
                   <span className="text-[10px] font-black font-display text-white/30 uppercase text-center tracking-widest">Part</span>
                   <span className="text-[10px] font-black font-display text-white/30 uppercase text-center tracking-widest">Vits</span>
                   <span className="text-[10px] font-black font-display text-white/30 uppercase text-center tracking-widest">Trios</span>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-3 custom-scroll">
                  {loading && leaderboard.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                       <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
                       <p className="text-[11px] font-black font-display text-white/20 uppercase tracking-[0.4em]">Sincronizando Ranking...</p>
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="py-24 text-center">
                       <Target className="mx-auto text-white/5 mb-6" size={56} />
                       <p className="text-[11px] font-black font-display text-white/20 uppercase tracking-[0.4em]">Aguardando dados...</p>
                    </div>
                  ) : (
                    leaderboard.slice(0, 10).map((entry, i) => (
                      <LeaderboardRow key={entry.id} entry={entry} rank={i + 1} />
                    ))
                  )}
                </div>

                {/* Footer Info */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between px-3">
                   <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse" />
                      <span className="text-[10px] font-black font-display text-white/20 uppercase tracking-[0.2em]">Real-time Sync</span>
                   </div>
                   <p className="text-[10px] font-black font-display text-white/10 uppercase tracking-[0.2em] font-medium">v1.2.4 Beta</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry, rank: number }) {
  const isTopThree = rank <= 3;
  
  const rankStyles: Record<number, { bg: string, border: string, glow: string, text: string }> = {
    1: { 
      bg: "bg-gradient-to-r from-amber-500/20 to-amber-500/5", 
      border: "border-amber-500/30", 
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.1)]",
      text: "text-amber-400"
    },
    2: { 
      bg: "bg-gradient-to-r from-slate-300/15 to-slate-300/5", 
      border: "border-slate-300/20", 
      glow: "shadow-[0_0_20px_rgba(203,213,225,0.05)]",
      text: "text-slate-300"
    },
    3: { 
      bg: "bg-gradient-to-r from-amber-700/20 to-amber-700/5", 
      border: "border-amber-700/20", 
      glow: "shadow-[0_0_20px_rgba(180,83,9,0.05)]",
      text: "text-amber-600"
    },
  };

  const currentStyle = isTopThree ? rankStyles[rank as 1|2|3] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
      transition={{ 
        delay: rank * 0.05,
        duration: 0.3,
        whileHover: { duration: 0.2 }
      }}
      className={`group grid grid-cols-[0.8fr_3.5fr_1fr_1fr_1fr] gap-4 items-center px-7 py-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden pointer-events-auto
        ${isTopThree ? `${currentStyle?.bg} ${currentStyle?.border} ${currentStyle?.glow}` : "bg-white/[0.01] border-white/5 hover:border-white/10"}
      `}
    >
      {/* Shimmer Effect for Top 3 */}
      {isTopThree && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-shimmer pointer-events-none" style={{ animationDuration: '4s' }} />
      )}

      {/* Rank Column */}
      <div className="flex justify-center items-center">
        {rank === 1 ? (
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_8px_20px_rgba(245,158,11,0.4)] rotate-[-4deg] group-hover:rotate-0 transition-transform">
             <Crown className="text-black" size={20} fill="black" />
          </div>
        ) : rank === 2 ? (
          <div className="w-9 h-9 rounded-xl bg-slate-300 flex items-center justify-center shadow-[0_8px_20px_rgba(203,213,225,0.3)]">
             <Award className="text-black" size={18} fill="black" />
          </div>
        ) : rank === 3 ? (
          <div className="w-9 h-9 rounded-xl bg-amber-700 flex items-center justify-center shadow-[0_8px_20px_rgba(180,83,9,0.3)]">
             <Star className="text-black" size={18} fill="black" />
          </div>
        ) : (
          <span className="text-sm font-black font-display text-white/10 group-hover:text-white/30 transition-colors tracking-tighter">
            {rank.toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Player Identity */}
      <div className="flex items-center gap-5 truncate">
        <div className="relative flex-shrink-0">
          <div className={`p-0.5 rounded-2xl ${isTopThree ? 'bg-gradient-to-br from-white/30 to-transparent' : 'bg-white/5'}`}>
            <div className="rounded-[0.9rem] overflow-hidden border border-white/10 bg-slate-950 shadow-inner">
              <PlayerAvatar name={entry.username} avatarUrl={entry.avatar_url} size="sm" showName={false} showStatus={false} showBadge={false} />
            </div>
          </div>
          {isTopThree && (
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
            />
          )}
        </div>
        <span className={`text-lg font-bold font-display truncate tracking-tight transition-colors antialiased ${isTopThree ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
          {entry.username}
        </span>
      </div>

      {/* Stats Columns */}
      <span className="text-xs font-black font-display text-white/20 text-center group-hover:text-white/40 transition-colors tabular-nums">{entry.total_matches}</span>
      
      <div className="flex justify-center">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isTopThree ? 'bg-white/5' : 'bg-emerald-500/[0.03] border border-emerald-500/5 group-hover:border-emerald-500/20'}`}>
           <Flame size={14} className={rank === 1 ? "text-amber-400" : "text-emerald-400"} />
           <span className={`text-xs font-black font-display tabular-nums ${rank === 1 ? "text-amber-400" : "text-emerald-400"}`}>{entry.total_wins}</span>
        </div>
      </div>

      <div className="flex justify-center">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isTopThree ? 'bg-white/5' : 'bg-white/[0.02] border border-white/5 group-hover:border-white/20'}`}>
           <Zap size={14} className="text-white/20 group-hover:text-blue-400 transition-colors" />
           <span className="text-xs font-black font-display text-white/40 group-hover:text-white transition-colors tabular-nums">{entry.total_trios}</span>
        </div>
      </div>
    </motion.div>
  );
}
