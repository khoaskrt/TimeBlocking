export default function TasksLoading() {
  return (
    <div className="flex-1 overflow-hidden bg-zinc-50">
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-zinc-200 bg-white px-5 py-4 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="h-8 bg-zinc-200 rounded w-32" />
            <div className="flex items-center gap-2">
              <div className="h-8 bg-zinc-200 rounded w-24" />
              <div className="h-8 bg-zinc-200 rounded w-24" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-5 bg-zinc-200 rounded w-32" />
            <div className="space-y-2">
              <div className="h-16 bg-zinc-200 rounded" />
              <div className="h-16 bg-zinc-200 rounded" />
              <div className="h-16 bg-zinc-200 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-zinc-200 rounded w-40" />
            <div className="space-y-2">
              <div className="h-16 bg-zinc-200 rounded" />
              <div className="h-16 bg-zinc-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
