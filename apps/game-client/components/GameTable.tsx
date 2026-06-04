"use client";

import React, { memo, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useGameStore, PlayerData, CardData, TrioData } from "../store/useGameStore";
import { colyseusService } from "../networking/ColyseusService";
import PlayerAvatar from "./PlayerAvatar";
import Card from "./Card";
import TrioCinematic from "./game/TrioCinematic";
import EmoteRain from "./game/EmoteRain";
import GameChat from "./game/GameChat";
import { LogOut, ArrowDownToLine, ArrowUpToLine, Trophy, Clock, Swords, Hand, Target } from "lucide-react";
import CardImage from "./CardImage";

// ==========================================
// 1. SHARED COMPONENTS
// ==========================================
const Timer = memo(() => {
  const cur = useGameStore((s) => s.currentTick);
  const exp = useGameStore((s) => s.expirationTick);
  if (exp <= 0) return null;
  const rem = Math.max(0, exp - cur);
  const pct = Math.min(100, (rem / 2400) * 100);
  const total = Math.ceil(rem / 20);
  const col = pct < 20 ? "bg-red-500" : pct < 50 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
      <Clock size={12} className={pct < 20 ? "text-red-400" : "text-emerald-400"} />
      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${col}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono font-bold tabular-nums ${pct < 20 ? "text-red-400" : "text-white"}`}>
        {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}
      </span>
    </div>
  );
});
Timer.displayName = "Timer";

const FormedTriosPanel = memo(({ trios, scale = 1 }: { trios: TrioData[], scale?: number }) => {
  if (!trios || trios.length === 0) return null;

  const baseW = 36 * scale;
  const baseH = 54 * scale;

  return (
    <div className="flex flex-wrap gap-2">
      {trios.map((trio, idx) => (
        <motion.div key={idx} initial={{ scale: 0, x: -10 }} animate={{ scale: 1, x: 0 }} 
          style={{ width: baseW, height: baseH }}
          className="relative flex items-center justify-center"
        >
           {[0, 1, 2].map((offset) => (
             <div key={offset} className="absolute w-full h-full rounded-[2px] shadow-lg ring-1 ring-amber-400/20 overflow-hidden bg-slate-800" 
                  style={{ transform: `translate(${offset * 3 * scale}px, ${offset * -2 * scale}px) rotate(${offset * 2}deg)`, zIndex: offset }}>
                <Image src={`/cards/card_${trio.value}.webp`} alt={`Trio ${trio.value}`} fill sizes="60px" className="object-cover" />
             </div>
           ))}
        </motion.div>
      ))}
    </div>
  );
});
FormedTriosPanel.displayName = "FormedTriosPanel";

// ==========================================
// 2. HEADER
// ==========================================
const GameHeader = memo(() => {
  const round = useGameStore((s) => s.round);
  const logs = useGameStore((s) => s.actionLogWindow);
  const mySid = useGameStore((s) => s.mySessionId);
  const players = useGameStore((s) => s.players);
  const isMyTurn = useGameStore((s) => s.activePlayerSessionId) === mySid;

  const lastEvent = useMemo(() => {
    if (!logs.length) return "";
    const l = logs[logs.length - 1];
    if (l.startsWith("MATCH_TARGET:")) return "Buscando...";
    if (l.startsWith("MATCH:")) return "Combinado!";
    if (l.startsWith("MISMATCH:")) return "Vez encerrada";
    if (l.startsWith("TRIO_COMPLETE:")) return `Trio completo!`;
    if (l.startsWith("TURN_START:")) { const sid = l.split(":")[1]; return sid === mySid ? "SUA VEZ" : players[sid]?.displayName.toUpperCase(); }
    return "";
  }, [logs, mySid, players]);

  return (
    <div className="flex-none h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <Swords size={14} className="text-emerald-400" />
          <span className="text-[11px] font-black font-display text-emerald-400 uppercase tracking-widest">R{round}</span>
        </div>
        <Timer />
      </div>

      <AnimatePresence mode="wait">
        {lastEvent && (
          <motion.div key={lastEvent} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} 
            className="hidden md:flex px-6 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
            <span className={`text-[10px] font-black font-display tracking-[0.3em] uppercase ${isMyTurn ? "text-emerald-400" : "text-amber-400"}`}>
              {lastEvent}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => colyseusService.leaveRoom()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all text-white/70 group">
        <LogOut size={14} />
        <span className="text-[9px] font-black font-display uppercase tracking-widest hidden sm:inline">Abandonar</span>
      </button>
    </div>
  );
});
GameHeader.displayName = "GameHeader";

// ==========================================
// 3. CARD REQUEST CINEMATIC
// ==========================================
const CardRequestCinematic = memo(() => {
  const event = useGameStore((s) => s.cardRequestEvent);
  const clear = useGameStore((s) => s.clearCardRequest);
  const players = useGameStore((s) => s.players);
  const mySid = useGameStore((s) => s.mySessionId);

  useEffect(() => {
    if (event) {
      const timer = setTimeout(clear, 1200);
      return () => clearTimeout(timer);
    }
  }, [event, clear]);

  if (!event) return null;

  const actor = players[event.fromSid];
  const target = players[event.toSid];
  if (!actor || !target) return null;

  const isActorMe = event.fromSid === mySid;
  const isTargetMe = event.toSid === mySid;

  let message = "";
  if (isActorMe) message = `Você pediu a ${event.position === "lowest" ? "menor" : "maior"} de ${target.displayName}`;
  else if (isTargetMe) message = `${actor.displayName} pediu a sua ${event.position === "lowest" ? "menor" : "maior"} carta!`;
  else message = `${actor.displayName} pediu a ${event.position === "lowest" ? "menor" : "maior"} de ${target.displayName}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-md"
    >
      <div className="flex flex-col items-center">
         <motion.div initial={{ scale: 0.8, y: 100, rotateY: 90 }} animate={{ scale: 1, y: 0, rotateY: 0 }} transition={{ type: "spring", damping: 15 }}
           className="relative w-40 h-60 sm:w-48 sm:h-72 rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.5)] border-2 border-emerald-400/50 overflow-hidden bg-slate-900"
         >
            <CardImage value={event.cardValue} eager />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end justify-center pb-6">
               <span className="text-6xl sm:text-7xl font-black font-display text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">{event.cardValue}</span>
            </div>
         </motion.div>
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
           className="mt-8 px-10 py-5 bg-slate-900/95 border border-emerald-500/20 rounded-[2rem] shadow-2xl text-center max-w-sm"
         >
            <p className="text-sm sm:text-base font-black font-display text-white uppercase tracking-widest leading-relaxed">{message}</p>
            <div className="h-0.5 w-12 bg-emerald-500/40 mx-auto mt-3 rounded-full" />
         </motion.div>
      </div>
    </motion.div>
  );
});
CardRequestCinematic.displayName = "CardRequestCinematic";

