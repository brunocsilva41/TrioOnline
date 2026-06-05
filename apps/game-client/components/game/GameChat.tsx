"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, ChatMessage } from "../../store/useGameStore";
import { colyseusService } from "../../networking/ColyseusService";
import { MessageSquare, Send, X, SmilePlus } from "lucide-react";

const COMMON_EMOTES = ["😊", "😂", "🤔", "😮", "🤨", "😎", "🤝", "🔥", "⚡", "🍀", "🃏", "🤡"];

export default function GameChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const [text, setText] = useState("");
  const chatMessages = useGameStore((s) => s.chatMessages);
  const mySid = useGameStore((s) => s.mySessionId);
  const [floatingMessages, setFloatingMessages] = useState<ChatMessage[]>([]);
  const lastMessagesCount = useRef(chatMessages.length);

  useEffect(() => {
    if (!isOpen && chatMessages.length > lastMessagesCount.current) {
      const newMsg = chatMessages[chatMessages.length - 1];
      addFloating(newMsg);
    }
    lastMessagesCount.current = chatMessages.length;
  }, [chatMessages, isOpen]);

  const toggleChat = () => {
    if (isOpen) {
      const last5 = chatMessages.slice(-5);
      last5.forEach((msg, i) => {
        setTimeout(() => addFloating(msg), i * 100);
      });
      setShowEmotes(false);
    }
    setIsOpen(!isOpen);
  };

  const addFloating = (msg: ChatMessage) => {
    const id = `${msg.sessionId}-${msg.ts}-${Math.random()}`;
    const fMsg = { ...msg, id };
    setFloatingMessages((prev) => [...prev.slice(-4), fMsg as any]);
    setTimeout(() => {
      setFloatingMessages((prev) => prev.filter((m: any) => m.id !== id));
    }, 4000);
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    colyseusService.sendChatMessage(text.trim());
    setText("");
  };

  const handleEmote = (emote: string) => {
    colyseusService.sendEmote(emote);
    setShowEmotes(false);
  };

  return (
    <div className="absolute top-12 left-4 z-[60] flex flex-col items-start gap-3 pointer-events-none">
      {/* Floating Messages */}
      <div className="flex flex-col gap-2 mb-2">
        <AnimatePresence>
          {!isOpen && floatingMessages.map((msg: any) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, y: -40, scale: 1.1 }}
              className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl rounded-bl-none shadow-lg max-w-[200px]"
            >
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-tighter leading-none mb-0.5">{msg.displayName}</p>
              <p className="text-xs text-white leading-tight break-words">{msg.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Chat Toggle */}
        <button
          onClick={toggleChat}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 border 
            ${isOpen ? "bg-indigo-500 border-white/40" : "bg-slate-900/80 border-white/10 hover:bg-slate-800"}`}
        >
          <MessageSquare size={20} className="text-white" />
        </button>

        {/* Centralized Emote Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmotes(!showEmotes)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 border 
              ${showEmotes ? "bg-amber-500 border-white/40" : "bg-slate-900/80 border-white/10 hover:bg-slate-800"}`}
          >
            <SmilePlus size={20} className={showEmotes ? "text-black" : "text-white"} />
          </button>

          <AnimatePresence>
            {showEmotes && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 20 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                className="absolute top-0 left-full ml-2 p-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-wrap gap-1 w-44"
              >
                {COMMON_EMOTES.map((e) => (
                  <button
                    key={e}
                    onClick={() => handleEmote(e)}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="pointer-events-auto w-[calc(100vw-32px)] sm:w-80 h-[60vh] sm:h-96 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden mt-2"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <span className="text-[10px] font-black tracking-[0.2em] text-white/50 uppercase">Canal de Voz</span>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scroll">
              {chatMessages.length === 0 && (
                <div className="flex-1 flex items-center justify-center italic text-white/10 text-[10px] uppercase tracking-widest">Silêncio na mesa...</div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={`${msg.ts}-${i}`} className={`flex flex-col ${msg.sessionId === mySid ? "items-end" : "items-start"}`}>
                  <span className="text-[8px] font-black text-white/30 uppercase mb-1 px-1 tracking-tighter">{msg.displayName}</span>
                  <div className={`px-4 py-2 rounded-2xl text-xs max-w-[90%] break-words shadow-sm font-medium leading-relaxed ${
                    msg.sessionId === mySid ? "bg-indigo-500 text-white rounded-tr-none" : "bg-white/5 text-white/90 rounded-tl-none border border-white/5"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Diga algo..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all"
                maxLength={140}
              />
              <button type="submit" className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 active:scale-95 transition-all shadow-lg shadow-indigo-500/20">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
