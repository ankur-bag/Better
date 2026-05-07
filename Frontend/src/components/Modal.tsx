import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmLoading?: boolean;
  type?: 'danger' | 'primary';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  confirmLoading,
  type = 'primary'
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-gray-500 font-normal mb-8 leading-relaxed">
              {children}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  disabled={confirmLoading}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all shadow-sm ${
                    type === 'danger' 
                      ? 'bg-[#FF1313] hover:bg-[#E61111] shadow-red-100' 
                      : 'bg-black hover:bg-gray-800'
                  } disabled:opacity-50`}
                >
                  {confirmLoading ? 'Processing...' : confirmLabel}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
