export function TableSkeleton({ cols = 3, rows = 10 }: { cols?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-rule">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule bg-soft">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-2.5">
                <div className="h-3 w-16 animate-pulse rounded bg-rule" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-rule">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div
                    className="h-3 animate-pulse rounded bg-rule"
                    style={{ width: `${j === 0 ? 60 : 40}%`, opacity: 1 - i * 0.06 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
