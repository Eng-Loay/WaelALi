import { useEffect, useMemo, useState } from "react";
import { uploadAdminFile } from "../api/uploadApi";
import AdminDataTable from "./AdminDataTable";
import AdminModal from "./AdminModal";
import FileUploadField from "./FileUploadField";
import StageGradeSelect from "./StageGradeSelect";
import { getStageFromGradeId } from "./gradeHelpers";
import { IconPlus } from "./DashboardIcons";

export default function AdminCrudPage({
  title,
  resource,
  columns,
  emptyForm,
  fields,
  options = {},
  addLabel,
  showImport = false,
  onImport,
  extraRowActions,
}) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState("");

  const fieldDefs = useMemo(() => fields, [fields]);
  const stageGradeField = useMemo(
    () => fieldDefs.find((field) => field.type === "stage-grade"),
    [fieldDefs],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await resource.list();
      setRows(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFiles({});
    setEditingId(null);
    setStage("");
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const onEdit = (row) => {
    const next = { ...emptyForm };
    Object.keys(emptyForm).forEach((key) => {
      next[key] = row[key] ?? emptyForm[key];
    });
    if (stageGradeField) {
      next[stageGradeField.key] = row[stageGradeField.key]
        ? String(row[stageGradeField.key])
        : "";
      const gradeList = options[stageGradeField.optionsKey] || [];
      setStage(getStageFromGradeId(gradeList, next[stageGradeField.key]));
    }
    setForm(next);
    setFiles({});
    setEditingId(row.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };

      fieldDefs.forEach((field) => {
        if (field.type === "number")
          payload[field.key] = Number(payload[field.key] || 0);
        if (field.type === "checkbox")
          payload[field.key] = Boolean(payload[field.key]);
        if (field.type === "stage-grade") {
          payload[field.key] = payload[field.key]
            ? Number(payload[field.key])
            : null;
        }
      });

      for (const field of fieldDefs.filter((f) => f.type === "file")) {
        if (files[field.key]) {
          payload[field.key] = await uploadAdminFile(
            files[field.key],
            field.uploadKind || "image",
          );
        } else if (field.required && !payload[field.key]) {
          throw new Error(`${field.label} مطلوب`);
        }
      }

      if (editingId) await resource.update(editingId, payload);
      else await resource.create(payload);

      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await resource.remove(id);
      if (editingId === id) closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderField = (field) => {
    if (field.type === "stage-grade") {
      return (
        <StageGradeSelect
          key={field.key}
          grades={options[field.optionsKey] || []}
          stage={stage}
          gradeId={form[field.key] ?? ""}
          onStageChange={setStage}
          onGradeIdChange={(value) => onChange(field.key, value)}
          stageLabel="المرحلة الدراسية"
          gradeLabel={field.label}
          required={field.required}
        />
      );
    }

    if (field.type === "file") {
      return (
        <FileUploadField
          key={field.key}
          label={field.label}
          accept={field.accept}
          uploadKind={field.uploadKind || "image"}
          value={form[field.key]}
          file={files[field.key]}
          required={field.required}
          onFileChange={(file) =>
            setFiles((prev) => ({ ...prev, [field.key]: file }))
          }
        />
      );
    }

    return (
      <label
        key={field.key}
        className={field.full ? "admin-form-full" : undefined}
      >
        {field.label}
        {field.type === "select" ? (
          <select
            value={form[field.key] ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            required={field.required}
          >
            <option value="">{field.placeholder || "اختار..."}</option>
            {(options[field.optionsKey] || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            rows={3}
            value={form[field.key] ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            required={field.required}
          />
        ) : field.type === "checkbox" ? (
          <input
            type="checkbox"
            checked={Boolean(form[field.key])}
            onChange={(e) => onChange(field.key, e.target.checked)}
          />
        ) : (
          <input
            type={field.type || "text"}
            value={form[field.key] ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            required={field.required}
          />
        )}
      </label>
    );
  };

  return (
    <div className="dash-page">
      <div className="dash-toolbar">
        <div className="dash-toolbar__actions">
          <button
            type="button"
            className="dash-btn dash-btn--primary"
            onClick={openCreate}
          >
            <IconPlus />
            {addLabel || `إضافة`}
          </button>
          {showImport && (
            <button
              type="button"
              className="dash-btn dash-btn--outline"
              onClick={onImport}
            >
              استيراد Excel/CSV
            </button>
          )}
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      <div className="dash-panel dash-panel--table">
        <div className="dash-panel__head">
          <h2>{title}</h2>
          <span>{rows.length} عنصر</span>
        </div>

        <AdminDataTable
          columns={columns}
          rows={rows}
          loading={loading}
          actions={(row) => (
            <>
              {extraRowActions?.(row)}
              <button
                type="button"
                className="dash-btn dash-btn--outline dash-btn--sm"
                onClick={() => onEdit(row)}
              >
                تعديل
              </button>
              <button
                type="button"
                className="dash-btn dash-btn--outline dash-btn--sm dash-btn--danger"
                onClick={() => onDelete(row.id)}
              >
                حذف
              </button>
            </>
          )}
        />
      </div>

      <AdminModal
        open={modalOpen}
        title={editingId ? `تعديل — ${title}` : `إضافة — ${title}`}
        onClose={closeModal}
      >
        <form className="admin-form admin-form--modal" onSubmit={onSubmit}>
          <div className="admin-form-grid">
            {fieldDefs.map((field) => renderField(field))}
          </div>
          <div className="admin-form-actions">
            <button
              type="submit"
              className="dash-btn dash-btn--primary"
              disabled={saving}
            >
              {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة"}
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--outline"
              onClick={closeModal}
            >
              إلغاء
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
