import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, LogIn, UserRound } from "lucide-react";
import { studentLogin } from "../../services/api.js";
import { saveStudentSession } from "../../utils/studentSession.js";

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await studentLogin({
        account: account.trim(),
        password,
      });
      saveStudentSession(data);
      navigate("/");
    } catch (err) {
      setError(err?.message || "登录失败，请核对账号密码或稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-900">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-900">用户登录</h1>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">账号</span>
            <div className="relative">
              <UserRound className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                required
                autoComplete="username"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                placeholder="请输入账号"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">密码</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-base font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            type="submit"
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </section>
    </div>
  );
}
