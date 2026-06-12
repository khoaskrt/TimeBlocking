export default function ProjectsLoading() {
  return (
    <div className="flex-1 overflow-hidden bg-zinc-50">
      <div className="mx-auto max-w-[880px] px-10 py-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-36 rounded bg-zinc-200" />
          <div className="h-5 w-10 rounded-full bg-zinc-200" />
          <span className="flex-1" />
          <div className="h-8 w-24 rounded bg-zinc-200" />
          <div className="h-8 w-28 rounded bg-zinc-200" />
        </div>
        <div className="mt-8 space-y-7">
          {[0, 1, 2].map((group) => (
            <div key={group} className="space-y-3">
              <div className="h-4 w-32 rounded bg-zinc-200" />
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-12 rounded-lg bg-zinc-100" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
