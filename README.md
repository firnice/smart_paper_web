# lf-smart-paper-web

JuYiFanSan (Smart Paper) 前端工程，聚焦小学错题整理与变式题生成的交互体验。

## 功能概览

- 上传试卷图片并展示处理进度
- OCR + 版面分析结果预览
- 变式题生成与错题本导出
- API 健康检查与状态提示

## 目录结构

```
src/
  components/    # UI 组件
  constants/     # 文案与配置
  pages/         # 页面
  services/      # API 调用
```

## 开发

```bash
npm install
npm run dev
```

## 环境变量

- `VITE_API_BASE`：后端 API 地址（默认 `http://localhost:8000`）
