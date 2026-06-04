"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, ChatMessage } from "../../store/useGameStore";
import { colyseusService } from "../../networking/ColyseusService";

export default function GameChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const chatMessages = useGameStore((s) => s.chatMessages);
  const mySid = useGameStore((s) => s.mySessionId);
  const [floatingMessages, setFloatingMessages] = useState<ChatMessage[]>([]);
  const lastMessagesCount = useRef(chatMessages.length);

  // Handle floating messages when chat is closed or new message arrives
  useEffect(() => {
    // If a new message arrived and chat is closed, add to floating
    if (!isOpen && chatMessages.length > lastMessagesCount.current) {
      const newMsg = chatMessages[chatMessages.length - 1];
      addFloating(newMsg);
    }
    lastMessagesCount.current = chatMessages.length;
  }, [chatMessages, isOpen]);

  // When closing chat, show last 5 messages
  const toggleChat = () => {
    if (isOpen) {
      // Closing: show last 5
      const last5 = chatMessages.slice(-5);
      last5.forEach((msg, i) => {
        setTimeout(() => addFloating(msg), i * 100);
      });
    }
    setIsOpen(!isOpen);
  };

  const addFloating = (msg: ChatMessage) => {
    const id = `${msg.sessionId}-${msg.ts}-${Math.random()}`;
    const fMsg = { ...msg, id }; // Add temp id for uniqueness in floating list
    setFloatingMessages((prev) => [...prev.slice(-4), fMsg as any]);
    
    setTimeout(() => {
      setFloatingMessages((prev) => prev.filter((m: any) => m.id !== id));
    }, 4000);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    colyseusService.sendChatMessage(text.trim());
    setText("");
  };

  return (
    <div className="absolute top-12 left-4 z-[60] flex flex-col items-start gap-2 pointer-events-none">
      {/* Floating Messages Area */}
      <div className="flex flex-col gap-2 mb-2">
        <AnimatePresence>
          {!isOpen && floatingMessages.map((msg: any) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, y: -40, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl rounded-bl-none shadow-lg max-w-[200px]"
            >
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-tighter leading-none mb-0.5">
                {msg.displayName}
              </p>
              <p className="text-xs text-white leading-tight break-words">
                {msg.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="pointer-events-auto w-10 h-10 rounded-full bg-indigo-600/80 hover:bg-indigo-500 border border-white/20 flex items-center justify-center shadow-lg transition-all active:scale-90"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
        </svg>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20, y: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20, y: -10 }}
            className="pointer-events-auto w-72 h-80 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black tracking-widest text-white/50 uppercase">Chat da Sala</span>
              <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scroll">
              {chatMessages.length === 0 && (
                <div className="flex-1 flex items-center justify-center italic text-white/10 text-[10px]">
                  Nenhuma mensagem ainda...
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={`${msg.ts}-${i}`} className={`flex flex-col ${msg.sessionId === mySid ? "items-end" : "items-start"}`}>
                  <span className="text-[8px] font-bold text-white/30 uppercase mb-0.5 px-1">{msg.displayName}</span>
                  <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words shadow-sm ${
                    msg.sessionId === mySid ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/10 text-white/90 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
            </div>

            <form onSubmit={sendMessage} className="p-2 bg-black/20 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enviar mensagem..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                maxLength={140}
              />
              <button
                type="submit"
                className="w-10 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
