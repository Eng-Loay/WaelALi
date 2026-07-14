import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchDashboardCharts, fetchDashboardOverview } from '../../api/adminApi';
import {
  IconAssignments,
  IconCoupons,
  IconCourses,
  IconExams,
  IconGrades,
  IconPayments,
  IconRevenue,
  IconUsers,
} from '../../admin/DashboardIcons';

const statCards = [
  { key: 'totalUsers', title: 'المشتركين', icon: IconUsers, tone: 'red' },
  { key: 'totalCourses', title: 'الكورسات', icon: IconCourses, tone: 'navy' },
  { key: 'totalGrades', title: 'الصفوف', icon: IconGrades, tone: 'navy' },
  { key: 'totalAssignments', title: 'الواجبات', icon: IconAssignments, tone: 'red' },
  { key: 'totalExams', title: 'الاختبارات', icon: IconExams, tone: 'navy' },
  { key: 'totalCoupons', title: 'الكوبونات', icon: IconCoupons, tone: 'red' },
  { key: 'totalPayments', title: 'المدفوعات', icon: IconPayments, tone: 'navy' },
  { key: 'totalRevenue', title: 'الإيرادات', icon: IconRevenue, tone: 'red', suffix: ' ج.م' },
];

function StatCard({ title, value, suffix = '', icon: Icon, tone }) {
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-card__head">
        <p>{title}</p>
        <span className={`dash-stat-card__icon${tone === 'navy' ? ' dash-stat-card__icon--navy' : ''}`}>
          <Icon />
        </span>
      </div>
      <h3>
        {value}
        {suffix}
      </h3>
    </div>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchDashboardOverview(), fetchDashboardCharts()])
      .then(([ov, ch]) => {
        setOverview(ov.data);
        setCharts(ch.data);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="admin-alert error">{error}</div>;
  if (!overview || !charts) return <div className="admin-loading">جاري تحميل لوحة التحكم...</div>;

  return (
    <div className="admin-dashboard">
      <div className="dash-card-grid">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            value={overview[card.key] ?? 0}
            suffix={card.suffix}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="dash-charts-grid">
        <div className="dash-panel">
          <h3>نمو المشتركين</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.usersGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#E63946" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-panel">
          <h3>الإيرادات</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#1D3557" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-panel dash-chart-wide">
          <h3>توزيع الدورات حسب الصف</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={charts.courseCompletion}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {charts.courseCompletion.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
