import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastData, useGameStore } from '../store/useGameStore';
import { Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  toast: ToastData;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const removeToast = useGameStore((state) => state.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  const icons = {
    info: <Info className="w-5 h-5 text-blue-400" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
  };

  const colors = {
    info: 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    success: 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    warning: 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    error: 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative flex items-center gap-3 px-4 py-3 min-w-[300px] border-l-4 rounded-r-lg backdrop-blur-md ${colors[toast.type]} border-y border-r border-white/5 overflow-hidden`}
    >
      {/* Cyberpunk accent lines */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />
      
      <div className="flex-shrink-0">
        {icons[toast.type]}
      </div>
      
      <div className="flex-grow">
        <p className="text-sm font-medium text-white/90 font-mono tracking-tight">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-white/40" />
      </button>

      {/* Progress bar for auto-dismiss */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 3000) / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[2px] ${
          toast.type === 'info' ? 'bg-blue-500' :
          toast.type === 'success' ? 'bg-emerald-500' :
          toast.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
        }`}
      />
    </motion.div>
  );
};

export default Toast;
