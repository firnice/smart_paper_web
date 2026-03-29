const STAT_ITEMS = [
  {
    key: "total",
    label: "错题总数",
    color: "#6366F1",
    bgColor: "#EEF2FF",
    iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    key: "new_count",
    label: "今日新增",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    iconPath: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "reviewing_count",
    label: "未掌握",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "mastery_rate",
    label: "掌握率",
    suffix: "%",
    color: "#10B981",
    bgColor: "#ECFDF5",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

function StatIcon({ path, color }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d={path} />
    </svg>
  );
}

export default function StatsBar({ stats }) {
  if (!stats) {
    return (
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-4 grid grid-cols-4 gap-2">
      {STAT_ITEMS.map(({ key, label, color, bgColor, suffix, iconPath }) => (
        <div
          key={key}
          className="flex flex-col items-center justify-center rounded-2xl py-3 px-1"
          style={{ background: bgColor, border: `1px solid ${color}20` }}
        >
          <StatIcon path={iconPath} color={color} />
          <strong className="mt-1.5 text-[18px] font-bold leading-none" style={{ color }}>
            {stats[key] ?? 0}{suffix || ""}
          </strong>
          <span className="mt-1 text-center text-[10px] leading-tight text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
}
