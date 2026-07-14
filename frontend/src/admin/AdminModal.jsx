import { useEffect } from 'react';
import { IconClose } from './DashboardIcons';

export default function AdminModal({ open, title, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dash-modal-overlay" onClick={onClose} role="presentation">
      <div className={`dash-modal${wide ? ' dash-modal--wide' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dash-modal__head">
          <h3>{title}</h3>
          <button type="button" className="dash-icon-btn" onClick={onClose} aria-label="إغلاق">
            <IconClose />
          </button>
        </div>
        <div className="dash-modal__body">{children}</div>
      </div>
    </div>
  );
}
