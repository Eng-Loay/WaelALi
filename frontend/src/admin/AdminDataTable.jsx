export default function AdminDataTable({ columns, rows, loading, emptyText = 'لا توجد بيانات', actions }) {
  if (loading) {
    return <div className="dash-table-empty">جاري التحميل...</div>;
  }

  if (!rows.length) {
    return <div className="dash-table-empty">{emptyText}</div>;
  }

  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions ? <th>إجراءات</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions ? <td className="dash-table__actions">{actions(row)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashBadge({ active, activeLabel = 'نشط', inactiveLabel = 'معطل' }) {
  return (
    <span className={`dash-badge${active ? ' dash-badge--success' : ' dash-badge--danger'}`}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
