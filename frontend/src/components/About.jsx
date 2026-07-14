import { Link } from 'react-router-dom';
import teacherPortrait from '../assets/teacher-portrait.png';
import { useApp } from '../context/AppContext';
import ScrollReveal from './ScrollReveal';
import AnimatedCounter from './AnimatedCounter';
import './About.css';

export default function About() {
  const { t } = useApp();

  return (
    <section id="about" className="section about math-bg">
      <div className="container">
        <div className="about__inner">
          <ScrollReveal animation="right" className="about__image-wrapper">
            <div className="about__image-frame">
              <img src={teacherPortrait} alt={t.about.alt} className="about__image" />
            </div>
            <div className="about__experience">
              <AnimatedCounter end={25} prefix="+" />
              <span>{t.about.experience}</span>
            </div>
          </ScrollReveal>

          <div className="about__content">
            <ScrollReveal animation="left" delay={0.1}>
              <span className="about__label">{t.about.label}</span>
              <h2 className="about__title">
                {t.about.title}<span>{t.about.titleHighlight}</span>{t.about.titleEnd}
              </h2>
            </ScrollReveal>
            <ScrollReveal animation="left" delay={0.2}>
              <p className="about__text">{t.about.text1}</p>
              <p className="about__text">{t.about.text2}</p>
            </ScrollReveal>

            <ScrollReveal animation="left" delay={0.3}>
              <div className="about__highlights">
                <div className="about__highlight">
                  <span className="about__highlight-icon about__highlight-icon--spin">π</span>
                  <div>
                    <strong>{t.about.highlight1Title}</strong>
                    <small>{t.about.highlight1Desc}</small>
                  </div>
                </div>
                <div className="about__highlight">
                  <span className="about__highlight-icon">📊</span>
                  <div>
                    <strong>{t.about.highlight2Title}</strong>
                    <small>{t.about.highlight2Desc}</small>
                  </div>
                </div>
              </div>

              <Link to="/contact" className="btn btn-primary btn--shine btn--magnetic">
                {t.about.cta}
                <svg className="icon-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
