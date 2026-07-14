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
        { key: "title_ar", label: "العنوان بالعربي", required: true },
        { key: "title_en", label: "العنوان بالإنجليزي" },
        { key: "description_ar", label: "الوصف", type: "textarea", full: true },
        { key: "price", label: "السعر", type: "number" },
        { key: "lessons_count", label: "عدد الدروس", type: "number" },
        {
          key: "image_url",
          label: "صورة الكورس",
          type: "file",
          uploadKind: "image",
          accept: "image/*",
          required: true,
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
      extraRowActions={(row) => (
        <Link
          to={`/admin/courses/${row.id}/sections`}
          className="dash-btn dash-btn--primary dash-btn--sm"
        >
          أجزاء الكورس
        </Link>
      )}
      columns={[
        { key: "id", label: "#" },
        { key: "title_ar", label: "العنوان" },
        { key: "grade_name", label: "الصف" },
        { key: "sections_count", label: "الأجزاء", render: (r) => r.sections_count ?? 0 },
        { key: "price", label: "السعر", render: (r) => `${r.price} ج.م` },
        {
          key: "image_url",
          label: "الصورة",
          render: (r) =>
            r.image_url ? (
              <img src={r.image_url} alt="" className="dash-table-thumb" />
            ) : (
              "—"
            ),
        },
        {
          key: "pdf_url",
          label: "PDF",
          render: (r) => (r.pdf_url ? fileLinkLabel(r.pdf_url) : "—"),
        },
        {
          key: "link_url",
          label: "لينك",
          render: (r) =>
            r.link_url ? (
              <a href={r.link_url} target="_blank" rel="noreferrer" className="dash-file-link">
                فتح
              </a>
            ) : (
              "—"
            ),
        },
        {
          key: "is_featured",
          label: "مميز",
          render: (r) => (r.is_featured ? "نعم" : "لا"),
        },
      ]}
    />
  );
}
