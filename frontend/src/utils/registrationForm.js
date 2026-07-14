export const emptyRegistrationForm = {
  first_name: '',
  last_name: '',
  phone: '',
  parent_phone: '',
  governorate: '',
  grade_id: '',
  address: '',
  email: '',
  password: '',
  confirm_password: '',
};

export function buildFullName(form) {
  return `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
}

export function validateRegistrationForm(form, { requirePassword = true, requireEmail = false } = {}) {
  if (!form.first_name.trim()) return 'الاسم الأول مطلوب';
  if (!form.last_name.trim()) return 'الاسم الأخير مطلوب';
  if (!form.phone.trim()) return 'رقم الهاتف مطلوب';
  if (!form.parent_phone.trim()) return 'رقم ولي الأمر مطلوب';
  if (!form.governorate) return 'اختار المحافظة';
  if (!form.grade_id) return 'اختار الصف الدراسي';
  if (!form.address.trim()) return 'العنوان مطلوب';
  if (requireEmail && !form.email.trim()) return 'البريد الإلكتروني مطلوب لإنشاء الحساب';
  if (requirePassword) {
    if (!form.password) return 'كلمة المرور مطلوبة';
    if (form.password.length < 6) return 'كلمة المرور لازم تكون 6 أحرف على الأقل';
    if (form.password !== form.confirm_password) return 'كلمة المرور غير متطابقة';
  }
  return '';
}
