import { BookOpen, CircleCheckBig, Clock3, GraduationCap, RefreshCcw } from "lucide-react";

function formatRatio(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

export default function StatsOverview({ stats, masteryRate, loading }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span className="text-sm">累计错题</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? "--" : Number(stats?.total_wrong_questions || 0)}
          </div>
          <div className="mt-2 text-xs text-gray-500">当前账号下已录入的真实错题数量</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <CircleCheckBig className="h-5 w-5 text-emerald-600" />
            <span className="text-sm">掌握率</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{loading ? "--" : formatRatio(masteryRate)}</div>
          <div className="mt-2 text-xs text-gray-500">
            已掌握 {Number(stats?.mastered_count || 0)} 道 / 总共 {Number(stats?.total_wrong_questions || 0)} 道
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Clock3 className="h-4 w-4 text-amber-500" />
            <span className="text-sm">复习中</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{loading ? "--" : Number(stats?.reviewing_count || 0)}</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <RefreshCcw className="h-4 w-4 text-blue-500" />
            <span className="text-sm">练习次数</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{loading ? "--" : Number(stats?.study_records_count || 0)}</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <GraduationCap className="h-4 w-4 text-violet-500" />
            <span className="text-sm">新错题</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{loading ? "--" : Number(stats?.new_count || 0)}</div>
        </div>
      </div>
    </>
  );
}
