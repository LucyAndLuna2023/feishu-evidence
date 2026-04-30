// ============================================
// 劳动纠纷证据收集系统 - 服务器 (多角色版本)
// ============================================

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const PORT = 3000;

// 劳动纠纷标准证据清单模板
const EVIDENCE_TEMPLATES = {
  illegal_termination: [
    { id: 'contract', name: '劳动合同', required: true, description: '完整劳动合同文本' },
    { id: 'salary_flow', name: '工资流水', required: true, description: '近12个月银行工资流水' },
    { id: 'social_insurance', name: '社保缴纳记录', required: true, description: '社保局打印的缴费记录' },
    { id: 'termination_notice', name: '解除/终止劳动合同通知书', required: true, description: '公司出具的解除通知' },
    { id: 'attendance', name: '考勤记录', required: false, description: '打卡记录或考勤表' },
    { id: 'work_chat', name: '工作沟通记录', required: false, description: '微信/钉钉/邮件等工作沟通' },
    { id: 'company_rules', name: '公司规章制度', required: false, description: '员工手册等制度文件' },
    { id: 'performance', name: '绩效考核记录', required: false, description: '绩效评估表等' },
  ],
  unpaid_wages: [
    { id: 'contract', name: '劳动合同', required: true, description: '约定工资标准的合同' },
    { id: 'salary_flow', name: '工资流水', required: true, description: '显示拖欠的银行流水' },
    { id: 'pay_slip', name: '工资条', required: true, description: '公司发放的工资条' },
    { id: 'owe_proof', name: '欠薪证明', required: false, description: '公司确认的欠条/承诺书' },
    { id: 'attendance', name: '考勤记录', required: true, description: '证明实际工作的考勤' },
  ],
  unpaid_leave: [
    { id: 'contract', name: '劳动合同', required: true, description: '劳动关系证明' },
    { id: 'entry_proof', name: '入职时间证明', required: true, description: '证明工作年限' },
    { id: 'leave_record', name: '休假记录', required: true, description: '公司系统休假记录' },
    { id: 'salary_proof', name: '日工资标准证明', required: true, description: '计算年假工资的基数' },
  ],
  work_injury: [
    { id: 'contract', name: '劳动合同', required: true, description: '劳动关系证明' },
    { id: 'injury_report', name: '工伤认定书', required: true, description: '人社局工伤认定' },
    { id: 'medical_records', name: '医疗记录', required: true, description: '诊断证明、病历、发票' },
    { id: 'disability', name: '伤残鉴定', required: true, description: '劳动能力鉴定结论' },
    { id: 'salary_flow', name: '工资流水', required: true, description: '计算赔偿基数' },
  ],
};

// 数据存储
const db = {
  cases: {
    'CASE-001': {
      caseId: 'CASE-001',
      clientName: '张三',
      clientPhone: '13800138001',
      lawyer: '刘正禹',
      caseType: 'illegal_termination',
      status: 'collecting',
      createdAt: '2026-04-30',
      notes: ''
    }
  },
  evidence: {},
  lawyers: {
    '刘正禹': { name: '刘正禹', password: '123456', cases: ['CASE-001'] }
  },
  clients: {
    '13800138001': { name: '张三', phone: '13800138001', cases: ['CASE-001'] }
  },
};

// 初始化证据清单
function initEvidenceList(caseId, caseType) {
  const template = EVIDENCE_TEMPLATES[caseType] || EVIDENCE_TEMPLATES.illegal_termination;
  return template.map(item => ({
    ...item,
    status: 'pending',
    files: [],
    note: '',
    updatedAt: null,
  }));
}

