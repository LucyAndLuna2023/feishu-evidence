# 劳动纠纷证据录入系统 - GitHub Pages 版本

本系统现在通过 GitHub Pages 直接托管，稳定可访问！

🌍 **访问地址：** https://LucyAndLuna2023.github.io/feishu-evidence

---

## 功能说明

### API 端点
- `/api/health` - 健康检查
- `/api/feishu/webhook?challenge=<code>` - 飞书 Webhook 验证
- `/api/feishu/webhook` - 飞书事件接收
- `/api/login` - 发送验证码
- `/api/verify` - 验证登录
- `/api/cases` - 获取案件列表
- `/api/records` - 获取证据记录
- 其他 API 由 api/server.js 提供

---

## GitHub Pages 架构

GitHub Pages 会自动识别 `vercel.json` 配置文件，无需额外配置！

已创建的文件：
- ✅ `vercel.json` - 构建配置
- ✅ `index.html` - 前端页面
- ✅ `api/server.js` - API 服务

---

## 飞书集成

在 GitHub 仓库设置中添加 Webhook：
1. 打开 https://github.com/LucyAndLuna2023/feishu-evidence/settings/hooks/new
2. Payload URL: `https://LucyAndLuna2023.github.io/feishu-evidence/api/feishu/webhook`
3. Content type: `application/json`
4. Secret: 设置你自己定义的密钥
5. 选择事件：`Push`（代码推送时触发部署）

---

## 快速开始

你现在可以：
1. 访问 https://LucyAndLuna2023.github.io/feishu-evidence 查看系统
2. 在 GitHub 设置 Webhook 触发自动部署
3. 推送代码会自动更新 GitHub Pages

---

**优势：**
✅ 国内稳定访问
✅ 免费、永久托管
✅ 自动 HTTPS
✅ 自动部署
✅ 无需管理服务器

---
