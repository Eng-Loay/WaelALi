const YEAR_LABELS = {
  1: 'الصف الأول',
  2: 'الصف الثاني',
  3: 'الصف الثالث',
};

const STAGE_RANK = { secondary: 1, preparatory: 2 };

export function getYearLabel(yearOrder) {
  return YEAR_LABELS[yearOrder] || `الصف ${yearOrder}`;
}

export function findGradeById(grades, gradeId) {
  if (!gradeId) return null;
  return grades.find((grade) => String(grade.id) === String(gradeId)) || null;
}

export function getStageFromGradeId(grades, gradeId) {
  return findGradeById(grades, gradeId)?.stage || '';
}

/** Secondary first, then within each stage: 3rd → 1st */
export function sortGradesBigToSmall(grades) {
  return [...grades].sort((a, b) => {
    const stageDiff = (STAGE_RANK[a.stage] || 99) - (STAGE_RANK[b.stage] || 99);
    if (stageDiff !== 0) return stageDiff;
    return (b.year_order || 0) - (a.year_order || 0);
  });
}

export function filterGradesByStage(grades, stage) {
  return grades
    .filter((grade) => grade.stage === stage)
    .sort((a, b) => (b.year_order || 0) - (a.year_order || 0));
}
