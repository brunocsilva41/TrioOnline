"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { colyseusService } from "../networking/ColyseusService";
import LobbyScreen from "../components/lobby/LobbyScreen";
import RoomScreen from "../components/room/RoomScreen";
import CountdownScreen from "../components/room/CountdownScreen";
import DealingCinematic from "../components/game/DealingCinematic";
import GameTable from "../components/GameTable";
import GameOverScreen from "../components/game/GameOverScreen";

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const showTutorial = useGameStore((s) => s.showTutorial);
  const setShowTutorial = useGameStore((s) => s.setShowTutorial);
  const [reconnectPrompt, setReconnectPrompt] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Check for saved session on mount
  useEffect(() => {
    const saved = colyseusService.getSavedSession();
    if (saved && phase === "lobby") {
      setReconnectPrompt(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReconnect = async () => {
    const saved = colyseusService.getSavedSession();
    if (!saved) { setReconnectPrompt(false); return; }
    setReconnecting(true);
    const ok = await colyseusService.reconnectToSession(saved);
    setReconnecting(false);
    setReconnectPrompt(false);
    if (!ok) {
      // Session expired, go to lobby
      useGameStore.getState().resetGame();
    }
  };

  const handleDecline = () => {
    setReconnectPrompt(false);
    // Clear stale session
    try { sessionStorage.removeItem("trinity_session"); } catch {}
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      <AnimatePresence mode="wait">
        {phase === "lobby" && <LobbyScreen key="lobby" />}
        {phase === "room" && <RoomScreen key="room" />}
        {phase === "countdown" && <CountdownScreen key="countdown" />}
        {phase === "dealing" && <DealingCinematic key="dealing" />}
        {phase === "playing" && <GameTable key="game" />}
        {phase === "finished" && (
          <>
            <GameTable key="game-bg" />
            <GameOverScreen key="game-over" />
          </>
        )}
      </AnimatePresence>

      {/* ── Reconnect Dialog ── */}
      <AnimatePresence>
        {reconnectPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="text-3xl mb-3">🎮</div>
              <h2 className="text-lg font-black font-display text-white mb-1">Partida em andamento</h2>
              <p className="text-xs text-white/40 mb-5">
                Você estava em uma partida. Deseja voltar ao jogo?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDecline}
                  disabled={reconnecting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/60 hover:bg-white/10 transition-all"
                >
                  Ir ao Lobby
                </button>
                <button
                  onClick={handleReconnect}
                  disabled={reconnecting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {reconnecting ? "Reconectando..." : "Voltar ao Jogo"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
}}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
          >
            <TutorialOverlay />
            <button
              onClick={() => setShowTutorial(false)}
              className="fixed top-8 left-8 z-[210] px-6 py-2 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/40 rounded-full text-[10px] font-black tracking-widest text-rose-300 uppercase transition-all"
            >
              Sair do Tutorial
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
