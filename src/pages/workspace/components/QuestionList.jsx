import FilterBar from "./FilterBar.jsx";
import QuestionCard from "./QuestionCard.jsx";

export default function QuestionList({
  wrongQuestions,
  studyRecordMap,
  studyRecordTotalMap,
  filters,
  setFilters,
  filterSubjectOptions,
  filterTermOptions,
  onPractice,
  onChangeStatus,
  onToggleBookmark,
  onStartEdit,
  onDelete,
}) {
  return (
    <section className="workspace-card">
      <h2>我的错题列表</h2>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        filterSubjectOptions={filterSubjectOptions}
        filterTermOptions={filterTermOptions}
      />

      <div className="student-card-grid">
        {wrongQuestions.length === 0 ? (
          <p>当前筛选条件下没有错题。</p>
        ) : (
          wrongQuestions.map((item) => (
            <QuestionCard
              key={item.id}
              item={item}
              studyRecords={studyRecordMap[item.id] || []}
              studyRecordTotal={studyRecordTotalMap[item.id]}
              onPractice={onPractice}
              onChangeStatus={onChangeStatus}
              onToggleBookmark={onToggleBookmark}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}
