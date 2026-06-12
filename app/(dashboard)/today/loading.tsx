export default function TodayLoading() {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-white font-[family-name:var(--font-inter)]">
      <div className="px-5 pt-8 pb-28 sm:px-8 md:px-11 md:pt-9 md:pb-20 flex gap-12 justify-center">
        <div className="flex-1 max-w-[620px] min-w-0 animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-3 bg-zinc-200 rounded w-16" />
            <div className="h-8 bg-zinc-200 rounded w-48" />
            <div className="h-4 bg-zinc-200 rounded w-20" />
          </div>
          <div className="h-px bg-zinc-100" />
          <div className="space-y-3">
            <div className="h-6 bg-zinc-200 rounded w-24" />
            <div className="h-14 bg-zinc-200 rounded" />
            <div className="h-14 bg-zinc-200 rounded" />
            <div className="h-14 bg-zinc-200 rounded" />
          </div>
          <div className="h-px bg-zinc-100" />
          <div className="space-y-3">
            <div className="h-6 bg-zinc-200 rounded w-32" />
            <div className="h-12 bg-zinc-200 rounded" />
            <div className="h-12 bg-zinc-200 rounded" />
            <div className="h-12 bg-zinc-200 rounded" />
          </div>
        </div>
        <div className="w-[290px] shrink-0 pt-2 space-y-6 max-lg:hidden animate-pulse">
          <div className="h-24 bg-zinc-200 rounded" />
          <div className="h-48 bg-zinc-200 rounded" />
          <div className="h-32 bg-zinc-200 rounded" />
        </div>
      </div>
    </div>
  );
}
