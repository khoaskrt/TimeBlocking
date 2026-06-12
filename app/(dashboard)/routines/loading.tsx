export default function RoutinesLoading() {
  return (
    <div className="flex-1 overflow-hidden bg-zinc-50">
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-zinc-200 bg-white px-5 py-4 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="h-8 bg-zinc-200 rounded w-32" />
            <div className="h-9 bg-zinc-200 rounded w-20" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-5 bg-zinc-200 rounded w-24" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="h-24 bg-zinc-200 rounded" />
              <div className="h-24 bg-zinc-200 rounded" />
              <div className="h-24 bg-zinc-200 rounded" />
              <div className="h-24 bg-zinc-200 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-5 bg-zinc-200 rounded w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="h-24 bg-zinc-200 rounded" />
              <div className="h-24 bg-zinc-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
