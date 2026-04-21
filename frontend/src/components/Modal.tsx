import React, { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 520 }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="rounded-lg bg-white shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ width }}
        onClick={e => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-gray-900">{title}</div>
            <button
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              onClick={onClose}
              aria-label="close"
            >×</button>
          </div>
        )}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
