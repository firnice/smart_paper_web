import React from "react";
import { usePaper } from "../../context/PaperContext.jsx";

export default function PaperView({ items, pageSize = 6, onSelect, selectedId }) {
  const { crops } = usePaper();

  // Helper to chunk items into pages
  const pages = React.useMemo(() => {
    const result = [];
    for (let index = 0; index < items.length; index += pageSize) {
      result.push(items.slice(index, index + pageSize));
    }
    return result;
  }, [items, pageSize]);

  if (items.length === 0) {
    return (
      <div className="paper-empty">
        <p>暂无题目数据</p>
      </div>
    );
  }

  return (
    <div className="paper-container">
      {pages.map((pageItems, pageIndex) => (
        <div key={`page-${pageIndex}`} className="paper-sheet a4">
          <div className="paper-header-row">
            <div className="header-left">
              <h4>举一反三 · 错题整理</h4>
            </div>
            <div className="header-right">
               <span>姓名：__________</span>
               <span>日期：__________</span>
            </div>
          </div>
          
          <div className="paper-content-grid">
            {pageItems.map((item, idx) => (
              <div 
                key={item.id} 
                className={`paper-item ${selectedId === item.id ? "selected" : ""}`}
                onClick={() => onSelect && onSelect(item.id)}
              >
                <div className="item-index">{pageIndex * pageSize + idx + 1}.</div>
                <div className="item-body">
                  <p className="item-text">{item.text}</p>
                  {item.has_image && (
                    <div className="item-image">
                      {crops[item.id] ? (
                        <img src={crops[item.id]} alt="题目插图" />
                      ) : (
                        <span className="image-loading">插图加载中...</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="paper-footer">
             第 {pageIndex + 1} 页 / 共 {pages.length} 页
          </div>
        </div>
      ))}
    </div>
  );
}
