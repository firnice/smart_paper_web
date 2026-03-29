function formatRatio(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function StatIcon({ path, color }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={path} />
    </svg>
  );
}

export default function StatsOverview({ stats, masteryRate, loading }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Top 2 big cards */}
      <div
        className="rounded-2xl bg-white px-4 py-4"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}
      >
        <StatIcon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" color="#6366F1" />
        <p className="mt-2 text-[26px] font-bold" style={{ color: "#6366F1" }}>
          {loading ? "—" : Number(stats?.total_wrong_questions || 0)}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">累计错题</p>
      </div>

      <div
        className="rounded-2xl bg-white px-4 py-4"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}
      >
        <StatIcon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="#10B981" />
        <p className="mt-2 text-[26px] font-bold" style={{ color: "#10B981" }}>
          {loading ? "—" : formatRatio(masteryRate)}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">掌握率</p>
        <p className="text-[10px] text-gray-300">
          {Number(stats?.mastered_count || 0)} / {Number(stats?.total_wrong_questions || 0)} 题
        </p>
      </div>

      {/* Bottom 4 small cards */}
      {[
        { key: "reviewing_count", label: "复习中", color: "#F59E0B", path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
        { key: "study_records_count", label: "练习次数", color: "#3B82F6", path: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
        { key: "new_count", label: "新错题", color: "#EF4444", path: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" },
        { key: "mastered_count", label: "已掌握", color: "#10B981", path: "M5 13l4 4L19 7" },
      ].map(({ key, label, color, path }) => (
        <div
          key={key}
          className="flex flex-col rounded-2xl bg-white px-4 py-3"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)" }}
        >
          <StatIcon path={path} color={color} />
          <span className="mt-2 text-[20px] font-bold" style={{ color }}>
            {loading ? "—" : Number(stats?.[key] || 0)}
          </span>
          <span className="mt-0.5 text-[11px] text-gray-400">{label}</span>
        </div>
      ))}
    </div>
  );
}
