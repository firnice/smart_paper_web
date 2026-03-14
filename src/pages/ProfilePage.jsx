import { TrendingUp, CalendarDays, Target, Award } from "lucide-react";

const ACHIEVEMENTS = [
  { label: "坚持", icon: "🔥", value: "14天" },
  { label: "专注", icon: "🎯", value: "58次" },
  { label: "进步", icon: "📈", value: "+5%" },
];

const SUBJECT_PROGRESS = [
  { subject: "数学", progress: 75, color: "bg-blue-500" },
  { subject: "物理", progress: 60, color: "bg-purple-500" },
  { subject: "英语", progress: 85, color: "bg-emerald-500" },
  { subject: "化学", progress: 45, color: "bg-orange-500" },
];

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <div className="pt-2 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">我的学习</h1>
        <p className="mt-1 text-sm text-gray-500">本月已记录 142 道错题</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 text-white shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-200" />
            <span className="text-sm text-indigo-200">正确率</span>
          </div>
          <div className="text-3xl font-bold">78%</div>
          <div className="mt-2 text-xs text-indigo-200">提升 5% ↑</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-gray-600">坚持天数</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">14</div>
          <div className="mt-2 text-xs text-amber-600">继续保持！</div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          本周学习概况
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">新增错题</span>
            <span className="text-lg font-bold text-gray-900">42 道</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">已解决</span>
            <span className="text-lg font-bold text-emerald-600">26 道</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">练习次数</span>
            <span className="text-lg font-bold text-indigo-600">58 次</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <Award className="h-5 w-5 text-amber-500" />
          近期成就
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((achievement) => (
            <div key={achievement.label} className="rounded-xl bg-gray-50 p-4 text-center">
              <div className="mb-2 text-2xl">{achievement.icon}</div>
              <div className="mb-1 text-xs text-gray-500">{achievement.label}</div>
              <div className="text-sm font-bold text-gray-900">{achievement.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">各科表现</h3>

        <div className="space-y-3">
          {SUBJECT_PROGRESS.map((item) => (
            <div key={item.subject}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.subject}</span>
                <span className="text-sm font-semibold text-gray-900">{item.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
