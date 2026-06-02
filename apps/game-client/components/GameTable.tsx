"use client";

import React, { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, PlayerData } from "../store/useGameStore";
import { colyseusService } from "../networking/ColyseusService";
import { usePreloader } from "./AssetPreloader";
import Card from "./Card";
import CardImage from "./CardImage";
import TrioCinematic from "./game/TrioCinematic";
import EmoteRain from "./game/EmoteRain";

/* ━━━ Timer ━━━ */
const Timer = memo(() => {
  const cur = useGameStore((s) => s.currentTick);
  const exp = useGameStore((s) => s.expirationTick);
  if (exp <= 0) return null;
  const rem = Math.max(0, exp - cur);
  const pct = Math.min(100, (rem / 2400) * 100);
  const total = Math.ceil(rem / 20);
  const col = pct < 20 ? "bg-red-500" : pct < 50 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-[5px] bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${col}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono font-bold tabular-nums ${pct < 20 ? "text-red-400" : "text-white/40"}`}>
        {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}
      </span>
    </div>
  );
});
Timer.displayName = "Timer";

/* ━━━ Opponent with ask buttons directly on icon ━━━ */
function OpponentSeat({ player, isActive, isMyTurn }: {
  player: PlayerData; isActive: boolean; isMyTurn: boolean;
}) {
  const ch = player.displayName?.charAt(0)?.toUpperCase() || "?";
  const revealed = player.hand?.filter(c => c.isRevealed) || [];
  
  const emoteEvent = useGameStore((s) => s.emoteEvent);
  const nudgeEvent = useGameStore((s) => s.nudgeEvent);
  const isEmoting = emoteEvent?.sessionId === player.sessionId && (Date.now() - emoteEvent.ts < 3000);
  const isNudged = nudgeEvent?.to === player.sessionId && (Date.now() - nudgeEvent.ts < 1000);

  return (
    <div className="flex items-start gap-2">
      {/* ══ LEFT: Trios ══ */}
      {player.trios?.length > 0 ? (
        <div className="flex flex-col gap-1 w-8 items-end justify-start mt-2">
          {player.trios.map((t, i) => (
            <motion.div key={i} initial={{ scale: 0, x: 20 }} animate={{ scale: 1, x: 0 }}
              className="relative w-8 h-[48px] rounded-md overflow-hidden ring-2 ring-amber-500/60 shadow-[0_5px_15px_rgba(251,191,36,0.3)]">
              <CardImage value={t.value} className="rounded-md" eager />
              <div className="absolute top-0 right-0 bg-amber-400 text-black text-[6px] font-black px-1 rounded-bl shadow-md">T</div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="w-8" />
      )}

      {/* ══ CENTER: Avatar & Info ══ */}
      <div className="relative flex flex-col items-center gap-1 group z-20">
        {/* Emote Display */}
        <AnimatePresence>
          {isEmoting && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.5 }}
              animate={{ opacity: 1, y: -25, scale: 1.5 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-10 text-3xl z-50 pointer-events-none drop-shadow-2xl"
            >
              {emoteEvent.emote}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar */}
        <motion.div 
          animate={isNudged ? { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } } : {}}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-[3px]
          ${isActive ? "border-amber-400 bg-gradient-to-br from-amber-800/60 to-amber-950/60 shadow-[0_0_25px_rgba(251,191,36,0.5)]"
            : "border-white/20 bg-white/5"}
          ${!player.isOnline ? "opacity-30 grayscale" : ""}
        `}>
          <span className={`font-black text-lg sm:text-xl ${isActive ? "text-amber-300 drop-shadow-lg" : "text-white/60"}`}>{ch}</span>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1a0e08] shadow-md ${player.isOnline ? "bg-emerald-400" : "bg-red-400"}`} />
          {isActive && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-1.5 rounded-full border-[3px] border-transparent border-t-amber-400/80 pointer-events-none drop-shadow-lg" />
          )}
        </motion.div>

        {/* Name */}
        <span className={`text-[10px] sm:text-xs font-black max-w-[80px] truncate uppercase tracking-widest mt-1 ${isActive ? "text-amber-300 drop-shadow-md" : "text-white/50"}`}>
          {player.displayName}
        </span>
        <span className="text-[8px] font-mono text-white/30 tracking-widest">{player.handCount} CARTAS</span>

        {/* ══ ASK BUTTONS ══ */}
        {isMyTurn && player.handCount > 0 && (
          <div className="flex gap-1.5 mt-1">
            <button
              onClick={() => colyseusService.sendAskPlayerCard(player.sessionId, "lowest")}
              className="px-2.5 py-1.5 rounded-md bg-sky-600/90 hover:bg-sky-500 text-[9px] font-black text-white uppercase tracking-widest
                shadow-[0_4px_10px_rgba(2,132,199,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              ▼ MENOR
            </button>
            <button
              onClick={() => colyseusService.sendAskPlayerCard(player.sessionId, "highest")}
              className="px-2.5 py-1.5 rounded-md bg-fuchsia-600/90 hover:bg-fuchsia-500 text-[9px] font-black text-white uppercase tracking-widest
                shadow-[0_4px_10px_rgba(192,38,211,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              ▲ MAIOR
            </button>
          </div>
        )}

        {/* Revealed cards */}
        <AnimatePresence>
          {revealed.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="flex gap-1.5 mt-1 overflow-hidden">
              {revealed.map((card) => (
                <motion.div key={card.id} initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }}
                  exit={{ scale: 0, rotateY: -180 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative w-10 h-[60px] rounded-md overflow-hidden shadow-[0_5px_15px_rgba(0,0,0,0.5)] ring-2 ring-amber-400/70">
                  <CardImage value={card.value} alt={`${card.value}`} className="rounded-md" eager />
                  <motion.div initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 1.5 }}
                    className="absolute inset-0 bg-amber-300/30 pointer-events-none" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ RIGHT: Social Menu (Permanently Visible, Horizontal) ══ */}
      <div className="flex gap-1 items-start mt-2 pointer-events-auto z-30">
        <button onClick={() => colyseusService.sendEmote("❤️")} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] sm:text-xs shadow-[0_3px_10px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all">❤️</button>
        <button onClick={() => colyseusService.sendEmote("😂")} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] sm:text-xs shadow-[0_3px_10px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all">😂</button>
        <button onClick={() => colyseusService.sendNudge(player.sessionId)} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-500/80 hover:bg-indigo-400 flex items-center justify-center text-[10px] sm:text-xs text-white font-bold shadow-[0_3px_10px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95 transition-all">👉</button>
      </div>
    </div>
  );
}

/* ━━━ MAIN ━━━ */
const GameTable: React.FC = memo(() => {
  const { isReady, progress } = usePreloader();
  const players = useGameStore((s) => s.players);
  const tableCards = useGameStore((s) => s.tableCards);
  const myHand = useGameStore((s) => s.myHand);
  const activeSid = useGameStore((s) => s.activePlayerSessionId);
  const mySid = useGameStore((s) => s.mySessionId);
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.round);
  const logs = useGameStore((s) => s.actionLogWindow);
  const hostSid = useGameStore((s) => s.hostSessionId);

  const playerList = useMemo(() => Object.values(players), [players]);
  const isObserver = useMemo(() => !players[mySid], [players, mySid]);
  const opponents = useMemo(() => isObserver ? playerList : playerList.filter(p => p.sessionId !== mySid), [playerList, mySid, isObserver]);
  const isMyTurn = activeSid === mySid && !isObserver;
  const activeName = activeSid ? players[activeSid]?.displayName : "";
  const myPlayer = players[mySid];
  const isHost = mySid === hostSid;

  const visibleCards = useMemo(() => tableCards.filter(c => c.location !== "scored"), [tableCards]);

  const gridCols = useMemo(() => {
    const n = visibleCards.length;
    // On mobile, we prefer a more compact grid to keep cards large enough for touch
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile) {
      if (n <= 4) return 2;
      if (n <= 9) return 3;
      return 4; // 4 cols max on mobile for readability
    }
    if (n <= 8) return 4;
    return 6;
  }, [visibleCards.length]);

  const tableDimensions = useMemo(() => {
    const n = visibleCards.length;
    const cols = gridCols;
    const rows = Math.ceil(n / cols) || 1;
    
    // Improved dimension calculation based on responsive sizes
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const cardW = isMobile ? 56 : 72; 
    const cardH = isMobile ? 84 : 108;
    const gap = isMobile ? 8 : 12;
    const padding = isMobile ? 12 : 16;

    const width = (cols * cardW) + ((cols - 1) * gap) + (padding * 2);
    const height = (rows * cardH) + ((rows - 1) * gap) + (padding * 2);

    return {
      width: `clamp(${width}px, 98vw, 1100px)`,
      minHeight: isMobile ? `${height}px` : `${Math.max(height, 400)}px`
    };
  }, [visibleCards.length, gridCols]);

  const trioCinematicEvent = useGameStore((s) => s.trioCinematicEvent);
  const clearTrioCinematic = useGameStore((s) => s.clearTrioCinematic);

  const lastEvent = useMemo(() => {
    if (!logs.length) return "";
    const l = logs[logs.length - 1];
    if (l.startsWith("MATCH_TARGET:")) return `Procurando: carta ${l.split(":")[1]}`;
    if (l.startsWith("MATCH:")) return "Carta igual encontrada!";
    if (l.startsWith("MISMATCH:")) return "Não combinou — vez encerrada";
    if (l.startsWith("TRIO_COMPLETE:")) return `TRIO DE ${l.split(":")[2]}s COMPLETO!`;
    if (l.startsWith("TURN_START:")) { const sid = l.split(":")[1]; return sid === mySid ? "Sua vez!" : `Vez de ${players[sid]?.displayName}`; }
    if (l.startsWith("HAND_REVEAL:")) { const p = l.split(":"); return `Carta ${p[3] === "lowest" ? "menor" : "maior"} revelada: ${p[4]}`; }
    if (l.startsWith("OWN_REVEAL:") || l.startsWith("AUTO_REVEAL:")) { const p = l.split(":"); return `Sua ${p[2] === "lowest" ? "menor" : "maior"} revelada: ${p[3]}`; }
    if (l.startsWith("GAME_OVER:")) return "Partida encerrada!";
    return "";
  }, [logs, mySid, players]);

  return (
    <div className="w-full min-h-[100dvh] h-[100dvh] flex flex-col overflow-hidden select-none relative bg-[#020617]">
      
      {/* ══ NEW RICH BACKGROUND ══ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Radial Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1)_0%,_transparent_70%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle_at_50%_50%,_rgba(251,191,36,0.05)_0%,_transparent_70%)]" />
        
        {/* Dynamic Light Rays */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] opacity-[0.03] mix-blend-screen"
          style={{ background: "conic-gradient(from 0deg, transparent 0deg, #10b981 10deg, transparent 20deg, transparent 40deg, #f59e0b 50deg, transparent 60deg, transparent 80deg, #10b981 90deg, transparent 100deg)" }}
        />

        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`bg-part-${i}`}
            className="absolute rounded-full bg-emerald-500/20 blur-[2px]"
            style={{ width: Math.random() * 6 + 2, height: Math.random() * 6 + 2 }}
            animate={{
              y: ["100vh", "-10vh"],
              x: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}

        <TableCardShadows />
      </div>

      <EmoteRain />

      <AnimatePresence>
        {trioCinematicEvent && (
          <TrioCinematic 
            key={`${trioCinematicEvent.sid}-${trioCinematicEvent.value}-${trioCinematicEvent.ts}`}
            playerName={trioCinematicEvent.playerName} 
            cardValue={trioCinematicEvent.value} 
            onComplete={clearTrioCinematic} 
          />
        )}
      </AnimatePresence>


      <AnimatePresence>
        {!isReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full mb-6"
            />
            <h2 className="text-sm font-black tracking-[0.5em] text-emerald-500 uppercase mb-2">
              SINCRONIZANDO ATIVOS
            </h2>
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-4 text-[10px] text-white/20 font-mono tracking-widest uppercase">
              Otimizando Experiência...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HUD ═══ */}
      <div className="flex-none h-10 flex items-center justify-between px-3 border-b border-white/5 bg-black/30 z-50">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
            <span className="text-[9px] font-bold tracking-widest text-amber-400/80 uppercase">Rodada {round}</span>
          </div>
          <Timer />
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {lastEvent && (
              <motion.div key={lastEvent} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="px-2.5 py-0.5 rounded-lg bg-black/50 border border-white/10 max-w-[120px] sm:max-w-[250px]">
                <span className="text-[9px] font-bold text-amber-200/90 block truncate">{lastEvent}</span>
              </motion.div>
            )}
          </AnimatePresence>
          {isObserver ? (
             <button onClick={() => colyseusService.leaveRoom()}
             className="px-2 py-1 ml-1 sm:ml-2 rounded bg-amber-900/30 border border-amber-500/20 text-[8px] font-bold text-amber-400/70 hover:bg-amber-900/50 hover:text-amber-300 transition-all">
             Sair
           </button>
          ) : isHost ? (
            <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
              <button onClick={() => colyseusService.leaveRoom()}
                className="px-2 py-1 rounded border border-white/20 text-[8px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all hidden sm:block">
                Sair
              </button>
              <button onClick={() => colyseusService.sendCloseRoom()}
                className="px-2 py-1 rounded bg-red-900/30 border border-red-500/20 text-[8px] font-bold text-red-400/70 hover:bg-red-900/50 hover:text-red-300 transition-all">
                Encerrar
              </button>
            </div>
          ) : (
            <button onClick={() => colyseusService.leaveRoom()}
              className="px-2 py-1 ml-1 sm:ml-2 rounded bg-red-900/30 border border-red-500/20 text-[8px] font-bold text-red-400/70 hover:bg-red-900/50 hover:text-red-300 transition-all">
              Sair
            </button>
          )}
        </div>
      </div>

      {/* ═══ OPPONENTS ═══ */}
      <div className="flex-none flex flex-wrap items-start justify-center gap-1 sm:gap-4 md:gap-6 px-1 sm:px-4 py-2 z-30 max-h-[30vh] overflow-y-auto custom-scroll">
        {opponents.map((p) => (
          <div key={p.sessionId} className="transform scale-75 sm:scale-100 origin-top">
            <OpponentSeat player={p} isActive={p.sessionId === activeSid} isMyTurn={isMyTurn} />
          </div>
        ))}
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="flex-1 min-h-0 flex items-center justify-center z-10 p-1 sm:p-4 overflow-auto custom-scroll">
        <div className="relative rounded-2xl transition-all duration-500"
          style={{
            ...tableDimensions,
            background: "radial-gradient(ellipse at 50% 50%, #0f6b55 0%, #0b4f3e 30%, #083d2f 55%, #052a20 80%, #031a14 100%)",
            boxShadow: "inset 0 0 50px rgba(0,0,0,0.4), inset 0 0 15px rgba(0,0,0,0.3), 0 6px 30px rgba(0,0,0,0.5)",
            border: "clamp(2px, 0.5vw, 5px) solid #1a0e08",
            outline: "clamp(1px, 0.2vw, 2px) solid #2a1a0f",
          }}>
          <div className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none overflow-hidden"
            style={{ backgroundImage: "radial-gradient(circle, #fff 0.4px, transparent 0.4px)", backgroundSize: "6px 6px" }} />
          <div className="absolute inset-[10px] rounded-xl border border-amber-600/10 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.025]">
            <span className="text-3xl sm:text-4xl font-black tracking-[0.3em] text-white italic">TRIO</span>
          </div>

          {/* Cards */}
          <div className="flex items-center justify-center w-full h-full p-2 sm:p-4">
            <div className="grid place-items-center justify-center content-center w-full"
              style={{ 
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, 
                gap: typeof window !== 'undefined' && window.innerWidth < 640 ? "8px" : "12px",
                maxWidth: "100%"
              }}>
              {visibleCards.map((card, i) => {
                const origIdx = tableCards.findIndex(c => c.id === card.id);
                return (
                  <motion.div key={card.id} initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.015, type: "spring", stiffness: 200, damping: 18 }}
                    className="w-full flex justify-center items-center"
                  >
                    <div className="transform scale-[0.7] sm:scale-100">
                      <Card cardData={card} index={origIdx} location="table" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div className="flex-none h-6 sm:h-8 flex items-center justify-center z-40 px-4 text-center">
        {isMyTurn && phase === "playing" ? (
          <span className="text-[8px] sm:text-[10px] font-bold text-emerald-400/80">Sua vez — peça cartas ou clique na mesa</span>
        ) : phase === "playing" ? (
          <span className="text-[8px] sm:text-[10px] font-bold text-white/20 tracking-wider uppercase">Aguardando {activeName}...</span>
        ) : null}
      </div>

      {/* ═══ MY HAND ═══ */}
      <div className="flex-none z-40 border-t border-white/5 bg-gradient-to-t from-black/80 to-[#1a0e08]/90">
        <div className="px-4 pt-1 sm:pt-1.5 pb-3 sm:pb-4">
          <div className="flex items-center justify-center gap-3 mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-px w-3 sm:w-4 bg-white/10" />
              <span className="text-[7px] sm:text-[8px] font-bold tracking-[0.15em] text-white/20 uppercase">
                {isObserver ? "Modo Espectador" : "Sua Mão"}
              </span>
              <div className="h-px w-3 sm:w-4 bg-white/10" />
            </div>
            {!isObserver && myPlayer?.trios?.length > 0 && (
              <div className="flex items-center gap-1.5 ml-1">
                {myPlayer.trios.map((t, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/25">
                    <div className="w-4 h-[24px] sm:w-5 sm:h-[30px] rounded-sm overflow-hidden">
                      <CardImage value={t.value} className="rounded-sm" eager />
                    </div>
                    <span className="text-[7px] sm:text-[8px] font-black text-amber-400">×3</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          {isObserver ? (
            <div className="text-center py-2 sm:py-4">
              <span className="text-[9px] sm:text-[10px] font-black text-amber-400/40 uppercase tracking-[0.2em] animate-pulse">
                Observando...
              </span>
            </div>
          ) : myHand.length > 0 ? (
            <div className="flex items-end justify-center">
              {myHand.map((card, i) => {
                const rot = getHandRot(i, myHand.length);
                return (
                  <motion.div key={card.id}
                    animate={{ y: Math.abs(rot) * 0.3, rotate: rot }}
                    whileHover={{ y: -18, scale: 1.15, zIndex: 60, rotate: 0 }}
                    whileTap={{ y: -24, scale: 1.2, zIndex: 60, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    style={{ marginLeft: i > 0 ? "-12px" : "0", zIndex: i }}
                    className="flex-shrink-0 cursor-pointer">
                    <div className="w-[44px] h-[66px] sm:w-[60px] sm:h-[90px] md:w-[68px] md:h-[102px] rounded-md sm:rounded-lg overflow-hidden shadow-xl shadow-black/60 border border-white/10 hover:border-white/30 transition-colors relative">
                      <CardImage value={card.value} alt={`${card.value}`} className="rounded-md sm:rounded-lg" eager />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2 sm:py-3"><span className="text-[9px] text-white/15">Mão vazia</span></div>
          )}
        </div>
      </div>

      {/* Turn glow */}
      {isMyTurn && (
        <motion.div animate={{ opacity: [0.15, 0.5, 0.15] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-50" />
      )}

      {/* ═══ GAME OVER ═══ */}
      <AnimatePresence>
        {phase === "finished" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <motion.div initial={{ scale: 0.6, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 150 }}
              className="text-center p-8 rounded-2xl border border-amber-500/30 shadow-2xl max-w-sm mx-4"
              style={{ background: "linear-gradient(135deg, #2d1a0a 0%, #1a1025 100%)" }}>
              <motion.div animate={{ rotate: [0, -5, 5, -5, 0] }} transition={{ duration: 0.5, delay: 0.3 }} className="text-4xl mb-2">🏆</motion.div>
              <h2 className="text-2xl font-black text-amber-400 mb-1">{activeSid === mySid ? "VOCÊ VENCEU!" : `${activeName} VENCEU!`}</h2>
              <p className="text-xs text-white/30 mb-5">Partida encerrada</p>
              <button onClick={() => colyseusService.leaveRoom()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-bold text-sm hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg">
                Voltar ao Lobby
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
GameTable.displayName = "GameTable";
export default GameTable;

function getHandRot(i: number, total: number): number {
  if (total <= 1) return 0;
  return (i - (total - 1) / 2) * 1.5;
}

// 3D Table Background Card Shadows
function TableCardShadows() {
  // Use a fixed set of card values for the background
  const cards = [2, 4, 7, 9, 11, 3, 6, 10];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none perspective-[1200px]">
      {cards.map((val, i) => (
        <motion.div
          key={`shadow-${i}`}
          initial={{ 
            opacity: 0, 
            y: "110vh", 
            x: `${(i * 13) % 100}vw`,
            rotateX: 45,
            rotateY: i % 2 === 0 ? -15 : 15,
            rotateZ: i * 20,
            scale: 0.8 + (i % 3) * 0.2
          }}
          animate={{
            y: "-20vh",
            x: [`${(i * 13) % 100}vw`, `${((i * 13) + 10) % 100}vw`, `${(i * 13) % 100}vw`],
            rotateX: [45, 55, 45],
            rotateY: [i % 2 === 0 ? -15 : 15, 0, i % 2 === 0 ? -15 : 15],
            rotateZ: [i * 20, i * 20 + 40, i * 20 + 80],
            opacity: [0, 0.08, 0]
          }}
          transition={{
            duration: 20 + i * 4,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear"
          }}
          className="absolute w-28 h-40 rounded-xl"
          style={{ transformStyle: "preserve-3d" }}
        >
          <CardImage
            value={val}
            className="rounded-xl grayscale opacity-40 mix-blend-overlay"
            eager={false}
          />
        </motion.div>
      ))}
    </div>
  );
}
