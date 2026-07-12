const express = require("express");
const pool = require("../../config/db");
const authAdmin = require("../../middleware/authAdmin");

const router = express.Router();
router.use(authAdmin);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, g.name_ar AS grade_name,
        (SELECT COUNT(*) FROM course_sections s WHERE s.course_id = c.id) AS sections_count
      FROM courses c
      LEFT JOIN grades g ON g.id = c.grade_id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "فشل تحميل الكورسات" });
  }
});

router.get("/:courseId/sections", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order, id",
      [req.params.courseId],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "فشل تحميل أجزاء الكورس" });
  }
});

router.post("/:courseId/sections", async (req, res) => {
  const {
    title_ar, description_ar, image_url, pdf_url, link_url, video_url, sort_order,
  } = req.body;
  if (!title_ar) {
    return res.status(400).json({ success: false, message: "عنوان الجزء مطلوب" });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO course_sections
       (course_id, title_ar, description_ar, image_url, pdf_url, link_url, video_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.courseId,
        title_ar,
        description_ar || null,
        image_url || null,
        pdf_url || null,
        link_url || null,
        video_url || null,
        sort_order || 0,
      ],
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "فشل إضافة الجزء" });
  }
});

router.put("/:courseId/sections/:sectionId", async (req, res) => {
  const {
    title_ar, description_ar, image_url, pdf_url, link_url, video_url, sort_order,
  } = req.body;
  try {
    await pool.query(
      `UPDATE course_sections SET title_ar=?, description_ar=?, image_url=?, pdf_url=?, link_url=?, video_url=?, sort_order=?
       WHERE id=? AND course_id=?`,
      [
        title_ar,
        description_ar || null,
        image_url || null,
        pdf_url || null,
        link_url || null,
        video_url || null,
        sort_order || 0,
        req.params.sectionId,
        req.params.courseId,
      ],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "فشل تحديث الجزء" });
  }
});

router.delete("/:courseId/sections/:sectionId", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM course_sections WHERE id = ? AND course_id = ?",
      [req.params.sectionId, req.params.courseId],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "فشل حذف الجزء" });
  }
});

router.post("/", async (req, res) => {
  const {
    grade_id,
    title_ar,
    title_en,
    description_ar,
    price,
    lessons_count,
    image_url,
    video_url,
    pdf_url,
    link_url,
    is_featured,
  } = req.body;
  if (!grade_id || !title_ar) {
    return res
      .status(400)
      .json({ success: false, message: "الصف وعنوان الكورس مطلوبان" });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO courses
       (grade_id, title_ar, title_en, description_ar, price, lessons_count, image_url, video_url, pdf_url, link_url, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        grade_id,
        title_ar,
        title_en || null,
        description_ar || null,
        price || 0,
        lessons_count || 0,
        image_url || null,
        video_url || null,
        pdf_url || null,
        link_url || null,
        Boolean(is_featured),
      ],
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "فشل إضافة الكورس" });
  }
});

router.put("/:id", async (req, res) => {
  const {
    grade_id,
    title_ar,
    title_en,
    description_ar,
    price,
    lessons_count,
    image_url,
    video_url,
    pdf_url,
    link_url,
    is_featured,
  } = req.body;
  try {
    await pool.query(
      `UPDATE courses SET
        grade_id = ?, title_ar = ?, title_en = ?, description_ar = ?,
        price = ?, lessons_count = ?, image_url = ?, video_url = ?, pdf_url = ?, link_url = ?, is_featured = ?
       WHERE id = ?`,
      [
        grade_id,
        title_ar,
        title_en || null,
        description_ar || null,
        price || 0,
        lessons_count || 0,
        image_url || null,
        video_url || null,
        pdf_url || null,
        link_url || null,
        Boolean(is_featured),
        req.params.id,
      ],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "فشل تحديث الكورس" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "فشل حذف الكورس" });
  }
});

module.exports = router;
