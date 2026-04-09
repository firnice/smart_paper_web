import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Camera, Printer, User } from "lucide-react";
import { readStudentSession } from "../../utils/studentSession.js";

const NAV_ITEMS = [
  { to: "/workspace", label: "错题本", shortLabel: "错题本", Icon: BookOpen },
  { to: "/capture", label: "录入错题", shortLabel: "录入", Icon: Camera },
  { to: "/print", label: "打印", shortLabel: "打印", Icon: Printer },
  { to: "/profile", label: "我的", shortLabel: "我的", Icon: User },
];

export default function AppFrameLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = readStudentSession();
  const student = session?.student || null;

  const isItemActive = (to) => {
    if (to === "/workspace") {
      return (
        location.pathname.startsWith("/workspace")
        || location.pathname.startsWith("/question/")
        || location.pathname.startsWith("/practice/")
      );
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/60 bg-slate-950 text-white shadow-[24px_0_48px_rgba(15,23,42,0.18)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="border-b border-white/10 px-6 py-7">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">
              Smart Paper
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight">智能错题本</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              手机更适合录入，电脑更适合校对与打印，两端共享同一套功能和同一份数据。
            </p>
          </div>

          <div className="flex-1 px-4 py-5">
            <nav className="space-y-2">
              {NAV_ITEMS.map(({ to, label, Icon }) => {
                const active = isItemActive(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active ? "bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.12)]" : "text-slate-300 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${active ? "text-indigo-600" : ""}`} />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 px-6 py-5 text-sm text-slate-300">
            <div className="font-semibold text-white">{student?.name || "当前用户"}</div>
            <div className="mt-1 text-xs text-slate-400">
              {student?.student_profile?.grade || "未设置年级"}
              {student?.student_profile?.class_name ? ` · ${student.student_profile.class_name}` : ""}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <main className="pb-[88px] lg:pb-8">
            <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-10 lg:py-6">
              <Outlet />
            </div>
          </main>

          <nav
            className="safe-area-inset-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-slate-200/80 bg-white/96 backdrop-blur lg:hidden"
            style={{ boxShadow: "0 -6px 24px rgba(15,23,42,0.08)" }}
          >
            <div className="mx-auto flex max-w-[560px] items-end justify-around px-3 pb-2 pt-1">
              <NavLink to="/workspace" className="flex min-w-[56px] flex-1 flex-col items-center gap-1 py-2">
                <BookOpen className={`h-5 w-5 ${isItemActive("/workspace") ? "text-indigo-600" : "text-slate-400"}`} />
                <span className={`text-[11px] font-medium ${isItemActive("/workspace") ? "text-indigo-600" : "text-slate-400"}`}>
                  错题本
                </span>
              </NavLink>

              <div className="flex flex-1 flex-col items-center justify-end pb-1">
                <button
                  type="button"
                  className="flex h-[58px] w-[58px] -translate-y-4 items-center justify-center rounded-full text-white transition active:scale-95"
                  style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", boxShadow: "0 10px 24px rgba(99,102,241,0.38)" }}
                  onClick={() => navigate("/capture")}
                >
                  <Camera className="h-6 w-6" strokeWidth={2} />
                </button>
                <span className="mt-[-10px] text-[11px] font-medium text-indigo-500">录入</span>
              </div>

              {NAV_ITEMS.slice(1).map(({ to, shortLabel, Icon }) => {
                const active = isItemActive(to);
                return (
                  <NavLink key={to} to={to} className="flex min-w-[56px] flex-1 flex-col items-center gap-1 py-2">
                    <Icon className={`h-5 w-5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className={`text-[11px] font-medium ${active ? "text-indigo-600" : "text-slate-400"}`}>
                      {shortLabel}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
