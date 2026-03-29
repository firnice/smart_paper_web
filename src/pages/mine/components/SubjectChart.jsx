const SUBJECT_COLORS = [
  { bar: "#6366F1", bg: "#EEF2FF" },
  { bar: "#10B981", bg: "#ECFDF5" },
  { bar: "#F59E0B", bg: "#FFFBEB" },
  { bar: "#3B82F6", bg: "#EFF6FF" },
];

export default function SubjectChart({ topSubjects }) {
  return (
    <div
      className="rounded-2xl bg-white px-4 py-4"
      style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}
    >
      <h2 className="mb-4 text-[14px] font-bold text-gray-800">学科分布</h2>
      {topSubjects.length ? (
        <div className="space-y-4">
          {topSubjects.map((item, idx) => {
            const c = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
            return (
              <div key={item.subject}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: c.bg, color: c.bar }}
                    >
                      {item.subject}
                    </span>
                    <span className="text-[11px] text-gray-400">{item.mastered}/{item.total} 已掌握</span>
                  </div>
                  <span className="text-[12px] font-bold" style={{ color: c.bar }}>{item.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.progress}%`, background: c.bar }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] text-gray-400">还没有学科统计，先录入一些错题。</p>
      )}
    </div>
  );
}
