import { useEffect, useState } from 'react';
import { adminResource, fetchAdminSubscribers } from '../../api/adminApi';
import AdminCrudPage from '../../admin/AdminCrudPage';

const paymentsApi = adminResource('payments');
const coursesApi = adminResource('courses');
const couponsApi = adminResource('coupons');

export default function AdminPayments() {
  const [options, setOptions] = useState({ subscribers: [], courses: [], coupons: [] });

  useEffect(() => {
    Promise.all([fetchAdminSubscribers(), coursesApi.list(), couponsApi.list()])
      .then(([subs, courses, coupons]) => {
        setOptions({
          subscribers: (subs.data || []).map((s) => ({ value: String(s.id), label: `${s.name} (${s.email})` })),
          courses: (courses.data || []).map((c) => ({ value: String(c.id), label: c.title_ar })),
          coupons: (coupons.data || []).map((c) => ({ value: String(c.id), label: c.code })),
        });
      })
      .catch(console.error);
  }, []);

  return (
    <AdminCrudPage
      title="المدفوعات"
      resource={paymentsApi}
      emptyForm={{
        subscriber_id: '',
        course_id: '',
        coupon_id: '',
        amount: 0,
        method: 'cash',
        status: 'paid',
        note: '',
      }}
      fields={[
        { key: 'subscriber_id', label: 'المشترك', type: 'select', optionsKey: 'subscribers' },
        { key: 'course_id', label: 'الكورس', type: 'select', optionsKey: 'courses' },
        { key: 'coupon_id', label: 'كوبون', type: 'select', optionsKey: 'coupons' },
        { key: 'amount', label: 'المبلغ', type: 'number', required: true },
        {
          key: 'method',
          label: 'طريقة الدفع',
          type: 'select',
          optionsKey: 'methods',
        },
        {
          key: 'status',
          label: 'الحالة',
          type: 'select',
          optionsKey: 'statuses',
        },
        { key: 'note', label: 'ملاحظة', type: 'textarea', full: true },
      ]}
      options={{
        ...options,
        methods: [
          { value: 'cash', label: 'كاش' },
          { value: 'instapay', label: 'إنستاباي' },
          { value: 'card', label: 'بطاقة' },
          { value: 'transfer', label: 'تحويل' },
        ],
        statuses: [
          { value: 'pending', label: 'قيد الانتظار' },
          { value: 'paid', label: 'مدفوع' },
          { value: 'failed', label: 'فشل' },
          { value: 'refunded', label: 'مسترجع' },
        ],
      }}
      columns={[
        { key: 'id', label: '#' },
        { key: 'subscriber_name', label: 'المشترك' },
        { key: 'course_title', label: 'الكورس' },
        { key: 'amount', label: 'المبلغ', render: (r) => `${r.amount} ج.م` },
        { key: 'method', label: 'الطريقة' },
        { key: 'status', label: 'الحالة' },
        { key: 'coupon_code', label: 'كوبون', render: (r) => r.coupon_code || '—' },
      ]}
    />
  );
}
