import { adminResource } from '../../api/adminApi';
import AdminCrudPage from '../../admin/AdminCrudPage';

const couponsApi = adminResource('coupons');

export default function AdminCoupons() {
  return (
    <AdminCrudPage
      title="الكوبونات"
      resource={couponsApi}
      emptyForm={{
        code: '',
        discount_type: 'percent',
        discount_value: 10,
        max_uses: 100,
        expires_at: '',
        is_active: true,
      }}
      fields={[
        { key: 'code', label: 'كود الكوبون', required: true },
        {
          key: 'discount_type',
          label: 'نوع الخصم',
          type: 'select',
          optionsKey: 'types',
          required: true,
        },
        { key: 'discount_value', label: 'قيمة الخصم', type: 'number', required: true },
        { key: 'max_uses', label: 'أقصى استخدام', type: 'number' },
        { key: 'expires_at', label: 'تاريخ الانتهاء', type: 'date' },
        { key: 'is_active', label: 'مفعل', type: 'checkbox' },
      ]}
      options={{
        types: [
          { value: 'percent', label: 'نسبة %' },
          { value: 'fixed', label: 'مبلغ ثابت' },
        ],
      }}
      columns={[
        { key: 'id', label: '#' },
        { key: 'code', label: 'الكود' },
        {
          key: 'discount',
          label: 'الخصم',
          render: (r) => (r.discount_type === 'percent' ? `${r.discount_value}%` : `${r.discount_value} ج.م`),
        },
        { key: 'used_count', label: 'استخدم' },
        { key: 'max_uses', label: 'الحد' },
        { key: 'is_active', label: 'الحالة', render: (r) => (r.is_active ? 'مفعل' : 'متوقف') },
      ]}
    />
  );
}
