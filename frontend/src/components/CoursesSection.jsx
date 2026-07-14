import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCourses } from '../api';
import { useApp } from '../context/AppContext';
import { pickField } from '../utils/localized';
import ScrollReveal from './ScrollReveal';
import './CoursesSection.css';

const AUTO_MS = 5000;

function CourseCard({ course, t, lang }) {
  return (
    <article className="course-card courses-slider__card">
      <div className="course-card__header">
        <span className="course-card__grade">{course.grade_name}</span>
        {course.is_featured ? (
          <span className="course-card__badge">{t.coursesSection.new}</span>
        ) : null}
      </div>
      <h3 className="course-card__title">{pickField(course, 'title', lang)}</h3>
      <p className="course-card__desc">{pickField(course, 'description', lang)}</p>
      <div className="course-card__meta">
        <span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          {course.lessons_count} {t.coursesSection.lessons}
        </span>
        <span className="course-card__price">
          {course.price} {t.coursesSection.currency}
        </span>
      </div>
      <div className="course-card__footer">
        <span className="course-card__slogan">{t.coursesSection.slogan}</span>
        <Link to="/contact" className="btn btn-primary course-card__btn btn--shine">
          {t.coursesSection.subscribe}
        </Link>
      </div>
    </article>
  );
}

export default function CoursesSection({ showViewAll = false }) {
  const { t, lang } = useApp();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);
  const pauseUntil = useRef(0);
  const isProgrammatic = useRef(false);

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current;
    if (!track || !track.children[index]) return;

    const slide = track.children[index];
    const trackStyles = getComputedStyle(track);
    const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
    const slideWidth = slide.offsetWidth + gap;

    isProgrammatic.current = true;
    track.scrollTo({ left: index * slideWidth, behavior: 'smooth' });

    window.setTimeout(() => {
      isProgrammatic.current = false;
    }, 450);
  }, []);

  const goTo = useCallback((index) => {
    if (!courses.length) return;
    const next = ((index % courses.length) + courses.length) % courses.length;
    pauseUntil.current = Date.now() + AUTO_MS * 2;
    setActiveIndex(next);
    scrollToIndex(next);
  }, [courses.length, scrollToIndex]);

  useEffect(() => {
    if (courses.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntil.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % courses.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [courses.length, scrollToIndex]);

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const handleScroll = () => {
    if (isProgrammatic.current) return;
    const track = trackRef.current;
    if (!track || !track.children.length) return;

    const slide = track.children[0];
    const trackStyles = getComputedStyle(track);
    const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
    const slideWidth = slide.offsetWidth + gap;
    if (!slideWidth) return;

    const offset = track.scrollLeft;
    const index = Math.min(
      courses.length - 1,
      Math.max(0, Math.round(offset / slideWidth)),
    );
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <section id="courses" className="section courses-section">
      <div className="container">
        <ScrollReveal animation="up">
          <div className="section-head">
            <div>
              <h2 className="section-title">
                {t.coursesSection.title} <span>{t.coursesSection.titleHighlight}</span> !
              </h2>
              <p className="section-subtitle courses-section__subtitle">{t.coursesSection.subtitle}</p>
            </div>
            {showViewAll && (
              <Link to="/courses" className="section-view-all">
                {t.coursesSection.viewAll}
                <svg className="icon-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="courses-section__loading">
            <div className="courses-section__spinner" />
            <p>{t.coursesSection.loading}</p>
          </div>
        ) : courses.length === 0 ? (
          <p className="courses-section__empty">{t.coursesPage.empty}</p>
        ) : (
          <div className="courses-slider" dir="ltr">
            <button
              type="button"
              className="courses-slider__nav courses-slider__nav--prev"
              onClick={goPrev}
              aria-label={t.coursesSection.prev}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="courses-slider__viewport">
              <div
                ref={trackRef}
                className="courses-slider__track"
                onScroll={handleScroll}
              >
                {courses.map((course) => (
                  <div key={course.id} className="courses-slider__slide">
                    <CourseCard course={course} t={t} lang={lang} />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="courses-slider__nav courses-slider__nav--next"
              onClick={goNext}
              aria-label={t.coursesSection.next}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <div className="courses-slider__dots" role="tablist" aria-label={t.coursesSection.sliderLabel}>
              {courses.map((course, index) => (
                <button
                  key={course.id}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  className={`courses-slider__dot ${index === activeIndex ? 'courses-slider__dot--active' : ''}`}
                  onClick={() => goTo(index)}
                  aria-label={`${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
