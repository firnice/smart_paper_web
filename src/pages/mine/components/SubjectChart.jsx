export default function SubjectChart({ topSubjects }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold text-gray-900">各科学习情况</h2>
      {topSubjects.length ? (
        <div className="space-y-4">
          {topSubjects.map((item) => (
            <div key={item.subject}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.subject}</span>
                <span className="text-gray-500">{item.mastered}/{item.total} 已掌握</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">还没有学科统计，先录入一些真实错题。</div>
      )}
    </div>
  );
}
