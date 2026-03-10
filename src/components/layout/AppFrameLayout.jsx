import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { id: "home", label: "工作台", hint: "首页总览", token: "台", to: "/" },
  { id: "upload", label: "上传试题", hint: "识别入口", token: "传", to: "/upload", accent: true },
  { id: "dashboard", label: "学生错题本", hint: "错题维护", token: "本", to: "/student/dashboard" },
  { id: "result", label: "识别结果", hint: "变式与导出", token: "果", to: "/result" },
  { id: "workspace", label: "管理台", hint: "字典与数据", token: "管", to: "/workspace" },
];

function isActive(pathname, item) {
  if (item.to === "/") {
    return pathname === "/";
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function NavGroup({ pathname, mobile = false, onNavigate }) {
  return (
    <nav className={mobile ? "ai-home-mobile-nav" : "ai-home-nav"}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item);
        const className = [
          mobile ? "ai-home-mobile-nav-item" : "ai-home-nav-item",
          active ? "is-active" : "",
          item.accent ? "is-accent" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <Link key={item.id} className={className} to={item.to} onClick={onNavigate}>
            <span className="ai-home-nav-token">{item.token}</span>
            <span className="ai-home-nav-copy">
              <strong>{item.label}</strong>
              <em>{active ? "当前页" : item.hint}</em>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppFrameLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="ai-home-shell">
      <aside className="ai-home-sidebar">
        <div className="ai-home-brand-block">
          <Link className="ai-home-brand" to="/">
            <span className="ai-home-brand-mark">AI</span>
            <span className="ai-home-brand-copy">
              <strong>AI错题助手</strong>
              <em>Study cockpit</em>
            </span>
          </Link>
          <p className="ai-home-brand-note">
            所有当前路由已经收进同一套 Make 风格壳层，首页、上传、结果、学生端和管理台保持统一入口。
          </p>
        </div>

        <NavGroup pathname={location.pathname} />

        <div className="ai-home-sidebar-footer">
          <p className="ai-home-sidebar-note">Demo 快捷入口</p>
          <Link className="ai-home-side-cta primary" to="/student/login">
            学生登录
          </Link>
          <Link className="ai-home-side-cta" to="/parent/login">
            家长入口
          </Link>
        </div>
      </aside>

      <main className="ai-home-main">
        <header className="ai-home-mobile-bar">
          <Link className="ai-home-brand compact" to="/">
            <span className="ai-home-brand-mark">AI</span>
            <span className="ai-home-brand-copy">
              <strong>错题助手</strong>
              <em>Home</em>
            </span>
          </Link>
          <button
            type="button"
            className="ai-home-menu-button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label="切换菜单"
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {mobileMenuOpen ? (
          <div className="ai-home-mobile-menu">
            <NavGroup pathname={location.pathname} mobile onNavigate={() => setMobileMenuOpen(false)} />
            <div className="ai-home-mobile-actions">
              <Link className="ai-home-side-cta primary" to="/student/login" onClick={() => setMobileMenuOpen(false)}>
                学生登录
              </Link>
              <Link className="ai-home-side-cta" to="/parent/login" onClick={() => setMobileMenuOpen(false)}>
                家长入口
              </Link>
            </div>
          </div>
        ) : null}

        <div className="app-frame-view">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