// ==========================================
// 4. OPPONENTS (3D CARD STYLE)
// ==========================================
const OpponentSeat = memo(({ player, isActive, isMyTurn }: { player: PlayerData, isActive: boolean, isMyTurn: boolean }) => {
  const nudgeEvent = useGameStore((s) => s.nudgeEvent);
  const isProcessing = useGameStore((s) => s.isProcessing);
  const isNudged = nudgeEvent?.to === player.sessionId && (Date.now() - nudgeEvent.ts < 1000);

  return (
    <motion.div 
      animate={isNudged ? { x: [-3, 3, -3, 3, 0], transition: { duration: 0.3 } } : {}}
      whileHover={{ y: -5, rotateX: 2, rotateY: -2 }}
      className={`
        flex flex-col p-4 rounded-[2rem] border transition-all duration-500 min-w-[280px] relative overflow-hidden
        ${isActive ? 'bg-slate-900/90 border-emerald-500/50 shadow-[0_20px_50px_rgba(16,185,129,0.2)] scale-105 z-10' : 'bg-slate-950/60 border-white/10 hover:bg-slate-900/80 shadow-xl'}
      `}
    >
       {/* 3D Glass Highlight */}
       <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
       
       <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
             <PlayerAvatar sessionId={player.sessionId} isActive={isActive} showName={false} showBadge={false} size="lg" />
             <div className="flex flex-col min-w-0">
                <span className={`text-xs font-black font-display uppercase tracking-wider truncate max-w-[120px] ${isActive ? 'text-emerald-400' : 'text-white'}`}>
                   {player.displayName}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                   <Hand size={10} className="text-white/40" />
                   <span className="text-[9px] font-black font-display text-white/60 tracking-[0.1em] uppercase">{player.handCount} Cartas</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5 mb-2">
                <Target size={10} className="text-white/30" />
                <span className="text-[8px] font-black font-display text-white/40 uppercase tracking-[0.2em]">Trios</span>
             </div>
             <FormedTriosPanel trios={player.trios} scale={0.7} />
          </div>
       </div>

       {isMyTurn && player.handCount > 0 && (
         <div className="flex gap-2 w-full mt-4 pt-3 border-t border-white/5 relative z-10">
            <button 
               disabled={isProcessing}
               onClick={() => colyseusService.sendAskPlayerCard(player.sessionId, "lowest")} 
               className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all active:scale-95 group disabled:opacity-50"
            >
               <ArrowDownToLine size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
               <span className="text-[9px] font-black font-display text-emerald-400 uppercase tracking-widest">Menor</span>
            </button>
            <button 
               disabled={isProcessing}
               onClick={() => colyseusService.sendAskPlayerCard(player.sessionId, "highest")} 
               className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 rounded-xl transition-all active:scale-95 group disabled:opacity-50"
            >
               <ArrowUpToLine size={12} className="text-violet-400 group-hover:scale-110 transition-transform" />
               <span className="text-[9px] font-black font-display text-violet-400 uppercase tracking-widest">Maior</span>
            </button>
         </div>
       )}
    </motion.div>
  );
});
OpponentSeat.displayName = "OpponentSeat";

