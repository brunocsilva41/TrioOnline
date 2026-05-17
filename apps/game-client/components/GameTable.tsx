"use client";

import React, { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useGameStore, PlayerData } from "../store/useGameStore";
import { colyseusService } from "../networking/ColyseusService";
import Card from "./Card";

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

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Avatar */}
      <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-[3px]
        ${isActive ? "border-amber-400 bg-gradient-to-br from-amber-800/60 to-amber-950/60 shadow-[0_0_18px_rgba(251,191,36,0.4)]"
          : "border-white/15 bg-white/5"}
        ${!player.isOnline ? "opacity-30 grayscale" : ""}
      `}>
        <span className={`font-black text-base sm:text-lg ${isActive ? "text-amber-300" : "text-white/50"}`}>{ch}</span>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a0e08] ${player.isOnline ? "bg-emerald-400" : "bg-red-400"}`} />
        {isActive && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1 rounded-full border-2 border-transparent border-t-amber-400/60 pointer-events-none" />
        )}
      </div>

      {/* Name */}
      <span className={`text-[10px] font-bold max-w-[72px] truncate ${isActive ? "text-amber-300" : "text-white/40"}`}>
        {player.displayName}
      </span>
      <span className="text-[8px] text-white/20">{player.handCount} cartas</span>

      {/* ══ ASK BUTTONS — directly on each opponent ══ */}
      {isMyTurn && player.handCount > 0 && (
        <div className="flex gap-1 mt-0.5">
          <button
            onClick={() => colyseusService.sendAskPlayerCard(player.sessionId, "lowest")}
            className="px-2 py-1 rounded-md bg-sky-700/80 hover:bg-sky-600 text-[8px] font-bold text-white
              shadow shadow-sky-900/40 hover:scale-105 active:scale-95 transition-all"
          >
            ▼ Menor
          </button>
          <button
            onClick={() => colyseusService.sendAskPlayerCard(player.sessionId, "highest")}
            className="px-2 py-1 rounded-md bg-fuchsia-700/80 hover:bg-fuchsia-600 text-[8px] font-bold text-white
              shadow shadow-fuchsia-900/40 hover:scale-105 active:scale-95 transition-all"
          >
            ▲ Maior
          </button>
        </div>
      )}

      {/* Revealed cards */}
      <AnimatePresence>
        {revealed.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex gap-1 mt-0.5 overflow-hidden">
            {revealed.map((card) => (
              <motion.div key={card.id} initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }}
                exit={{ scale: 0, rotateY: -180 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative w-9 h-[54px] rounded overflow-hidden shadow-lg ring-2 ring-amber-400/50">
                <Image src={`/cards/card_${card.value}.webp`} alt={`${card.value}`} fill sizes="36px" className="object-cover" />
                <motion.div initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 1.5 }}
                  className="absolute inset-0 bg-amber-300/25 pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trios */}
      {player.trios?.length > 0 && (
        <div className="flex gap-1 mt-0.5">
          {player.trios.map((t, i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="relative w-7 h-[42px] rounded overflow-hidden ring-2 ring-amber-500/60 shadow-lg shadow-amber-500/20">
              <Image src={`/cards/card_${t.value}.webp`} alt="" fill sizes="28px" className="object-cover" />
              <div className="absolute top-0 right-0 bg-amber-400 text-black text-[6px] font-black px-1 rounded-bl">T</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ━━━ MAIN ━━━ */
const GameTable: React.FC = memo(() => {
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
  const opponents = useMemo(() => playerList.filter(p => p.sessionId !== mySid), [playerList, mySid]);
  const isMyTurn = activeSid === mySid;
  const activeName = activeSid ? players[activeSid]?.displayName : "";
  const myPlayer = players[mySid];
  const isHost = mySid === hostSid;

  const visibleCards = useMemo(() => tableCards.filter(c => c.location !== "scored"), [tableCards]);

  const gridCols = useMemo(() => {
    const n = visibleCards.length;
    if (n <= 8) return 4;
    if (n <= 18) return 6;
    return 6;
  }, [visibleCards.length]);

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
    <div className="w-full h-screen flex flex-col overflow-hidden select-none"
      style={{ background: "linear-gradient(180deg, #0c0704 0%, #1a0e08 30%, #1a0e08 70%, #0c0704 100%)" }}>

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
                className="px-2.5 py-0.5 rounded-lg bg-black/50 border border-white/10 max-w-[250px]">
                <span className="text-[9px] font-bold text-amber-200/90 block truncate">{lastEvent}</span>
              </motion.div>
            )}
          </AnimatePresence>
          {isHost && (
            <button onClick={() => colyseusService.leaveRoom()}
              className="px-2 py-1 rounded bg-red-900/30 border border-red-500/20 text-[8px] font-bold text-red-400/70 hover:bg-red-900/50 hover:text-red-300 transition-all">
              Sair
            </button>
          )}
        </div>
      </div>

      {/* ═══ OPPONENTS — each with their own ask buttons ═══ */}
      <div className="flex-none flex items-start justify-center gap-4 sm:gap-6 px-4 py-2 z-30">
        {opponents.map((p) => (
          <OpponentSeat key={p.sessionId} player={p} isActive={p.sessionId === activeSid} isMyTurn={isMyTurn} />
        ))}
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="flex-1 min-h-0 flex items-center justify-center z-10">
        <div className="relative rounded-[50%/46%]"
          style={{
            width: "clamp(720px, 60vw, 1060px)",
            aspectRatio: "16 / 9",
            background: "radial-gradient(ellipse at 50% 50%, #0f6b55 0%, #0b4f3e 30%, #083d2f 55%, #052a20 80%, #031a14 100%)",
            boxShadow: "inset 0 0 50px rgba(0,0,0,0.4), inset 0 0 15px rgba(0,0,0,0.3), 0 6px 30px rgba(0,0,0,0.5)",
            border: "5px solid #1a0e08",
            outline: "2px solid #2a1a0f",
          }}>
          <div className="absolute inset-0 rounded-[50%/46%] opacity-[0.03] pointer-events-none overflow-hidden"
            style={{ backgroundImage: "radial-gradient(circle, #fff 0.4px, transparent 0.4px)", backgroundSize: "6px 6px" }} />
          <div className="absolute inset-[10px] rounded-[50%/44%] border border-amber-600/10 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.025]">
            <span className="text-4xl font-black tracking-[0.3em] text-white italic">TRIO</span>
          </div>

          {/* Cards */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ padding: "clamp(24px, 4vw, 48px)" }}>
            <div className="grid place-items-center justify-center content-center"
              style={{ gridTemplateColumns: `repeat(${gridCols}, auto)`, gap: "clamp(12px, 2vw, 24px)" }}>
              {visibleCards.map((card, i) => {
                const origIdx = tableCards.findIndex(c => c.id === card.id);
                return (
                  <motion.div key={card.id} initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.015, type: "spring", stiffness: 200, damping: 18 }}>
                    <Card cardData={card} index={origIdx} location="table" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STATUS BAR (no action buttons — actions are on opponents) ═══ */}
      <div className="flex-none h-8 flex items-center justify-center z-40">
        {isMyTurn && phase === "playing" ? (
          <span className="text-[10px] font-bold text-emerald-400/60">Sua vez — peça cartas dos oponentes ou clique na mesa</span>
        ) : phase === "playing" ? (
          <span className="text-[10px] font-bold text-white/20 tracking-wider uppercase">Aguardando {activeName}...</span>
        ) : null}
      </div>

      {/* ═══ MY HAND ═══ */}
      <div className="flex-none z-40 border-t border-white/5 bg-gradient-to-t from-black/60 to-[#1a0e08]/80">
        <div className="px-4 pt-1.5 pb-2.5">
          <div className="flex items-center justify-center gap-3 mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 bg-white/10" />
              <span className="text-[8px] font-bold tracking-[0.15em] text-white/20 uppercase">Sua Mão</span>
              <div className="h-px w-4 bg-white/10" />
            </div>
            {myPlayer?.trios?.length > 0 && (
              <div className="flex items-center gap-1.5 ml-1">
                {myPlayer.trios.map((t, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/25">
                    <div className="w-5 h-[30px] rounded-sm overflow-hidden">
                      <Image src={`/cards/card_${t.value}.webp`} alt="" width={20} height={30} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[8px] font-black text-amber-400">×3</span>
                  </motion.div>
                ))}
                <span className="text-[8px] text-amber-400/50 font-bold">{myPlayer.trios.length}/3</span>
              </div>
            )}
          </div>
          {myHand.length > 0 ? (
            <div className="flex items-end justify-center">
              {myHand.map((card, i) => {
                const rot = getHandRot(i, myHand.length);
                return (
                  <motion.div key={card.id}
                    animate={{ y: Math.abs(rot) * 0.3, rotate: rot }}
                    whileHover={{ y: -14, scale: 1.1, zIndex: 50, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    style={{ marginLeft: i > 0 ? "-6px" : "0", zIndex: i }}
                    className="flex-shrink-0">
                    <div className="w-[52px] h-[78px] sm:w-[60px] sm:h-[90px] md:w-[68px] md:h-[102px] rounded-md overflow-hidden shadow-lg shadow-black/40 border border-white/10 hover:border-white/25 transition-colors relative">
                      <Image src={`/cards/card_${card.value}.webp`} alt={`${card.value}`} fill sizes="68px" className="object-cover" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-3"><span className="text-[9px] text-white/15">Sem cartas</span></div>
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
