export default function Loading() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="space-y-4">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-96 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-7 w-36 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
