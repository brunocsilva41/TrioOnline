"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Trophy, ArrowLeft, ArrowRight, MousePointer2, Layers, Binary, HelpCircle, User, ShieldCheck, Search } from 'lucide-react';
import CardImage from '../CardImage';

/**
 * PROJECT TRINITY - Interactive Tutorial Screen
 * 
 * A guided, step-by-step learning experience for new players.
 * Features a mock game table to visualize rules.
 */

interface Step {
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  visual?: React.ReactNode;
}

export default function TutorialScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: "Como Começar",
      icon: <User className="text-emerald-400" />,
      description: (
        <div className="space-y-4">
          <p>No **Lobby**, você tem o controle total da sua entrada no mundo de Trio:</p>
          <ul className="space-y-3 text-white/60">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5"><User size={12} className="text-emerald-400" /></div>
              <span>**Identidade:** Coloque seu apelido ou crie uma conta para salvar suas vitórias e trios feitos.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5"><Search size={12} className="text-blue-400" /></div>
              <span>**Buscar:** Use a lista de salas para ver partidas públicas com vagas disponíveis.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5"><Layers size={12} className="text-amber-400" /></div>
              <span>**Criar:** Monte sua própria sala, podendo deixá-la privada (com código) para amigos.</span>
            </li>
          </ul>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mx-auto">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <div className="text-xl mb-1">CRIAR</div>
            <div className="text-[8px] text-white/30 uppercase">Sala Própria</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <div className="text-xl mb-1">ENTRAR</div>
            <div className="text-[8px] text-white/30 uppercase">Via Código</div>
          </div>
          <div className="col-span-2 p-4 bg-emerald-500 text-black font-black rounded-xl text-center">
            PARTIDA RÁPIDA
          </div>
        </div>
      )
    },
    {
      title: "O Objetivo: Fazer Trios",
      icon: <Trophy className="text-amber-400" />,
      description: (
        <div className="space-y-4">
          <p>Trio é um jogo de **memória e dedução**. O baralho tem cartas de 1 a 12 (três de cada).</p>
          <p>Para ganhar, você precisa encontrar **três cartas de mesmo valor** para formar um Trio.</p>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
             <p className="text-xs font-bold text-emerald-400 uppercase tracking-tighter mb-1">Condições de Vitória:</p>
             <p className="text-[11px] text-white/70">1. Completar **3 Trios** quaisquer.</p>
             <p className="text-[11px] text-white/70">2. Ou completar o **Trio de Setes (7)** (Vitória Instantânea!).</p>
          </div>
        </div>
      ),
      visual: (
        <div className="flex justify-center gap-2">
          {[5, 5, 5].map((v, i) => (
            <motion.div 
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2 }}
              className="w-20 h-28"
            >
              <CardImage value={v} className="rounded-xl border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
            </motion.div>
          ))}
        </div>
      )
    },
    {
      title: "Regra de Ouro: As Pontas",
      icon: <Layers className="text-sky-400" />,
      description: (
        <div className="space-y-4">
          <p>Esta é a regra mais importante: você **não pode** escolher qualquer carta da mão de um jogador.</p>
          <p>Ao clicar em si mesmo ou em um adversário, você só pode pedir a carta **MAIOR** ou a **MENOR** da mão dele.</p>
          <p className="text-white/60">As cartas do **Centro da Mesa** podem ser reveladas em qualquer ordem.</p>
        </div>
      ),
      visual: (
        <div className="relative p-6 bg-slate-800/50 rounded-[2rem] border border-white/10">
           <div className="flex justify-between items-center mb-8">
              <div className="px-4 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-[8px] font-black uppercase text-rose-300">Menor (1)</div>
              <div className="flex gap-1">
                 {[1, 4, 7, 10].map(v => <div key={v} className="w-8 h-12 bg-white/10 border border-white/5 rounded-md" />)}
              </div>
              <div className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-[8px] font-black uppercase text-emerald-300">Maior (10)</div>
           </div>
           <p className="text-center text-[9px] text-white/30 uppercase tracking-widest">Exemplo de Mão de Jogador</p>
        </div>
      )
    },
    {
      title: "O Fluxo da Jogada",
      icon: <MousePointer2 className="text-rose-400" />,
      description: (
        <div className="space-y-4">
          <p>No seu turno, você começa revelando **uma carta**.</p>
          <p>Para continuar jogando, a próxima carta revelada **DEVE ser igual** à primeira.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-[11px] text-emerald-400">
               <ShieldCheck size={14} /> <span>Acertou? Você continua revelando até completar o Trio.</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-rose-400">
               <Binary size={14} /> <span>Errou? As cartas viram de volta e o turno passa.</span>
            </div>
          </div>
        </div>
      ),
      visual: (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <div className="relative">
              <CardImage value={8} className="w-20 h-28 rounded-xl border-2 border-white/20" />
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-black font-black text-xs">1º</div>
            </div>
            <div className="relative">
              <CardImage value={8} className="w-20 h-28 rounded-xl border-2 border-emerald-500 shadow-lg shadow-emerald-500/20" />
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-black font-black text-xs">2º</div>
            </div>
          </div>
          <p className="text-[10px] font-bold text-emerald-400 uppercase animate-pulse">Combinação encontrada! Continue...</p>
        </div>
      )
    },
    {
      title: "Resumo Final",
      icon: <HelpCircle className="text-emerald-400" />,
      description: (
        <div className="space-y-4">
          <p>Para ser um mestre no Trio:</p>
          <ul className="list-disc list-inside space-y-2 text-white/70 text-sm">
            <li>Lembre-se das cartas que já apareceram.</li>
            <li>Use as pontas (maior/menor) para deduzir o que os outros têm.</li>
            <li>O Trio de 7 é a jogada mais poderosa!</li>
          </ul>
          <p className="text-emerald-400 font-bold">Você está pronto para o desafio!</p>
        </div>
      ),
      visual: (
        <div className="relative w-full h-full flex items-center justify-center">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute w-40 h-40 border-2 border-dashed border-emerald-500/20 rounded-full"
           />
           <div className="text-6xl animate-bounce">🃏</div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="p-6 sm:p-10 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <HelpCircle className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-display tracking-widest uppercase">Centro de Treinamento</h1>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Aprenda as regras do Trio Online</p>
          </div>
        </div>
        
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black tracking-widest uppercase transition-all hover:bg-white/10"
          >
            Sair do Tutorial
          </motion.button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      {steps[currentStep].icon}
                   </div>
                   <h2 className="text-2xl sm:text-4xl font-black font-display uppercase tracking-tight leading-tight">
                     {steps[currentStep].title}
                   </h2>
                </div>
                
                <div className="text-lg text-white/80 leading-relaxed max-w-xl font-medium">
                  {steps[currentStep].description}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-12 flex items-center gap-6">
              <div className="flex gap-2 mr-6">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 transition-all duration-500 rounded-full ${i === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-white/10'}`} 
                  />
                ))}
              </div>

              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/5 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="px-8 h-12 rounded-full bg-white text-black font-black text-xs tracking-widest uppercase hover:bg-emerald-400 transition-all flex items-center gap-2 group"
                >
                  Próximo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <Link href="/">
                  <button
                    className="px-8 h-12 rounded-full bg-emerald-500 text-black font-black text-xs tracking-widest uppercase hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
                  >
                    Estou Pronto!
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="order-1 lg:order-2">
             <div className="aspect-square w-full max-w-[480px] bg-slate-900/30 rounded-[3rem] border border-white/5 flex items-center justify-center p-8 relative overflow-hidden group">
                {/* Background animations */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1)_0%,_transparent_70%)]" />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
                    className="relative z-10 w-full"
                  >
                    {steps[currentStep].visual}
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>

        </div>
      </main>

      {/* Footer Vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
