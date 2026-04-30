// ============================================
// 劳动纠纷证据收集系统 - 服务器 (多角色版本)
// ============================================

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const PORT = 3000;

// ============================================
// 劳动纠纷标准证据清单模板 (来自多维表格)
// ============================================

const EVIDENCE_TEMPLATES = {
  // 通用模板 - 适用于所有劳动纠纷案件
  general: [
    // 劳动关系类
    {
      id: 'contract',
      name: '劳动合同',
      category: '劳动关系',
      required: true,
      description: '请上传劳动合同原件照片或扫描件（PDF或图片格式均可）',
      tips: ['如果有多份劳动合同，请全部上传', '纸质合同可拍照，电子合同可截图']
    },
    {
      id: 'work_card',
      name: '工作证、工牌、门禁卡',
      category: '劳动关系',
      required: true,
      description: '请上传工作证、工牌、门禁卡、名片、有单位名称的工作服照片',
      tips: ['可以手机拍照，只要能看清公司名称和您的信息即可', '多张照片请整理到一个文件夹后上传']
    },
    {
      id: 'performance',
      name: '绩效文件',
      category: '劳动关系',
      required: false,
      description: '如有绩效相关文件截图或PDF，请上传',
      tips: ['绩效考核结果通知', '公司发送的绩效相关邮件']
    },
    {
      id: 'employee_handbook',
      name: '员工手册签收',
      category: '劳动关系',
      required: false,
      description: '请说明是否签收过《员工手册》或公司规章制度',
      tips: ['在备注中填写：是否签收过？（是/否）']
    },
    // 工资福利类
    {
      id: 'bank_statement',
      name: '银行流水',
      category: '工资福利',
      required: true,
      description: '请在银行APP下载或导出最近12个月工资流水',
      tips: ['必须清晰显示：付款方公司名称、账号、标注"工资"字样', '导出格式：PDF或截图均可', '流水需显示"工资"关键词，如果不是工资发放，请备注说明']
    },
    {
      id: 'pay_slip',
      name: '工资条',
      category: '工资福利',
      required: false,
      description: '如有工资条，请上传照片或电子版',
      tips: ['纸质工资条可拍照，电子工资条可截图', '如有签字或盖章的工资条，请重点上传']
    },
    {
      id: 'salary_confirmation',
      name: '薪资确认文件',
      category: '工资福利',
      required: false,
      description: '如有岗位职责说明、调薪通知、奖金/提成计算说明等，请上传',
      tips: ['邮件请截图或导出为PDF']
    },
    {
      id: 'social_insurance',
      name: '社保、公积金缴费记录',
      category: '工资福利',
      required: true,
      description: '请上传社保和公积金缴费记录',
      tips: ['在当地社保局/公积金管理中心网站注册后下载', '或在支付宝/微信城市服务中查询并截图', '需显示：公司名称、缴费基数、缴费金额', '请提供最近12个月的记录', '如公司未足额缴纳，请重点标注']
    },
    // 考勤加班类
    {
      id: 'attendance',
      name: '考勤记录',
      category: '考勤加班',
      required: true,
      description: '请上传考勤记录截图或照片',
      tips: ['钉钉/企业微信月度打卡汇总截图', '考勤机照片（如有）', '考勤表/排班表（如公司有）', '需能看清日期和上下班时间', '如有加班记录，请一并提供']
    },
    {
      id: 'overtime_approval',
      name: '加班审批记录',
      category: '考勤加班',
      required: false,
      description: '如有加班申请记录截图或邮件，请上传',
      tips: ['需显示"审批通过"']
    },
    {
      id: 'overtime_chat',
      name: '加班沟通记录',
      category: '考勤加班',
      required: false,
      description: '如有领导指派加班的沟通记录，请截图上传',
      tips: ['微信/钉钉消息截图（显示领导在非工作时间指派工作）']
    },
    {
      id: 'work_deliverables',
      name: '工作成果记录',
      category: '考勤加班',
      required: false,
      description: '如有非工作时间完成的工作成果，请上传',
      tips: ['文档/表格/PPT等文件（查看文件属性中的创建/修改时间）']
    },
    // 视听资料类
    {
      id: 'work_communication',
      name: '工作群截图、工作邮件',
      category: '视听资料',
      required: false,
      description: '如有工作微信群/钉钉群的聊天记录，请截图上传',
      tips: ['需包含群名称、您的昵称、与领导/同事的沟通内容', '重要消息请单独截图保存']
    },
    // 协议文件类
    {
      id: 'agreements',
      name: '竞业限制协议等',
      category: '协议文件',
      required: false,
      description: '如有签署过竞业限制协议/保密协议/培训服务期协议，请上传原件',
      tips: ['如未签署过，请在备注中注明"未签署"']
    },
    // 其他
    {
      id: 'other_materials',
      name: '其他重要材料',
      category: '其他',
      required: false,
      description: '请上传其他对您有利的材料',
      tips: ['请假审批记录（可证明您的出勤情况）', '表彰证书、奖状、优秀员工通知等']
    }
  ],
  
  // 违法解除劳动合同 - 额外证据
  illegal_termination: [
    {
      id: 'termination_notice',
      name: '解除/终止劳动合同通知书',
      category: '离职相关',
      required: true,
      description: '请上传公司出具的解除/终止劳动合同通知书',
      tips: ['必须包含：公司盖章、解除日期、解除理由', '如为口头通知，请提供录音或事后要求公司出具书面通知的沟通记录']
    },
    {
      id: 'termination_chat',
      name: '解除沟通记录',
      category: '离职相关',
      required: false,
      description: '如有与HR或领导沟通解除事宜的记录，请上传',
      tips: ['微信/钉钉/邮件等沟通记录', '电话录音请转文字后上传']
    }
  ],
  
  // 拖欠工资
  unpaid_wages: [
    {
      id: 'owe_proof',
      name: '欠薪证明',
      category: '工资福利',
      required: false,
      description: '如有公司确认的欠条、承诺书等，请上传',
      tips: ['需有公司盖章或负责人签字']
    }
  ],
  
  // 未休年假
  unpaid_leave: [
    {
      id: 'entry_proof',
      name: '入职时间证明',
      category: '劳动关系',
      required: true,
      description: '请提供证明入职时间的材料',
      tips: ['劳动合同起始日期页', '社保缴费记录起始时间', '入职offer']
    },
    {
      id: 'leave_record',
      name: '休假记录',
      category: '考勤加班',
      required: true,
      description: '请上传公司系统休假记录',
      tips: ['钉钉/企业微信休假申请记录', '年假使用情况截图']
    }
  ],
  
  // 工伤赔偿
  work_injury: [
    {
      id: 'injury_report',
      name: '工伤认定书',
      category: '工伤认定',
      required: true,
      description: '请上传人社局出具的工伤认定书',
      tips: ['工伤认定决定书原件']
    },
    {
      id: 'medical_records',
      name: '医疗记录',
      category: '工伤认定',
      required: true,
      description: '请上传完整的医疗记录',
      tips: ['诊断证明、病历、出院小结', '医疗费用发票及清单', '影像学检查报告（X光、CT、MRI等）']
    },
    {
      id: 'disability_assessment',
      name: '伤残鉴定',
      category: '工伤认定',
      required: true,
      description: '请上传劳动能力鉴定结论',
      tips: ['劳动能力鉴定结论书', '如有复查鉴定，请一并提供']
    },
    {
      id: 'accident_report',
      name: '事故报告',
      category: '工伤认定',
      required: false,
      description: '如有事故报告或报警记录，请上传',
      tips: ['公司事故调查报告', '公安报警记录', '现场照片']
    }
  ]
};

