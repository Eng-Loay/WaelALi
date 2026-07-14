export function pickField(item, field, lang) {
  if (!item) return '';
  const arKey = `${field}_ar`;
  const enKey = `${field}_en`;
  if (lang === 'en' && item[enKey]) return item[enKey];
  return item[arKey] || item[enKey] || '';
}

export function pickGradeName(grade, lang) {
  if (!grade) return '';
  if (lang === 'en' && grade.name_en) return grade.name_en;
  return grade.name_ar || grade.name_en || '';
}

export function pickGradeShort(grade, lang) {
  const name = pickGradeName(grade, lang);
  return name.split(' - ')[0];
}
