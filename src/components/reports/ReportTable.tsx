import { ReactNode } from 'react'

export interface ReportColumn<T> {
  header: string
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
}

interface ReportTableProps<T> {
  columns: ReportColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
}

function ReportTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'Nenhum registro no periodo.',
}: ReportTableProps<T>) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-600">{emptyMessage}</p>
  }

  return (
    <table className="print-table w-full border-collapse text-sm">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.header}
              className={`border border-gray-400 px-2 py-1 text-${column.align ?? 'left'}`}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => (
              <td
                key={column.header}
                className={`border border-gray-300 px-2 py-1 text-${column.align ?? 'left'}`}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ReportTable