// ==========================================
// 5. TABLE
// ==========================================
const TableSurface = memo(({ cards }: { cards: CardData[] }) => {
  return (
    <div className="flex-1 w-full relative flex items-center justify-center p-4 overflow-hidden">
       <div className="w-full h-full max-w-5xl max-h-[580px] aspect-[16/10] relative rounded-[4rem] border-[14px] border-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden bg-emerald-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#059669_0%,_#022c22_100%)]" />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url('/table.png')", backgroundSize: "cover" }} />
          <div className="absolute inset-6 sm:inset-14 flex items-center justify-center">
             <div className="w-full h-full grid place-content-center place-items-center gap-2 sm:gap-4" 
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(clamp(40px, 8vw, 85px), 1fr))" }}>
                {cards.map((card, i) => (
                   <div key={card.id} className="w-full aspect-[2/3] max-w-[85px] flex items-center justify-center">
                     {card.location !== "scored" ? (
                        <Card cardData={card} index={i} location="table" />
                     ) : (
                        <div className="w-full h-full opacity-0 pointer-events-none" />
                     )}
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
});
TableSurface.displayName = "TableSurface";

// ==========================================
// 6. PLAYER AREA (3D DASHBOARD STYLE)
// ==========================================
const PlayerArea = memo(({ player, isMyTurn }: { player: PlayerData, isMyTurn: boolean }) => {
  const myHand = useGameStore((s) => s.myHand);

  return (
    <div className="flex-none bg-slate-950/95 border-t border-white/10 z-40 relative px-4 sm:px-8 py-4 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
       {/* 3D Active Turn Glow */}
       {isMyTurn && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} 
           className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_30px_rgba(16,185,129,0.8)]" />}

       <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-6 sm:gap-12 min-h-[120px]">
          {/* 3D PROFILE CARD */}
          <div className="hidden lg:flex flex-none items-center gap-5 w-72 bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/10 shadow-lg">
             <PlayerAvatar sessionId={player?.sessionId} isActive={isMyTurn} size="lg" showName={false} showBadge={false} />
             <div className="flex flex-col min-w-0">
                <span className="text-base font-black font-display text-white uppercase truncate tracking-tight">{player?.displayName}</span>
                <div className={`flex items-center gap-2 mt-1 px-3 py-1 rounded-full text-[10px] font-black font-display tracking-widest border transition-colors
                  ${isMyTurn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/40 border-white/5'}`}>
                   {isMyTurn ? "SEU TURNO" : "AGUARDANDO"}
                </div>
             </div>
          </div>

          <div className="flex-1 w-full h-[140px] flex items-center justify-center relative overflow-visible">
              <div className="flex items-end justify-center w-full max-w-5xl px-2">
                 {myHand.map((card, i) => {
                    const count = myHand.length;
                    const center = (count - 1) / 2;
                    const offset = i - center;
                    const maxOverlap = count > 12 ? -3.5 : count > 8 ? -3 : -2;
                    const overlapX = i === 0 ? 0 : `${maxOverlap}rem`;
                    const rotation = offset * (count > 10 ? 1.5 : 2.5);
                    const yOffset = Math.abs(offset) * (count > 10 ? 3 : 5);
                    
                    return (
                      <motion.div key={card.id} 
                        className="w-[80px] sm:w-[100px] aspect-[2/3] relative flex-shrink-0"
                        style={{ marginLeft: overlapX, zIndex: i }}
                        animate={{ rotate: rotation, y: yOffset }}
                        whileHover={{ y: -45, scale: 1.2, zIndex: 100, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                         <Card cardData={card} index={i} location="hand" />
                      </motion.div>
                    );
                 })}
                 {myHand.length === 0 && (
                    <span className="text-sm font-black font-display text-white/20 uppercase tracking-[0.6em] italic animate-pulse">Aguardando Distribuição</span>
                 )}
              </div>
          </div>

          {/* TRIOS DASHBOARD */}
          <div className="flex-none flex flex-col items-center sm:items-end w-full sm:w-80 lg:pl-8 border-l border-white/5">
             <div className="flex items-center gap-3 mb-4">
                <Trophy size={18} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
                <span className="text-xs font-black font-display text-white uppercase tracking-[0.2em]">Meus Trios</span>
             </div>
             <div className="flex justify-center sm:justify-end w-full overflow-visible">
                <FormedTriosPanel trios={player?.trios || []} scale={1.5} />
             </div>
          </div>
       </div>
    </div>
  );
});
PlayerArea.displayName = "PlayerArea";

// ==========================================
// MAIN BOARD
// ==========================================
const GameTable: React.FC = memo(() => {
  const players = useGameStore((s) => s.players);
  const tableCards = useGameStore((s) => s.tableCards);
  const activeSid = useGameStore((s) => s.activePlayerSessionId);
  const mySid = useGameStore((s) => s.mySessionId);
  
  const sortedPlayers = useMemo(() => {
    return Object.values(players).sort((a, b) => a.sessionId.localeCompare(b.sessionId));
  }, [players]);

  const opponents = useMemo(() => sortedPlayers.filter(p => p.sessionId !== mySid), [sortedPlayers, mySid]);
  const isMyTurn = activeSid === mySid;
  const trioCinematicEvent = useGameStore((s) => s.trioCinematicEvent);
  const clearTrioCinematic = useGameStore((s) => s.clearTrioCinematic);

  return (
    <div className="w-full h-[100dvh] flex flex-col overflow-hidden select-none bg-slate-950 font-sans">
      <EmoteRain />
      <GameChat />

      <AnimatePresence>
        {trioCinematicEvent && (
          <TrioCinematic 
            key={`${trioCinematicEvent.sid}-${trioCinematicEvent.value}-${trioCinematicEvent.ts}`}
            playerName={trioCinematicEvent.playerName} cardValue={trioCinematicEvent.value} onComplete={clearTrioCinematic} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
         <CardRequestCinematic />
      </AnimatePresence>

      <GameHeader />

      <div className="flex-none w-full overflow-hidden bg-gradient-to-b from-black/80 to-transparent z-40">
         <div className="flex items-start justify-center gap-6 px-4 pt-8 pb-4 overflow-x-auto custom-scroll-hidden">
            {opponents.map(p => (
               <OpponentSeat key={p.sessionId} player={p} isActive={p.sessionId === activeSid} isMyTurn={isMyTurn} />
            ))}
         </div>
      </div>

      <TableSurface cards={tableCards} />

      {players[mySid] && (
         <PlayerArea player={players[mySid]} isMyTurn={isMyTurn} />
      )}

      <AnimatePresence>
        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.08, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 pointer-events-none ring-inset ring-[10px] ring-emerald-500/20 z-50 mix-blend-overlay"
          />
        )}
      </AnimatePresence>
    </div>
  );
});

GameTable.displayName = "GameTable";
export default GameTable;
