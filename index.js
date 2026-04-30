const express = require('express');
const server = require('./api/server');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 飞书 Webhook
app.get('/api/feishu/webhook', (req, res) => {
  if (req.query.challenge) {
    return res.json({ challenge: req.query.challenge });
  }
  res.json({});
});

app.post('/api/feishu/webhook', (req, res) => {
  console.log('收到飞书事件:', req.body);
  res.json({ code: 0, msg: 'success' });
});

// 其他 API 路由使用原有服务
app.get('/api/cases', server.handleRequest);
app.post('/api/login', server.handleRequest);
app.post('/api/verify', server.handleRequest);
app.get('/api/records', server.handleRequest);
app.post('/api/records', server.handleRequest);
app.put('/api/records', server.handleRequest);
app.delete('/api/records', server.handleRequest);

// 前端页面
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
