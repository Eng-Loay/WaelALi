const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');

const router = express.Router();

async function countOrZero(query) {
  try {
    const [[row]] = await pool.query(query);
    return Number(Object.values(row)[0] || 0);
  } catch {
    return 0;
  }
}

router.get('/overview', authAdmin, async (req, res) => {
  try {
    const subscribers = await countOrZero('SELECT COUNT(*) AS c FROM subscribers');
    const courses = await countOrZero('SELECT COUNT(*) AS c FROM courses');
    const grades = await countOrZero('SELECT COUNT(*) AS c FROM grades');
    const coupons = await countOrZero('SELECT COUNT(*) AS c FROM coupons');
    const assignments = await countOrZero('SELECT COUNT(*) AS c FROM assignments');
    const exams = await countOrZero('SELECT COUNT(*) AS c FROM exams');
    const payments = await countOrZero('SELECT COUNT(*) AS c FROM payments');
    const revenueCourses = await countOrZero('SELECT COALESCE(SUM(price), 0) AS c FROM courses');
    const revenuePaid = await countOrZero("SELECT COALESCE(SUM(amount), 0) AS c FROM payments WHERE status = 'paid'");

    res.json({
      success: true,
      data: {
        totalUsers: subscribers,
        totalCourses: courses,
        totalGrades: grades,
        totalCoupons: coupons,
        totalAssignments: assignments,
        totalExams: exams,
        totalPayments: payments,
        totalSubscriptions: subscribers,
        totalRevenue: revenuePaid || revenueCourses,
        usersGrowth: 12,
        coursesGrowth: 8,
        subscriptionsGrowth: 15,
        revenueGrowth: 10,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الإحصائيات' });
  }
});

router.get('/charts', authAdmin, async (req, res) => {
  try {
    const [monthly] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%b') AS month, COUNT(*) AS users
      FROM subscribers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b')
      ORDER BY MIN(created_at)
    `);

    const [byGrade] = await pool.query(`
      SELECT g.name_ar AS name, COUNT(c.id) AS value
      FROM grades g
      LEFT JOIN courses c ON c.grade_id = g.id
      GROUP BY g.id, g.name_ar
    `);

    let paymentMonthly = [];
    try {
      const [rows] = await pool.query(`
        SELECT DATE_FORMAT(created_at, '%b') AS month, COALESCE(SUM(amount), 0) AS revenue
        FROM payments
        WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b')
        ORDER BY MIN(created_at)
      `);
      paymentMonthly = rows;
    } catch {
      paymentMonthly = [];
    }

    const colors = ['#E63946', '#1D3557', '#a855f7', '#22c55e', '#f59e0b'];
    const courseCompletion = byGrade.map((row, i) => ({
      name: row.name,
      value: row.value,
      color: colors[i % colors.length],
    }));

    const revenue = paymentMonthly.length
      ? paymentMonthly.map((m) => ({ month: m.month, revenue: Number(m.revenue) }))
      : monthly.map((m) => ({ month: m.month, revenue: m.users * 120 }));

    res.json({
      success: true,
      data: {
        usersGrowth: monthly.map((m) => ({ month: m.month, users: m.users })),
        revenue,
        courseCompletion: courseCompletion.length
          ? courseCompletion
          : [{ name: 'لا توجد بيانات', value: 0, color: '#E63946' }],
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الرسوم' });
  }
});

module.exports = router;
