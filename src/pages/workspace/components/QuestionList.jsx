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
  defaultTerm,
  onPractice,
  onChangeStatus,
  onToggleBookmark,
  onStartEdit,
  onDelete,
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-gray-800">错题列表</h2>
        <span className="text-[12px] text-gray-400">{wrongQuestions.length} 道</span>
      </div>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        filterSubjectOptions={filterSubjectOptions}
        filterTermOptions={filterTermOptions}
        defaultTerm={defaultTerm}
      />

      {wrongQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-12 text-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5} className="h-12 w-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="mt-3 text-[14px] font-medium text-gray-400">暂无错题</p>
          <p className="mt-1 text-[12px] text-gray-300">点击上方"添加"录入第一道错题</p>
        </div>
      ) : (
        <div>
          {wrongQuestions.map((item) => (
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
          ))}
        </div>
      )}
    </section>
  );
}
