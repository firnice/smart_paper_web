import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, KeyRound, LogIn, Sparkles } from "lucide-react";
import { getStudentLoginConfig, studentLogin } from "../../services/api.js";
import { saveStudentSession } from "../../utils/studentSession.js";

const DEFAULT_LOGIN_CONFIG = {
  mode: "managed",
  show_presets: false,
  title: "家长登录",
  subtitle: "请输入绑定孩子的访问账号与密码，进入统一的家庭错题本。",
  help_text: "登录后即可在手机录入，在电脑整理、分析和打印。",
  preset_accounts: [],
};

const DEFAULT_HIGHLIGHTS = [
  { title: "一套能力，双端可用", desc: "手机适合录入，电脑适合校对与打印，但看到的是同一套功能。" },
  { title: "主链路已接真实页面", desc: "录入、错题本、打印与结果回填都走真实页面和接口。" },
  { title: "联调期仍可切正式模式", desc: "后端可配置隐藏预置账号，后续切正式登录口径不会影响页面结构。" },
];

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [loginConfig, setLoginConfig] = useState(DEFAULT_LOGIN_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);
  const [account, setAccount] = useState("test1");
  const [password, setPassword] = useState("test1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getStudentLoginConfig()
      .then((data) => {
        if (!active || !data) return;
        setLoginConfig({
          ...DEFAULT_LOGIN_CONFIG,
          ...data,
          title: DEFAULT_LOGIN_CONFIG.title,
          subtitle: DEFAULT_LOGIN_CONFIG.subtitle,
          help_text: DEFAULT_LOGIN_CONFIG.help_text,
        });
        if (!data.show_presets) {
          setAccount("");
          setPassword("");
        }
      })
      .catch(() => {
        if (!active) return;
        setLoginConfig(DEFAULT_LOGIN_CONFIG);
        setAccount("");
        setPassword("");
      })
      .finally(() => {
        if (active) setConfigLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
      navigate("/");
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
              家庭入口
            </div>
            {loginConfig.show_presets ? (
              <div className="inline-flex items-center rounded-full border border-amber-200/40 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-50">
                当前为联调登录入口 / 可快速填充已绑定孩子的测试账号
              </div>
            ) : (
              <div className="inline-flex items-center rounded-full border border-emerald-200/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-50">
                当前按正式登录入口展示
              </div>
            )}
            <h1 className="text-4xl font-black leading-tight tracking-tight">
              手机方便录入，
              <br />
              电脑方便整理和打印。
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-indigo-50">
              {loginConfig.subtitle}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {DEFAULT_HIGHLIGHTS.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-sm font-bold">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-indigo-50/95">{item.desc}</p>
                </article>
              ))}
            </div>

            {loginConfig.show_presets ? (
              <div className="mt-8 rounded-2xl border border-white/15 bg-slate-950/20 p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <BookOpen className="h-4 w-4" />
                  预置联调账号
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {loginConfig.preset_accounts.map((item) => (
                    <button
                      key={item.account}
                      type="button"
                      onClick={() => fillPreset(item)}
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left transition hover:bg-white/15"
                    >
                      <div className="text-sm font-bold">{item.account}</div>
                      <div className="mt-1 text-sm text-indigo-50">访问密码：{item.password}</div>
                      <div className="mt-2 text-xs text-indigo-100/90">{item.note}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-white/15 bg-slate-950/20 p-5 text-sm leading-6 text-indigo-50/95 backdrop-blur-sm">
                {loginConfig.help_text}
              </div>
            )}
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mx-auto max-w-md">
              <div className="mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <LogIn className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900">{loginConfig.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {configLoading ? "正在加载登录配置..." : loginConfig.help_text}
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
                    当前登录后会进入统一家庭错题本，手机和电脑共享同一份数据。
                  </div>
                )}

                <button
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-base font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "登录中..." : "进入家庭错题本"}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Link className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50" to="/parent/login">
                  使用旧入口地址
                </Link>
                <Link className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50" to="/login">
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
