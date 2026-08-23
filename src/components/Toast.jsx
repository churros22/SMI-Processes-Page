import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className={`toast-notification toast-${toast.type || 'info'}`}>
      <div className="toast-content">
        {isSuccess && <CheckCircle2 size={18} className="toast-icon" />}
        {isError && <AlertCircle size={18} className="toast-icon" />}
        {!isSuccess && !isError && <Info size={18} className="toast-icon" />}
        <span>{toast.message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
