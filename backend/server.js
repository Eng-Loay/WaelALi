require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

const gradesRouter = require('./routes/grades');
const coursesRouter = require('./routes/courses');
const featuresRouter = require('./routes/features');
const testimonialsRouter = require('./routes/testimonials');
const subscribeRouter = require('./routes/subscribe');
const adminRouter = require('./routes/admin');
const studentRouter = require('./routes/student');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/grades', gradesRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/features', featuresRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/student', studentRouter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', message: 'Wael Ali Math API is running', database: 'connected' });
  } catch {
    res.json({ status: 'ok', message: 'Wael Ali Math API is running', database: 'disconnected' });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1');
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM grades');
    console.log(`Database connected (${rows[0].count} grades found)`);
  } catch (error) {
    console.error('Database NOT connected:', error.message);
    console.error('Run: npm run setup-db -- YOUR_MYSQL_PASSWORD');
  }
});
