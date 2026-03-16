import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function UploadPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/student/dashboard", { replace: true });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-tag">入口调整</div>
        <h1>录入错题入口已并入学生工作台</h1>
        <p>
          旧的 /upload 页面原来还是 mock 识别流，继续保留只会把用户带回假流程。
          现在统一从学生工作台进入真实录入、识别、精修和保存链路。
        </p>
        <div className="hero-actions">
          <Link className="btn-primary" to="/student/dashboard">
            立即进入工作台
          </Link>
          <Link className="btn-ghost" to="/home">
            先回首页
          </Link>
        </div>
      </header>

      <div className="workspace-card">
        <h2>正在跳转</h2>
        <p>1 秒后自动前往学生工作台。若未跳转，请点击上方按钮。</p>
      </div>
    </div>
  );
}
