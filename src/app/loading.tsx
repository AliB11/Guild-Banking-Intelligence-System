export default function Loading() {
  return (
    <main className="space-y-5" aria-label="در حال بارگذاری">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-44 rounded-full bg-white/[0.08]" />
        <div className="h-8 w-80 max-w-full rounded-lg bg-white/[0.08]" />
        <div className="h-4 w-[34rem] max-w-full rounded-lg bg-white/[0.05]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="glass h-32 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass h-80 animate-pulse lg:col-span-2" />
        <div className="glass h-80 animate-pulse" />
      </div>
    </main>
  );
}
