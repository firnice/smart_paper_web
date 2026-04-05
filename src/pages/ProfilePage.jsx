import { BarChart2, Percent, BookOpen, Flame } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RADAR_DATA } from "../data/figmaMock.js";

const WEEK_TREND = [
  { day: "周一", errors: 8, resolved: 8 },
  { day: "周二", errors: 6, resolved: 4 },
  { day: "周三", errors: 4, resolved: 4 },
  { day: "周四", errors: 9, resolved: 8 },
  { day: "周五", errors: 7, resolved: 10 },
  { day: "周六", errors: 12, resolved: 12 },
  { day: "周日", errors: 5, resolved: 4 },
];

const radarDataFormatted = RADAR_DATA.map((d) => ({ ...d, fullMark: 100 }));

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="h-5 w-5 text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900">学情画像</h1>
        </div>
        <p className="text-sm text-gray-500">
          本月累计记录错题 142 道，已解决 98 道，综合掌握度提升 12%。
        </p>
      </div>

      {/* 三卡片统计 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 近期平均正确率 - 紫色渐变 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 text-white">
          <Percent className="absolute right-4 top-4 h-16 w-16 text-white/20" />
          <div className="flex items-center gap-2 mb-2 text-sm text-indigo-100">
            <Percent className="h-4 w-4" />
            近期平均正确率
          </div>
          <div className="text-4xl font-bold mb-1">78%</div>
          <div className="text-sm text-indigo-200">较上月提升 5% ↑</div>
        </div>

        {/* 本周错题消灭率 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            本周错题消灭率
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">62%</div>
          <div className="text-sm text-emerald-500 font-medium">击败了 85% 的同学</div>
        </div>

        {/* 连续记录天数 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
            <Flame className="h-4 w-4 text-amber-500" />
            连续记录天数
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            14 <span className="text-2xl font-normal text-gray-600">天</span>
          </div>
          <div className="inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-600">
            继续保持！
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 能力雷达图 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🎯</span>
            <h2 className="font-semibold text-gray-900">能力雷达分布</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarDataFormatted}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#6b7280", fontSize: 13 }}
              />
              <Radar
                name="能力值"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 本周错题处理趋势折线图 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">📈</span>
            <h2 className="font-semibold text-gray-900">本周错题处理趋势</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={WEEK_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (value === "errors" ? "错题数" : "解决数")}
              />
              <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} name="errors" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} name="resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
