import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminResource } from "../../api/adminApi";
import { fileLinkLabel, uploadAdminFile } from "../../api/uploadApi";
import AdminCrudPage from "../../admin/AdminCrudPage";

const coursesApi = adminResource("courses");
const gradesApi = adminResource("grades");

export default function AdminCourses() {
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    gradesApi
      .list()
      .then((res) => setGrades(res.data || []))
      .catch(console.error);
  }, []);

  return (
    <AdminCrudPage
      title="الكورسات"
      addLabel="إضافة كورس"
      resource={coursesApi}
      emptyForm={{
        grade_id: "",
        title_ar: "",
        title_en: "",
        description_ar: "",
        price: 0,
        lessons_count: 0,
        image_url: "",
        video_url: "",
        pdf_url: "",
        link_url: "",
        is_featured: false,
      }}
      fields={[
        {
          key: "grade_id",
          label: "الصف الدراسي",
          type: "stage-grade",
          optionsKey: "grades",
          required: true,
        },
        { key: "title_ar", label: "العنوان", required: true, full: true },
        { key: "description_ar", label: "الوصف", type: "textarea", full: true },
        { key: "price", label: "السعر", type: "number" },
        { key: "lessons_count", label: "عدد الدروس", type: "number" },
        {
          key: "image_url",
          label: "صورة الكورس",
          type: "file",
          uploadKind: "image",
          accept: "image/*",
        },
        {
          key: "video_url",
          label: "فيديو الكورس",
          type: "file",
          uploadKind: "video",
          accept: "video/*",
        },
        {
          key: "pdf_url",
          label: "ملف PDF للكورس",
          type: "file",
          uploadKind: "pdf",
          accept: "application/pdf,.pdf",
        },
        {
          key: "link_url",
          label: "لينك خارجي",
          type: "url",
          placeholder: "https://...",
        },
        { key: "is_featured", label: "مميز", type: "checkbox" },
      ]}
      options={{ grades }}
      renderActions={(row, onEdit, onDelete) => (
        <>
          <Link
            to={`/admin/courses/${row.id}/content`}
            className="dash-btn dash-btn--outline dash-btn--sm"
          >
            المحتوى
          </Link>
          <button
            type="button"
            className="dash-btn dash-btn--outline dash-btn--sm"
            onClick={() => onEdit(row)}
          >
            تعديل
          </button>
          <Link
            to={`/admin/subscribers?course_id=${row.id}`}
            className="dash-btn dash-btn--outline dash-btn--sm"
          >
            الطلاب
          </Link>
          <button
            type="button"
            className="dash-btn dash-btn--danger-filled dash-btn--sm"
            onClick={() => onDelete(row.id)}
          >
            حذف
          </button>
        </>
      )}
      columns={[
        {
          key: "title_ar",
          label: "العنوان",
        },
        {
          key: "grade_name",
          label: "الصف",
        },
        {
          key: "students_count",
          label: "الطلاب",
          render: (r) => r.students_count ?? 0,
        },
        {
          key: "status",
          label: "الحالة",
          render: () => (
            <span className="dash-badge--success" style={{ fontSize: "0.875rem" }}>
              منشور
            </span>
          ),
        },
      ]}
    />
  );
}
