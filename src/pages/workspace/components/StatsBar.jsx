export default function StatsBar({ stats, onOpenComposer }) {
  if (!stats) return null;

  return (
    <section className="workspace-card">
      <div className="student-stats-head">
        <div>
          <h2>工作台概览</h2>
          <p>这里是执行场：录入新错题、维护错题状态、补练习记录与精修图片。</p>
        </div>
        <button className="btn-primary" type="button" onClick={onOpenComposer}>
          添加错题
        </button>
      </div>
      <div className="workspace-stat-grid student-stats-grid">
        <div>
          <span>错题总数</span>
          <strong>{stats.total}</strong>
        </div>
        <div>
          <span>新错题</span>
          <strong>{stats.new_count}</strong>
        </div>
        <div>
          <span>复习中</span>
          <strong>{stats.reviewing_count}</strong>
        </div>
        <div>
          <span>已掌握</span>
          <strong>{stats.mastered_count}</strong>
        </div>
        <div>
          <span>掌握率</span>
          <strong>{stats.mastery_rate}%</strong>
        </div>
        <div>
          <span>累计练习</span>
          <strong>{stats.total_reviews}</strong>
        </div>
      </div>
    </section>
  );
}
