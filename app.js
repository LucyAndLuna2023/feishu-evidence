// ============================================
// 飞书证据录入系统 - 前端主程序
// ============================================

// API配置
const API_BASE = '';  // 空字符串表示使用同源API，生产环境部署后填实际地址

// 证据清单数据
const evidenceList = [
  { id: 1, name: "劳动合同", category: "劳动关系", required: true, desc: "【必填】* 请上传劳动合同原件照片或扫描件（PDF或图片格式均可）\n💡 如果有多份劳动合同，请全部上传" },
  { id: 2, name: "工作证、工牌、门禁卡", category: "劳动关系", required: true, desc: "【必填】* 请上传工作证、工牌、门禁卡、名片等照片\n💡 可以手机拍照，只要能看清公司名称" },
  { id: 3, name: "银行流水", category: "工资福利", required: true, desc: "【必填】* 请上传最近12个月工资银行流水\n💡 必须显示\"工资\"字样和付款方公司名称" },
  { id: 4, name: "考勤记录", category: "考勤加班", required: true, desc: "【必填】* 请上传考勤记录截图或照片\n💡 需能看清日期和上下班时间" },
  { id: 5, name: "社保缴费记录", category: "工资福利", required: true, desc: "【必填】* 请上传社保缴费记录\n💡 在支付宝-市民中心-社保查询截图" },
  { id: 6, name: "离职证明", category: "劳动关系", required: true, desc: "【必填】* 请上传离职证明原件照片\n💡 需加盖公司公章" },
  { id: 7, name: "工资转账记录", category: "工资福利", required: true, desc: "【必填】* 请上传工资转账记录截图\n💡 显示每月固定日期转账的\"工资\"" },
  { id: 8, name: "降薪通知", category: "劳动关系变更", required: false, desc: "【选填】如有降薪通知，请上传相关材料\n📧 HR或老板发送的降薪通知截图" },
  { id: 9, name: "违纪处分通知", category: "离职相关", required: false, desc: "【选填】如有违纪处分通知，请上传\n📄 违纪处分决定书/通知" },
  { id: 10, name: "公司搬迁通知", category: "劳动关系变更", required: false, desc: "【选填】如有公司搬迁通知，请上传\n📧 公司发送的搬迁通知邮件/公告" },
  { id: 11, name: "孕期产检请假记录", category: "特殊保护", required: false, desc: "【选填】如有孕期产检请假记录，请上传\n📧 产检请假申请记录" },
  { id: 12, name: "产假相关材料", category: "特殊保护", required: false, desc: "【选填】如有产假相关材料，请上传\n📄 产假请假申请、生育津贴通知等" },
  { id: 13, name: "哺乳期加班安排", category: "特殊保护", required: false, desc: "【选填】如有哺乳期加班安排，请上传证据\n📱 哺乳期内被要求加班的消息记录" },
  { id: 14, name: "工伤认定材料", category: "特殊保护", required: false, desc: "【选填】如有工伤，请上传工伤认定材料\n🩺 医院诊断证明、工伤认定申请表" },
  { id: 15, name: "病假审批记录", category: "特殊保护", required: false, desc: "【选填】如有病假审批记录，请上传\n📄 医院病假条、请假审批记录" },
  { id: 16, name: "公司组织架构调整公告", category: "离职相关", required: false, desc: "【选填】如有公司组织架构调整公告，请上传\n📧 公司发送的部门撤销/合并通知" },
  { id: 17, name: "解除劳动合同通知书", category: "离职相关", required: true, desc: "【必填】* 请上传解除劳动合同通知书\n📄 解除通知书原件（必须加盖公司公章）" },
  { id: 18, name: "加班记录", category: "考勤加班", required: true, desc: "【必填】* 请统计并上传加班记录\n💡 钉钉/企业微信加班打卡记录截图" },
  { id: 19, name: "未休年假记录", category: "考勤加班", required: false, desc: "【选填】如有未休年假，请上传记录\n📄 年假申请记录、公司年假过期提醒" },
  { id: 20, name: "高温补贴发放记录", category: "工资福利", required: false, desc: "【选填】如有高温补贴，请上传发放记录\n💰 银行流水显示高温补贴发放金额" },
  { id: 21, name: "夜班津贴发放记录", category: "工资福利", required: false, desc: "【选填】如有夜班津贴，请上传发放记录\n💰 银行流水显示夜班津贴" },
  { id: 22, name: "末位淘汰通知", category: "离职相关", required: false, desc: "【选填】如有末位淘汰通知，请上传\n📄 解除劳动合同通知书（以末位淘汰为由）" },
  { id: 23, name: "待岗通知书", category: "离职相关", required: false, desc: "【选填】如有待岗通知书，请上传\n📄 公司发送的待岗通知书原件" },
  { id: 24, name: "停工停产相关材料", category: "离职相关", required: false, desc: "【选填】如有停工停产，请上传相关材料\n📄 公司发布的停工停产通知" },
  { id: 25, name: "被移出工作群记录", category: "视听资料", required: false, desc: "【选填】如有被移出工作群，请上传截图\n📱 手机截图（显示被移出群聊的时间）" },
  { id: 26, name: "收回工位的照片", category: "视听资料", required: false, desc: "【选填】如有收回工位，请上传证据\n📸 工位被清理后的照片" },
  { id: 27, name: "工作账号被禁用记录", category: "视听资料", required: false, desc: "【选填】如有工作账号被禁用，请上传\n📱 账号无法登录的截图" },
  { id: 28, name: "非工作时间加班安排", category: "视听资料", required: false, desc: "【选填】如有非工作时间加班安排，请上传\n📱 钉钉/微信消息截图（显示发送时间）" },
  { id: 29, name: "深夜/周末工作邮件", category: "视听资料", required: false, desc: "【选填】如有深夜/周末工作邮件，请上传\n📧 邮件发送记录截图（显示发送时间）" },
  { id: 30, name: "其他对您有利的材料", category: "其他", required: false, desc: "【选填】如有其他对您有利的材料，请上传\n📄 请假审批记录、表彰证书等" }
];

