// ============================================
// 飞书证据录入系统 - 配置文件
// ============================================

// 开发模式开关（设为true使用模拟登录，设为false使用真实飞书登录）
const DEV_MODE = true;

// 飞书开放平台配置
const FEISHU_CONFIG = {
  // App ID（在飞书开放平台获取）
  appId: 'cli_a97a9035b5395cc4',

  // App Secret（在飞书开放平台获取，保密！）
  // ⚠️ 注意：这个文件不应该提交到代码仓库！
  appSecret: process.env.FEISHU_APP_SECRET || '',

  // 多维表格配置
  bitableToken: 'SCyMbdPt4aCYp9sqVrDcRh4Fnvb',
  tableId: 'tblduxvyAhxC4hXe',

  // 多维表格字段ID（如果需要精确匹配）
  fields: {
    caseId: '案件编号',
    evidenceId: '证据编号',
    evidenceCategory: '证据类别',
    evidenceName: '证据名称',
    userContent: '客户填写内容',
    userId: '客户ID',
    userName: '客户姓名',
    submitTime: '提交时间'
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FEISHU_CONFIG;
}
