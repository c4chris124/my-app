import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

/**
 * Generic, soft-edged data table built on TanStack Table. Pass typed column
 * defs and rows; headers and cells render via flexRender.
 */
export function DataTable<T>({
  columns,
  data,
}: {
  columns: ColumnDef<T>[];
  data: T[];
}) {
  // TanStack Table returns non-memoizable functions; React Compiler safely
  // skips this hook. The warning is expected — silence it for clean lint.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface shadow-card">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface-container">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap border-b border-outline-variant px-stack-md py-stack-sm font-body text-label-bold uppercase tracking-wide text-on-surface-variant"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-outline-variant transition-colors last:border-b-0 hover:bg-surface-container"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="whitespace-nowrap px-stack-md py-stack-sm font-body text-body-md text-on-surface"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