// 数据存储 - 匹配多维表格结构
const db = {
  cases: {
    'CASE-001': {
      caseId: 'CASE-001',
      clientName: '张三',
      clientPhone: '13800138001',
      lawyer: '刘正禹',
      caseType: 'illegal_termination',
      status: 'collecting', // 证据收集/待立案/已立案/调解中/仲裁中/已结案/一审中
      createdAt: '2026-04-30',
      notes: '',
      // 新增字段（匹配多维表格）
      entryDate: '2024-01-01', // 入职日期
      exitDate: '2026-04-15',  // 离职日期
      avgSalary: 15000,        // 月平均工资
      region: '北京',          // 地区
      terminationReason: '违法解除' // 解除原因
    }
  },
  evidence: {},
  // 赔偿计算表
  compensation: {},
  // 地区配置
  regions: {
    '北京': { minWage: 2420, socialBaseMin: 6821, socialBaseMax: 34104 },
    '上海': { minWage: 2690, socialBaseMin: 7384, socialBaseMax: 36921 },
    '广州': { minWage: 2300, socialBaseMin: 5284, socialBaseMax: 26421 },
    '深圳': { minWage: 2360, socialBaseMin: 3523, socialBaseMax: 26421 },
    '杭州': { minWage: 2280, socialBaseMin: 4462, socialBaseMax: 22311 },
    '成都': { minWage: 2100, socialBaseMin: 4246, socialBaseMax: 21228 },
    '武汉': { minWage: 2210, socialBaseMin: 4224, socialBaseMax: 21120 },
    '南京': { minWage: 2280, socialBaseMin: 4494, socialBaseMax: 22470 },
    '西安': { minWage: 2160, socialBaseMin: 4638, socialBaseMax: 23190 },
    '重庆': { minWage: 2100, socialBaseMin: 4118, socialBaseMax: 20587 }
  },
  lawyers: {
    '刘正禹': { name: '刘正禹', password: '123456', cases: ['CASE-001'] }
  },
  clients: {
    '13800138001': { name: '张三', phone: '13800138001', cases: ['CASE-001'] }
  },
};

