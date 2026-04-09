import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { getLlmStatsOverview, listLlmLogs } from "../../services/api.js";

const STATUS_LABELS = {
  success: { label: "成功", cls: "bg-green-50 text-green-700" },
  http_error: { label: "HTTP错误", cls: "bg-red-50 text-red-600" },
  network_error: { label: "网络错误", cls: "bg-orange-50 text-orange-600" },
  client_error: { label: "客户端错误", cls: "bg-yellow-50 text-yellow-700" },
};

export default function LlmLogsPage() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ agent_node: "", status: "", date_from: "", date_to: "" });
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  async function fetchStats() {
    try {
      const data = await getLlmStatsOverview();
      setStats(data);
    } catch {
      // non-critical
    }
  }

  async function fetchLogs(off = 0) {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: off };
      if (filters.agent_node) params.agent_node = filters.agent_node;
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const data = await listLlmLogs(params);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    fetchLogs(0);
  }, []);

  function handleSearch() {
    setOffset(0);
    fetchLogs(0);
  }

  function handlePrev() {
    const newOffset = Math.max(0, offset - LIMIT);
    setOffset(newOffset);
    fetchLogs(newOffset);
  }

  function handleNext() {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchLogs(newOffset);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">请求日志</h1>
        <p className="mt-1 text-sm text-slate-500">LLM API 调用统计与明细</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="总调用" value={stats.total_calls} />
          <StatCard label="成功" value={stats.success_count} valueClass="text-green-600" />
          <StatCard label="失败" value={stats.error_count} valueClass="text-red-500" />
          <StatCard label="成功率" value={`${stats.success_rate}%`} valueClass={stats.success_rate >= 90 ? "text-green-600" : "text-orange-500"} />
          <StatCard label="平均耗时" value={`${stats.avg_elapsed_ms}ms`} />
        </div>
      )}

      {/* Agent breakdown */}
      {stats?.by_agent?.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">按 Agent 分布</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.by_agent.map((a) => (
              <div key={a.agent_node || "unknown"} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-mono text-slate-700">{a.agent_node || "(未知)"}</span>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>总计 {a.total}</span>
                  <span className="text-green-600">成功 {a.success}</span>
                  <span className="text-red-500">失败 {a.total - a.success}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Agent 节点</label>
          <input
            type="text"
            value={filters.agent_node}
            onChange={(e) => setFilters({ ...filters, agent_node: e.target.value })}
            placeholder="如 ocr_recognize"
            className="w-44 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">状态</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-36 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">全部</option>
            <option value="success">成功</option>
            <option value="http_error">HTTP错误</option>
            <option value="network_error">网络错误</option>
            <option value="client_error">客户端错误</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">开始日期</label>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">结束日期</label>
          <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
        >
          <Search className="h-4 w-4" />
          查询
        </button>
      </div>

      {/* Logs table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">暂无日志数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  {["时间", "Agent", "Provider", "模型", "状态", "耗时", "Tokens(in/out)", "错误信息"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const s = STATUS_LABELS[log.status] || { label: log.status, cls: "bg-slate-100 text-slate-500" };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.called_at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-700">{log.agent_node || "-"}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{log.provider}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-600 max-w-[160px] truncate">{log.model}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{log.elapsed_ms}ms</td>
                      <td className="px-3 py-2.5 text-xs text-slate-400">
                        {log.input_tokens != null ? `${log.input_tokens} / ${log.output_tokens ?? "-"}` : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-red-400 max-w-[200px] truncate" title={log.error_message || ""}>
                        {log.error_message || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>共 {total} 条，第 {currentPage} / {totalPages} 页</span>
          <div className="flex gap-2">
            <button type="button" onClick={handlePrev} disabled={offset === 0} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40 transition">
              上一页
            </button>
            <button type="button" onClick={handleNext} disabled={offset + LIMIT >= total} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40 transition">
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, valueClass = "text-slate-900" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-black ${valueClass}`}>{value}</div>
    </div>
  );
}