// 当前用户
let currentUser = null;
let currentCaseId = null;
let editingRecordId = null;
let currentTab = 'all';

// API请求
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('feishu_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}

// DOM元素
const loginSection = document.getElementById('loginSection');
const mainSection = document.getElementById('mainSection');
const loginBtn = document.getElementById('loginBtn');
const phoneLoginForm = document.getElementById('phoneLoginForm');
const confirmLoginBtn = document.getElementById('confirmLoginBtn');
const cancelLoginBtn = document.getElementById('cancelLoginBtn');
const loginNameInput = document.getElementById('loginName');
const loginPhoneInput = document.getElementById('loginPhone');
const loginCodeInput = document.getElementById('loginCode');
const loginCodeBtn = document.getElementById('loginCodeBtn');
const roleSelect = document.getElementById('roleSelect');
const logoutBtn = document.getElementById('logoutBtn');
const caseIdInput = document.getElementById('caseId');
const loadBtn = document.getElementById('loadBtn');
const loadingEl = document.getElementById('loading');
const evidenceListEl = document.getElementById('evidenceList');
const progressSectionEl = document.getElementById('progressSection');
const evidenceFormEl = document.getElementById('evidenceForm');
const formTitle = document.getElementById('formTitle');
const formEvidenceId = document.getElementById('formEvidenceId');
const formCaseId = document.getElementById('formCaseId');
const formCategory = document.getElementById('formCategory');
const formName = document.getElementById('formName');
const formContent = document.getElementById('formContent');
const selectFileBtn = document.getElementById('selectFileBtn');
const formFile = document.getElementById('formFile');
const fileNameEl = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const userNameEl = document.getElementById('userName');
const userAvatarEl = document.getElementById('userAvatar');
const displayUserNameEl = document.getElementById('displayUserName');
const userRoleEl = document.getElementById('userRole');
const requiredTotalEl = document.getElementById('requiredTotal');
const submittedCountEl = document.getElementById('submittedCount');
const pendingCountEl = document.getElementById('pendingCount');
const progressFillEl = document.getElementById('progressFill');
const tabAll = document.getElementById('tabAll');
const tabSubmitted = document.getElementById('tabSubmitted');
const tabPending = document.getElementById('tabPending');
const currentTabEl = document.getElementById('currentTab');
const lawyerPanel = document.getElementById('lawyerPanel');
const adminPanel = document.getElementById('adminPanel');
const caseListEl = document.getElementById('caseList');
const roleSection = document.getElementById('roleSection');

// 事件监听
loginBtn.addEventListener('click', handleLogin);
confirmLoginBtn.addEventListener('click', handleConfirmLogin);
cancelLoginBtn.addEventListener('click', handleCancelLogin);
logoutBtn.addEventListener('click', handleLogout);
loadBtn.addEventListener('click', loadEvidenceList);
cancelBtn.addEventListener('click', closeForm);
submitBtn.addEventListener('click', submitEvidence);
selectFileBtn.addEventListener('click', () => formFile.click());
formFile.addEventListener('change', handleFileSelect);
tabAll.addEventListener('click', () => switchTab('all'));
tabSubmitted.addEventListener('click', () => switchTab('submitted'));
tabPending.addEventListener('click', () => switchTab('pending'));

// 发送验证码
async function sendCode() {
  const phone = loginPhoneInput.value.trim();
  if (!phone) {
    showError('请输入手机号');
    return;
  }

  loginCodeBtn.disabled = true;
  loginCodeBtn.textContent = '发送中...';

  try {
    const result = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });

    if (result.success) {
      showSuccess('验证码已发送到您的手机');
      let countdown = 60;
      const timer = setInterval(() => {
        countdown--;
        loginCodeBtn.textContent = `${countdown}秒后重发`;
        if (countdown <= 0) {
          clearInterval(timer);
          loginCodeBtn.disabled = false;
          loginCodeBtn.textContent = '获取验证码';
        }
      }, 1000);
    } else {
      showError(result.error || '发送验证码失败');
      loginCodeBtn.disabled = false;
      loginCodeBtn.textContent = '获取验证码';
    }
  } catch (error) {
    showError('网络错误，请稍后重试');
    loginCodeBtn.disabled = false;
    loginCodeBtn.textContent = '获取验证码';
  }
}

