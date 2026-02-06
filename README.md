# lf-smart-paper-web

JuYiFanSan (Smart Paper) 前端工程，聚焦小学错题整理与变式题生成的交互体验。

## 功能概览

- 上传试卷图片并展示处理进度
- OCR + 版面分析结果预览
- 变式题生成与错题本导出
- API 健康检查与状态提示
- 用户维护（学生/家长角色）
- 学生错题本维护（学科/年级/分类/错误原因）
- 学习记录与统计总览

## 目录结构

```
src/
  app/                 # 应用入口和路由
  components/
    home/              # 首页展示组件
    paper/             # 错题纸张视图组件
  constants/           # 首页文案和静态配置
  context/             # 全局状态（PaperContext）
  pages/
    paper/             # 上传页、结果页
  services/            # API 调用封装
  styles/              # 全局样式
  utils/               # 通用工具方法
```

详细规范见：`docs/CODE_LAYOUT.md`

## 开发

```bash
npm install
npm run dev
npm run build
```

> 所有命令需在 `lf-smart-paper-web/` 仓库根目录执行。

## 页面路由

- `/`：首页
- `/upload`：OCR 上传页
- `/result`：错题识别与导出页
- `/workspace`：用户/错题/统计管理台

## 环境变量

- `VITE_API_BASE`：后端 API 地址（默认 `http://localhost:8000`）
