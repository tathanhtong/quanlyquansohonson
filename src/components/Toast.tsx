import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 bg-emerald-950 text-white rounded-xl shadow-2xl border border-amber-500/50 animate-in slide-in-from-bottom-5 duration-200">
      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
      <span className="text-xs sm:text-sm font-semibold tracking-wide text-emerald-50">
        {message}
      </span>
      <button
        onClick={onClose}
        className="p-1 rounded-md text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors ml-2"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
