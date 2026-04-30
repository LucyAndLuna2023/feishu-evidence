// ============================================
// 飞书证据录入系统 - 标准HTTP服务器
// ============================================

const http = require('http');
const url = require('url');
const PORT = 3000;

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a97a9035b5395cc4';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '';

// 内存存储
const records = {};
const users = {};

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// 主处理器
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }
  
  // 设置 CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  try {
    // 飞书 Webhook 验证 (GET/POST 都支持)
    if (pathname === '/api/feishu/webhook') {
      const challenge = query.challenge;
      if (challenge) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ challenge }));
        return;
      }
      // POST 请求处理
      if (req.method === 'POST') {
        const body = await parseBody(req);
        console.log('收到飞书事件:', body);
        // 如果 body 中有 challenge
        if (body.challenge) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ challenge: body.challenge }));
          return;
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 0, msg: 'success' }));
      return;
    }
    
    // 健康检查
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
      return;
    }
    
    // 发送验证码
    if (pathname === '/api/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { phone } = body;
      
      if (!phone) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '手机号不能为空' }));
        return;
      }
      
      try {
        const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/send_verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile_country_code: '86',
            mobile: phone,
          }),
        });
        
        const data = await response.json();
        
        if (data.code === 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: '验证码已发送' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: data.msg || '发送验证码失败' }));
        }
      } catch (error) {
        console.error('发送验证码错误:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '发送验证码失败' }));
      }
      return;
    }
    
    // 验证登录
    if (pathname === '/api/verify' && req.method === 'POST') {
      const body = await parseBody(req);
      const { phone, code } = body;
      
      if (!phone || !code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '参数不完整' }));
        return;
      }
      
      // 模拟验证成功
      const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2);
      users[token] = {
        openId: 'user_' + Date.now(),
        name: phone.slice(-4),
        phone: phone,
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        token: token,
        user: users[token]
      }));
      return;
    }
    
    // 获取案件列表
    if (pathname === '/api/cases' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        cases: [
          { caseId: 'TEST-001', clientName: '张三', phone: '138****8001', lawyer: '刘正禹', status: '进行中', progress: 60 },
          { caseId: 'TEST-002', clientName: '李四', phone: '138****8002', lawyer: '刘正禹', status: '进行中', progress: 30 },
          { caseId: 'TEST-003', clientName: '王五', phone: '138****8003', lawyer: '刘正禹', status: '已完成', progress: 100 },
        ]
      }));
      return;
    }
    
    // 获取证据记录
    if (pathname === '/api/records' && req.method === 'GET') {
      const caseId = query.caseId;
      const caseRecords = records[caseId] || [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ records: caseRecords }));
      return;
    }
    
    // 创建证据记录
    if (pathname === '/api/records' && req.method === 'POST') {
      const body = await parseBody(req);
      const { caseId, evidenceId, evidenceName, evidenceCategory, content } = body;
      
      if (!records[caseId]) records[caseId] = [];
      
      const record = {
        id: 'rec_' + Date.now(),
        evidenceId,
        evidenceName,
        evidenceCategory,
        content,
        submittedAt: new Date().toISOString(),
      };
      
      records[caseId].push(record);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, record }));
      return;
    }
    
    // 更新证据记录
    if (pathname === '/api/records' && req.method === 'PUT') {
      const body = await parseBody(req);
      const { caseId, id, content } = body;
      
      const caseRecords = records[caseId] || [];
      const index = caseRecords.findIndex(r => r.id === id);
      
      if (index !== -1) {
        caseRecords[index].content = content;
        caseRecords[index].updatedAt = new Date().toISOString();
        records[caseId] = caseRecords;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, record: caseRecords[index] }));
        return;
      }
      
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '记录不存在' }));
      return;
    }
    
    // 删除证据记录
    if (pathname === '/api/records' && req.method === 'DELETE') {
      const id = query.id;
      const caseId = query.caseId;
      
      if (records[caseId]) {
        records[caseId] = records[caseId].filter(r => r.id !== id);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    
    // 静态文件服务
    if (pathname === '/' || pathname === '/index.html') {
      const fs = require('fs');
      const path = require('path');
      
      const htmlPath = path.join(__dirname, '..', 'index.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: pathname }));
    
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
  }
}

// 启动服务器
const server = http.createServer(handleRequest);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