// 初始化证据清单 - 合并通用模板+案件特定模板
function initEvidenceList(caseId, caseType) {
  // 获取通用模板
  let baseList = JSON.parse(JSON.stringify(EVIDENCE_TEMPLATES.general));
  
  // 根据案件类型添加特定证据
  if (caseType && EVIDENCE_TEMPLATES[caseType]) {
    const specificList = JSON.parse(JSON.stringify(EVIDENCE_TEMPLATES[caseType]));
    baseList = [...baseList, ...specificList];
  }
  
  // 添加状态字段
  return baseList.map((item, index) => ({
    ...item,
    id: item.id || `ev_${index}`,
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
      const { lawyer, clientName, clientPhone, caseType, region, entryDate, exitDate, avgSalary, terminationReason, notes } = body;
      
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
        status: '证据收集',
        createdAt: new Date().toISOString().split('T')[0],
        notes: notes || '',
        region: region || '',
        entryDate: entryDate || '',
        exitDate: exitDate || '',
        avgSalary: avgSalary || 0,
        terminationReason: terminationReason || ''
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
    
    // ========== 飞书登录接口 ==========
    
    // 获取飞书登录配置
    if (pathname === '/api/feishu/config' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        appId: FEISHU_APP_ID,
        // 注意：正式环境需要配置正确的回调地址
        redirectUri: 'http://47.114.81.88:3000/feishu/callback'
      }));
      return;
    }
    
    // 飞书登录回调处理
    if (pathname === '/api/feishu/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { code } = body;
      
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少授权码' }));
        return;
      }
      
      try {
        // 使用飞书 API 获取 access_token
        const tokenRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FEISHU_APP_SECRET}` // 实际应该使用 app_access_token
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code
          })
        });
        
        const tokenData = await tokenRes.json();
        
        if (tokenData.code !== 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '飞书登录失败：' + tokenData.msg }));
          return;
        }
        
        const { open_id, union_id, mobile } = tokenData.data;
        
        // 如果没有手机号，返回错误
        if (!mobile) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '无法获取手机号，请确保已授权手机号权限' }));
          return;
        }
        
        // 检查该手机号是否有关联的案件
        const client = db.clients[mobile];
        if (!client) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: '未找到该手机号的案件，请联系您的律师',
            phone: mobile 
          }));
          return;
        }
        
        // 更新客户的飞书信息
        client.feishuOpenId = open_id;
        client.feishuUnionId = union_id;
        
        // 获取客户的所有案件
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
          client: { 
            name: client.name, 
            phone: client.phone,
            openId: open_id 
          },
          cases 
        }));
        return;
        
      } catch (e) {
        console.error('飞书登录错误:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '飞书登录处理失败' }));
        return;
      }
    }
    
    // ========== 赔偿计算接口 ==========
    
    // 获取案件赔偿计算
    if (pathname === '/api/lawyer/compensation' && req.method === 'GET') {
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
      const compensationList = db.compensation[caseId] || [];
      
      // 自动计算赔偿金额
      const calculations = calculateCompensation(caseInfo);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        case: caseInfo,
        compensation: compensationList,
        calculations
      }));
      return;
    }
    
    // 添加/更新赔偿计算
    if (pathname === '/api/lawyer/compensation' && req.method === 'POST') {
      const body = await parseBody(req);
      const { lawyer, caseId, item, baseAmount, years, multiplier, note } = body;
      
      if (!lawyer || !db.lawyers[lawyer]) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未授权' }));
        return;
      }
      
      if (!db.compensation[caseId]) {
        db.compensation[caseId] = [];
      }
      
      const amount = Math.round(baseAmount * years * multiplier);
      const compItem = {
        id: 'comp_' + Date.now(),
        item,
        baseAmount,
        years,
        multiplier,
        amount,
        note: note || '',
        createdAt: new Date().toISOString()
      };
      
      db.compensation[caseId].push(compItem);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, compensation: compItem }));
      return;
    }
    
    // ========== 地区配置接口 ==========
    
    // 获取地区配置
    if (pathname === '/api/regions' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        regions: db.regions
      }));
      return;
    }
    
    // ========== 案件状态更新接口 ==========
    
    // 更新案件状态
    if (pathname === '/api/lawyer/case/status' && req.method === 'POST') {
      const body = await parseBody(req);
      const { lawyer, caseId, status } = body;
      
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
      
      const validStatuses = ['证据收集', '待立案', '已立案', '调解中', '仲裁中', '已结案', '一审中'];
      if (!validStatuses.includes(status)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的案件状态' }));
        return;
      }
      
      db.cases[caseId].status = status;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, case: db.cases[caseId] }));
      return;
    }
    
    // ========== 赔偿计算辅助函数 ==========
    function calculateCompensation(caseInfo) {
      const results = [];
      const avgSalary = caseInfo.avgSalary || 0;
      const years = calculateWorkYears(caseInfo.entryDate, caseInfo.exitDate);
      
      // 违法解除：2N
      if (caseInfo.caseType === 'illegal_termination') {
        results.push({
          item: '违法解除劳动合同赔偿金',
          formula: `${avgSalary} × ${years} × 2`,
          baseAmount: avgSalary,
          years,
          multiplier: 2,
          amount: Math.round(avgSalary * years * 2),
          description: '根据《劳动合同法》第87条，用人单位违法解除劳动合同的，应按经济补偿标准的2倍支付赔偿金'
        });
      }
      
      // 拖欠工资：本金+25%赔偿金
      if (caseInfo.caseType === 'unpaid_wages') {
        results.push({
          item: '拖欠工资',
          formula: '拖欠金额（需根据证据确认）',
          amount: 0,
          description: '根据《劳动合同法》第85条，用人单位拖欠劳动报酬的，劳动行政部门责令限期支付；逾期不支付的，按应付金额50%-100%加付赔偿金'
        });
      }
      
      // 未休年假：3倍日工资
      if (caseInfo.caseType === 'unpaid_leave') {
        const dailySalary = avgSalary / 21.75;
        results.push({
          item: '未休年休假工资报酬',
          formula: `${dailySalary.toFixed(2)}/天 × 未休天数 × 3`,
          baseAmount: dailySalary,
          multiplier: 3,
          amount: 0,
          description: '根据《职工带薪年休假条例》第5条，单位应按职工日工资收入的300%支付年休假工资报酬'
        });
      }
      
      // 工伤：根据伤残等级
      if (caseInfo.caseType === 'work_injury') {
        results.push({
          item: '一次性伤残补助金',
          formula: '需根据伤残等级确定',
          amount: 0,
          description: '根据《工伤保险条例》，一级至十级伤残分别享受27-7个月本人工资的一次性伤残补助金'
        });
      }
      
      return results;
    }
    
    function calculateWorkYears(entryDate, exitDate) {
      if (!entryDate || !exitDate) return 0;
      const entry = new Date(entryDate);
      const exit = new Date(exitDate);
      const diffTime = exit - entry;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return Math.max(0, Math.round(diffDays / 365 * 10) / 10);
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
