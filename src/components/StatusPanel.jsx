import { useState } from "react";

import { checkHealth } from "../services/api";

export default function StatusPanel() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("尚未检查");
  const [timestamp, setTimestamp] = useState("");

  const runCheck = async () => {
    setStatus("loading");
    setMessage("检查中...");
    setTimestamp("");
    try {
      const data = await checkHealth();
      setStatus("ok");
      setMessage("服务正常");
      setTimestamp(data.timestamp ?? "");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "请求失败");
    }
  };

  return (
    <section className="panel">
      <div>
        <h3>API 状态</h3>
        <p>后端健康检查地址：<code>/api/health</code></p>
        <div className={`status-pill status-${status}`}>
          <span>{message}</span>
          {timestamp && <time>{timestamp}</time>}
        </div>
      </div>
      <button className="btn-primary" type="button" onClick={runCheck}>
        运行检查
      </button>
    </section>
  );
}
