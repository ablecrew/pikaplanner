'use client'

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'warning' | 'danger';
}
interface ActionMenuProps {
  actions: Action[];
}
const variantStyles: Record<string, string> = {
  default: 'text-gray-700 hover:bg-gray-50',
  warning: 'text-amber-600 hover:bg-amber-50',
  danger: 'text-red-600 hover:bg-red-50',
};
export const ActionMenu: React.FC<ActionMenuProps> = ({ actions }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
      >
        <MoreVertical size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1.5"
          >
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition ${variantStyles[action.variant || 'default']}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
