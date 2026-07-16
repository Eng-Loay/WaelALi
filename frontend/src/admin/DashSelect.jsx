import { useEffect, useId, useRef, useState } from 'react';
import { IconChevronDown } from './DashboardIcons';

function IconCoursesSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function DashSelect({
  label,
  value,
  onChange,
  options = [],
  className = '',
  placeholder = 'اختر...',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  const selected = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selected?.label || placeholder;

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const pick = (optValue) => {
    onChange?.({ target: { value: optValue } });
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`dash-select-field dash-select-field--custom ${open ? ' is-open' : ''} ${className}`.trim()}
    >
      {label && <span className="dash-select-field__label">{label}</span>}

      <button
        type="button"
        className="dash-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dash-select-trigger__icon" aria-hidden="true">
          <IconCoursesSmall />
        </span>
        <span className="dash-select-trigger__text">{displayLabel}</span>
        <span className={`dash-select-trigger__chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          <IconChevronDown />
        </span>
      </button>

      {open && (
        <ul id={listId} className="dash-select-menu" role="listbox">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li key={opt.value || '__all'} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={`dash-select-menu__item${isSelected ? ' is-selected' : ''}`}
                  onClick={() => pick(opt.value)}
                >
                  <span className="dash-select-menu__label">{opt.label}</span>
                  {isSelected && (
                    <span className="dash-select-menu__check" aria-hidden="true">
                      <IconCheck />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
