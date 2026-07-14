import { adminResource } from '../../api/adminApi';
import AdminCrudPage from '../../admin/AdminCrudPage';

const notificationsApi = adminResource('notifications');

export default function AdminNotifications() {
  return (
    <AdminCrudPage
      title="الإشعارات"
      resource={notificationsApi}
      emptyForm={{
        title_ar: '',
        body_ar: '',
        audience: 'all',
        is_sent: false,
      }}
      fields={[
        { key: 'title_ar', label: 'العنوان', required: true },
        { key: 'body_ar', label: 'النص', type: 'textarea', full: true, required: true },
        {
          key: 'audience',
          label: 'الجمهور',
          type: 'select',
          optionsKey: 'audiences',
          required: true,
        },
        { key: 'is_sent', label: 'تم الإرسال', type: 'checkbox' },
      ]}
      options={{
        audiences: [
          { value: 'all', label: 'الجميع' },
          { value: 'subscribers', label: 'المشتركين' },
          { value: 'admins', label: 'الإدارة' },
        ],
      }}
      columns={[
        { key: 'id', label: '#' },
        { key: 'title_ar', label: 'العنوان' },
        { key: 'audience', label: 'الجمهور' },
        { key: 'is_sent', label: 'الإرسال', render: (r) => (r.is_sent ? 'تم' : 'مسودة') },
        {
          key: 'created_at',
          label: 'التاريخ',
          render: (r) => new Date(r.created_at).toLocaleDateString('ar-EG'),
        },
      ]}
    />
  );
}
