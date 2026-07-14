import { useState, useEffect } from 'react';
import { fetchTestimonials } from '../api';
import { useApp } from '../context/AppContext';
import { pickField } from '../utils/localized';
import ScrollReveal from './ScrollReveal';
import useScrollReveal from '../hooks/useScrollReveal';
import './Testimonials.css';

export default function Testimonials() {
  const { t, lang } = useApp();
  const [testimonials, setTestimonials] = useState([]);
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal();

  useEffect(() => {
    fetchTestimonials()
      .then(setTestimonials)
      .catch(console.error);
  }, []);

  return (
    <section className="section testimonials">
      <div className="container">
        <ScrollReveal animation="up">
          <h2 className="section-title">
            {t.testimonials.title} <span>{t.testimonials.titleHighlight}</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal animation="up" delay={0.1}>
          <p className="section-subtitle">{t.testimonials.subtitle}</p>
        </ScrollReveal>

        <div
          ref={gridRef}
          className={`testimonials__grid stagger-children ${gridVisible || testimonials.length > 0 ? 'stagger-children--visible' : ''}`}
        >
          {testimonials.map((item) => (
            <div key={item.id} className="testimonial-card tilt-card">
              <div className="testimonial-card__stars">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <span key={i} className="testimonial-card__star" style={{ '--star-i': i }}>
                    ★
                  </span>
                ))}
              </div>
              <p className="testimonial-card__text">"{pickField(item, 'content', lang)}"</p>
              <div className="testimonial-card__author">
                <div className="testimonial-card__avatar">
                  {item.student_name.charAt(0)}
                </div>
                <span className="testimonial-card__name">{item.student_name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
