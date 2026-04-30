# 劳动纠纷证据录入 H5 网页应用

## 📋 项目说明

这是一个帮助客户提交劳动纠纷证据的H5网页应用，可以在微信、飞书、浏览器中打开使用。

### ✨ 功能特性

- 🔐 **飞书登录验证** - 客户需要使用飞书账号登录
- 📋 **证据清单展示** - 显示所有证据类型，标记必填/选填
- 📤 **证据提交** - 客户可以提交证据说明
- 📊 **提交进度** - 实时显示提交进度
- 🔒 **数据隔离** - 客户只能看到自己的案件数据
- 📱 **移动端友好** - 响应式设计，手机浏览器友好

---

## 🚀 部署指南

### 方式一：部署到自己的服务器

#### 1. 准备服务器

推荐配置：
- CPU: 1核
- 内存: 1GB
- 带宽: 1Mbps
- 系统: Ubuntu 20.04 / CentOS 7

推荐云服务商：
- 阿里云 ECS（学生机 9.9元/月）
- 腾讯云 CVM（学生机 10元/月）
- AWS EC2（免费套餐）
- Vultr（$5/月）

#### 2. 安装 Node.js

```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

验证安装：
```bash
node -v  # 应该显示 v18.x.x
npm -v   # 应该显示 8.x.x
```

#### 3. 上传代码

```bash
# 在本地项目目录执行
scp -r ./feishu-evidence-app user@your-server:/home/user/
```

#### 4. 配置环境变量

```bash
# SSH登录到服务器
ssh user@your-server

# 进入项目目录
cd feishu-evidence-app

# 设置环境变量（重要！）
export FEISHU_APP_ID="cli_a97a9035b5395cc4"
export FEISHU_APP_SECRET="你的App Secret"
export PORT=8080
```

#### 5. 安装依赖并启动

```bash
cd feishu-evidence-app
npm install
npm start
```

#### 6. 配置 Nginx（可选，用于HTTPS）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 7. 配置 HTTPS（必需）

使用 Let's Encrypt 免费证书：

```bash
sudo apt install certbot
sudo certbot --nginx -d your-domain.com
```

---

### 方式二：使用 PM2 守护进程（生产环境推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name feishu-evidence

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

常用命令：
```bash
pm2 list           # 查看进程列表
pm2 logs           # 查看日志
pm2 restart all    # 重启所有进程
pm2 stop all       # 停止所有进程
```

---

### 方式三：部署到 Vercel（免费，推荐）

#### 1. 创建 vercel.json

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.js" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

#### 2. 环境变量配置

在 Vercel 后台添加环境变量：
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`

#### 3. 部署

```bash
npm i -g vercel
vercel
```

---

## 🔧 飞书开放平台配置

### 1. 配置应用信息

1. 打开 [飞书开放平台](https://open.feishu.cn)
2. 进入你的应用（cli_a97a9035b5395cc4）
3. 配置应用信息

### 2. 配置权限

需要开通以下权限：
- `bitable:app:record:create` - 创建记录
- `bitable:app:record:read` - 读取记录
- `authen:user_id:read` - 获取用户ID

### 3. 配置网页应用

1. 进入「应用功能」→「网页应用」
2. 添加网址：
   - 开发环境：`http://localhost:8080`
   - 生产环境：`https://你的域名`

### 4. 发布应用

1. 创建应用版本
2. 提交审核
3. 发布上线

---

## 📱 使用指南

### 客户使用流程

1. **打开链接**
   - 在微信/飞书/浏览器中打开网页链接
   - 例如：`https://your-domain.com`

2. **登录**
   - 点击「使用飞书账号登录」
   - 使用飞书App扫码或授权

3. **输入案件编号**
   - 输入律师提供的案件编号
   - 点击「查询我的证据清单」

4. **查看证据**
   - 查看需要提交的证据清单
   - 必填证据显示红色标记
   - 选填证据显示绿色标记

5. **提交证据**
   - 点击「提交证据」按钮
   - 填写证据说明
   - 可选择上传附件
   - 点击「提交证据」

6. **查看进度**
   - 返回清单页面
   - 查看提交进度统计
   - 已提交的证据显示为灰色

---

## 🔐 安全说明

### 重要提示

⚠️ **App Secret 是敏感信息**
- 不要将 App Secret 硬编码在前端代码中
- 不要将 App Secret 提交到 Git 仓库
- 使用环境变量存储 App Secret

### 数据安全

- 所有数据传输使用 HTTPS 加密
- 用户只能查看自己的案件数据
- 证据提交需要登录验证

---

## 📂 项目文件结构

```
feishu-evidence-app/
├── index.html      # 主页面
├── app.js          # 前端逻辑
├── config.js       # 配置文件
├── server.js       # 后端服务器
├── package.json    # 项目配置
└── README.md       # 说明文档
```

---

## 🐛 常见问题

### Q: 微信打不开页面？
A: 确保已配置 HTTPS，微信要求页面必须使用 HTTPS 协议。

### Q: 登录失败？
A: 检查飞书开放平台的 App ID 和 App Secret 是否正确配置。

### Q: 数据没有保存到表格？
A: 检查 App Secret 是否正确，以及多维表格的 Token 是否正确。

### Q: 如何查看提交的数据？
A: 在飞书多维表格的「证据清单」表中查看，案件编号字段可以筛选。

---

## 📞 技术支持

如遇问题，请联系开发团队。

---

**版本**: 1.0.0
**更新日期**: 2026-04-28
