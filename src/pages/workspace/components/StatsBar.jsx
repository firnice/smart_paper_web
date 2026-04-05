const STAT_ITEMS = [
  {
    key: "total",
    label: "总错题",
    color: "#4F46E5",
  },
  {
    key: "new_count",
    label: "待处理",
    color: "#DC2626",
  },
  {
    key: "reviewing_count",
    label: "复习中",
    color: "#D97706",
  },
  {
    key: "mastered_count",
    label: "已掌握",
    color: "#059669",
  },
];

export default function StatsBar({ stats }) {
  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl border border-slate-200/70 bg-white shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_ITEMS.map(({ key, label, color }) => (
        <div
          key={key}
          className="rounded-3xl border border-slate-200/80 bg-white px-5 py-5 shadow-sm"
        >
          <span className="text-sm font-medium text-slate-500">{label}</span>
          <strong className="mt-3 block text-[34px] font-black leading-none tracking-tight" style={{ color }}>
            {stats[key] ?? 0}
          </strong>
        </div>
      ))}
    </section>
  );
}
