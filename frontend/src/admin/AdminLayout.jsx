import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { adminResource, getAdminUser } from '../api/adminApi';
import { useApp } from '../context/AppContext';
import { AUTH_EVENT, unifiedLogout } from '../api/unifiedAuth';
import {
  IconAssignments,
  IconBanners,
  IconBell,
  IconChevronDown,
  IconCoupons,
  IconCourses,
  IconExams,
  IconGlobe,
  IconGrades,
  IconHome,
  IconLogout,
  IconMenu,
  IconMoon,
  IconNotifications,
  IconOverview,
  IconPayments,
  IconSearch,
  IconSun,
  IconUsers,
} from './DashboardIcons';
import './admin.css';

const notificationsApi = adminResource('notifications');

const navGroups = [
  {
    title: 'الرئيسية',
    items: [
      { title: 'لوحة الإحصائيات', href: '/admin/dashboard', icon: IconOverview },
    ],
  },
  {
    title: 'المستخدمون',
    items: [
      { title: 'المستخدمين', href: '/admin/subscribers', icon: IconUsers },
    ],
  },
  {
    title: 'التدريس',
    items: [
      { title: 'الكورسات', href: '/admin/courses', icon: IconCourses },
      { title: 'الصفوف', href: '/admin/grades', icon: IconGrades },
      { title: 'الواجبات', href: '/admin/assignments', icon: IconAssignments },
      { title: 'الامتحانات', href: '/admin/exams', icon: IconExams },
    ],
  },
  {
    title: 'المدفوعات',
    items: [
      { title: 'المدفوعات والاشتراكات', href: '/admin/payments', icon: IconPayments },
      { title: 'الكوبونات', href: '/admin/coupons', icon: IconCoupons },
    ],
  },
  {
    title: 'التواصل',
    items: [
      { title: 'الإشعارات', href: '/admin/notifications', icon: IconNotifications },
      { title: 'البانرات', href: '/admin/banners', icon: IconBanners },
    ],
  },
];

const flatNav = navGroups.flatMap((g) => g.items);

function getInitial(name) {
  return (name || 'أ').trim().charAt(0).toUpperCase();
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAdminUser();
  const { lang, toggleLang } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('dash-theme') === 'dark');
  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const isDashboard = location.pathname === '/admin/dashboard';

  useEffect(() => {
    localStorage.setItem('dash-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeMenus = () => {
      setProfileOpen(false);
      setNotifOpen(false);
    };
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  useEffect(() => {
    notificationsApi.list()
      .then((res) => setNotifications((res.data || []).slice(0, 8)))
      .catch(() => {});
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

  const unreadCount = notifications.filter((n) => !n.is_sent).length;

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
                  <span>لوحة الإدارة</span>
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
              <a href="/" className="dash-back-site">← العودة للموقع</a>
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
              <div className="dash-dropdown">
                <button
                  type="button"
                  className="dash-profile-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifOpen(false);
                    setProfileOpen((v) => !v);
                  }}
                >
                  <span className="dash-avatar">{getInitial(user?.name)}</span>
                  <span className="dash-profile-btn__text">
                    <strong>{user?.name || 'المدير'}</strong>
                    <small>أدمن</small>
                  </span>
                  <IconChevronDown />
                </button>
                {profileOpen && (
                  <div className="dash-dropdown__menu" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="dash-dropdown__item" onClick={handleLogout}>
                      <IconLogout />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>

              <div className="dash-dropdown">
                <button
                  type="button"
                  className="dash-icon-btn dash-icon-btn--badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen(false);
                    setNotifOpen((v) => !v);
                  }}
                  aria-label="الإشعارات"
                >
                  <IconBell />
                  {unreadCount > 0 && <span className="dash-badge-count">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="dash-dropdown__menu dash-dropdown__menu--wide" onClick={(e) => e.stopPropagation()}>
                    <div className="dash-dropdown__title">الإشعارات</div>
                    {notifications.length === 0 ? (
                      <p className="dash-dropdown__empty">لا توجد إشعارات</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="dash-notif-item">
                          <strong>{n.title_ar}</strong>
                          <span>{n.body_ar}</span>
                        </div>
                      ))
                    )}
                    <Link to="/admin/notifications" className="dash-dropdown__footer">
                      عرض الكل
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/" className="dash-icon-btn" aria-label="الموقع">
                <IconHome />
              </Link>

              <button
                type="button"
                className="dash-icon-btn"
                onClick={() => setDark((v) => !v)}
                aria-label="تبديل الوضع"
              >
                {dark ? <IconSun /> : <IconMoon />}
              </button>

              <button
                type="button"
                className="dash-icon-btn"
                onClick={toggleLang}
                aria-label="تبديل اللغة"
                title={lang === 'ar' ? 'English' : 'العربية'}
              >
                <IconGlobe />
              </button>
            </div>
          </header>

          <main className="dash-content">
            {isDashboard && (
              <div className="dash-page-intro">
                <h1>مرحباً، {user?.name || 'المدير'}</h1>
                <p>لوحة تحكم الأدمن — وائل علي ماث</p>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
