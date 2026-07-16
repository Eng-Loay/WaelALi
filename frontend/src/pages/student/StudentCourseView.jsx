import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchLessonPlayerToken,
  fetchStudentCourseContent,
  getStudentUser,
  logStudentLessonActivity,
} from '../../api/studentApi';

const TYPE_LABELS = {
  video: 'فيديو',
  text: 'نص',
  pdf: 'PDF',
  record: 'تسجيل',
  assignment: 'واجب',
  quiz: 'اختبار',
};

function mediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/${url}`;
}

function LessonTypeIcon({ type }) {
  const paths = {
    video: 'M8 5v14l11-7L8 5z',
    text: 'M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm2 3v2h10V7H7zm0 4v2h10v-2H7zm0 4v2h6v-2H7z',
    pdf: 'M7 2h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zm7 1.5V8h4.5L14 3.5zM8 12h8v1.5H8V12zm0 3.5h8V17H8v-1.5z',
    record: 'M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 7a7 7 0 007-7h2a9 9 0 01-18 0h2a7 7 0 007 7z',
    assignment: 'M9 3h6l1 2h4a1 1 0 011 1v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a1 1 0 011-1h4l1-2zm1.2 14.2l-2.4-2.4 1.4-1.4 1 1 3.6-3.6 1.4 1.4-5 5z',
    quiz: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z',
  };
  return (
    <span className="learn-lesson__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d={paths[type] || paths.text} fill="currentColor" />
      </svg>
    </span>
  );
}

function doneStorageKey(courseId) {
  return `course_done_${courseId}`;
}

function loadDoneSet(courseId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(doneStorageKey(courseId)) || '[]').map(Number));
  } catch {
    return new Set();
  }
}

function saveDoneSet(courseId, set) {
  localStorage.setItem(doneStorageKey(courseId), JSON.stringify([...set]));
}

export default function StudentCourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = getStudentUser();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [done, setDone] = useState(() => loadDoneSet(courseId));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [playerUrl, setPlayerUrl] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const flatLessons = useMemo(
    () =>
      (sections || []).flatMap((section) =>
        (section.lessons || []).map((lesson) => ({
          ...lesson,
          sectionTitle: section.title_ar || section.title,
        })),
      ),
    [sections],
  );

  const selected = flatLessons.find((l) => String(l.id) === String(selectedId)) || null;
  const currentIndex = flatLessons.findIndex((l) => String(l.id) === String(selectedId));
  const progressPct = flatLessons.length
    ? Math.round((done.size / flatLessons.length) * 100)
    : 0;

  useEffect(() => {
    setDone(loadDoneSet(courseId));
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchStudentCourseContent(courseId)
      .then((res) => {
        const nextSections = res.data.sections || [];
        const flat = nextSections.flatMap((s) => s.lessons || []);
        setCourse(res.data.course);
        setSections(nextSections);

        const openMap = {};
        nextSections.forEach((s) => {
          openMap[s.id] = true;
        });
        setExpanded(openMap);

        const serverDone = new Set((res.data.completedLessonIds || []).map(Number));
        const merged = new Set([...loadDoneSet(courseId), ...serverDone]);
        setDone(merged);
        saveDoneSet(courseId, merged);

        const lastId = res.data.lastLessonId;
        const first = flat.find((l) => Number(l.id) === Number(lastId)) || flat[0] || null;
        setSelectedId(first?.id ?? null);
        if (first && !String(first.id).startsWith('legacy-')) {
          logStudentLessonActivity(courseId, first.id).catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Secure player: fetch short-lived URL; never expose YouTube/source in course JSON
  useEffect(() => {
    setPlayerUrl(null);
    setPlayerError('');
    if (!selected) return undefined;
    const needsPlayer =
      (selected.lesson_type === 'video' || selected.lesson_type === 'record')
      && selected.has_media;
    if (!needsPlayer) return undefined;

    let cancelled = false;
    setPlayerLoading(true);
    fetchLessonPlayerToken(courseId, selected.id)
      .then((res) => {
        if (!cancelled) setPlayerUrl(res.data?.url || null);
      })
      .catch(() => {
        if (!cancelled) setPlayerError('تعذّر تشغيل هذا الدرس');
      })
      .finally(() => {
        if (!cancelled) setPlayerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, selected?.id, selected?.lesson_type, selected?.has_media]);

  const selectLesson = useCallback(
    (lessonId) => {
      setSelectedId(lessonId);
      setDrawerOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (!String(lessonId).startsWith('legacy-')) {
        logStudentLessonActivity(courseId, lessonId).catch(() => {});
      }
    },
    [courseId],
  );

  const toggleDone = useCallback(
    (lessonId) => {
      setDone((prev) => {
        const next = new Set(prev);
        const id = Number(lessonId);
        if (Number.isFinite(id)) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        }
        saveDoneSet(courseId, next);
        return next;
      });
    },
    [courseId],
  );

  const markDoneAndNext = () => {
    if (!selected) return;
    setDone((prev) => {
      const next = new Set(prev);
      const id = Number(selected.id);
      if (Number.isFinite(id)) next.add(id);
      saveDoneSet(courseId, next);
      return next;
    });
    if (currentIndex < flatLessons.length - 1) {
      selectLesson(flatLessons[currentIndex + 1].id);
    }
  };

  const isDone = (lessonId) => done.has(Number(lessonId));

  const curriculum = (
    <div className="learn-curriculum">
      <div className="learn-curriculum__head">
        <div className="learn-curriculum__title">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M4 6h16M4 12h16M4 18h10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <h2>محتوى الكورس</h2>
        </div>
        <button
          type="button"
          className="learn-curriculum__close"
          onClick={() => setDrawerOpen(false)}
          aria-label="إغلاق"
        >
          ×
        </button>
      </div>

      <div className="learn-curriculum__progress">
        <div className="learn-curriculum__progress-meta">
          <span>
            {done.size} / {flatLessons.length} درس
          </span>
          <strong>{progressPct}%</strong>
        </div>
        <div className="learn-curriculum__bar" aria-hidden="true">
          <span style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="learn-curriculum__list">
        {sections.map((section) => {
          const lessons = section.lessons || [];
          const isOpen = expanded[section.id] !== false;
          const sectionDone = lessons.filter((l) => isDone(l.id)).length;
          return (
            <div key={section.id} className="learn-section">
              <button
                type="button"
                className="learn-section__trigger"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [section.id]: !isOpen }))
                }
              >
                <span>
                  <strong>{section.title_ar || section.title}</strong>
                  <small>
                    {sectionDone}/{lessons.length} · {lessons.length} درس
                  </small>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  className={isOpen ? 'is-open' : ''}
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>

              {isOpen && (
                <ul className="learn-section__lessons">
                  {lessons.length === 0 ? (
                    <li className="learn-section__empty">لا توجد دروس</li>
                  ) : (
                    lessons.map((lesson) => {
                      const active = String(lesson.id) === String(selectedId);
                      const completed = isDone(lesson.id);
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            className={`learn-lesson${active ? ' is-active' : ''}`}
                            onClick={() => selectLesson(lesson.id)}
                          >
                            <span
                              role="button"
                              tabIndex={0}
                              className={`learn-lesson__check${completed ? ' is-done' : ''}`}
                              title={completed ? 'مكتمل' : 'وضع علامة كمكتمل'}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDone(lesson.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleDone(lesson.id);
                                }
                              }}
                            >
                              {completed ? '✓' : ''}
                            </span>
                            <span className="learn-lesson__body">
                              <span className="learn-lesson__name">{lesson.title_ar}</span>
                              <span className="learn-lesson__meta">
                                <LessonTypeIcon type={lesson.lesson_type} />
                                {TYPE_LABELS[lesson.lesson_type] || 'درس'}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="learn-page learn-page--center">
        <div className="learn-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="learn-page learn-page--center">
        <p className="learn-error">{error}</p>
        <button
          type="button"
          className="learn-btn learn-btn--primary"
          onClick={() => navigate('/student/courses')}
        >
          العودة لكورساتي
        </button>
      </div>
    );
  }

  const pdfSrc = mediaUrl(selected?.content_url);

  return (
    <div className="learn-page" dir="rtl">
      <header className="learn-topbar">
        <button
          type="button"
          className="learn-topbar__back"
          onClick={() => navigate('/student/courses')}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <span>كورساتي</span>
        </button>

        <div className="learn-topbar__divider" />

        <div className="learn-topbar__titles">
          <h1>{course?.title_ar}</h1>
          <p>
            {course?.grade_name || '—'}
            {user?.name ? ` — ${user.name}` : ''}
          </p>
        </div>

        <div className="learn-topbar__progress">
          <div className="learn-topbar__bar" aria-hidden="true">
            <span style={{ width: `${progressPct}%` }} />
          </div>
          <strong>{progressPct}%</strong>
        </div>

        <button
          type="button"
          className="learn-topbar__menu"
          onClick={() => setDrawerOpen(true)}
        >
          المحتوى
        </button>
      </header>

      <div className="learn-body">
        <main className="learn-main">
          {!selected ? (
            <div className="learn-empty">
              <p>لا يوجد محتوى منشور في هذا الكورس بعد</p>
            </div>
          ) : (
            <>
              <div className="learn-stage">
                <div className="learn-stage__inner">
                  {(selected.lesson_type === 'video' || selected.lesson_type === 'record')
                  && selected.has_media ? (
                    playerUrl ? (
                      <div className="learn-stage__frame">
                        <iframe
                          key={playerUrl}
                          title={selected.title_ar}
                          src={playerUrl}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="learn-stage__frame learn-stage__frame--loading">
                        {playerError || (playerLoading ? (
                          <div className="learn-spinner learn-spinner--light" />
                        ) : null)}
                      </div>
                    )
                  ) : selected.lesson_type === 'pdf' && pdfSrc ? (
                    <iframe
                      title={selected.title_ar}
                      src={pdfSrc}
                      className="learn-stage__pdf"
                    />
                  ) : (
                    <div className="learn-stage__placeholder">
                      <LessonTypeIcon type={selected.lesson_type} />
                    </div>
                  )}
                </div>
              </div>

              <div className="learn-panel">
                <div className="learn-panel__head">
                  <div>
                    <p className="learn-panel__meta">
                      {selected.sectionTitle} · {TYPE_LABELS[selected.lesson_type] || 'درس'}
                    </p>
                    <h2>{selected.title_ar}</h2>
                  </div>
                  <button
                    type="button"
                    className={`learn-complete-btn${isDone(selected.id) ? ' is-done' : ''}`}
                    onClick={() => toggleDone(selected.id)}
                  >
                    <span className="learn-complete-btn__icon">
                      {isDone(selected.id) ? '✓' : '○'}
                    </span>
                    {isDone(selected.id) ? 'مكتمل' : 'وضع علامة كمكتمل'}
                  </button>
                </div>

                {selected.lesson_type === 'quiz' && (
                  <div className="learn-action-card">
                    <div>
                      <strong>اختبار هذا الدرس</strong>
                      <p>ابدأ الاختبار من صفحة الامتحانات</p>
                    </div>
                    <Link to="/student/exams" className="learn-btn learn-btn--accent">
                      بدء الاختبار
                    </Link>
                  </div>
                )}

                {selected.lesson_type === 'assignment' && (
                  <div className="learn-action-card">
                    <div>
                      <strong>واجب هذا الدرس</strong>
                      <p>قم بحل الواجب من صفحة الواجبات</p>
                    </div>
                    <Link to="/student/assignments" className="learn-btn learn-btn--primary">
                      حل الواجب
                    </Link>
                  </div>
                )}

                {selected.lesson_type === 'pdf' && pdfSrc && (
                  <a
                    href={pdfSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="learn-external-link"
                  >
                    فتح الملف في تبويب جديد
                  </a>
                )}

                {selected.content_text && (
                  <div className="learn-text-card">
                    <p>{selected.content_text}</p>
                  </div>
                )}

                <div className="learn-nav">
                  <button
                    type="button"
                    className="learn-btn learn-btn--ghost"
                    disabled={currentIndex <= 0}
                    onClick={() => selectLesson(flatLessons[currentIndex - 1].id)}
                  >
                    الدرس السابق
                  </button>
                  <button
                    type="button"
                    className="learn-btn learn-btn--accent"
                    disabled={
                      currentIndex >= flatLessons.length - 1 && isDone(selected.id)
                    }
                    onClick={markDoneAndNext}
                  >
                    {currentIndex >= flatLessons.length - 1 ? 'إنهاء' : 'التالي'}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <aside className="learn-sidebar">{curriculum}</aside>
      </div>

      {drawerOpen && (
        <div className="learn-drawer">
          <button
            type="button"
            className="learn-drawer__backdrop"
            aria-label="إغلاق"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="learn-drawer__panel">{curriculum}</div>
        </div>
      )}
    </div>
  );
}
