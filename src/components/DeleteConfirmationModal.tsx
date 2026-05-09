import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "Delete All Items?",
  description = "This will permanently delete all stock items. This action cannot be undone."
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#f8f9fa] rounded-lg shadow-xl w-full max-w-md relative z-10 p-6"
          >
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <h3 className="text-[20px] font-semibold text-gray-900">{title}</h3>
                <p className="text-[#64748b] text-[15px] leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md font-medium text-gray-900 bg-[#f8f9fa] hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm text-[15px]"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="bg-[#e53e3e] hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-[15px]"
                >
                  {title.includes('All') ? 'Delete All' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
