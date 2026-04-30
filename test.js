#!/usr/bin/env node
/**
 * 劳动纠纷证据收集系统 - 自动化测试脚本
 * 测试所有功能并生成100+条测试数据
 */

const http = require('http');

const API_BASE = 'http://47.114.81.88:3000';

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 测试数据
const testData = {
  lawyers: [],
  clients: [],
  cases: [],
  evidence: []
};

// 辅助函数：发送HTTP请求
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// 测试用例记录
function test(name, fn) {
  stats.total++;
  return fn().then(result => {
    if (result.passed) {
      stats.passed++;
      console.log(`✅ ${name}`);
    } else {
      stats.failed++;
      stats.errors.push({ name, error: result.error });
      console.log(`❌ ${name}: ${result.error}`);
    }
  }).catch(e => {
    stats.failed++;
    stats.errors.push({ name, error: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  });
}

// ========== 测试用例 ==========

async function testHealthCheck() {
  await test('健康检查', async () => {
    const res = await request('GET', '/api/health');
    return { passed: res.status === 200 && res.data.status === 'ok' };
  });
}

async function testWebhook() {
  await test('Webhook GET验证', async () => {
    const res = await request('GET', '/api/feishu/webhook?challenge=test123');
    return { passed: res.data.challenge === 'test123' };
  });

  await test('Webhook POST验证', async () => {
    const res = await request('POST', '/api/feishu/webhook', { challenge: 'post_test' });
    return { passed: res.data.challenge === 'post_test' };
  });
}

async function testLawyerLogin() {
  await test('律师登录-正确密码', async () => {
    const res = await request('POST', '/api/lawyer/login', {
      name: '刘正禹',
      password: '123456'
    });
    return { passed: res.data.success === true };
  });

  await test('律师登录-错误密码', async () => {
    const res = await request('POST', '/api/lawyer/login', {
      name: '刘正禹',
      password: 'wrong'
    });
    return { passed: res.status === 401 };
  });

  await test('律师登录-不存在用户', async () => {
    const res = await request('POST', '/api/lawyer/login', {
      name: '不存在',
      password: '123456'
    });
    return { passed: res.status === 401 };
  });
}

async function testCreateCases() {
  const caseTypes = ['illegal_termination', 'unpaid_wages', 'unpaid_leave', 'work_injury'];
  const regions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆'];
  const terminationReasons = ['违法解除', '协商解除', '经济性裁员', '未签劳动合同', '拖欠工资', '调岗降薪'];
  
  // 创建100个案件
  for (let i = 1; i <= 100; i++) {
    const caseType = caseTypes[(i - 1) % caseTypes.length];
    const region = regions[(i - 1) % regions.length];
    const terminationReason = terminationReasons[(i - 1) % terminationReasons.length];
    
    await test(`创建案件 #${i} (${caseType})`, async () => {
      const res = await request('POST', '/api/lawyer/cases', {
        lawyer: '刘正禹',
        clientName: `测试客户${i}`,
        clientPhone: `138${String(i).padStart(8, '0')}`,
        caseType,
        region,
        entryDate: `20${20 + (i % 5)}-01-01`,
        exitDate: `2026-04-${String(i % 28 + 1).padStart(2, '0')}`,
        avgSalary: 8000 + (i * 100),
        terminationReason,
        notes: `测试案件 #${i}`
      });
      
      if (res.data.success) {
        testData.cases.push(res.data.case);
        return { passed: true };
      }
      return { passed: false, error: res.data.error };
    });
  }
}

async function testGetLawyerCases() {
  await test('获取律师案件列表', async () => {
    const res = await request('GET', '/api/lawyer/cases?lawyer=刘正禹');
    return { passed: res.data.success && res.data.cases.length >= 100 };
  });
}

async function testClientLogin() {
  // 测试已存在的客户
  await test('客户登录-已存在', async () => {
    const res = await request('POST', '/api/client/login', {
      phone: '13800138001'
    });
    return { passed: res.data.success === true };
  });

  // 测试不存在的客户
  await test('客户登录-不存在', async () => {
    const res = await request('POST', '/api/client/login', {
      phone: '19900000000'
    });
    return { passed: res.status === 404 };
  });

  // 测试多个客户登录
  for (let i = 1; i <= 10; i++) {
    const phone = `138${String(i).padStart(8, '0')}`;
    await test(`客户登录 #${i}`, async () => {
      const res = await request('POST', '/api/client/login', { phone });
      return { passed: res.data.success === true };
    });
  }
}

async function testEvidenceOperations() {
  // 测试证据操作
  const testCases = testData.cases.slice(0, 20);
  
  for (let i = 0; i < testCases.length; i++) {
    const caseInfo = testCases[i];
    
    // 获取证据清单
    await test(`获取证据清单 #${i + 1}`, async () => {
      const res = await request('GET', `/api/client/evidence?caseId=${caseInfo.caseId}&phone=${caseInfo.clientPhone}`);
      if (res.data.success) {
        testData.evidence.push({ caseId: caseInfo.caseId, evidence: res.data.evidence });
        return { passed: true };
      }
      return { passed: false, error: res.data.error };
    });

    // 更新证据状态
    if (i < 10) {
      await test(`更新证据状态 #${i + 1}`, async () => {
        const res = await request('POST', '/api/client/evidence/update', {
          caseId: caseInfo.caseId,
          phone: caseInfo.clientPhone,
          evidenceId: 'contract',
          status: 'collected',
          note: `测试备注 ${i + 1}`,
          files: [{ name: 'test.jpg', size: 100 * 1024 }]
        });
        return { passed: res.data.success === true };
      });
    }
  }
}

async function testAIAudit() {
  // 测试AI审核
  const testCases = testData.cases.slice(0, 10);
  
  for (let i = 0; i < testCases.length; i++) {
    const caseInfo = testCases[i];
    
    await test(`AI审核 #${i + 1}`, async () => {
      const res = await request('POST', '/api/lawyer/audit', {
        lawyer: '刘正禹',
        caseId: caseInfo.caseId
      });
      return { passed: res.data.success === true };
    });
  }
}

async function testPermissionControl() {
  // 测试权限控制
  await test('权限控制-律师访问他人案件', async () => {
    // 创建另一个律师
    // 注意：这里假设系统中有其他律师，如果没有会返回404
    const res = await request('GET', '/api/lawyer/cases?lawyer=其他律师');
    return { passed: res.status === 401 || res.data.cases?.length === 0 };
  });

  await test('权限控制-客户访问他人案件', async () => {
    const res = await request('GET', '/api/client/evidence?caseId=CASE-001&phone=13800000002');
    return { passed: res.status === 403 };
  });
}

async function testDataIntegrity() {
  // 测试数据完整性
  await test('数据完整性-案件字段', async () => {
    const res = await request('GET', '/api/lawyer/cases?lawyer=刘正禹');
    if (res.data.cases && res.data.cases.length > 0) {
      const firstCase = res.data.cases[0];
      const hasAllFields = 
        firstCase.caseId && 
        firstCase.clientName && 
        firstCase.clientPhone &&
        firstCase.caseType &&
        firstCase.region;
      return { passed: hasAllFields };
    }
    return { passed: false, error: '没有案件数据' };
  });

  await test('数据完整性-证据字段', async () => {
    const res = await request('GET', '/api/client/evidence?caseId=CASE-001&phone=13800138001');
    if (res.data.evidence && res.data.evidence.length > 0) {
      const firstEvidence = res.data.evidence[0];
      const hasAllFields = 
        firstEvidence.id &&
        firstEvidence.name &&
        firstEvidence.description &&
        firstEvidence.status;
      return { passed: hasAllFields };
    }
    return { passed: false, error: '没有证据数据' };
  });
}

async function testEdgeCases() {
  // 测试边界情况
  await test('边界-空参数', async () => {
    const res = await request('POST', '/api/lawyer/login', {});
    return { passed: res.status === 401 };
  });

  await test('边界-无效案件类型', async () => {
    const res = await request('POST', '/api/lawyer/cases', {
      lawyer: '刘正禹',
      clientName: '测试',
      clientPhone: '13800000001',
      caseType: 'invalid_type',
      region: '北京'
    });
    // 应该接受任何案件类型（使用通用模板）
    return { passed: res.data.success === true || res.status === 400 };
  });

  await test('边界-超长备注', async () => {
    const longNote = 'a'.repeat(10000);
    const res = await request('POST', '/api/client/evidence/update', {
      caseId: 'CASE-001',
      phone: '13800138001',
      evidenceId: 'contract',
      note: longNote
    });
    return { passed: res.data.success === true };
  });
}

// ========== 主测试流程 ==========

async function main() {
  console.log('\n========================================');
  console.log('劳动纠纷证据收集系统 - 自动化测试');
  console.log('========================================\n');

  console.log('【1/10】健康检查测试');
  await testHealthCheck();

  console.log('\n【2/10】Webhook测试');
  await testWebhook();

  console.log('\n【3/10】律师登录测试');
  await testLawyerLogin();

  console.log('\n【4/10】创建案件测试（100个案件）');
  await testCreateCases();

  console.log('\n【5/10】获取律师案件列表');
  await testGetLawyerCases();

  console.log('\n【6/10】客户登录测试');
  await testClientLogin();

  console.log('\n【7/10】证据操作测试');
  await testEvidenceOperations();

  console.log('\n【8/10】AI审核测试');
  await testAIAudit();

  console.log('\n【9/10】权限控制测试');
  await testPermissionControl();

  console.log('\n【10/10】边界情况测试');
  await testEdgeCases();

  // 输出测试报告
  console.log('\n========================================');
  console.log('测试报告');
  console.log('========================================');
  console.log(`总计: ${stats.total} 个测试`);
  console.log(`通过: ${stats.passed} 个 ✅`);
  console.log(`失败: ${stats.failed} 个 ❌`);
  console.log(`成功率: ${((stats.passed / stats.total) * 100).toFixed(2)}%`);

  if (stats.errors.length > 0) {
    console.log('\n失败详情:');
    stats.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.name}: ${err.error}`);
    });
  }

  console.log('\n========================================');
  console.log('测试数据统计');
  console.log('========================================');
  console.log(`创建案件: ${testData.cases.length} 个`);
  console.log(`测试客户: ${new Set(testData.cases.map(c => c.clientPhone)).size} 个`);
  console.log(`证据操作: ${testData.evidence.length} 次`);

  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(console.error);
