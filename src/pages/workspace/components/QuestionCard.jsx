import { STATUS_LABEL } from "../constants.js";
import { formatStudyResult } from "../mappers.js";

export default function QuestionCard({
  item,
  studyRecords,
  studyRecordTotal,
  onPractice,
  onChangeStatus,
  onToggleBookmark,
  onStartEdit,
  onDelete,
  onQuickPractice,
  onVariant,
}) {
  const records = studyRecords || [];
  const total = studyRecordTotal ?? records.length;

  return (
    <article className="student-question-item">
      <div className="student-question-head">
        <div className="student-chip-row">
          <span className="student-subject-badge">{item.subject}</span>
          <span className="student-term-badge">{item.term || "未分期"}</span>
          {item.is_bookmarked ? <span className="student-term-badge">已收藏</span> : null}
        </div>
        <span className={`student-status status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
      </div>
      <strong className="student-question-title">{item.title}</strong>
      <p>{item.content}</p>
      {item.image_data && (
        <div className="student-question-image-wrap">
          <img className="student-question-image" src={item.image_data} alt={item.image_name || item.title} />
        </div>
      )}
      <div className="student-meta">
        <span>学科：{item.subject}</span>
        <span>学期：{item.term || "未分期"}</span>
        <span>分类：{item.category}</span>
        <span>错因：{item.error_reason}</span>
        <span>错次：{item.error_count || 0}</span>
        <span>练习次数：{total}</span>
      </div>
      {item.notes ? <div className="workspace-alert">备注：{item.notes}</div> : null}
      <div className="student-actions">
        {onQuickPractice && (
          <button type="button" className="btn-primary btn-small" onClick={() => onQuickPractice(item)}>
            快速练习
          </button>
        )}
        {onVariant && (
          <button type="button" className="btn-secondary btn-small" onClick={() => onVariant(item)}>
            举一反三
          </button>
        )}
        <button type="button" className="btn-secondary btn-small" onClick={() => onPractice(item.id, "correct")}>
          本次做对
        </button>
        <button type="button" className="btn-secondary btn-small" onClick={() => onPractice(item.id, "incorrect")}>
          本次做错
        </button>
        <button type="button" className="btn-small btn-ghost" onClick={() => onChangeStatus(item.id, "reviewing")}>
          标记复习中
        </button>
        <button type="button" className="btn-small btn-ghost" onClick={() => onChangeStatus(item.id, "mastered")}>
          标记已掌握
        </button>
        <button type="button" className="btn-small btn-ghost" onClick={() => onToggleBookmark(item)}>
          {item.is_bookmarked ? "取消收藏" : "加入收藏"}
        </button>
        <button type="button" className="btn-small btn-ghost" onClick={() => onStartEdit(item)}>
          编辑
        </button>
        <button type="button" className="btn-small btn-ghost" onClick={() => onDelete(item)}>
          删除
        </button>
      </div>
      <div className="workspace-list">
        <strong>最近练习记录</strong>
        {records.length === 0 ? (
          <div className="workspace-list-item">
            <span>还没有练习记录</span>
            <span>先做一次题就会显示在这里</span>
          </div>
        ) : (
          <>
            {records.map((record) => (
              <div key={record.id} className="workspace-list-item">
                <span>{record.study_date}</span>
                <span>{formatStudyResult(record.result)}</span>
                <span>掌握度 {record.mastery_level ?? "-"}</span>
                <span>耗时 {record.time_spent_seconds ?? 0}s</span>
              </div>
            ))}
            {total > records.length ? (
              <div className="workspace-list-item">
                <span>仅展示最近 {records.length} 条</span>
                <span>累计 {total} 次练习</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