// 初始化示例数据
db.evidence['CASE-001'] = initEvidenceList('CASE-001', 'illegal_termination');

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }
  
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  try {
    // 飞书 Webhook
    if (pathname === '/api/feishu/webhook') {
      const challenge = query.challenge;
      if (challenge) {
        const response = JSON.stringify({ challenge });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(response) });
        res.end(response);
        return;
      }
      if (req.method === 'POST') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const bodyStr = Buffer.concat(chunks).toString();
        let body = {};
        try { if (bodyStr) body = JSON.parse(bodyStr); } catch (e) {}
        if (body.challenge) {
          const response = JSON.stringify({ challenge: body.challenge });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(response) });
          res.end(response);
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: 0, msg: 'success' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({}));
      return;
    }
    
    // 健康检查
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
      return;
    }
    
    // ========== 律师接口 ==========
    
    // 律师登录
    if (pathname === '/api/lawyer/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, password } = body;
      
      const lawyer = db.lawyers[name];
      if (!lawyer || lawyer.password !== password) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '用户名或密码错误' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, lawyer: { name: lawyer.name } }));
      return;
    }
    
    // 获取律师的所有案件
    if (pathname === '/api/lawyer/cases' && req.method === 'GET') {
      const { lawyer } = query;
      if (!lawyer || !db.lawyers[lawyer]) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未授权' }));
        return;
      }
      
      const cases = Object.values(db.cases).filter(c => c.lawyer === lawyer).map(c => {
        const evidenceList = db.evidence[c.caseId] || [];
        const collected = evidenceList.filter(e => e.status === 'collected').length;
        const required = evidenceList.filter(e => e.required).length;
        const requiredCollected = evidenceList.filter(e => e.required && e.status === 'collected').length;
        return {
          ...c,
          progress: {
            total: evidenceList.length,
            collected,
            required,
            requiredCollected,
            percent: Math.round((collected / evidenceList.length) * 100) || 0,
          }
        };
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, cases }));
      return;
    }
    
    // 创建案件
    if (pathname === '/api/lawyer/cases' && req.method === 'POST') {
      const body = await parseBody(req);
      const { lawyer, clientName, clientPhone, caseType, notes } = body;
      
      if (!lawyer || !db.lawyers[lawyer]) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未授权' }));
        return;
      }
      
      const caseId = 'CASE-' + Date.now().toString().slice(-6);
      db.cases[caseId] = {
        caseId,
        clientName,
        clientPhone,
        lawyer,
        caseType,
        status: 'collecting',
        createdAt: new Date().toISOString().split('T')[0],
        notes: notes || ''
      };
      
      // 初始化证据清单
      db.evidence[caseId] = initEvidenceList(caseId, caseType);
      
      // 关联客户
      if (!db.clients[clientPhone]) {
        db.clients[clientPhone] = { name: clientName, phone: clientPhone, cases: [] };
      }
      db.clients[clientPhone].cases.push(caseId);
      db.lawyers[lawyer].cases.push(caseId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, case: db.cases[caseId] }));
      return;
    }
    
    // 更新案件
    if (pathname === '/api/lawyer/cases' && req.method === 'PUT') {
      const body = await parseBody(req);
      const { lawyer, caseId, ...updates } = body;
      
      if (!lawyer || !db.lawyers[lawyer]) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未授权' }));
        return;
      }
      
      if (!db.cases[caseId]) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '案件不存在' }));
        return;
      }
      
      Object.assign(db.cases[caseId], updates);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, case: db.cases[caseId] }));
      return;
    }
    
    // 删除案件
    if (pathname === '/api/lawyer/cases' && req.method === 'DELETE') {
      const { lawyer, caseId } = query;
      
      if (!lawyer || !db.lawyers[lawyer]) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未授权' }));
        return;
      }
      
      delete db.cases[caseId];
      delete db.evidence[caseId];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    
    // 获取案件证据详情（律师查看）
    if (pathname === '/api/lawyer/evidence' && req.method === 'GET') {
      const { lawyer, caseId } = query;
      
      if (!lawyer || !db.lawyers[lawyer]) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未授权' }));
        return;
      }
      
      if (!db.cases[caseId]) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '案件不存在' }));
        return;
      }
      
      const caseInfo = db.cases[caseId];
      const evidenceList = db.evidence[caseId] || [];
      
      const collected = evidenceList.filter(e => e.status === 'collected').length;
      const required = evidenceList.filter(e => e.required).length;
      const requiredCollected = evidenceList.filter(e => e.required && e.status === 'collected').length;
      const unqualified = evidenceList.filter(e => e.status === 'unqualified').length;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        case: caseInfo,
        evidence: evidenceList,
        summary: {
          total: evidenceList.length,
          collected,
          required,
          requiredCollected,
          unqualified,
          percent: Math.round((collected / evidenceList.length) * 100) || 0,
          isComplete: requiredCollected >= required && unqualified === 0,
        }
      }));
      return;
    }
    
    // ========== 客户接口 ==========
    
    // 客户登录
    if (pathname === '/api/client/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { phone } = body;
      
      if (!phone) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '请输入手机号' }));
        return;
      }
      
      const client = db.clients[phone];
      if (!client) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未找到该手机号的案件，请联系您的律师' }));
        return;
      }
      
      const cases = client.cases.map(caseId => {
        const caseInfo = db.cases[caseId];
        const evidenceList = db.evidence[caseId] || [];
        const collected = evidenceList.filter(e => e.status === 'collected').length;
        const required = evidenceList.filter(e => e.required).length;
        const requiredCollected = evidenceList.filter(e => e.required && e.status === 'collected').length;
        
        return {
          ...caseInfo,
          progress: {
            total: evidenceList.length,
            collected,
            required,
            requiredCollected,
            percent: Math.round((collected / evidenceList.length) * 100) || 0,
          }
        };
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        client: { name: client.name, phone: client.phone },
        cases 
      }));
      return;
    }
    
    // 获取客户证据清单
    if (pathname === '/api/client/evidence' && req.method === 'GET') {
      const { caseId, phone } = query;
      
      if (!caseId || !phone) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '参数不完整' }));
        return;
      }
      
      const client = db.clients[phone];
      if (!client || !client.cases.includes(caseId)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无权访问此案件' }));
        return;
      }
      
      const caseInfo = db.cases[caseId];
      let evidenceList = db.evidence[caseId];
      
      if (!evidenceList) {
        evidenceList = initEvidenceList(caseId, caseInfo.caseType);
        db.evidence[caseId] = evidenceList;
      }
      
      const collected = evidenceList.filter(e => e.status === 'collected').length;
      const required = evidenceList.filter(e => e.required).length;
      const requiredCollected = evidenceList.filter(e => e.required && e.status === 'collected').length;
      const unqualified = evidenceList.filter(e => e.status === 'unqualified').length;
      
      const isComplete = requiredCollected >= required;
      const issues = [];
      
      if (!isComplete) {
        const missingRequired = evidenceList.filter(e => e.required && e.status !== 'collected');
        issues.push(`缺少 ${missingRequired.length} 项必填证据：${missingRequired.map(e => e.name).join('、')}`);
      }
      
      if (unqualified > 0) {
        issues.push(`${unqualified} 项证据不合格，需要重新上传`);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        case: caseInfo,
        evidence: evidenceList,
        summary: {
          total: evidenceList.length,
          collected,
          required,
          requiredCollected,
          unqualified,
          percent: Math.round((collected / evidenceList.length) * 100) || 0,
          isComplete,
          issues,
        }
      }));
      return;
    }
    
    // 客户更新证据
    if (pathname === '/api/client/evidence/update' && req.method === 'POST') {
      const body = await parseBody(req);
      const { caseId, phone, evidenceId, status, note, files } = body;
      
      if (!caseId || !phone || !evidenceId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '参数不完整' }));
        return;
      }
      
      const client = db.clients[phone];
      if (!client || !client.cases.includes(caseId)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无权操作此案件' }));
        return;
      }
      
      const evidenceList = db.evidence[caseId];
      if (!evidenceList) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '证据清单不存在' }));
        return;
      }
      
      const evidence = evidenceList.find(e => e.id === evidenceId);
      if (!evidence) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '证据项不存在' }));
        return;
      }
      
      if (status) evidence.status = status;
      if (note !== undefined) evidence.note = note;
      if (files) evidence.files = files;
      evidence.updatedAt = new Date().toISOString();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, evidence }));
      return;
    }
    
    // 客户添加自定义证据
    if (pathname === '/api/client/evidence/add' && req.method === 'POST') {
      const body = await parseBody(req);
      const { caseId, phone, name, description, required } = body;
      
      if (!caseId || !phone || !name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '参数不完整' }));
        return;
      }
      
      const client = db.clients[phone];
      if (!client || !client.cases.includes(caseId)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无权操作此案件' }));
        return;
      }
      
      let evidenceList = db.evidence[caseId];
      if (!evidenceList) {
        evidenceList = [];
        db.evidence[caseId] = evidenceList;
      }
      
      const newEvidence = {
        id: 'custom_' + Date.now(),
        name,
        description: description || '',
        required: required || false,
        isCustom: true,
        status: 'pending',
        files: [],
        note: '',
        updatedAt: new Date().toISOString(),
      };
      
      evidenceList.push(newEvidence);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, evidence: newEvidence }));
      return;
    }
    
    // 客户删除自定义证据
    if (pathname === '/api/client/evidence/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const { caseId, phone, evidenceId } = body;
      
      if (!caseId || !phone || !evidenceId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '参数不完整' }));
        return;
      }
      
      const client = db.clients[phone];
      if (!client || !client.cases.includes(caseId)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无权操作此案件' }));
        return;
      }
      
      let evidenceList = db.evidence[caseId];
      if (evidenceList) {
        const evidence = evidenceList.find(e => e.id === evidenceId);
        if (evidence && evidence.isCustom) {
          db.evidence[caseId] = evidenceList.filter(e => e.id !== evidenceId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }
      
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '只能删除自定义添加的证据' }));
      return;
    }
    
    // 获取证据模板
    if (pathname === '/api/templates' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        templates: Object.entries(EVIDENCE_TEMPLATES).map(([key, items]) => ({
          type: key,
          name: {
            illegal_termination: '违法解除劳动合同',
            unpaid_wages: '拖欠工资',
            unpaid_leave: '未休年假',
            work_injury: '工伤赔偿',
          }[key],
          items,
        }))
      }));
      return;
    }
    
    // 静态文件服务 - 根据路径返回不同页面
    const fs = require('fs');
    const path = require('path');
    
    if (pathname === '/' || pathname === '/index.html') {
      // 默认显示客户页面
      const htmlPath = path.join(__dirname, '..', 'client.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
    }
    
    if (pathname === '/lawyer' || pathname === '/lawyer.html') {
      const htmlPath = path.join(__dirname, '..', 'lawyer.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
    }
    
    if (pathname === '/client' || pathname === '/client.html') {
      const htmlPath = path.join(__dirname, '..', 'client.html');
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

const server = http.createServer(handleRequest);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`劳动纠纷证据收集系统运行在端口 ${PORT}`);
});
