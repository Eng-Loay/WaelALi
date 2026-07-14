import { adminResource } from '../../api/adminApi';
import AdminCrudPage from '../../admin/AdminCrudPage';

const gradesApi = adminResource('grades');

const STAGE_OPTIONS = [
  { value: 'secondary', label: 'المرحلة الثانوية' },
  { value: 'preparatory', label: 'المرحلة الإعدادية' },
];

export default function AdminGrades() {
  return (
    <AdminCrudPage
      title="الصفوف الدراسية"
      addLabel="إضافة صف"
      resource={gradesApi}
      emptyForm={{
        name_ar: '',
        name_en: '',
        description_ar: '',
        icon: '📚',
        color: '#E63946',
        sort_order: 0,
        stage: 'secondary',
        year_order: 1,
      }}
      fields={[
        { key: 'name_ar', label: 'الاسم بالعربي', required: true },
        { key: 'name_en', label: 'الاسم بالإنجليزي', required: true },
        { key: 'description_ar', label: 'الوصف', type: 'textarea', full: true },
        { key: 'stage', label: 'المرحلة', type: 'select', options: STAGE_OPTIONS, required: true },
        { key: 'year_order', label: 'ترتيب الصف (1-3)', type: 'number', required: true },
        { key: 'icon', label: 'أيقونة' },
        { key: 'color', label: 'اللون', type: 'color' },
        { key: 'sort_order', label: 'الترتيب العام', type: 'number' },
      ]}
      columns={[
        { key: 'id', label: '#' },
        { key: 'icon', label: '' },
        { key: 'name_ar', label: 'الاسم' },
        { key: 'stage', label: 'المرحلة' },
        { key: 'year_order', label: 'الصف' },
        { key: 'sort_order', label: 'ترتيب' },
      ]}
    />
  );
}
