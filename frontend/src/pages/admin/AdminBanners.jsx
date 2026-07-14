import { adminResource } from '../../api/adminApi';
import AdminCrudPage from '../../admin/AdminCrudPage';

const bannersApi = adminResource('banners');

export default function AdminBanners() {
  return (
    <AdminCrudPage
      title="البانرات"
      addLabel="إضافة بانر"
      resource={bannersApi}
      emptyForm={{
        title_ar: '',
        image_url: '',
        sort_order: 0,
        is_active: true,
      }}
      fields={[
        { key: 'title_ar', label: 'العنوان', required: true },
        {
          key: 'image_url',
          label: 'صورة البانر',
          type: 'file',
          uploadKind: 'image',
          accept: 'image/*',
          required: true,
        },
        { key: 'sort_order', label: 'الترتيب', type: 'number' },
        { key: 'is_active', label: 'مفعل', type: 'checkbox' },
      ]}
      columns={[
        { key: 'id', label: '#' },
        { key: 'title_ar', label: 'العنوان' },
        {
          key: 'image_url',
          label: 'الصورة',
          render: (r) => (r.image_url ? (
            <img src={r.image_url} alt="" className="dash-table-thumb" />
          ) : '—'),
        },
        { key: 'sort_order', label: 'ترتيب' },
        { key: 'is_active', label: 'الحالة', render: (r) => (r.is_active ? 'مفعل' : 'متوقف') },
      ]}
    />
  );
}
