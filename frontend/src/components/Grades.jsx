import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchGrades } from '../api';
import { useApp } from '../context/AppContext';
import { getStagesBigToSmall, getStageByKey, pickStageDescription, pickStageName } from '../data/stages';
import { filterGradesByStage } from '../admin/gradeHelpers';
import { pickGradeName, pickField } from '../utils/localized';
import ScrollReveal from './ScrollReveal';
import useScrollReveal from '../hooks/useScrollReveal';
import './Grades.css';

export default function Grades({ showViewAll = false, stage: stageKey = null }) {
  const { t, lang } = useApp();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(Boolean(stageKey));
  const [loadError, setLoadError] = useState('');
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal();
  const stage = stageKey ? getStageByKey(stageKey) : null;
  const needsGrades = Boolean(stage);

  useEffect(() => {
    if (!needsGrades) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    fetchGrades()
      .then((data) => setGrades(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setLoadError(err.message || 'تعذر تحميل الصفوف');
        setGrades([]);
      })
      .finally(() => setLoading(false));
  }, [needsGrades]);

  const stageGrades = useMemo(() => {
    if (!stage) return [];
    return filterGradesByStage(grades, stage.key);
  }, [grades, stage]);

  const stages = useMemo(() => getStagesBigToSmall(), []);

  const title = stage
    ? pickStageName(stage, lang)
    : `${t.grades.title} ${t.grades.titleHighlight}`;

  const subtitle = stage
    ? pickStageDescription(stage, lang)
    : t.grades.subtitle;

  return (
    <section id="grades" className="section grades math-bg">
      <div className="container">
        <ScrollReveal animation="up">
          <div className="section-head">
            <div>
              {stage && (
                <Link to="/grades" className="grades__back">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  {t.grades.back}
                </Link>
              )}
              <h2 className="section-title">
                {stage ? (
                  <>
                    {title}
                  </>
                ) : (
                  <>
                    {t.grades.title} <span>{t.grades.titleHighlight}</span> !
                  </>
                )}
              </h2>
              <p className="section-subtitle">{subtitle}</p>
            </div>
            {showViewAll && !stage && (
              <Link to="/grades" className="section-view-all">
                {t.grades.viewAll}
                <svg className="icon-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grades__loading">
            <div className="grades__spinner" />
            <p>{t.grades.loading}</p>
          </div>
        ) : loadError && stage ? (
          <div className="grades__loading">
            <p>{loadError}</p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className={`grades__grid ${stage ? 'grades__grid--years' : 'grades__grid--stages'} stagger-children ${gridVisible ? 'stagger-children--visible' : ''}`}
          >
            {!stage ? (
              stages.map((item) => (
                <Link
                  key={item.key}
                  to={`/grades/${item.key}`}
                  className="grades__card tilt-card"
                  style={{ '--card-color': item.color }}
                >
                  <div className="grades__card-icon">{item.icon}</div>
                  <h3 className="grades__card-title">{pickStageName(item, lang)}</h3>
                  <p className="grades__card-desc">{pickStageDescription(item, lang)}</p>
                  <span className="grades__card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))
            ) : (
              stageGrades.map((grade) => (
                <Link
                  key={grade.id}
                  to={`/courses/${grade.id}`}
                  className="grades__card tilt-card"
                  style={{ '--card-color': grade.color }}
                >
                  <div className="grades__card-icon">{grade.icon}</div>
                  <h3 className="grades__card-title">{pickGradeName(grade, lang)}</h3>
                  <p className="grades__card-desc">{pickField(grade, 'description', lang)}</p>
                  <span className="grades__card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
