const steps = [
  {
    title: "上传",
    detail: "拍照或上传试卷/作业图片。"
  },
  {
    title: "提取",
    detail: "OCR + 版面分析，忽略手写痕迹。"
  },
  {
    title: "生成",
    detail: "基于错题生成 3 道同类题。"
  },
  {
    title: "导出",
    detail: "一键生成可打印文档。"
  }
];

export default function App() {
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-tag">JuYiFanSan</div>
        <h1>举一反三 · 智能错题重构助手</h1>
        <p>
          拍照即录入，自动去手写、裁剪插图、生成同类题，
          为小学阶段建立高效练习闭环。
        </p>
        <div className="hero-actions">
          <button className="btn-primary" type="button">开始体验</button>
          <button className="btn-ghost" type="button">查看流程</button>
        </div>
      </header>

      <section className="grid">
        {steps.map((step) => (
          <article className="card" key={step.title}>
            <h2>{step.title}</h2>
            <p>{step.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div>
          <h3>API 状态</h3>
          <p>后端健康检查地址：<code>/api/health</code></p>
        </div>
        <button className="btn-primary" type="button">运行检查</button>
      </section>
    </div>
  );
}
