import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { id: "home", label: "工作台", hint: "首页总览", token: "台", to: "/" },
  { id: "bank", label: "错题本", hint: "回看与筛选", token: "本", to: "/bank" },
  { id: "print", label: "组卷打印", hint: "A4 练习卷", token: "卷", to: "/print" },
  { id: "insights", label: "反复出错", hint: "风险预警", token: "警", to: "/insights" },
  { id: "profile", label: "学情画像", hint: "周趋势", token: "像", to: "/profile" },
];

function isActive(pathname, item) {
  if (item.to === "/") {
    return pathname === "/";
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function NavGroup({ pathname, mobile = false, onNavigate }) {
  return (
    <nav className={mobile ? "figma-mobile-nav" : "figma-nav"}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item);
        const className = [
          mobile ? "figma-mobile-nav-item" : "figma-nav-item",
          active ? "is-active" : "",
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
    <div className="figma-shell">
      <aside className="figma-sidebar">
        <div className="figma-brand-block">
          <Link className="figma-brand" to="/">
            <span className="figma-brand-mark">AI</span>
            <span className="figma-brand-copy">
              <strong>AI错题助手</strong>
              <em>Study cockpit</em>
            </span>
          </Link>
          <p className="figma-brand-note">主导航现在直接按 Figma Make 原型组织，上传入口独立置顶，学习主流程回到工作台、错题本、组卷、洞察、画像。</p>
        </div>

        <Link className="figma-sidebar-cta" to="/upload">
          录入新错题
        </Link>

        <NavGroup pathname={location.pathname} />

        <div className="figma-sidebar-footer">
          <p className="figma-sidebar-note">辅助入口</p>
          <div className="figma-utility-links">
            <Link className="figma-utility-link" to="/result">
              识别结果
            </Link>
            <Link className="figma-utility-link" to="/student/dashboard">
              学生端
            </Link>
            <Link className="figma-utility-link" to="/workspace">
              管理台
            </Link>
          </div>
          <Link className="figma-side-cta primary" to="/student/login">
            学生登录
          </Link>
          <Link className="figma-side-cta" to="/parent/login">
            家长入口
          </Link>
        </div>
      </aside>

      <main className="figma-main">
        <header className="figma-mobile-bar">
          <Link className="figma-brand compact" to="/">
            <span className="figma-brand-mark">AI</span>
            <span className="figma-brand-copy">
              <strong>错题助手</strong>
              <em>Home</em>
            </span>
          </Link>
          <button
            type="button"
            className="figma-menu-button"
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
          <div className="figma-mobile-menu">
            <NavGroup pathname={location.pathname} mobile onNavigate={() => setMobileMenuOpen(false)} />
            <div className="figma-mobile-actions">
              <Link className="figma-side-cta primary" to="/upload" onClick={() => setMobileMenuOpen(false)}>
                录入新错题
              </Link>
              <Link className="figma-side-cta" to="/student/login" onClick={() => setMobileMenuOpen(false)}>
                学生登录
              </Link>
              <Link className="figma-side-cta" to="/parent/login" onClick={() => setMobileMenuOpen(false)}>
                家长入口
              </Link>
            </div>
          </div>
        ) : null}

        <div className="figma-view">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