// 登录处理
function handleLogin() {
  loginBtn.classList.add('hidden');
  phoneLoginForm.classList.remove('hidden');
}

async function handleConfirmLogin() {
  const phone = loginPhoneInput.value.trim();
  const code = loginCodeInput?.value?.trim();

  if (!phone) {
    showError('请输入手机号');
    return;
  }

  if (!code) {
    showError('请输入验证码');
    return;
  }

  confirmLoginBtn.disabled = true;
  confirmLoginBtn.textContent = '登录中...';

  try {
    const result = await apiRequest('/api/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });

    if (result.success) {
      currentUser = result.user;
      localStorage.setItem('feishu_token', result.token);
      localStorage.setItem('feishu_user', JSON.stringify(currentUser));
      showMainSection();
      showSuccess('登录成功！');
    } else {
      showError(result.error || '登录失败');
    }
  } catch (error) {
    // 如果API不可用，使用模拟登录
    console.log('API not available, using mock login');
    currentUser = {
      openId: 'user_' + Date.now(),
      name: phone.slice(-4),
      phone: phone,
      role: 'client'
    };
    localStorage.setItem('feishu_user', JSON.stringify(currentUser));
    showMainSection();
    showSuccess('登录成功（演示模式）！');
  }

  confirmLoginBtn.disabled = false;
  confirmLoginBtn.textContent = '确认登录';
}

function handleCancelLogin() {
  loginBtn.classList.remove('hidden');
  phoneLoginForm.classList.add('hidden');
  loginNameInput.value = '';
  loginPhoneInput.value = '';
  loginCodeInput.value = '';
}

function handleLogout() {
  currentUser = null;
  currentCaseId = null;
  localStorage.removeItem('feishu_token');
  localStorage.removeItem('feishu_user');
  loginBtn.classList.remove('hidden');
  phoneLoginForm.classList.add('hidden');
  loginNameInput.value = '';
  loginPhoneInput.value = '';
  lawyerPanel.classList.add('hidden');
  adminPanel.classList.add('hidden');
  showLoginSection();
}

function showLoginSection() {
  loginSection.classList.remove('hidden');
  mainSection.classList.add('hidden');
}

function showMainSection() {
  loginSection.classList.add('hidden');
  mainSection.classList.add('hidden');

  if (currentUser) {
    userNameEl.textContent = currentUser.name || '用户';
    displayUserNameEl.textContent = currentUser.name || '用户';
    userAvatarEl.textContent = (currentUser.name || '用户').charAt(0);
    userRoleEl.textContent = currentUser.role === 'admin' ? '管理员' : currentUser.role === 'lawyer' ? '律师' : '客户';

    // 律师和管理员显示案件列表
    if (currentUser.role === 'admin' || currentUser.role === 'lawyer') {
      lawyerPanel.classList.remove('hidden');
      if (currentUser.role === 'admin') {
        adminPanel.classList.remove('hidden');
      }
      loadCaseList();
    } else {
      lawyerPanel.classList.add('hidden');
      adminPanel.classList.add('hidden');
    }
  }
  mainSection.classList.remove('hidden');
}

// 加载案件列表
async function loadCaseList() {
  try {
    const result = await apiRequest('/api/cases');
    if (result.cases) {
      renderCaseList(result.cases);
    }
  } catch (error) {
    // 模拟数据
    renderCaseList([
      { caseId: "TEST-001", clientName: "张三", phone: "138****8001", lawyer: "刘正禹", status: "进行中", progress: 60 },
      { caseId: "TEST-002", clientName: "李四", phone: "138****8002", lawyer: "刘正禹", status: "进行中", progress: 30 },
      { caseId: "TEST-003", clientName: "王五", phone: "138****8003", lawyer: "刘正禹", status: "已完成", progress: 100 },
    ]);
  }
}

function renderCaseList(cases) {
  caseListEl.innerHTML = '';

  if (cases.length === 0) {
    caseListEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">暂无案件</p>';
    return;
  }

  cases.forEach(c => {
    const div = document.createElement('div');
    div.className = 'case-item';
    div.innerHTML = `
      <div class="case-header">
        <div class="case-name">${c.clientName}</div>
        <div class="case-status status-${c.status}">${c.status}</div>
      </div>
      <div class="case-info">
        <div>案件编号：${c.caseId}</div>
        <div>客户电话：${c.phone}</div>
        <div>负责律师：${c.lawyer}</div>
      </div>
      <div class="case-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${c.progress}%"></div>
        </div>
        <div class="progress-text">${c.progress}% 已完成</div>
      </div>
      <button class="btn" onclick="viewCaseDetail('${c.caseId}')" style="margin-top:10px;">查看详情</button>
    `;
    caseListEl.appendChild(div);
  });
}

function viewCaseDetail(caseId) {
  caseIdInput.value = caseId;
  lawyerPanel.classList.add('hidden');
  adminPanel.classList.add('hidden');
  loadEvidenceList();
}

function backToCaseList() {
  lawyerPanel.classList.remove('hidden');
  document.getElementById('caseInput').classList.add('hidden');
  evidenceListEl.classList.remove('active');
  progressSectionEl.classList.add('hidden');
}

// 加载证据清单
async function loadEvidenceList() {
  const caseId = caseIdInput.value.trim();
  if (!caseId) {
    showError('请输入案件编号');
    return;
  }
  currentCaseId = caseId;
  hideError();
  evidenceListEl.classList.remove('active');
  evidenceFormEl.classList.add('hidden');
  progressSectionEl.classList.add('hidden');
  successMessage.classList.add('hidden');
  showLoading();

  try {
    const result = await apiRequest(`/api/records?caseId=${encodeURIComponent(caseId)}`);
    renderEvidenceList(caseId, result.records || []);
    updateProgress(caseId, result.records || []);
  } catch (error) {
    // 使用本地存储
    const localRecords = JSON.parse(localStorage.getItem(`records_${caseId}`) || '[]');
    renderEvidenceList(caseId, localRecords);
    updateProgress(caseId, localRecords);
  }

  hideLoading();
  evidenceListEl.classList.add('active');
}

// 渲染证据列表
function renderEvidenceList(caseId, records) {
  evidenceListEl.innerHTML = '';

  records.forEach(record => {
    const div = document.createElement('div');
    div.className = 'evidence-item submitted';
    div.innerHTML = `
      <div class="evidence-header">
        <div class="evidence-name">${record.evidenceName || '证据' + record.evidenceId}</div>
        <span class="status-badge status-submitted">已提交</span>
      </div>
      <div class="evidence-type">${record.evidenceCategory || ''}</div>
      <div class="evidence-user-content">
        <strong>📝 已提交内容：</strong><br>
        ${escapeHtml(record.content || '')}
        <div style="font-size: 12px; color: #999; margin-top: 5px;">
          提交人：${record.userName || '客户'} | 时间：${new Date(record.submittedAt).toLocaleString()}
        </div>
      </div>
      ${currentUser.role !== 'admin' ? `
      <div style="display: flex; gap: 8px; margin-top: 10px;">
        <button class="btn" onclick="openEditForm(${record.evidenceId}, '${record.id}')" style="flex:1; background: #ff9800;">✏️ 编辑</button>
        <button class="btn" onclick="deleteRecord('${record.id}')" style="flex:1; background: #f44336;">🗑️ 删除</button>
      </div>
      ` : ''}
    `;
    evidenceListEl.appendChild(div);
  });

  // 添加未提交的证据
  evidenceList.filter(e => !records.some(r => r.evidenceId === e.id)).forEach(evidence => {
    const div = document.createElement('div');
    div.className = `evidence-item ${evidence.required ? 'required' : 'optional'}`;
    div.innerHTML = `
      <div class="evidence-header">
        <div class="evidence-name">${evidence.name}</div>
        <span class="status-badge ${evidence.required ? 'status-required' : 'status-optional'}">
          ${evidence.required ? '必填' : '选填'}
        </span>
      </div>
      <div class="evidence-type">${evidence.category}</div>
      <div class="evidence-desc">${evidence.desc}</div>
      <button class="btn evidence-btn" onclick="openEvidenceForm(${evidence.id})">📤 提交证据</button>
    `;
    evidenceListEl.appendChild(div);
  });
}

// 打开提交表单
function openEvidenceForm(evidenceId) {
  const evidence = evidenceList.find(e => e.id === evidenceId);
  if (!evidence) return;

  editingRecordId = null;
  formEvidenceId.value = evidenceId;
  formCaseId.value = currentCaseId;
  formCategory.value = evidence.category;
  formName.value = evidence.name;
  formContent.value = '';
  fileNameEl.textContent = '';

  formTitle.textContent = `📤 提交证据：${evidence.name}`;
  submitBtn.textContent = '提交证据';

  evidenceListEl.classList.remove('active');
  evidenceFormEl.classList.remove('hidden');
  evidenceFormEl.classList.add('active');
  successMessage.classList.add('hidden');
  hideError();
}

// 打开编辑表单
function openEditForm(evidenceId, recordId) {
  const evidence = evidenceList.find(e => e.id === evidenceId);
  const records = JSON.parse(localStorage.getItem(`records_${currentCaseId}`) || '[]');
  const record = records.find(r => r.id === recordId);

  if (!evidence || !record) return;

  editingRecordId = recordId;
  formEvidenceId.value = evidenceId;
  formCaseId.value = currentCaseId;
  formCategory.value = evidence.category;
  formName.value = evidence.name;
  formContent.value = record.content || '';
  fileNameEl.textContent = '';

  formTitle.textContent = `✏️ 编辑证据：${evidence.name}`;
  submitBtn.textContent = '保存修改';

  evidenceListEl.classList.remove('active');
  evidenceFormEl.classList.remove('hidden');
  evidenceFormEl.classList.add('active');
  successMessage.classList.add('hidden');
  hideError();
}

function closeForm() {
  evidenceFormEl.classList.add('hidden');
  evidenceListEl.classList.add('active');
  editingRecordId = null;
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  fileNameEl.textContent = file ? `📎 已选择: ${file.name}` : '';
}

async function submitEvidence() {
  const content = formContent.value.trim();
  if (!content) {
    showError('请填写证据说明');
    return;
  }

  const caseId = formCaseId.value;
  const evidenceId = parseInt(formEvidenceId.value);
  const evidence = evidenceList.find(e => e.id === evidenceId);

  submitBtn.disabled = true;
  submitBtn.textContent = '提交中...';

  try {
    if (editingRecordId) {
      // 更新记录
      await apiRequest('/api/records', {
        method: 'PUT',
        body: JSON.stringify({ caseId, id: editingRecordId, content }),
      });
    } else {
      // 创建记录
      await apiRequest('/api/records', {
        method: 'POST',
        body: JSON.stringify({
          caseId,
          evidenceId,
          evidenceName: evidence.name,
          evidenceCategory: evidence.category,
          content,
        }),
      });
    }
    showSuccess(editingRecordId ? '✅ 修改已保存！' : '✅ 提交成功！');
  } catch (error) {
    // 本地存储
    const records = JSON.parse(localStorage.getItem(`records_${caseId}`) || '[]');
    if (editingRecordId) {
      const index = records.findIndex(r => r.id === editingRecordId);
      if (index !== -1) {
        records[index].content = content;
        records[index].updatedAt = new Date().toISOString();
      }
    } else {
      records.push({
        id: 'rec_' + Date.now(),
        evidenceId,
        evidenceName: evidence.name,
        evidenceCategory: evidence.category,
        content,
        submittedAt: new Date().toISOString(),
        userId: currentUser?.openId || 'unknown',
        userName: currentUser?.name || '客户',
      });
    }
    localStorage.setItem(`records_${caseId}`, JSON.stringify(records));
    showSuccess(editingRecordId ? '✅ 修改已保存！' : '✅ 提交成功！');
  }

  setTimeout(() => {
    closeForm();
    loadEvidenceList();
    submitBtn.disabled = false;
    submitBtn.textContent = editingRecordId ? '保存修改' : '提交证据';
    successMessage.classList.add('hidden');
  }, 1500);
}

async function deleteRecord(recordId) {
  if (!confirm('确定要删除这条记录吗？')) return;

  try {
    await apiRequest(`/api/records?id=${recordId}&caseId=${currentCaseId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    // 本地存储
    const records = JSON.parse(localStorage.getItem(`records_${currentCaseId}`) || '[]');
    const filtered = records.filter(r => r.id !== recordId);
    localStorage.setItem(`records_${currentCaseId}`, JSON.stringify(filtered));
  }

  showSuccess('✅ 已删除！');
  setTimeout(() => {
    successMessage.classList.add('hidden');
    loadEvidenceList();
  }, 1000);
}

function updateProgress(caseId, records) {
  const required = evidenceList.filter(e => e.required);
  const total = required.length;
  const submitted = required.filter(e => records.some(r => r.evidenceId === e.id)).length;
  const pending = total - submitted;
  const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;

  requiredTotalEl.textContent = total;
  submittedCountEl.textContent = submitted;
  pendingCountEl.textContent = pending;
  progressFillEl.style.width = `${percent}%`;

  progressSectionEl.classList.remove('hidden');
}

function switchTab(tab) {
  currentTab = tab;
  currentTabEl.value = tab;
  tabAll.classList.remove('active-tab');
  tabSubmitted.classList.remove('active-tab');
  tabPending.classList.remove('active-tab');
  if (tab === 'all') tabAll.classList.add('active-tab');
  if (tab === 'submitted') tabSubmitted.classList.add('active-tab');
  if (tab === 'pending') tabPending.classList.add('active-tab');

  // 重新过滤显示
  const items = evidenceListEl.querySelectorAll('.evidence-item');
  items.forEach(item => {
    if (tab === 'all') {
      item.style.display = '';
    } else if (tab === 'submitted') {
      item.style.display = item.classList.contains('submitted') ? '' : 'none';
    } else if (tab === 'pending') {
      item.style.display = !item.classList.contains('submitted') ? '' : 'none';
    }
  });
}

function showLoading() {
  loadingEl.classList.remove('hidden');
  loadBtn.disabled = true;
}

function hideLoading() {
  loadingEl.classList.add('hidden');
  loadBtn.disabled = false;
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function showSuccess(msg) {
  successMessage.textContent = msg;
  successMessage.classList.remove('hidden');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('feishu_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainSection();
  } else {
    showLoginSection();
  }
});
