export const GOVERNORATES = [
  { value: 'القاهرة', label_ar: 'القاهرة', label_en: 'Cairo' },
  { value: 'الجيزة', label_ar: 'الجيزة', label_en: 'Giza' },
  { value: 'الإسكندرية', label_ar: 'الإسكندرية', label_en: 'Alexandria' },
  { value: 'الدقهلية', label_ar: 'الدقهلية', label_en: 'Dakahlia' },
  { value: 'الشرقية', label_ar: 'الشرقية', label_en: 'Sharqia' },
  { value: 'القليوبية', label_ar: 'القليوبية', label_en: 'Qalyubia' },
  { value: 'المنوفية', label_ar: 'المنوفية', label_en: 'Monufia' },
  { value: 'الغربية', label_ar: 'الغربية', label_en: 'Gharbia' },
  { value: 'كفر الشيخ', label_ar: 'كفر الشيخ', label_en: 'Kafr El Sheikh' },
  { value: 'البحيرة', label_ar: 'البحيرة', label_en: 'Beheira' },
  { value: 'الإسماعيلية', label_ar: 'الإسماعيلية', label_en: 'Ismailia' },
  { value: 'بورسعيد', label_ar: 'بورسعيد', label_en: 'Port Said' },
  { value: 'السويس', label_ar: 'السويس', label_en: 'Suez' },
  { value: 'دمياط', label_ar: 'دمياط', label_en: 'Damietta' },
  { value: 'الفيوم', label_ar: 'الفيوم', label_en: 'Fayoum' },
  { value: 'بني سويف', label_ar: 'بني سويف', label_en: 'Beni Suef' },
  { value: 'المنيا', label_ar: 'المنيا', label_en: 'Minya' },
  { value: 'أسيوط', label_ar: 'أسيوط', label_en: 'Assiut' },
  { value: 'سوهاج', label_ar: 'سوهاج', label_en: 'Sohag' },
  { value: 'قنا', label_ar: 'قنا', label_en: 'Qena' },
  { value: 'الأقصر', label_ar: 'الأقصر', label_en: 'Luxor' },
  { value: 'أسوان', label_ar: 'أسوان', label_en: 'Aswan' },
  { value: 'البحر الأحمر', label_ar: 'البحر الأحمر', label_en: 'Red Sea' },
  { value: 'الوادي الجديد', label_ar: 'الوادي الجديد', label_en: 'New Valley' },
  { value: 'مطروح', label_ar: 'مطروح', label_en: 'Matrouh' },
  { value: 'شمال سيناء', label_ar: 'شمال سيناء', label_en: 'North Sinai' },
  { value: 'جنوب سيناء', label_ar: 'جنوب سيناء', label_en: 'South Sinai' },
];

export function pickGovernorateLabel(item, lang) {
  return lang === 'en' ? item.label_en : item.label_ar;
}
