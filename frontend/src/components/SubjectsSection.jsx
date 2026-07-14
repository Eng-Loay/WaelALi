import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useActiveCycle from '../hooks/useActiveCycle';
import { useApp } from '../context/AppContext';
import ScrollReveal from './ScrollReveal';
import { CYCLE_MS, PAUSE_MS, SUBJECTS } from '../data/subjects';
import './SubjectsSection.css';

export default function SubjectsSection() {
  const { t } = useApp();
  const [hovered, setHovered] = useState(null);
  const [locked, setLocked] = useState(null);
  const [slideDir, setSlideDir] = useState(1);
  const prevIndex = useRef(0);
  const pauseTimer = useRef(null);

  const cycleEnabled = locked === null && hovered === null;
  const cycleIndex = useActiveCycle(SUBJECTS.length, CYCLE_MS, cycleEnabled);
  const activeIndex = locked ?? hovered ?? cycleIndex;
  const active = SUBJECTS[activeIndex];
  const activeCopy = t.floatCards[active.id];

  useEffect(() => {
    if (activeIndex !== prevIndex.current) {
      setSlideDir(activeIndex > prevIndex.current ? 1 : -1);
      prevIndex.current = activeIndex;
    }
  }, [activeIndex]);

  useEffect(() => () => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
  }, []);

  const lockSelection = (index) => {
    setLocked(index);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setLocked(null), PAUSE_MS);
  };

  return (
    <section className="subjects-section math-bg" aria-label={t.subjects.aria}>
      <div className="subjects-section__bg" aria-hidden="true">
        <span className="subjects-section__orb subjects-section__orb--1" />
        <span className="subjects-section__orb subjects-section__orb--2" />
      </div>

      <div className="container subjects-section__inner">
        <ScrollReveal animation="up">
          <div className="subjects-section__header">
            <span className="subjects-section__eyebrow">{t.subjects.eyebrow}</span>
            <h2 className="section-title">
              {t.subjects.title} <span>{t.subjects.titleHighlight}</span>
            </h2>
            <p className="section-subtitle subjects-section__subtitle">{t.subjects.subtitle}</p>
          </div>
        </ScrollReveal>

        <div
          className="subjects-showcase"
          style={{ '--accent': active.accent, '--glow': active.glow, '--duration': `${CYCLE_MS}ms` }}
        >
          <article
            className={`subjects-showcase__feature subjects-showcase__feature--slide-${slideDir > 0 ? 'next' : 'prev'}`}
            key={active.id}
          >
            <div className="subjects-showcase__feature-top">
              <div className="subjects-showcase__progress" aria-hidden="true">
                <span
                  key={`${activeIndex}-${locked ?? 'auto'}`}
                  className="subjects-showcase__progress-fill"
                  style={{ animationPlayState: cycleEnabled ? 'running' : 'paused' }}
                />
              </div>
              <span className="subjects-showcase__index">
                {String(activeIndex + 1).padStart(2, '0')} / {String(SUBJECTS.length).padStart(2, '0')}
              </span>
            </div>

            <div className="subjects-showcase__feature-body">
              <div className="subjects-showcase__icon-wrap">
                <span className="subjects-showcase__icon-ring" />
                <span className="subjects-showcase__icon">{active.symbol}</span>
              </div>

              <div className="subjects-showcase__copy">
                <h3>{activeCopy.title}</h3>
                <p className="subjects-showcase__lead">{activeCopy.subtitle}</p>
                <p className="subjects-showcase__desc">{t.subjects.descriptions[active.id]}</p>
              </div>
            </div>

            <span className="subjects-showcase__shine" aria-hidden="true" />
          </article>

          <div className="subjects-showcase__picker" role="tablist" aria-label={t.subjects.pickerLabel}>
            {SUBJECTS.map((subject, index) => {
              const copy = t.floatCards[subject.id];
              const isActive = index === activeIndex;
              return (
                <button
                  key={subject.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`subjects-showcase__card ${isActive ? 'subjects-showcase__card--active' : ''}`}
                  style={{ '--accent': subject.accent, '--card-i': index }}
                  onClick={() => lockSelection(index)}
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  onBlur={() => setHovered(null)}
                >
                  <span className="subjects-showcase__card-icon">{subject.symbol}</span>
                  <span className="subjects-showcase__card-title">{copy.title}</span>
                  <span className="subjects-showcase__card-sub">{copy.subtitle}</span>
                  {isActive && (
                    <span
                      key={`timer-${activeIndex}-${locked ?? 'auto'}`}
                      className="subjects-showcase__card-timer"
                      style={{ animationPlayState: cycleEnabled ? 'running' : 'paused' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <ScrollReveal animation="up" delay={0.15}>
          <div className="subjects-section__foot">
            <div className="subjects-section__badge">
              <span className="subjects-section__badge-pi">π</span>
              <span>{t.hero.experience}</span>
            </div>
            <Link to="/courses" className="btn btn-primary btn--shine subjects-section__cta">
              {t.subjects.cta}
              <svg className="icon-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
