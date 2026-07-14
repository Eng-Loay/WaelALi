import { useState, useEffect } from 'react';
import { fetchFeatures } from '../api';
import { useApp } from '../context/AppContext';
import { pickField } from '../utils/localized';
import ScrollReveal from './ScrollReveal';
import useScrollReveal from '../hooks/useScrollReveal';
import './Features.css';

export default function Features() {
  const { t, lang } = useApp();
  const [features, setFeatures] = useState([]);
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal();

  useEffect(() => {
    fetchFeatures()
      .then(setFeatures)
      .catch(console.error);
  }, []);

  return (
    <section className="section features">
      <div className="container">
        <ScrollReveal animation="up">
          <h2 className="section-title">
            {t.features.title} <span>{t.features.titleHighlight}</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal animation="up" delay={0.1}>
          <p className="section-subtitle">{t.features.subtitle}</p>
        </ScrollReveal>

        <div
          ref={gridRef}
          className={`features__grid stagger-children ${gridVisible || features.length > 0 ? 'stagger-children--visible' : ''}`}
        >
          {features.map((feature, index) => (
            <div key={feature.id} className="features__card tilt-card">
              <div className="features__icon">{feature.icon}</div>
              <h3 className="features__title">{pickField(feature, 'title', lang)}</h3>
              <p className="features__desc">{pickField(feature, 'description', lang)}</p>
              <div className="features__number">{String(index + 1).padStart(2, '0')}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
