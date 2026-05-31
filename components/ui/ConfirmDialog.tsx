'use client'

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}
const variantClasses: Record<string, string> = {
  primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
};
const variantIcons: Record<string, React.ReactNode> = {
  primary: <Info size={24} className="text-emerald-500" />,
  danger: <Trash2 size={24} className="text-red-500" />,
  warning: <AlertTriangle size={24} className="text-amber-500" />,
};
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel, confirmVariant = 'primary', onConfirm, onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          {variantIcons[confirmVariant]}
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${variantClasses[confirmVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};