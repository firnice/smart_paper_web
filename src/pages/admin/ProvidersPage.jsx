import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  listModelProviders,
  createModelProvider,
  updateModelProvider,
  deleteModelProvider,
} from "../../services/api.js";

const EMPTY_FORM = { name: "", base_url: "", api_key: "", is_active: true, models: [] };

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function fetchProviders() {
    setLoading(true);
    setError("");
    try {
      const data = await listModelProviders();
      setProviders(data || []);
    } catch (err) {
      setError(err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProviders(); }, []);

  function openCreate() {
    setEditingProvider(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(p) {
    setEditingProvider(p);
    setForm({ name: p.name, base_url: p.base_url, api_key: "", is_active: p.is_active, models: p.models || [] });
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.base_url.trim()) {
      setFormError("名称和 Base URL 为必填项");
      return;
    }
    if (!editingProvider && !form.api_key.trim()) {
      setFormError("创建时 API Key 为必填项");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      if (editingProvider) {
        const payload = { name: form.name.trim(), base_url: form.base_url.trim(), is_active: form.is_active, models: form.models };
        if (form.api_key.trim()) payload.api_key = form.api_key.trim();
        await updateModelProvider(editingProvider.id, payload);
      } else {
        await createModelProvider({ name: form.name.trim(), base_url: form.base_url.trim(), api_key: form.api_key.trim(), is_active: form.is_active, models: form.models });
      }
      setShowModal(false);
      fetchProviders();
    } catch (err) {
      setFormError(err.message || "操作失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteModelProvider(id);
      setConfirmDeleteId(null);
      fetchProviders();
    } catch (err) {
      alert(err.message || "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">模型供应商</h1>
          <p className="mt-1 text-sm text-slate-500">管理 LLM API 供应商及其支持的模型列表</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition">
          <Plus className="h-4 w-4" />新增供应商
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">加载中...</div>
        ) : providers.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">暂无供应商，点击右上角新增</div>
        ) : providers.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>{p.is_active ? "启用" : "停用"}</span>
                </div>
                <div className="mt-1 font-mono text-xs text-slate-400 truncate">{p.base_url}</div>
                <div className="mt-1 font-mono text-xs text-slate-300">{p.api_key_masked}</div>
                {p.models?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.models.map((m) => (
                      <span key={m} className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-mono text-indigo-700">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setConfirmDeleteId(p.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新增/编辑 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingProvider ? "编辑供应商" : "新增供应商"}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="名称 *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="如 SiliconFlow" />
              <FormField label="Base URL *" value={form.base_url} onChange={(v) => setForm({ ...form, base_url: v })} placeholder="https://api.example.com/v1" />
              <FormField
                label={editingProvider ? "API Key（留空保持不变）" : "API Key *"}
                value={form.api_key} onChange={(v) => setForm({ ...form, api_key: v })}
                placeholder={editingProvider ? "输入新密钥" : "sk-..."} type="password"
              />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                <label htmlFor="is_active" className="text-sm text-slate-700">启用该供应商</label>
              </div>

              {/* 模型列表 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  支持的模型列表
                  <span className="ml-1 text-xs font-normal text-slate-400">（回车添加，点击删除）</span>
                </label>
                <ModelTagInput
                  value={form.models}
                  onChange={(models) => setForm({ ...form, models })}
                />
              </div>

              {formError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{formError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">取消</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition">
                  {submitting ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-lg font-bold text-slate-900">确认删除</h2>
            <p className="mb-6 text-sm text-slate-500">删除后该供应商配置将无法恢复。</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">取消</button>
              <button type="button" disabled={deletingId === confirmDeleteId} onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition">
                {deletingId === confirmDeleteId ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelTagInput({ value = [], onChange }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  function addModel() {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...value, trimmed]);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addModel();
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeModel(m) {
    onChange(value.filter((x) => x !== m));
  }

  return (
    <div
      className="min-h-[44px] w-full cursor-text rounded-xl border border-slate-200 px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap gap-1.5">
        {value.map((m) => (
          <span key={m} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-mono text-indigo-700">
            {m}
            <button type="button" onClick={() => removeModel(m)} className="text-indigo-400 hover:text-indigo-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addModel}
          placeholder={value.length === 0 ? "输入模型名称，回车确认" : ""}
          className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder-slate-300"
        />
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
    </div>
  );
}
