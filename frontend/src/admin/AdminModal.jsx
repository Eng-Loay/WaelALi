import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './DashboardIcons';

function isDashDark() {
  return (
    document.querySelector('.dashboard-theme.dash-dark') != null
    || localStorage.getItem('dash-theme') === 'dark'
  );
}

export default function AdminModal({
  open,
  title,
  onClose,
  children,
  footer = null,
  wide = false,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const dark = isDashDark();

  return createPortal(
    <div
      className={`dash-modal-overlay${dark ? ' dash-modal-overlay--dark' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`dash-modal${wide ? ' dash-modal--wide' : ''}${footer ? ' dash-modal--has-footer' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className="dash-modal__head">
          <h3>{title}</h3>
          <button type="button" className="dash-icon-btn" onClick={onClose} aria-label="إغلاق">
            <IconClose />
          </button>
        </div>
        <div className="dash-modal__body">{children}</div>
        {footer ? <div className="dash-modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
