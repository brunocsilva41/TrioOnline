"use client";

import React, { memo, useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useGameStore, PlayerData, CardData, TrioData } from "../store/useGameStore";
import { colyseusService } from "../networking/ColyseusService";
import PlayerAvatar from "./PlayerAvatar";
import Card from "./Card";
import TrioCinematic from "./game/TrioCinematic";
import EmoteRain from "./game/EmoteRain";
import GameChat from "./game/GameChat";
import { LogOut, ArrowDownToLine, ArrowUpToLine, Trophy, Clock, Swords, Hand, Target, Layers } from "lucide-react";
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
  const col = pct < 20 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : pct < 50 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner text-white">
      <Clock size={14} className={pct < 20 ? "text-red-400" : "text-emerald-400"} />
      <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${col}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono font-black tabular-nums ${pct < 20 ? "text-red-400" : "text-white"}`}>
        {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}
      </span>
    </div>
  );
});
Timer.displayName = "Timer";

const FormedTriosPanel = memo(({ trios, scale = 1 }: { trios: TrioData[], scale?: number }) => {
  if (!trios || trios.length === 0) return null;

  const baseW = 24 * scale;
  const baseH = 36 * scale;

  return (
    <div className="flex flex-wrap gap-1">
      {trios.map((trio, idx) => (
        <motion.div key={idx} initial={{ scale: 0, x: -10 }} animate={{ scale: 1, x: 0 }} 
          style={{ width: baseW, height: baseH }}
          className="relative flex items-center justify-center"
        >
           {[0, 1, 2].map((offset) => (
             <div key={offset} className="absolute w-full h-full rounded-sm shadow-md ring-1 ring-amber-400/10 overflow-hidden bg-slate-800" 
                  style={{ transform: `translate(${offset * 1.5 * scale}px, ${offset * -1 * scale}px) rotate(${offset * 1.5}deg)`, zIndex: offset }}>
                <Image src={`/cards/card_${trio.value}.webp`} alt={`Trio ${trio.value}`} fill sizes="40px" className="object-cover" />
             </div>
           ))}
        </motion.div>
      ))}
    </div>
  );
});
FormedTriosPanel.displayName = "FormedTriosPanel";

/**
 * Mostra as cartas reveladas no turno atual
 */
const TurnReveals = memo(({ cards }: { cards: CardData[] }) => {
  if (cards.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {cards.map((card, i) => (
        <motion.div
          key={`${card.id}-${i}`}
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-10 sm:w-12 aspect-[2/3] relative rounded-md overflow-hidden ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-slate-800"
        >
          <CardImage value={card.value} eager />
          <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
        </motion.div>
      ))}
    </div>
  );
});
TurnReveals.displayName = "TurnReveals";

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
    if (l.startsWith("MATCH_TARGET:")) return "BUSCANDO...";
    if (l.startsWith("MATCH:")) return "COMBINADO!";
    if (l.startsWith("MISMATCH:")) return "ERROU!";
    if (l.startsWith("TRIO_COMPLETE:")) return `TRIO COMPLETO!`;
    if (l.startsWith("TURN_START:")) { const sid = l.split(":")[1]; return sid === mySid ? "SUA VEZ" : players[sid]?.displayName.toUpperCase(); }
    return "";
  }, [logs, mySid, players]);

  return (
    <div className="flex-none h-12 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl z-50">
      <div className="flex items-center gap-4 text-white">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Swords size={16} className="text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">R{round}</span>
        </div>
        <Timer />
      </div>

      <AnimatePresence mode="wait">
        {lastEvent && (
          <motion.div key={lastEvent} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} 
            className="hidden md:flex px-6 py-1.5 rounded-full bg-white/[0.03] border border-white/10 shadow-lg">
            <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isMyTurn ? "text-emerald-400" : "text-amber-400"}`}>
              {lastEvent}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => colyseusService.leaveRoom()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all text-white/80 font-black text-[10px] uppercase tracking-widest group active:scale-95 shadow-lg">
        <LogOut size={16} />
        <span className="hidden sm:inline">Sair</span>
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
// 4. OPPONENTS (Adaptive Sizing)
// ==========================================
const OpponentSeat = memo(({ player, isActive, isMyTurn }: { player: PlayerData, isActive: boolean, isMyTurn: boolean }) => {
  const nudgeEvent = useGameStore((s) => s.nudgeEvent);
  const isProcessing = useGameStore((s) => s.isProcessing);
  const isNudged = nudgeEvent?.to === player.sessionId && (Date.now() - nudgeEvent.ts < 1000);

  return (
    <motion.div 
      animate={isNudged ? { x: [-2, 2, -2, 2, 0], transition: { duration: 0.3 } } : {}}
      className={`
        flex flex-col p-3 rounded-[2rem] border transition-all duration-500 min-w-[220px] relative overflow-hidden
        ${isActive ? 'bg-slate-900/98 border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)] scale-105 z-10' : 'bg-slate-950/60 border-white/5 hover:bg-slate-900/80 shadow-lg'}
      `}
    >
       <div className="flex items-center justify-between relative z-10 gap-2">
          <div className="flex items-center gap-3">
             <PlayerAvatar sessionId={player.sessionId} isActive={isActive} showName={false} showBadge={false} size="sm" />
             <div className="flex flex-col min-w-0">
                <span className={`text-[12px] font-black uppercase tracking-tight truncate max-w-[90px] ${isActive ? 'text-emerald-400' : 'text-white'}`}>
                   {player.displayName}
                </span>
                <div className="flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-white/5 w-fit">
                   <Hand size={8} className="text-white/30" />
                   <span className="text-[7px] sm:text-[8px] font-black text-white/50 tracking-tighter uppercase">{player.handCount} C</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col items-end">
             <FormedTriosPanel trios={player.trios} scale={0.6} />
          </div>
       </div>

       {isMyTurn && player.handCount > 0 && (
         <div className="flex gap-1.5 w-full mt-2.5 pt-2 border-t border-white/5 relative z-10">
            <button 
               disabled={isProcessing}
               onClick={() => colyseusService.sendAskPlayerCard(player.sessionId, "lowest")} 
               className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-emerald-500 border border-white/10 rounded-xl transition-all text-white hover:text-black shadow-sm"
            >
               <ArrowDownToLine size={12} />
               <span className="text-[11px] font-black uppercase">Menor</span>
            </button>
            <button 
               disabled={isProcessing}
               onClick={() => colyseusService.sendAskPlayerCard(player.sessionId, "highest")} 
               className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-amber-500 border border-white/10 rounded-xl transition-all text-white hover:text-black shadow-sm"
            >
               <ArrowUpToLine size={12} />
               <span className="text-[11px] font-black uppercase">Maior</span>
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
       <div className="w-full h-full max-w-5xl max-h-[460px] aspect-[16/9] relative rounded-[3rem] border-[10px] border-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden bg-emerald-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#059669_0%,_#022c22_100%)]" />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url('/table.png')", backgroundSize: "cover" }} />
          <div className="absolute inset-4 sm:inset-10 flex items-center justify-center">
             <div className="w-full h-full grid place-content-center place-items-center gap-2 sm:gap-4" 
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(clamp(30px, 6vw, 70px), 1fr))" }}>
                {cards.map((card, i) => (
                   <div key={card.id} className="w-full aspect-[2/3] max-w-[70px] flex items-center justify-center">
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
// 6. PLAYER AREA (Hyper-Compressed for Space)
// ==========================================
const PlayerArea = memo(({ player, isMyTurn }: { player: PlayerData, isMyTurn: boolean }) => {
  const myHand = useGameStore((s) => s.myHand);
  const tableCards = useGameStore((s) => s.tableCards);
  const players = useGameStore((s) => s.players);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Cartas reveladas na rodada (para mostrar ao lado da mão)
  const turnReveals = useMemo(() => {
    if (!isMyTurn) return [];
    const tRev = tableCards.filter(c => c.isRevealed && c.location === "table");
    const pRev = Object.values(players).flatMap(p => (p.hand || []).filter(c => c.isRevealed));
    return [...tRev, ...pRev];
  }, [isMyTurn, tableCards, players]);

  return (
    <div className="flex-none bg-slate-950/98 border-t border-white/10 z-40 relative px-4 sm:px-12 py-1.5 shadow-[0_-15px_40px_rgba(0,0,0,0.9)]">
       {isMyTurn && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 2, repeat: Infinity }} 
           className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />}

       <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-12 min-h-[70px]">
          {/* PROFILE CARD */}
          <div className="hidden lg:flex flex-none items-center gap-3 w-64 bg-white/[0.02] p-2.5 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden text-white">
             <PlayerAvatar sessionId={player?.sessionId} isActive={isMyTurn} size="sm" showName={false} showBadge={false} />
             <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-black font-display uppercase truncate tracking-tight">{player?.displayName}</span>
                <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest border transition-all w-fit
                  ${isMyTurn ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-white/5 text-white/30 border-white/5'}`}>
                   {isMyTurn ? "SUA VEZ" : "AGUARDANDO"}
                </div>
             </div>
          </div>

          {/* CENTER: Hand + Turn Reveals */}
          <div className="flex-1 w-full h-[80px] sm:h-[90px] flex items-center justify-center relative overflow-visible">
              <div className="flex items-end justify-center w-full max-w-5xl px-2 relative">
                 {/* MÃO DO JOGADOR */}
                 <div className="flex items-end justify-center">
                    {myHand.map((card, i) => {
                        const count = myHand.length;
                        const center = (count - 1) / 2;
                        const offset = i - center;
                        
                        const mobileOverlap = count > 12 ? -1.8 : count > 8 ? -1.5 : -1.2;
                        const desktopOverlap = count > 12 ? -3 : count > 8 ? -2.6 : -1.8;
                        
                        const currentOverlap = isMobile ? mobileOverlap : desktopOverlap;
                        const rotation = offset * (count > 10 ? 1 : 1.5);
                        const yOffset = Math.abs(offset) * (count > 10 ? 1.5 : 2.5);
                        
                        return (
                        <motion.div key={card.id} 
                            className="w-[50px] sm:w-[75px] aspect-[2/3] relative flex-shrink-0"
                            style={{ 
                              marginLeft: i === 0 ? 0 : `${currentOverlap}rem`,
                              zIndex: i 
                            }}
                            animate={{ rotate: rotation, y: yOffset }}
                            whileHover={{ y: -25, scale: 1.2, zIndex: 100, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        >
                            <Card cardData={card} index={i} location="hand" />
                        </motion.div>
                        );
                    })}
                 </div>

                 {/* CARTAS REVELADAS NO TURNO (À direita ou acima da mão) */}
                 <AnimatePresence>
                    {isMyTurn && turnReveals.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute sm:left-[calc(50%+180px)] bottom-[100px] sm:bottom-2 flex items-center gap-2 sm:gap-3 bg-emerald-500/10 border border-emerald-500/20 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl backdrop-blur-sm shadow-2xl z-50 text-white"
                        >
                            <div className="flex flex-col items-center gap-0.5 sm:gap-1 mr-1">
                                <Layers size={10} className="text-emerald-400" />
                                <span className="text-[6px] sm:text-[7px] font-black text-emerald-400 uppercase tracking-tighter">Turno</span>
                            </div>
                            <TurnReveals cards={turnReveals} />
                        </motion.div>
                    )}
                 </AnimatePresence>

                 {myHand.length === 0 && (
                    <span className="text-[11px] font-black text-white/10 uppercase tracking-[0.4em] italic">Aguardando Distribuição</span>
                 )}
              </div>
          </div>

          {/* TRIOS DASHBOARD */}
          <div className="flex-none flex flex-col items-center sm:items-end w-full sm:w-64 lg:pl-6 border-l border-white/5 text-white">
             <div className="flex items-center gap-2 mb-1.5 opacity-60">
                <Trophy size={14} className="text-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Meus Trios</span>
             </div>
             <div className="flex justify-center sm:justify-end w-full overflow-visible">
                <FormedTriosPanel trios={player?.trios || []} scale={1.2} />
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

      <div className="flex-none w-full overflow-hidden bg-gradient-to-b from-black/60 to-transparent z-40">
         <div className="flex items-start justify-center gap-6 px-4 pt-4 pb-3 overflow-x-auto custom-scroll-hidden">
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
            animate={{ opacity: [0, 0.05, 0] }}
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
