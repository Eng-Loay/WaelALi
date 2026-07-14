import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import teacherHero from '../assets/WhatsApp_Image_2026-07-07_at_1.12.45_PM-removebg-preview.png';
import FloatingSymbols from './FloatingSymbols';
import HeroGeoOrbit from './HeroGeoOrbit';
import './HeroGeoOrbit.css';
import './Hero.css';

export default function Hero() {
  const { t } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const taglineParts = t.hero.tagline.flatMap((text, i, arr) => {
    const parts = [{ text, highlight: i === arr.length - 1 }];
    if (i < arr.length - 1) parts.push({ text: '•', type: 'dot' });
    return parts;
  });

  return (
    <section id="home" className="hero">
      <FloatingSymbols />

      <div className="hero__bg-shapes">
        <div className="hero__shape hero__shape--1" />
        <div className="hero__shape hero__shape--2" />
        <div className="hero__shape hero__shape--3" />
      </div>

      <div className="hero__grid-pattern" aria-hidden="true" />

      <div className="container hero__inner">
        <div className={`hero__content ${mounted ? 'hero__content--mounted' : ''}`}>
          <div className="hero__badge hero__item" style={{ '--i': 0 }}>
            <span className="hero__pi hero__pi--spin">π</span>
            {t.hero.badge}
          </div>

          <h1 className="hero__title hero__item" style={{ '--i': 1 }}>
            {t.hero.namePrefix}<span className="hero__name">{t.hero.name}</span>
          </h1>

          <p className="hero__tagline">
            {taglineParts.map((part, i) => (
              <span
                key={i}
                className={`hero__tagline-part hero__item ${
                  part.highlight ? 'hero__tagline-part--highlight' : ''
                } ${part.type === 'dot' ? 'hero__tagline-dot' : ''}`}
                style={{ '--i': i + 2 }}
              >
                {part.text}
              </span>
            ))}
          </p>

          <p className="hero__desc hero__item" style={{ '--i': 7 }}>
            {t.hero.desc}
          </p>

          <div className="hero__actions hero__item" style={{ '--i': 8 }}>
            <Link to="/contact" className="btn btn-primary btn--shine btn--magnetic">
              {t.hero.subscribe}
              <svg className="icon-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/courses" className="btn btn-outline btn--magnetic">
              {t.hero.viewCourses}
            </Link>
          </div>
        </div>

        <div className={`hero__visual ${mounted ? 'hero__visual--mounted' : ''}`}>
          <div className="hero__visual-bg" aria-hidden="true">
            <span className="hero__orbit hero__orbit--1" />
            <span className="hero__orbit hero__orbit--2" />
            <span className="hero__orbit hero__orbit--3" />
            <span className="hero__orbit-dot" />
            <span className="hero__visual-floor" />
          </div>
          <HeroGeoOrbit visible={mounted} />
          <div className="hero__image-shell">
            <span className="hero__image-aura" />
            <img src={teacherHero} alt={t.hero.alt} className="hero__image" />
          </div>
        </div>
      </div>

      <div className="hero__scroll-indicator">
        <span>{t.hero.scroll}</span>
        <div className="hero__scroll-mouse">
          <div className="hero__scroll-wheel" />
        </div>
      </div>
    </section>
  );
}
