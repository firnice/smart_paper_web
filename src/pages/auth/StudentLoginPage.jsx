import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, KeyRound, LogIn, Sparkles } from "lucide-react";
import { studentLogin } from "../../services/api.js";
import { saveStudentSession } from "../../utils/studentSession.js";

const PRESET_ACCOUNTS = [
  { account: "test1", password: "test1", note: "测试学生1 / 三年级" },
  { account: "test2", password: "test2", note: "测试学生2 / 四年级" },
  { account: "test3", password: "test3", note: "测试学生3 / 五年级" },
];

const HIGHLIGHTS = [
  { title: "测试账号登录", desc: "当前环境使用内置测试账号联调学生端流程" },
  { title: "先到学生首页", desc: "登录后先看首页总览，再进入工作台处理任务" },
  { title: "真实链路验证", desc: "登录后走的首页、工作台、打印等链路都是真实页面" },
];

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState("test1");
  const [password, setPassword] = useState("test1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fillPreset = (item) => {
    setAccount(item.account);
    setPassword(item.password);
    setError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await studentLogin({ account, password });
      saveStudentSession(data);
      navigate("/home");
    } catch (err) {
      setError(err?.message || "登录失败，请核对账号密码或稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-8 text-white shadow-[0_24px_60px_rgba(79,70,229,0.28)]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              学生端登录
            </div>
            <div className="inline-flex items-center rounded-full border border-amber-200/40 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-50">
              当前为测试环境 / 联调账号入口
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight">
              先进入学生首页，
              <br />
              再去工作台处理错题。
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-indigo-50">
              这里接的是后端真实登录接口，但当前仍使用联调测试账号，不要把它理解成正式发放中的学生账号体系。登录后可直接验证首页、工作台、复习和打印等真实链路。
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-sm font-bold">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-indigo-50/95">{item.desc}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/15 bg-slate-950/20 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <BookOpen className="h-4 w-4" />
                内置测试账号
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {PRESET_ACCOUNTS.map((item) => (
                  <button
                    key={item.account}
                    type="button"
                    onClick={() => fillPreset(item)}
                    className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left transition hover:bg-white/15"
                  >
                    <div className="text-sm font-bold">{item.account}</div>
                    <div className="mt-1 text-sm text-indigo-50">测试密码：{item.password}</div>
                    <div className="mt-2 text-xs text-indigo-100/90">{item.note}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mx-auto max-w-md">
              <div className="mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <LogIn className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900">学生账号登录</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  当前为测试环境登录入口。可直接使用左侧内置联调账号快速填充；页面与业务链路是真实的，但账号本身不是正式面向学生发放的线上账号。
                </p>
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">账号</span>
                  <input
                    required
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                    placeholder="请输入账号，如 test1"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">密码</span>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="password"
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
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    登录失败时会在这里给出明确提示，不再只甩一个 500。
                  </div>
                )}

                <button
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-base font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "登录中..." : "进入学生端"}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Link className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50" to="/parent/login">
                  查看家长入口
                </Link>
                <Link className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50" to="/student/login">
                  刷新当前登录页
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
