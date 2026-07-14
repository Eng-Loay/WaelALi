import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { getStudentUser } from '../api/studentApi';
import { AUTH_EVENT, unifiedLogout } from '../api/unifiedAuth';
import {
  IconAssignments,
  IconCourses,
  IconExams,
  IconExternal,
  IconLogout,
  IconMenu,
  IconMoon,
  IconOverview,
  IconSearch,
  IconSun,
} from '../admin/DashboardIcons';
import '../admin/admin.css';

const navGroups = [
  {
    title: 'التعلم',
    items: [
      { title: 'نظرة عامة', href: '/student/dashboard', icon: IconOverview },
      { title: 'كورساتي', href: '/student/courses', icon: IconCourses },
      { title: 'الواجبات', href: '/student/assignments', icon: IconAssignments },
      { title: 'الاختبارات', href: '/student/exams', icon: IconExams },
    ],
  },
];

const flatNav = navGroups.flatMap((g) => g.items);

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStudentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('dash-theme') === 'dark');
  const [search, setSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('dash-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return flatNav.filter((item) => item.title.toLowerCase().includes(q));
  }, [search]);

  const handleLogout = () => {
    unifiedLogout();
    window.dispatchEvent(new Event(AUTH_EVENT));
    navigate('/login');
  };

  return (
    <div className={`dashboard-theme dash-animate-in${dark ? ' dash-dark' : ''}`} dir="rtl">
      <div className="dash-layout">
        {sidebarOpen && (
          <button
            type="button"
            className="dash-overlay"
            aria-label="إغلاق القائمة"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`dash-sidebar${sidebarOpen ? ' dash-sidebar--open' : ''}`}>
          <div className="dash-sidebar__inner">
            <div className="dash-brand">
              <NavLink to="/" className="dash-brand__link">
                <div className="dash-brand__mark">
                  <img src={logo} alt="وائل علي ماث" />
                </div>
                <div>
                  <strong>وائل علي ماث</strong>
                  <span>حساب الطالب</span>
                </div>
              </NavLink>
            </div>

            <nav className="dashboard-sidebar-nav">
              {navGroups.map((group) => (
                <div key={group.title} className="dash-nav-group">
                  <p className="dash-nav-group__title">{group.title}</p>
                  <div className="dash-nav-group__items">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          className={({ isActive }) =>
                            `dash-nav-item${isActive ? ' dash-nav-active' : ''}`
                          }
                        >
                          <span className="dash-nav-icon">
                            <Icon />
                          </span>
                          {item.title}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="dash-sidebar-foot">
              <a href="/" className="dash-back-site">
                <IconExternal />
                العودة للموقع
              </a>
            </div>
          </div>
        </aside>

        <div className="dash-main">
          <header className="dash-header">
            <div className="dash-header__start">
              <button
                type="button"
                className="dash-icon-btn dash-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="فتح القائمة"
              >
                <IconMenu />
              </button>

              <div className="dash-search-wrap">
                <div className="dash-search">
                  <IconSearch />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث في القائمة..."
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="dash-search-results">
                    {searchResults.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => {
                          navigate(item.href);
                          setSearch('');
                        }}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dash-header__end">
              <button
                type="button"
                className="dash-icon-btn"
                onClick={() => setDark((v) => !v)}
                aria-label="تبديل الوضع"
              >
                {dark ? <IconSun /> : <IconMoon />}
              </button>
              <div className="dash-user-chip">
                <span>{user?.name || 'طالب'}</span>
                <small>طالب</small>
              </div>
              <button type="button" className="dash-logout-btn" onClick={handleLogout}>
                <IconLogout />
                <span>خروج</span>
              </button>
            </div>
          </header>

          <main className="dash-content">
            <div className="dash-page-intro">
              <h1>أهلاً، {user?.name || 'طالب'}</h1>
              <p>تابع كورساتك وتقدمك من هنا</p>
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
