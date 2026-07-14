import { getStagesBigToSmall } from '../data/stages';
import { filterGradesByStage, getYearLabel } from './gradeHelpers';

export default function StageGradeSelect({
  grades = [],
  stage = '',
  gradeId = '',
  onStageChange,
  onGradeIdChange,
  stageLabel = 'المرحلة الدراسية',
  gradeLabel = 'الصف الدراسي',
  required = false,
}) {
  const stageGrades = filterGradesByStage(grades, stage);
  const stages = getStagesBigToSmall();

  return (
    <>
      <label>
        {stageLabel}
        {required ? ' *' : ''}
        <select
          value={stage}
          onChange={(e) => {
            onStageChange(e.target.value);
            onGradeIdChange('');
          }}
          required={required}
        >
          <option value="">اختار المرحلة...</option>
          {stages.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name_ar}
            </option>
          ))}
        </select>
      </label>
      <label>
        {gradeLabel}
        {required ? ' *' : ''}
        <select
          value={gradeId}
          onChange={(e) => onGradeIdChange(e.target.value)}
          required={required}
          disabled={!stage}
        >
          <option value="">{stage ? 'اختار الصف...' : 'اختار المرحلة أولاً'}</option>
          {stageGrades.map((grade) => (
            <option key={grade.id} value={String(grade.id)}>
              {getYearLabel(grade.year_order)}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
