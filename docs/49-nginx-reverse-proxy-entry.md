# 49-nginx-reverse-proxy-entry

## 目标

为 Smart Paper 增加一层 Nginx 统一入口：

- `80 -> nginx`
- `/ -> 5173`
- `/api -> 8100`
- `/static -> 8100`
- 后端 `8100` 不直接对外暴露
- 本次先不上 HTTPS

## 本次变更

### 1. 前端联调代理切到 8100

更新 `vite.config.js`：

- dev server 监听 `0.0.0.0:5173`
- `/api` 代理到 `http://localhost:8100`
- `/static` 代理到 `http://localhost:8100`

这样本地前端联调与线上 Nginx 入口保持一致。

### 2. 静态资源地址改为同域优先

更新 `src/utils/imageProcessing.js`：

- 优先使用 `VITE_API_BASE`
- 未配置时优先使用当前页面 `window.location.origin`
- 最后 fallback 到 `http://localhost:8100`

这样上线后通过 Nginx 访问时，图片和 OCR 相关静态资源会自然走同域 `/static/...`。

### 3. 新增 Nginx 配置模板

新增文件：

- `deploy/nginx/smart-paper.conf`
- `deploy/docker-compose.nginx.yml`

默认路由：

- `/` -> `127.0.0.1:5173`
- `/api/` -> `127.0.0.1:8100/api/`
- `/static/` -> `127.0.0.1:8100/static/`

## 使用方式

### 方案 A：宿主机 Nginx

把 `deploy/nginx/smart-paper.conf` 放到宿主机 Nginx 站点配置目录，reload 即可。

### 方案 B：Docker Nginx

在 `deploy/` 目录执行：

```bash
docker compose -f docker-compose.nginx.yml up -d
```

> 当前示例使用 `network_mode: host`，假设前端监听 `5173`、后端监听 `8100`，且都在宿主机本地可达。

## 注意事项

1. 线上建议不要直接暴露 `8100`
2. 如果前端最终改成静态构建产物，可把 `/` 从代理 Vite 改成直接托管 `dist/`
3. 若保留 Vite dev server 在线上运行，需继续保留 WebSocket/HMR 相关 header
4. 本次未处理 HTTPS，后续只需在 Nginx 这一层补证书即可
