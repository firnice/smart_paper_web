import { useState, useEffect } from "react";
import { Pencil, X, Play } from "lucide-react";
import { adminListAgents, adminUpdateAgent, adminTestAgent, listModelProviders } from "../../services/api.js";

export default function AgentConfigPage() {
  const [agents, setAgents] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAgent, setEditingAgent] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [agentData, providerData] = await Promise.all([
        adminListAgents(),
        listModelProviders(),
      ]);
      setAgents(agentData || []);
      setProviders(providerData || []);
    } catch (err) {
      setError(err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  // 当前选中供应商的模型列表
  function getModelsForProvider(providerName) {
    const p = providers.find((p) => p.name === providerName);
    return p?.models || [];
  }

  function openEdit(agent) {
    setEditingAgent(agent);
    setForm({
      provider: agent.provider,
      model: agent.model === "(未配置)" ? "" : agent.model,
      temperature: agent.temperature,
      timeout_seconds: agent.timeout_seconds,
      is_enabled: agent.is_enabled,
      system_prompt: agent.system_prompt || "",
      user_prompt_template: agent.user_prompt_template || "",
    });
    setFormError("");
    setTestResult(null);
  }

  function handleProviderChange(providerName) {
    const models = getModelsForProvider(providerName);
    setForm((f) => ({
      ...f,
      provider: providerName,
      // 切换供应商时，如果当前模型不在新供应商的列表里则清空
      model: models.includes(f.model) ? f.model : (models[0] || ""),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await adminUpdateAgent(editingAgent.node_name, {
        provider: form.provider || undefined,
        model: form.model || undefined,
        temperature: parseFloat(form.temperature),
        timeout_seconds: parseInt(form.timeout_seconds),
        is_enabled: form.is_enabled,
        system_prompt: form.system_prompt || null,
        user_prompt_template: form.user_prompt_template || null,
      });
      setEditingAgent(null);
      fetchAll();
    } catch (err) {
      setFormError(err.message || "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await adminTestAgent(editingAgent.node_name, { test_prompt: "请回复'OK'。" });
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  }

  const activeProviders = providers.filter((p) => p.is_active);
  const currentModels = getModelsForProvider(form.provider);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Agent 配置</h1>
        <p className="mt-1 text-sm text-slate-500">管理各 LLM 节点的供应商、模型与参数</p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {["节点", "说明", "供应商", "模型", "温度", "超时", "状态", "操作"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((a) => (
                <tr key={a.node_name} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{a.node_name}</td>
                  <td className="px-4 py-3 text-slate-600">{a.display_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.provider}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[180px] truncate" title={a.model}>{a.model}</td>
                  <td className="px-4 py-3 text-slate-500">{a.temperature}</td>
                  <td className="px-4 py-3 text-slate-500">{a.timeout_seconds}s</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.is_enabled ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>{a.is_enabled ? "启用" : "停用"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">编辑 Agent</h2>
                <p className="text-xs text-slate-500 font-mono">{editingAgent.node_name}</p>
              </div>
              <button type="button" onClick={() => setEditingAgent(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">

              {/* 供应商下拉 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">供应商</label>
                <select
                  value={form.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {activeProviders.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                  {/* 如果当前 provider 不在活跃列表里也要显示 */}
                  {form.provider && !activeProviders.find((p) => p.name === form.provider) && (
                    <option value={form.provider}>{form.provider} (已停用)</option>
                  )}
                </select>
              </div>

              {/* 模型：有列表就用下拉+可手动输入，没有就纯文本框 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">模型</label>
                {currentModels.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={currentModels.includes(form.model) ? form.model : "__custom__"}
                      onChange={(e) => {
                        if (e.target.value !== "__custom__") setForm({ ...form, model: e.target.value });
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {currentModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      {!currentModels.includes(form.model) && form.model && (
                        <option value="__custom__">{form.model}（自定义）</option>
                      )}
                    </select>
                    {/* 也允许手动覆盖 */}
                    <input
                      type="text"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      placeholder="或手动输入模型名称"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="如 deepseek-ai/DeepSeek-V3"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">温度</label>
                  <input type="number" step="0.1" min="0" max="2" value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">超时(秒)</label>
                  <input type="number" min="5" value={form.timeout_seconds}
                    onChange={(e) => setForm({ ...form, timeout_seconds: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_enabled" checked={form.is_enabled}
                  onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                <label htmlFor="is_enabled" className="text-sm text-slate-700">启用该 Agent</label>
              </div>

              {/* Prompt 配置（可选，留空则使用系统默认） */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  System Prompt
                  <span className="ml-1 text-xs font-normal text-slate-400">（留空使用默认）</span>
                </label>
                <textarea
                  rows={4}
                  value={form.system_prompt}
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                  placeholder="留空则使用 yaml 配置中的默认 system prompt"
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  识别提示词（User Prompt）
                  <span className="ml-1 text-xs font-normal text-slate-400">（留空使用默认）</span>
                </label>
                <textarea
                  rows={6}
                  value={form.user_prompt_template}
                  onChange={(e) => setForm({ ...form, user_prompt_template: e.target.value })}
                  placeholder="留空则使用 yaml 配置中的默认识别 prompt"
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {formError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{formError}</div>}

              {testResult && (
                <div className={`rounded-xl px-4 py-3 text-sm ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {testResult.success
                    ? `测试成功 (${testResult.elapsed_seconds}s): ${testResult.response_text}`
                    : `测试失败: ${testResult.error}`}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleTest} disabled={testing}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 px-3 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition">
                  <Play className="h-3.5 w-3.5" />
                  {testing ? "测试中..." : "测试"}
                </button>
                <div className="flex flex-1 gap-3">
                  <button type="button" onClick={() => setEditingAgent(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">取消</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition">
                    {submitting ? "保存中..." : "保存"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
