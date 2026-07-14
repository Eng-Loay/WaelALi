import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchGrades, fetchGradeCourses, fetchCourses } from '../api';
import { useApp } from '../context/AppContext';
import { pickGradeName, pickGradeShort, pickField } from '../utils/localized';
import { sortGradesBigToSmall } from '../admin/gradeHelpers';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../components/CoursesSection.css';
import './Courses.css';

export default function Courses() {
  const { t, lang } = useApp();
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(gradeId || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades().then(setGrades).catch(console.error);
  }, []);

  const sortedGrades = useMemo(() => sortGradesBigToSmall(grades), [grades]);

  useEffect(() => {
    if (gradeId) setSelectedGrade(gradeId);
    else setSelectedGrade('');
  }, [gradeId]);

  useEffect(() => {
    setLoading(true);
    const request = selectedGrade ? fetchGradeCourses(selectedGrade) : fetchCourses();
    request
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedGrade]);

  const currentGrade = grades.find((g) => g.id === parseInt(selectedGrade, 10));

  const handleGradeChange = (id) => {
    setSelectedGrade(id);
    navigate(id ? `/courses/${id}` : '/courses');
  };

  const getGradeLabel = (course) => {
    if (course.grade_name) return course.grade_name;
    const grade = grades.find((g) => g.id === course.grade_id);
    return grade ? pickGradeName(grade, lang) : '';
  };

  return (
    <>
      <Navbar />
      <div className="courses-page">
        <header className="courses-page__hero">
          <div className="courses-page__hero-pattern" aria-hidden="true" />
          <div className="container courses-page__hero-inner">
            <Link to="/" className="courses-page__back">
              <svg className="icon-arrow icon-arrow--back" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t.coursesPage.back}
            </Link>

            <div className="courses-page__hero-content">
              <span className="courses-page__eyebrow">{t.coursesPage.eyebrow}</span>
              <h1 className="courses-page__title">
                {currentGrade ? pickGradeName(currentGrade, lang) : t.coursesPage.title}
              </h1>
              <p className="courses-page__subtitle">
                {currentGrade
                  ? pickField(currentGrade, 'description', lang)
                  : t.coursesPage.subtitle}
              </p>
              {!loading && (
                <div className="courses-page__stats">
                  <span className="courses-page__stat">
                    <strong>{courses.length}</strong>
                    {t.coursesPage.coursesLabel}
                  </span>
                  <span className="courses-page__stat">
                    <strong>{grades.length}</strong>
                    {t.coursesPage.gradesLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="container courses-page__body">
          <div className="courses-page__toolbar">
            <p className="courses-page__toolbar-label">{t.coursesPage.filterBy}</p>
            <div className="courses-page__filters">
              <button
                type="button"
                className={`courses-page__filter ${!selectedGrade ? 'courses-page__filter--active' : ''}`}
                onClick={() => handleGradeChange('')}
              >
                {t.coursesPage.all}
              </button>
              {sortedGrades.map((grade) => (
                <button
                  key={grade.id}
                  type="button"
                  className={`courses-page__filter ${selectedGrade === String(grade.id) ? 'courses-page__filter--active' : ''}`}
                  style={{ '--grade-color': grade.color }}
                  onClick={() => handleGradeChange(String(grade.id))}
                >
                  <span className="courses-page__filter-icon">{grade.icon}</span>
                  {pickGradeShort(grade, lang)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="courses-page__loading">
              <div className="courses-page__spinner" />
              <p>{t.coursesPage.loading}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="courses-page__empty">
              <div className="courses-page__empty-card">
                <span className="courses-page__empty-icon">📚</span>
                <h3>{t.coursesPage.emptyTitle}</h3>
                <p>{t.coursesPage.empty}</p>
                <Link to="/grades" className="btn btn-primary">{t.coursesPage.browseGrades}</Link>
              </div>
            </div>
          ) : (
            <div className="courses-page__grid">
              {courses.map((course, index) => (
                <article
                  key={course.id}
                  className="course-card courses-page__card"
                  style={{ '--card-delay': `${index * 0.06}s` }}
                >
                  <div className="course-card__header">
                    <span className="course-card__grade">{getGradeLabel(course)}</span>
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
                    <Link to="/contact" className="btn btn-primary course-card__btn">
                      {t.coursesSection.subscribe}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
