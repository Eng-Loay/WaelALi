export const STAGES = [
  {
    key: 'secondary',
    name_ar: 'المرحلة الثانوية',
    name_en: 'Secondary School',
    description_ar: 'الصف الأول والثاني والثالث الثانوي',
    description_en: 'Grades 10, 11, and 12',
    icon: '🎓',
    color: '#1D3557',
    sort: 1,
  },
  {
    key: 'preparatory',
    name_ar: 'المرحلة الإعدادية',
    name_en: 'Preparatory School',
    description_ar: 'الصف الأول والثاني والثالث الإعدادي',
    description_en: 'Grades 7, 8, and 9',
    icon: '📘',
    color: '#E63946',
    sort: 2,
  },
];

/** Secondary (bigger) → Preparatory (smaller) */
export function getStagesBigToSmall() {
  return [...STAGES].sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

export function getStageByKey(key) {
  return STAGES.find((stage) => stage.key === key) || null;
}

export function pickStageName(stage, lang) {
  return lang === 'en' ? stage.name_en : stage.name_ar;
}

export function pickStageDescription(stage, lang) {
  return lang === 'en' ? stage.description_en : stage.description_ar;
}
