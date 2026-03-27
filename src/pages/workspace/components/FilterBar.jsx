export default function FilterBar({ filters, setFilters, filterSubjectOptions, filterTermOptions }) {
  return (
    <>
      <div className="student-filter-block">
        <span className="student-filter-label">按学科筛选</span>
        <div className="student-filter-tabs">
          <button
            type="button"
            className={`student-filter-tab subject ${filters.subject === "" ? "active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, subject: "" }))}
          >
            全部学科
          </button>
          {filterSubjectOptions.map((subject) => (
            <button
              key={subject}
              type="button"
              className={`student-filter-tab subject ${filters.subject === subject ? "active" : ""}`}
              onClick={() => setFilters((prev) => ({ ...prev, subject }))}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div className="student-filter-block">
        <span className="student-filter-label">按学期筛选</span>
        <div className="student-filter-tabs">
          <button
            type="button"
            className={`student-filter-tab term ${filters.term === "" ? "active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, term: "" }))}
          >
            全部学期
          </button>
          {filterTermOptions.map((term) => (
            <button
              key={term}
              type="button"
              className={`student-filter-tab term ${filters.term === term ? "active" : ""}`}
              onClick={() => setFilters((prev) => ({ ...prev, term }))}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="workspace-form student-filter-grid">
        <label>
          关键词
          <input
            placeholder="标题 / 内容 / 错误原因"
            value={filters.keyword}
            onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
          />
        </label>
        <label>
          状态
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">全部</option>
            <option value="new">新错题</option>
            <option value="reviewing">复习中</option>
            <option value="mastered">已掌握</option>
          </select>
        </label>
      </div>
    </>
  );
}
