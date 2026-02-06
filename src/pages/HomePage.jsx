import { Link } from "react-router-dom";
import FlowStepCard from "../components/home/FlowStepCard.jsx";
import FeatureCard from "../components/home/FeatureCard.jsx";
import StackItem from "../components/home/StackItem.jsx";
import StatusPanel from "../components/home/StatusPanel.jsx";
import { BRAND, FEATURES, PIPELINE_STEPS, TECH_STACK } from "../constants/content.js";

export default function HomePage() {
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-tag">{BRAND.name}</div>
        <h1>{BRAND.headline}</h1>
        <p>{BRAND.description}</p>
        <div className="hero-actions">
          <Link className="btn-primary" to="/upload">开始体验</Link>
          <Link className="btn-ghost" to="/student/login">学生登录</Link>
          <Link className="btn-ghost" to="/workspace">进入管理台</Link>
          <a className="btn-ghost" href="#pipeline">查看流程</a>
        </div>
      </header>

      <section className="section">
        <div className="section-head">
          <h2>核心流程</h2>
          <p>从拍照录入到变式题输出，全流程自动化。</p>
        </div>
        <div className="grid" id="pipeline">
          {PIPELINE_STEPS.map((step) => (
            <FlowStepCard key={step.title} step={step} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>核心能力</h2>
          <p>聚焦小学错题整理场景的四大关键能力。</p>
        </div>
        <div className="grid grid-compact">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>AI 技术栈</h2>
          <p>OCR + 图像处理 + 大模型，组成可扩展的智能引擎。</p>
        </div>
        <div className="stack">
          {TECH_STACK.map((item) => (
            <StackItem key={item.name} item={item} />
          ))}
        </div>
      </section>

      <StatusPanel />
    </div>
  );
}
