/**
 * 海外共享充电宝项目测算 H5 - 核心逻辑 V3
 * 支持：国家→收入联动 | BD/渠道占比 | 投入滑块 | 必填验证 | 直接展示二维码
 */

// ========== 页面导航 ==========

function goToPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ========== 必填验证 ==========

function validateAndGo(fromPage, toPage) {
  const errors = [];

  if (fromPage === 'page-basic') {
    if (!document.getElementById('country').value) {
      errors.push('请选择目标国家/市场');
    }
    if (!getSelectedValue('city-type')) {
      errors.push('请选择投放范围（单城市/跨城市）');
    }
    if (!getSelectedValue('stage')) {
      errors.push('请选择当前项目阶段');
    }
    if (!getSelectedValue('scale')) {
      errors.push('请选择预计投放规模');
    }
    if (!getSelectedValue('mode')) {
      errors.push('请选择铺设方式');
    }
  }

  if (fromPage === 'page-operation') {
    if (!document.getElementById('monthly-income').value) {
      errors.push('请填写预估单台月收入（可使用系统自动填入的建议值）');
    }
    if (!document.getElementById('hardware-cost').value) {
      errors.push('请填写单台硬件综合投入成本');
    }
    if (!document.getElementById('labor-cost').value) {
      errors.push('请填写平均人力成本');
    }
  }

  if (fromPage === 'page-team') {
    if (!document.getElementById('labor-cost').value) {
      errors.push('请填写平均人力成本');
    }
  }

  if (errors.length > 0) {
    showValidationError(errors[0]);
    return;
  }

  // 如果是page-team，直接触发测算
  if (fromPage === 'page-team' && toPage === null) {
    calculateAndShowResult();
    return;
  }

  if (toPage) {
    goToPage(toPage);
  }
}

function showValidationError(message) {
  // 创建一个临时提示
  const existing = document.getElementById('validation-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'validation-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ef4444;
    color: #fff;
    padding: 14px 20px;
    border-radius: 10px;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(239,68,68,0.4);
    animation: slideDown 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;
  toast.innerHTML = '⚠️ ' + message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== 表单交互 ==========

function selectOption(groupId, element) {
  const container = document.getElementById(groupId);
  if (!container) return;
  container.querySelectorAll('.select-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  element.classList.add('active');
}

function getSelectedValue(groupId) {
  const container = document.getElementById(groupId);
  if (!container) return '';
  const activeBtn = container.querySelector('.select-btn.active');
  return activeBtn ? activeBtn.dataset.value : '';
}

function updateSliderValue(type, value) {
  const valueElement = document.getElementById(type + '-value');
  if (valueElement) {
    valueElement.innerHTML = value + '<span>%</span>';
  }
}

// ========== 投入资金滑块 ==========

function updateInvestmentDisplay(value) {
  const display = document.getElementById('investment-display');
  if (display) {
    display.innerHTML = value + '<span>万元</span>';
  }
}

// ========== 国家选择 → 单台月收入联动 ==========

function onCountryChange() {
  const country = document.getElementById('country');
  const otherInput = document.getElementById('other-country-input');
  const incomeInput = document.getElementById('monthly-income');
  const incomeHint = document.getElementById('income-hint');

  if (country.value === 'other') {
    otherInput.style.display = 'block';
    incomeHint.textContent = '请根据对目标市场的了解，手动填写单台月收入估算值（参考：东南亚120-300元）';
    incomeInput.value = '';
  } else if (country.value) {
    otherInput.style.display = 'none';
    const selectedOption = country.options[country.selectedIndex];
    const minIncome = selectedOption.getAttribute('data-income-min');
    const maxIncome = selectedOption.getAttribute('data-income-max');

    if (minIncome && maxIncome) {
      // 自动填入保守建议值（偏低区间）
      const suggestedIncome = Math.round((parseInt(minIncome) + parseInt(maxIncome)) / 2 * 0.8);
      incomeInput.value = suggestedIncome;
      incomeHint.innerHTML = `<strong>参考区间：</strong>${minIncome}-${maxIncome} 元/台/月（已填保守估算值）`;
    }
  } else {
    otherInput.style.display = 'none';
    incomeHint.textContent = '请先选择目标市场，系统将自动给出建议区间';
    incomeInput.value = '';
  }
}

function checkIncomeValue() {
  const incomeInput = document.getElementById('monthly-income');
  const alert = document.getElementById('income-alert');

  if (incomeInput && alert) {
    const value = parseFloat(incomeInput.value);
    const country = document.getElementById('country');
    const selectedOption = country.options[country.selectedIndex];
    const maxIncome = selectedOption ? parseInt(selectedOption.getAttribute('data-income-max')) : 300;

    if (value > maxIncome * 1.1) {
      alert.classList.add('show');
      alert.textContent = `您填写的单台月收入（${value}元）高于该市场参考上限（${maxIncome}元），可能导致结果过于乐观`;
    } else if (value > 0) {
      alert.classList.remove('show');
    }
  }
}

// ========== BD/渠道滑块 → 动态警告 ==========

function updateChannelSlider(value) {
  const valueElement = document.getElementById('channel-value');
  const bdPercent = 100 - parseInt(value);
  if (valueElement) {
    valueElement.innerHTML = `${value}<span>% 渠道 | ${bdPercent}% BD</span>`;
  }

  // BD比例警告
  const bdRatioAlert = document.getElementById('bd-ratio-alert');
  const bdWarningBox = document.getElementById('bd-warning-box');
  if (bdRatioAlert) {
    bdRatioAlert.textContent = bdPercent;
  }
  if (bdWarningBox) {
    if (bdPercent > 30) {
      bdWarningBox.classList.add('show');
    } else {
      bdWarningBox.classList.remove('show');
    }
  }
}

// ========== 核心测算逻辑（按顺序：人力→运营→分成→安装→支付） ==========

function getUserInputs() {
  // 基础信息
  const country = document.getElementById('country').value;
  const countryText = country === 'other'
    ? document.getElementById('other-country').value || '其他市场'
    : document.getElementById('country').options[document.getElementById('country').selectedIndex].text;
  const cityType = getSelectedValue('city-type');
  const scale = getSelectedValue('scale');
  const mode = getSelectedValue('mode');
  const stage = getSelectedValue('stage');

  // 投入资金（滑块：万元转元）
  const investmentWan = parseFloat(document.getElementById('total-investment').value) || 100;
  const totalInvestment = investmentWan * 10000;

  // 经营参数
  const monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 100;
  const splitRatio = parseFloat(document.getElementById('split-ratio').value) / 100;
  const hardwareCost = parseFloat(document.getElementById('hardware-cost').value) || 800;
  const installCost = parseFloat(document.getElementById('install-cost').value) || 20;
  const systemCostSelect = getSelectedValue('system-cost-select');
  const systemCostRatio = systemCostSelect ? parseFloat(systemCostSelect) : 0.05;

  // 铺设策略
  const channelRatio = parseFloat(document.getElementById('channel-ratio').value) / 100;
  const bdRatio = 1 - channelRatio;

  // 人效参数
  const bdCapacity = parseFloat(document.getElementById('bd-capacity').value) || 15;
  const maintenanceCapacity = parseFloat(document.getElementById('maintenance-capacity').value) || 600;
  const adminCapacity = parseFloat(document.getElementById('admin-capacity').value) || 800;
  const laborCost = parseFloat(document.getElementById('labor-cost').value) || 8050;
  const includeOverhead = getSelectedValue('include-overhead') === 'yes' || getSelectedValue('include-overhead') === 'auto';

  return {
    country,
    countryText,
    cityType,
    scale: parseInt(scale) || 300,
    mode,
    stage,
    totalInvestment,
    monthlyIncome,
    splitRatio,
    hardwareCost,
    installCost,
    systemCostRatio,
    channelRatio,
    bdRatio,
    bdCapacity,
    maintenanceCapacity,
    adminCapacity,
    laborCost,
    includeOverhead
  };
}

function calculateResults(params) {
  const {
    cityType,
    scale,
    monthlyIncome,
    splitRatio,
    hardwareCost,
    installCost,
    systemCostRatio,
    channelRatio,
    bdRatio,
    bdCapacity,
    maintenanceCapacity,
    adminCapacity,
    laborCost,
    includeOverhead,
    totalInvestment
  } = params;

  // ===== 1. 投入资金量 =====
  let investment;
  if (totalInvestment > 500000) {
    investment = totalInvestment;
  } else {
    // 根据规模估算
    const deviceCost = scale * (hardwareCost + installCost);
    const operatingReserve = scale * monthlyIncome * 0.25 * 6;
    investment = Math.max(deviceCost + operatingReserve, 500000);
  }

  // ===== 2. 团队规模测算（先算人） =====
  // BD逻辑调整：以渠道为主时，BD不再是主力铺设，而是补充零散点位
  // BD人数与总台数弱相关，最多2-3人即可
  let bdCount;
  if (bdRatio <= 0.2) {
    // 80%以上渠道：BD只是补充，最多2人
    bdCount = 1;
  } else if (bdRatio <= 0.4) {
    // 60-80%渠道：BD轻度配置
    bdCount = Math.min(3, Math.max(1, Math.ceil(scale / 500)));
  } else {
    // BD为主：按传统方式计算，但也要有上限
    const bdUnits = Math.round(scale * bdRatio);
    bdCount = Math.min(10, Math.max(2, Math.ceil(bdUnits / bdCapacity)));
  }

  const maintenanceCount = Math.max(1, Math.ceil(scale / maintenanceCapacity));
  const adminCount = Math.max(1, Math.ceil(scale / adminCapacity));
  const gmCount = 1;
  const marketingCount = cityType === 'multi' ? 1 : 0;
  const totalTeamSize = bdCount + maintenanceCount + adminCount + gmCount + marketingCount;

  // ===== 3. 月度人力成本 =====
  const monthlyLaborCost = totalTeamSize * laborCost;

  // ===== 4. 运营成本（办公/仓储/车辆） =====
  let monthlyOverhead = 0;
  if (includeOverhead) {
    const officeRent = 30000;
    const warehouseRent = 4500;
    const carExpense = Math.max(1, Math.ceil(scale / 400)) * 5500;
    const miscExpense = totalTeamSize * 200;
    monthlyOverhead = officeRent + warehouseRent + carExpense + miscExpense;
  }

  // ===== 5. 设备总投入 =====
  const totalCostPerUnit = hardwareCost + installCost;
  const totalHardwareInvestment = scale * totalCostPerUnit;

  // ===== 6. 月收入测算 =====
  // 商户分成（总收入 × 分成比例）
  const monthlySplitCost = scale * monthlyIncome * splitRatio;

  // 系统与支付通道成本（总收入 × 系统成本比例）
  const monthlyGrossIncome = scale * monthlyIncome;
  const monthlySystemCost = monthlyGrossIncome * systemCostRatio;

  // 月净收入（扣除分成+系统成本）
  const monthlyNetIncome = monthlyGrossIncome - monthlySplitCost - monthlySystemCost;

  // ===== 7. 月总成本 =====
  const totalMonthlyCost = monthlyLaborCost + monthlyOverhead;

  // ===== 8. 月利润 =====  （全量运营时的月利润）
  const monthlyProfit = monthlyNetIncome - totalMonthlyCost;

  // ===== 9. 盈亏平衡点（月）——按当月现金流计算 =====
  // 算法说明：
  // - Month 1：准备期，无设备落地，当月支出 = 固定成本+开办费，当月收入=0
  // - Month 2 开始：每月落地 300 台
  // - 盈亏平衡点 = 第一个"当月收入 > 当月支出"的月份
  const PER_MONTH_DEPLOY = 300; // 每月铺设备数
  const startUpCost = 50000; // 开办费
  const perUnitMonthlyContribution = monthlyNetIncome / scale; // 每台每月净贡献

  let breakevenMonth = null;
  let month = 1;
  let deployed = 0;

  // Month 1：准备期（无设备，无收入）
  const month1Expense = totalMonthlyCost + startUpCost;
  if (month1Expense <= 0) breakevenMonth = 1; // 理论上不可能
  if (breakevenMonth === null) month++;

  // 部署期：每月落地设备，当月收入=已部署台数×单台净贡献
  while (deployed < scale && breakevenMonth === null && month <= 60) {
    deployed = Math.min(deployed + PER_MONTH_DEPLOY, scale);
    const thisMonthRevenue = deployed * perUnitMonthlyContribution;
    const thisMonthExpense = totalMonthlyCost; // 当月固定成本
    if (thisMonthRevenue > thisMonthExpense) {
      breakevenMonth = month; // 当月现金流首次转正
    }
    month++;
  }

  // 全部铺完后仍不够 → 检查全量状态下是否盈利
  if (breakevenMonth === null && deployed >= scale) {
    if (monthlyNetIncome > totalMonthlyCost) {
      breakevenMonth = month; // 全量落地后再跑一个月，全量收入覆盖固定成本
    }
  }

  // 如果全量落地后月利润仍<=0，说明规模不够
  if (breakevenMonth === null) breakevenMonth = 999;

  // ===== 10. 回本周期 —— 基于真实月现金流 =====
  const initialInvestment = totalHardwareInvestment + startUpCost;
  let paybackMonths;
  if (monthlyProfit <= 0) {
    paybackMonths = 999;
  } else {
    // 重新计算：从第一个月现金流开始累加
    // Month 1: -labor -overhead -startup -device_deployed_month1(0)
    // Month 2+: revenue - fixed_cost
    // 回本 = 初始投入 / 月利润，但起始点要等全部设备铺完后的次月开始算
    // 为简化：仍然用全量月利润 / 总投入，但以全部落地后那个月为起点
    paybackMonths = Math.ceil(initialInvestment / monthlyProfit);
    paybackMonths = Math.min(paybackMonths, 60);
    paybackMonths += (breakevenMonth < 999 ? breakevenMonth : 1);
  }

  // ===== 10. 风险评估 =====

  // 资金压力
  let fundPressure;
  if (investment > 3000000 || (monthlyProfit < 0 && Math.abs(monthlyProfit) > monthlyNetIncome * 0.5)) {
    fundPressure = 'high';
  } else if (investment > 1500000 && monthlyProfit < monthlyNetIncome * 0.25) {
    fundPressure = 'medium';
  } else {
    fundPressure = 'low';
  }

  // 运营复杂度
  let complexity;
  if (scale > 1000 || bdRatio > 0.6) {
    complexity = 'high';
  } else if (scale > 500 || bdRatio > 0.35) {
    complexity = 'medium';
  } else {
    complexity = 'low';
  }

  // ===== 11. 项目评级 =====
  let rating;
  if (paybackMonths <= 16 && fundPressure !== 'high' && monthlyProfit > 0 && bdRatio <= 0.3) {
    rating = 'excellent';
  } else if (paybackMonths <= 24 && monthlyProfit > 0) {
    rating = 'good';
  } else if (paybackMonths <= 36 && monthlyProfit > 0) {
    rating = 'moderate';
  } else {
    rating = 'risky';
  }

  // ===== 12. 利润潜力等级 =====
  let profitLevel;
  if (monthlyProfit > 200000) {
    profitLevel = '较高';
  } else if (monthlyProfit > 80000) {
    profitLevel = '中等';
  } else if (monthlyProfit > 0) {
    profitLevel = '较低';
  } else {
    profitLevel = '亏损';
  }

  // ===== 13. 最低准备资金 = 硬件投入 + 开办费 + 6个月运营备用金 =====
  const operatingReserve = totalMonthlyCost * 6;
  const minRequiredCapital = totalHardwareInvestment + startUpCost + operatingReserve;

  return {
    investment: Math.round(investment),
    paybackMonths,
    breakevenMonth,
    minRequiredCapital: Math.round(minRequiredCapital),
    monthlyProfit: Math.round(monthlyProfit),
    monthlyNetIncome: Math.round(monthlyNetIncome),
    monthlyGrossIncome: Math.round(monthlyGrossIncome),
    monthlyCost: Math.round(totalMonthlyCost),
    monthlyLaborCost: Math.round(monthlyLaborCost),
    monthlyOverhead: Math.round(monthlyOverhead),
    monthlySplitCost: Math.round(monthlySplitCost),
    monthlySystemCost: Math.round(monthlySystemCost),
    totalHardwareInvestment: Math.round(totalHardwareInvestment),
    rating,
    fundPressure,
    complexity,
    profitLevel,
    channelRatio,
    bdRatio,
    totalTeamSize,
    bdCount,
    maintenanceCount,
    adminCount
  };
}

// ========== 最低盈利台数计算 ==========

function calculateMinimumViableScale(params) {
  const { monthlyIncome, splitRatio, systemCostRatio, laborCost, includeOverhead, bdRatio, bdCapacity, maintenanceCapacity, adminCapacity, scale } = params;

  // 单台月净收入（扣除分成+系统后）
  const netPerUnit = monthlyIncome * (1 - splitRatio - systemCostRatio);

  // 基础团队配置（不随规模增加的岗位）
  const fixedTeam = {
    gm: 1,
    admin: 1,
    // 客服/内勤根据规模增加
    support: 1
  };
  const fixedTeamSize = fixedTeam.gm + fixedTeam.admin + fixedTeam.support;

  // 随规模增加的人力
  // 运维按 maintenanceCapacity 配置
  // BD按 bdRatio 比例配置

  // ===== 最低运营台数计算 =====
  // 公式：总成本 = 总收入
  // (固定团队成本 + 可变团队成本) = 台数 × 单台净收入
  // 可变团队：运维 = scale/maintenanceCapacity, BD = scale × bdRatio / bdCapacity

  // 简化：找到"刚好能养活最小团队"的台数
  // 最小团队 = GM(1) + 内勤(1) + 基础运维(1~2人)
  // 最基础配置下的月固定成本
  const basicTeamSize = 3; // GM + 内勤 + 1运维
  const basicMonthlyCost = basicTeamSize * laborCost;

  // 基础运营成本（办公室+仓库，固定）
  const basicOverhead = includeOverhead ? 34500 : 0; // office 30000 + warehouse 4500

  // 最低月收入要求 = 基础团队成本 + 基础运营成本
  const minimumMonthlyRevenue = basicMonthlyCost + basicOverhead;

  // 单台贡献（扣除商户分成后，留给自己的）
  const contributionPerUnit = monthlyIncome * (1 - splitRatio);

  // 最低盈利台数 = 最低月收入要求 / 单台贡献
  // 但还要扣除系统成本：netPerUnit = monthlyIncome * (1 - splitRatio - systemCostRatio)
  const netContributionPerUnit = monthlyIncome * (1 - splitRatio - systemCostRatio);

  if (netContributionPerUnit <= 0) {
    return { minimumScale: 9999, breakEvenScale: 9999, status: 'impossible' };
  }

  const minimumScale = Math.ceil(minimumMonthlyRevenue / netContributionPerUnit);

  // 理想运营台数（能养完整团队且有盈余）
  const fullTeamSize = basicTeamSize + 2; // +1 BD + 1 运营主管
  const healthyMonthlyRevenue = (fullTeamSize * laborCost) + (includeOverhead ? 60000 : 0);
  const healthyScale = Math.ceil(healthyMonthlyRevenue / netContributionPerUnit);

  // 判断当前规模状态
  let status;
  if (minimumScale > 1000) {
    status = 'too-low'; // 目标市场台均太低，最低门槛太高
  } else if (scale < minimumScale * 0.5) {
    status = 'too-low';
  } else if (scale < minimumScale) {
    status = 'risky';
  } else if (scale < healthyScale) {
    status = 'marginal';
  } else {
    status = 'healthy';
  }

  return {
    minimumScale,
    healthyScale,
    basicMonthlyCost,
    basicOverhead,
    netContributionPerUnit,
    status
  };
}

function generateAnalysis(params, results) {
  const { monthlyIncome, splitRatio, channelRatio, bdRatio, scale, mode, countryText, totalInvestment } = params;
  const { monthlyProfit, paybackMonths, fundPressure, complexity, monthlyNetIncome, monthlyLaborCost, monthlyOverhead, breakevenMonth } = results;

  // 盈利核心判断
  let profitAnalysis = '';
  if (monthlyProfit > 0) {
    const profitRate = ((monthlyProfit / monthlyNetIncome) * 100).toFixed(1);
    // 添加团队结构说明
    const bdNote = bdRatio <= 0.2
      ? '（以渠道铺设为主，BD人数精简至1-2人）'
      : '';
    profitAnalysis = `当前模型下，月度净收入约${formatMoney(monthlyNetIncome)}元，扣除人力和运营成本后，预计月利润约${formatMoney(monthlyProfit)}元（净利率约${profitRate}%）${bdNote}。`;
  } else {
    const loss = Math.abs(monthlyProfit);
    const mainCost = monthlyLaborCost > monthlyOverhead ? '人力成本（月均' + formatMoney(monthlyLaborCost) + '元）' : '运营成本';
    profitAnalysis = `当前模型下，月度运营成本高于净收入约${formatMoney(loss)}元。建议优化分成比例、降低${mainCost}或提高单台收入。`;
  }

  // 风险提示
  const risks = [];

  if (monthlyIncome > 200) {
    risks.push(`您填写的单台月收入（${monthlyIncome}元）较高，建议结合当地真实数据进一步校准`);
  }

  if (splitRatio > 0.25) {
    risks.push(`当前商户分成比例${(splitRatio * 100).toFixed(0)}%较高，需关注实际场地谈判能力`);
  }

  if (bdRatio > 0.4) {
    risks.push(`⚠️ BD铺设占比${(bdRatio * 100).toFixed(0)}%偏高，海外BD效率低、人员管理难，建议优先走大渠道/连锁`);
  }

  if (bdRatio > 0.6) {
    risks.push(`⚠️ BD铺设占比${(bdRatio * 100).toFixed(0)}%风险极大，建议控制在20%以内`);
  }

  if (scale > 800) {
    risks.push('您的投放规模较大，需确认当地团队的招聘和管理能力');
  }

  if (monthlyProfit <= 0) {
    risks.push('⚠️ 当前模型月度亏损，建议优先降低分成比例或增加渠道铺设比例');
  }

  if (fundPressure === 'high') {
    risks.push('⚠️ 前期资金压力较大，建议分阶段投放，避免一次性铺太多设备');
  }

  if (totalInvestment > 3000000) {
    risks.push('投入规模较大，建议分批采购设备，降低库存和资金压力');
  }

  if (risks.length === 0) {
    risks.push('当前参数设置相对合理，建议尽快推进项目验证');
  }

  // 建议动作 —— 全新框架（使用i18n翻译系统）
  const suggestions = [];
  const lang = window.currentLang || 'zh';

  function s(key, params) {
    const t = translations[key];
    if (!t) return key;
    let text = t[lang] || t.zh || key;
    if (params) {
      Object.keys(params).forEach(function(p) {
        text = text.replace(p, params[p]);
      });
    }
    return text;
  }

  // ===== 1. 首批规模盈亏点引导（最重要） =====
  if (breakevenMonth >= 999) {
    suggestions.push(s('suggest-breakeven-fail'));
  } else if (breakevenMonth > 6) {
    suggestions.push(s('suggest-breakeven-slow', { 'N': breakevenMonth }));
  } else {
    suggestions.push(s('suggest-breakeven-good'));
  }

  // ===== 2. 玖果科技专业服务引导 =====
  // 所有客户都会看到这些核心服务价值
  suggestions.push(s('suggest-jiuguo-softpower'));

  // ===== 3. 按具体情况补充建议 =====
  if (bdRatio > 0.35) {
    suggestions.push(s('suggest-bd-ratio'));
  }

  if (splitRatio > 0.22) {
    suggestions.push(s('suggest-split-ratio'));
  }

  if (fundPressure === 'high') {
    suggestions.push(s('suggest-staged-purchase'));
  }

  if (suggestions.length === 0) {
    suggestions.push(s('suggest-all-good'));
  }

  return {
    profitAnalysis,
    risks,
    suggestions
  };
}

function formatMoney(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function calculateAndShowResult() {
  const params = getUserInputs();
  const results = calculateResults(params);
  const analysis = generateAnalysis(params, results);
  const viability = calculateMinimumViableScale(params);

  updateResultUI(params, results, analysis, viability);
  goToPage('page-result');
}

function updateResultUI(params, results, analysis, viability) {

  // ========== 首批设备盈亏分析 ==========
  const fbCard = document.getElementById('first-batch-card');
  if (fbCard) {
    fbCard.style.display = 'block';

    // 盈亏平衡点（月）—— 使用按月铺设模型的真实计算结果
    const breakevenEl = document.getElementById('fb-breakeven');
    const breakevenVal = results.breakevenMonth;
    if (breakevenVal >= 999) {
      breakevenEl.textContent = '无法回本';
      breakevenEl.className = 'fb-metric-value danger';
    } else {
      breakevenEl.textContent = breakevenVal;
      breakevenEl.className = breakevenVal <= 12 ? 'fb-metric-value primary' : 'fb-metric-value';
    }

    // 回本周期（首批）—— 直接使用计算结果
    const paybackEl = document.getElementById('fb-payback');
    if (results.paybackMonths >= 999) {
      paybackEl.textContent = '无法回本';
      paybackEl.className = 'fb-metric-value danger';
    } else if (results.paybackMonths > 48) {
      paybackEl.textContent = '48+';
    } else {
      paybackEl.textContent = results.paybackMonths;
    }

    // 首批规模
    document.getElementById('fb-scale').textContent = params.scale;
  }

  // ========== 最低准备资金 ==========
  const mcCard = document.getElementById('min-capital-card');
  if (mcCard) {
    mcCard.style.display = 'block';
    const capital = results.minRequiredCapital;
    document.getElementById('min-capital-value').textContent = formatMoney(capital);

    // 资金构成明细
    const hw = results.totalHardwareInvestment;
    const startUp = 50000;
    const reserve = capital - hw - startUp;
    document.getElementById('mc-breakdown').textContent =
      '硬件 ' + formatMoney(hw) + ' + 开办 ' + formatMoney(startUp) + ' + 6月运营备用 ' + formatMoney(reserve);
  }

  // ========== 最低盈利台数模块（仅在不健康时显示） ==========
  const minScaleCard = document.getElementById('min-scale-card');

  if (minScaleCard && viability) {
    // 健康状态下隐藏整个模块
    if (viability.status === 'healthy') {
      minScaleCard.style.display = 'none';
    } else {
      // 显示模块并填充内容
      minScaleCard.style.display = 'block';

      const minScaleStatus = document.getElementById('min-scale-status');
      const minScaleCurrent = document.getElementById('min-scale-current');
      const minScaleRequired = document.getElementById('min-scale-required');
      const minScaleBar = document.getElementById('min-scale-bar');
      const minScaleWarning = document.getElementById('min-scale-warning');

      // 当前台数
      minScaleCurrent.textContent = params.scale + '台';

      // 最低盈利台数
      if (viability.status === 'impossible') {
        minScaleStatus.innerHTML = '<span class="ms-status-icon danger">⚠️</span><span class="ms-status-text danger">当前台均无法盈利</span>';
        minScaleRequired.textContent = '无法计算';
        minScaleBar.style.width = '0%';
        minScaleWarning.style.display = 'block';
        minScaleWarning.innerHTML = `<strong>当前参数下无法盈利：</strong>单台月收入（${params.monthlyIncome}元）扣除分成和系统成本后，可能不足以支撑任何规模的运营。建议提高台均收入或降低分成比例。`;
      } else {
        minScaleRequired.textContent = viability.minimumScale + '台';

        // 计算进度条比例（当前台数 / 最低台数，上限100%）
        const progressPercent = Math.min(100, Math.round((params.scale / viability.minimumScale) * 100));
        minScaleBar.style.width = progressPercent + '%';

        // 根据状态显示不同颜色和提示
        if (viability.status === 'too-low' || viability.status === 'risky') {
          minScaleStatus.innerHTML = '<span class="ms-status-icon danger">⚠️</span><span class="ms-status-text danger">规模低于盈利门槛</span>';
          minScaleBar.style.background = '#ef4444';
          minScaleWarning.style.display = 'block';
          minScaleWarning.innerHTML = `<strong>⚠️ 重要提示：</strong>当前投放规模（${params.scale}台）低于最低盈利门槛（${viability.minimumScale}台）。按照当前参数，月净收入可能无法覆盖基础团队成本（${formatMoney(viability.basicMonthlyCost)}元/月 + 运营成本${formatMoney(viability.basicOverhead)}元/月），存在亏损风险。<br><br><strong>💡 建议：</strong>将规模提升至${viability.minimumScale}台以上，或寻找台均更高的优质渠道。`;
        } else if (viability.status === 'marginal') {
          minScaleStatus.innerHTML = '<span class="ms-status-icon warning">⚡</span><span class="ms-status-text warning">规模刚好达标</span>';
          minScaleBar.style.background = '#f59e0b';
          minScaleWarning.style.display = 'block';
          minScaleWarning.innerHTML = `<strong>⚡ 规模刚好达标：</strong>当前规模（${params.scale}台）勉强达到最低盈利门槛，但利润空间有限，抵抗风险能力较弱。<br><br><strong>💡 建议：</strong>优先选择分成比例较低、客流稳定的优质渠道，逐步提升到${viability.healthyScale}台以上的健康运营规模。`;
        }
      }
    }
  }

  // 投入资金量
  const investmentDisplay = document.getElementById('total-investment-display');
  const investmentWan = Math.round(results.investment / 10000);
  investmentDisplay.innerHTML = investmentWan + '<span class="metric-unit">万元</span>';

  // 项目评级
  const badge = document.getElementById('result-badge');
  badge.className = 'result-badge';
  if (results.rating === 'excellent') {
    badge.classList.add('excellent');
    badge.textContent = '⭐ 可做';
  } else if (results.rating === 'good') {
    badge.classList.add('good');
    badge.textContent = '✓ 谨慎推进';
  } else if (results.rating === 'moderate') {
    badge.classList.add('moderate');
    badge.textContent = '⚡ 需优化';
  } else {
    badge.classList.add('risky');
    badge.textContent = '⚠️ 风险较高';
  }

  // 回本周期
  const paybackEl = document.getElementById('payback-period');
  if (results.paybackMonths >= 999) {
    paybackEl.innerHTML = '无法回本<span class="metric-unit"></span>';
  } else if (results.paybackMonths > 36) {
    paybackEl.innerHTML = '36个月以上<span class="metric-unit"></span>';
  } else {
    const min = Math.max(6, results.paybackMonths - 3);
    const max = results.paybackMonths + 4;
    paybackEl.innerHTML = `${min}-${max}<span class="metric-unit">个月</span>`;
  }

  // 月利润潜力
  document.getElementById('monthly-profit').textContent = results.profitLevel;

  // 资金压力
  const fundDot = document.getElementById('fund-pressure-dot');
  const fundText = document.getElementById('fund-pressure-text');
  fundDot.className = 'risk-dot';
  fundDot.classList.add(results.fundPressure === 'high' ? 'high' : (results.fundPressure === 'medium' ? 'medium' : 'low'));
  fundText.textContent = results.fundPressure === 'high' ? '高' : (results.fundPressure === 'medium' ? '中等' : '低');

  // 运营复杂度
  const complexityDot = document.getElementById('complexity-dot');
  const complexityText = document.getElementById('complexity-text');
  complexityDot.className = 'risk-dot';
  complexityDot.classList.add(results.complexity === 'high' ? 'high' : (results.complexity === 'medium' ? 'medium' : 'low'));
  complexityText.textContent = results.complexity === 'high' ? '高' : (results.complexity === 'medium' ? '中等' : '低');

  // 团队规模
  document.getElementById('team-size-display').textContent = results.totalTeamSize + ' 人';

  // 盈利核心判断
  document.getElementById('profit-analysis').textContent = analysis.profitAnalysis;

  // 风险提示
  const riskList = analysis.risks.map(r => `<li>${r}</li>`).join('');
  document.getElementById('risk-analysis').innerHTML = `<ul>${riskList}</ul>`;

  // 建议动作
  const suggestionList = analysis.suggestions.map(s => `<li>${s}</li>`).join('');
  document.getElementById('suggestion-analysis').innerHTML = `<ul>${suggestionList}</ul>`;

  // 成本结构
  document.getElementById('cost-labor').textContent = formatMoney(results.monthlyLaborCost) + ' 元';
  document.getElementById('cost-overhead').textContent = formatMoney(results.monthlyOverhead) + ' 元';
  document.getElementById('cost-split').textContent = formatMoney(results.monthlySplitCost) + ' 元';
  document.getElementById('cost-system').textContent = formatMoney(results.monthlySystemCost) + ' 元';
  document.getElementById('cost-total').textContent = formatMoney(results.monthlyLaborCost + results.monthlyOverhead) + ' 元';
  document.getElementById('cost-revenue').textContent = formatMoney(results.monthlyGrossIncome) + ' 元';
}

// ========== 二维码配置（稍后替换为真实图片） ==========

// 用户可通过修改这两行来设置联系方式
const WECHAT_ID = '请添加微信二维码';
const WHATSAPP_ID = '请添加WhatsApp二维码';

function setContactInfo(wechatId, whatsappId) {
  const wechatDisplay = document.getElementById('wechat-id-display');
  const whatsappDisplay = document.getElementById('whatsapp-display');
  if (wechatDisplay) wechatDisplay.textContent = wechatId;
  if (whatsappDisplay) whatsappDisplay.textContent = whatsappId;
}

// ========== 页面初始化 ==========

document.addEventListener('DOMContentLoaded', function() {
  updateSliderValue('split', 15);
  updateChannelSlider(80);
  updateInvestmentDisplay(100);

  // 如果有预设联系方式，显示在结果页
  if (WECHAT_ID !== '请添加微信二维码') {
    setContactInfo(WECHAT_ID, WHATSAPP_ID);
  }

  // 默认语言
  window.currentLang = 'zh';

  // ===== 自动语言切换（根据IP检测） =====
  function applyAutoLang(lang) {
    if (lang === 'en') {
      switchLang('en');
    }
  }

  // 等待 autoLangDetect 事件（IP检测触发）
  document.addEventListener('autoLangDetect', function(e) {
    if (e.detail === 'en') {
      switchLang('en');
      document.getElementById('lang-zh').classList.remove('active');
      document.getElementById('lang-en').classList.add('active');
    }
  });

  // 若 _autoLang 已由 head 脚本设置，立即应用
  if (window._autoLang === 'en') {
    switchLang('en');
    document.getElementById('lang-zh').classList.remove('active');
    document.getElementById('lang-en').classList.add('active');
  }
});

// ========== 中英文切换 ==========

const translations = {
  // 封面页
  'hero-badge': { zh: 'OVERSEAS POWER BANK ROI ESTIMATOR', en: 'OVERSEAS POWER BANK ROI ESTIMATOR' },
  'hero-title': { zh: '海外共享充电宝<br>项目测算工具', en: 'Overseas Power Bank<br>Project Calculator' },
  'hero-subtitle': { zh: '输入关键参数，快速判断项目回本周期、收益潜力与风险等级', en: 'Enter key parameters to quickly assess project payback, ROI potential and risk level' },
  'btn-start': { zh: '开始测算', en: 'Start Calculator' },
  'feature-1': { zh: '投放节奏<br>模型测算', en: 'Deployment<br>Pace Analysis' },
  'feature-2': { zh: '收益潜力<br>评估', en: 'ROI<br>Assessment' },
  'feature-3': { zh: '风险等级<br>提示', en: 'Risk Level<br>Alerts' },
  'pro-card-title': { zh: '专业说明', en: 'Professional Note' },
  'pro-card-content': { zh: '这不是简单公式计算，而是基于共享充电宝海外项目的核心经营逻辑搭建，包括投放节奏、单台收入、分成结构、团队效率与本地化成本等关键因素。', en: 'This is not a simple formula calculation, but a comprehensive model built on core operational logic of overseas power bank projects, including deployment pace, per-unit revenue, revenue sharing, team efficiency and localization costs.' },
  'applicable-label': { zh: '适用场景：', en: 'Applicable: ' },
  'applicable-content': { zh: '东南亚、中东、日韩、欧美、中亚、海外本地化项目评估', en: 'SE Asia, Middle East, Japan/Korea, Europe/US, Central Asia, overseas projects' },

  // 步骤标题
  'step-1': { zh: '第 1 / 5 步 · 项目基础', en: 'Step 1 / 5 · Project Basics' },
  'step-2': { zh: '第 2 / 5 步 · 经营参数', en: 'Step 2 / 5 · Business Parameters' },
  'step-3': { zh: '第 3 / 5 步 · 铺设策略', en: 'Step 3 / 5 · Deployment Strategy' },
  'page-basic-title': { zh: '项目基础信息', en: 'Project Basic Info' },
  'page-basic-subtitle': { zh: '帮助我们了解您的项目背景，以便进行更精准的测算', en: 'Help us understand your project background for accurate calculation' },
  'page-operation-title': { zh: '核心经营参数', en: 'Core Business Parameters' },
  'page-operation-subtitle': { zh: '这些参数直接影响项目的盈利模型，请如实填写', en: 'These parameters directly affect profitability. Please fill in accurately' },
  'page-team-title': { zh: '铺设策略选择', en: 'Deployment Strategy' },
  'page-team-subtitle': { zh: '海外铺设与国内不同，渠道策略至关重要', en: 'Overseas deployment differs from domestic. Channel strategy is crucial' },

  // 基础表单标签
  'label-country': { zh: '您的目标国家 / 市场 <span class="required-star">*</span>', en: 'Target Country / Market <span class="required-star">*</span>' },
  'select-country-placeholder': { zh: '请选择目标市场', en: 'Select target market' },
  'placeholder-other-country': { zh: '请输入目标国家名称', en: 'Enter country name' },
  'hint-country': { zh: '不同国家的支付、点位分成和人工效率差异很大，会直接影响模型结果', en: 'Payment, split ratios and labor efficiency vary greatly across countries, directly affecting model results' },
  'label-city-type': { zh: '投放范围', en: 'Deployment Scope' },
  'opt-single-city': { zh: '单城市', en: 'Single City' },
  'opt-multi-city': { zh: '跨城市', en: 'Multi-City' },
  'label-stage': { zh: '当前项目阶段', en: 'Current Project Stage' },
  'stage-research': { zh: '调研阶段', en: 'Research Phase' },
  'stage-preparing': { zh: '准备启动', en: 'Preparing to Launch' },
  'stage-resources': { zh: '已有资源准备落地', en: 'Resources Ready, Planning' },
  'stage-operating': { zh: '已在运营，想优化', en: 'Already Operating' },
  'label-scale': { zh: '预计首批投放规模', en: 'Estimated First Batch Scale' },
  'scale-under-100': { zh: '100台以内', en: 'Under 100 units' },
  'scale-100-500': { zh: '100-500台', en: '100-500 units' },
  'scale-500-1000': { zh: '500-1000台', en: '500-1000 units' },
  'scale-over-1000': { zh: '1000台以上', en: 'Over 1000 units' },
  'label-investment': { zh: '计划总投入资金量', en: 'Total Investment Budget' },
  'unit-wan': { zh: '万元', en: '万' },
  'slider-min-50': { zh: '50万', en: '500K' },
  'slider-max-500': { zh: '500万', en: '5M' },
  'hint-investment': { zh: '包含设备采购、首批部署、运营备用金等总预算', en: 'Includes equipment procurement, initial deployment, and operating reserves' },
  'label-mode': { zh: '铺设方式', en: 'Deployment Model' },
  'mode-direct': { zh: '自营直营', en: 'Direct Operation' },
  'mode-agent': { zh: '代理招商', en: 'Agent/ Franchise' },
  'mode-mixed': { zh: '直营+代理混合', en: 'Mixed Model' },
  'mode-unknown': { zh: '还未确定', en: 'Not Decided Yet' },

  // 经营参数
  'label-income': { zh: '预估单台月收入（元 / 台 / 月） <span class="required-star">*</span>', en: 'Est. Monthly Revenue per Unit (¥/unit/month) <span class="required-star">*</span>' },
  'placeholder-income': { zh: '根据国家自动带出参考值', en: 'Auto-filled based on country selection' },
  'hint-income': { zh: '请先选择目标市场，系统将自动给出建议区间', en: 'Select target market first, system will auto-fill recommended range' },
  'alert-income-high': { zh: '您填写的单台收入偏高，可能导致结果过于乐观', en: 'Per-unit revenue is high, results may be overly optimistic' },
  'label-split': { zh: '商户 / 场地方分成比例', en: 'Merchant / Venue Revenue Split' },
  'split-good': { zh: '10%（优质场景）', en: '10% (Premium)' },
  'split-high': { zh: '40%+（高成本场地）', en: '40%+ (High Cost)' },
  'hint-split': { zh: '分成比例越高，留给自己的利润空间越小。建议优质渠道控制在20%以内', en: 'Higher splits = less profit. Recommend controlling at 20% or below for quality channels' },
  'label-hardware': { zh: '单台硬件综合投入成本（元） <span class="required-star">*</span>', en: 'Hardware Cost per Unit (¥) <span class="required-star">*</span>' },
  'placeholder-hardware': { zh: '包含底座、物料、运输等', en: 'Includes device, materials, shipping' },
  'hint-hardware': { zh: '包含设备底座、宣传物料、国内运输等综合成本', en: 'Includes device base, promotional materials, domestic shipping' },
  'label-install': { zh: '单台安装 / 部署成本（元）', en: 'Installation / Deployment Cost per Unit (¥)' },
  'placeholder-install': { zh: '本地安装人工成本', en: 'Local installation labor cost' },
  'hint-install': { zh: '本地安装人工、差旅等成本', en: 'Local installation labor and travel costs' },
  'label-system-cost': { zh: '系统与支付综合成本比例', en: 'System & Payment Cost Ratio' },
  'sys-cost-5': { zh: '5%（默认）', en: '5% (Default)' },
  'hint-system-cost': { zh: '支付通道、服务器、短信、本地化运维等综合成本比例', en: 'Payment gateway, server, SMS, localization overhead ratio' },
  'label-local-payment': { zh: '是否清楚本地服务器与支付通道价格？', en: 'Do you know local server & payment costs?' },
  'local-pay-know': { zh: '清楚，按实际填写', en: 'Yes, I know actual costs' },
  'local-pay-default': { zh: '不清楚，按系统默认', en: 'No, use system default' },
  'hint-local-payment': { zh: '系统默认按5%综合比例测算，包含支付通道、服务器、短信等', en: 'System defaults to 5%, includes payment, server, SMS, etc.' },

  // 铺设策略
  'label-channel-ratio': { zh: 'BD铺设 vs 渠道铺设占比', en: 'BD vs Channel Deployment Ratio' },
  'channel-display': { zh: '% 渠道 | 20% BD', en: '% Channel | 20% BD' },
  'channel-pure-bd': { zh: '纯BD铺设', en: 'Pure BD' },
  'channel-50-50': { zh: '各50%', en: '50/50' },
  'channel-pure-channel': { zh: '纯渠道铺设', en: 'Pure Channel' },
  'bd-warning-title': { zh: '⚠️ 重要提示：', en: '⚠️ Important: ' },
  'bd-warning-content': { zh: '海外市场与国内不同，用户习惯尚未形成，<strong>BD铺设效率低、成本高</strong>，且人员管理难度大。建议优先采用大渠道/连锁合作模式，可快速起量并降低运营成本。', en: 'Overseas markets differ from domestic — user habits are not yet formed, <strong>BD deployment is inefficient and costly</strong>, with difficult personnel management. Prioritize large chain/channel partnerships for rapid scale-up.' },
  'bd-ratio-high': { zh: '当前BD铺设比例偏高', en: 'BD ratio is too high' },
  'bd-ratio-suggestion': { zh: '海外BD铺设建议控制在', en: 'Overseas BD should be controlled within ' },
  'bd-ratio-suggestion2': { zh: '以内，优先走大渠道/连锁合作模式。', en: ', prioritize large chain/channel partnerships.' },
  'label-bd-capacity': { zh: '每位BD每月可铺设台数', en: 'Units Deployed per BD per Month' },
  'placeholder-bd-capacity': { zh: '每人每月可铺设的台数', en: 'Units per person per month' },
  'hint-bd-capacity': { zh: '海外BD效率参考值：10-20台/月/人（远低于国内30-50台）', en: 'Overseas BD efficiency: 10-20 units/month/person (far below domestic 30-50)' },
  'label-maintenance-capacity': { zh: '每位外勤运维可管理台数', en: 'Units per Field Technician' },
  'placeholder-maintenance': { zh: '每人可管理的设备数量', en: 'Units managed per person' },
  'hint-maintenance': { zh: '参考值：400-800台/人，视覆盖密度与城市交通而定', en: 'Reference: 400-800 units/person, depends on density and city traffic' },
  'label-admin-capacity': { zh: '每位内勤管理员可管理台数', en: 'Units per Admin Staff' },
  'placeholder-admin': { zh: '每人可管理的设备数量', en: 'Units managed per person' },
  'hint-admin': { zh: '参考值：600-1000台/人，含订单、客服、数据、结算等', en: 'Reference: 600-1000 units/person, includes orders, CS, data, settlements' },
  'label-labor-cost': { zh: '平均人力成本（元 / 人 / 月） <span class="required-star">*</span>', en: 'Avg. Labor Cost (¥/person/month) <span class="required-star">*</span>' },
  'placeholder-labor': { zh: '含工资、社保、公积金等', en: 'Including salary, social insurance, housing fund' },
  'hint-labor': { zh: '需包含管理损耗，建议按当地实际工资水平估算', en: 'Include management overhead, estimate based on local wages' },
  'label-overhead': { zh: '是否计入办公/仓储/车辆等基础运营成本', en: 'Include office/warehouse/vehicle overhead?' },
  'opt-yes': { zh: '是', en: 'Yes' },
  'opt-no': { zh: '否', en: 'No' },
  'opt-auto': { zh: '按系统默认', en: 'Use Default' },

  // 按钮
  'btn-prev': { zh: '上一步', en: 'Previous' },
  'btn-next': { zh: '下一步', en: 'Next' },
  'btn-view-result': { zh: '查看测算结果', en: 'View Results' },

  // 结果页指标
  'metric-investment': { zh: '预计投入资金', en: 'Est. Investment' },
  'metric-payback': { zh: '预计回本周期', en: 'Est. Payback Period' },
  'metric-profit': { zh: '月利润潜力', en: 'Monthly Profit Potential' },
  'metric-fund': { zh: '前期资金压力', en: 'Initial Fund Pressure' },
  'metric-complexity': { zh: '运营复杂度', en: 'Operation Complexity' },
  'metric-team': { zh: '所需团队规模', en: 'Required Team Size' },
  'unit-months': { zh: '个月', en: ' months' },

  // 最低盈利规模
  'min-scale-title': { zh: '📊 最低盈利规模分析', en: '📊 Minimum Viable Scale Analysis' },
  'min-scale-subtitle': { zh: '共享充电宝存在"最低运营门槛"，低于此规模团队难以养活', en: 'Power bank business has a "minimum operating threshold" — below this scale, team cannot sustain itself' },
  'msc-your-scale': { zh: '您选择的规模', en: 'Your Selected Scale' },
  'msc-threshold': { zh: '最低盈利门槛', en: 'Minimum Threshold' },
  'msc-calculating': { zh: '计算中...', en: 'Calculating...' },
  'msc-progress-label': { zh: '当前规模达标率', en: 'Current Scale Achievement' },
  'msc-progress-hint': { zh: '达标率100% = 刚好能养活基础团队', en: '100% = Just enough to support basic team' },
  'msc-why-title': { zh: '💡 为什么有最低规模门槛？', en: '💡 Why is there a minimum scale threshold?' },
  'msc-why-1': { zh: '共享充电宝需要<strong>完整的运营团队</strong>：BD拓展 + 运维巡检 + 客服结算 + 管理', en: 'Power bank requires a <strong>complete operating team</strong>: BD + Maintenance + CS & Billing + Management' },
  'msc-why-2': { zh: '团队成本<strong>相对固定</strong>，不会因为设备少就少很多人', en: 'Team costs are <strong>relatively fixed</strong> — fewer devices doesn\'t mean fewer people' },
  'msc-why-3': { zh: '台数太少 → 营收覆盖不了团队成本 → <strong>亏损</strong>', en: 'Too few units → Revenue can\'t cover team cost → <strong>Loss</strong>' },

  // 分析卡片
  'analysis-profit': { zh: '盈利核心判断', en: 'Profitability Analysis' },
  'analysis-risk': { zh: '风险提示', en: 'Risk Alerts' },
  'analysis-suggestion': { zh: '建议动作', en: 'Suggested Actions' },
  'risk-1': { zh: '您的模型对商户分成比例较为敏感，若实际场地成本上升，回本周期会明显拉长', en: 'Your model is sensitive to merchant split ratio — higher venue costs will extend payback significantly' },
  'risk-2': { zh: '需确认当地BD和运维能力是否匹配投放规模', en: 'Confirm local BD and maintenance capabilities match deployment scale' },
  'suggestion-1': { zh: '建议先以单城市、300-500台进行小规模验证，降低试错成本', en: 'Start with single-city, 300-500 units for small-scale validation to reduce trial costs' },
  'suggestion-2': { zh: '优先梳理支付、商户分成和人员模型', en: 'Prioritize payment, merchant split and staffing model clarity' },

  // 成本结构
  'result-title': { zh: '项目初步判断', en: 'Initial Project Assessment' },
  'result-subtitle': { zh: '基于您填写参数的初步测算结果', en: 'Preliminary results based on your parameters' },
  'cost-title': { zh: '📋 成本结构速览（单月）', en: '📋 Cost Breakdown (Monthly)' },
  'cost-labor': { zh: '人力成本（团队薪资）', en: 'Labor Cost (Team Salary)' },
  'cost-overhead': { zh: '运营成本（办公/仓储/车辆）', en: 'Operating Cost (Office/Warehouse/Vehicle)' },
  'cost-split': { zh: '商户/场地方分成', en: 'Merchant/Venue Split' },
  'cost-system': { zh: '系统与支付通道成本', en: 'System & Payment Cost' },
  'cost-total': { zh: '月总成本', en: 'Total Monthly Cost' },
  'cost-revenue': { zh: '月毛收入（扣除分成前）', en: 'Gross Revenue (Before Split)' },

  // 锁定内容
  'locked-1': { zh: '详细分阶段扩张建议', en: 'Detailed Phased Expansion Plan' },
  'locked-2': { zh: '现金流压力曲线分析', en: 'Cash Flow Pressure Analysis' },
  'locked-3': { zh: '目标国家本地化落地建议', en: 'Target Country Localization Guide' },
  'locked-4': { zh: '代理/直营模式优劣对比', en: 'Agent vs Direct Model Comparison' },

  // CTA
  'cta-title': { zh: '获取完整版报告', en: 'Get Complete Report' },
  'cta-subtitle': { zh: '以上是初步测算结果。完整版包含详细扩张节奏建议、现金流曲线、目标国家本地化落地指南，欢迎扫码领取。', en: 'Above are preliminary results. Full version includes detailed expansion plan, cash flow curves, target country localization guide — scan QR to get yours.' },
  'btn-get-report': { zh: '📱 扫码获取完整版报告', en: '📱 Get Full Report' },
  'cta-or': { zh: '或', en: 'or' },
  'btn-back-params': { zh: '← 返回修改参数', en: '← Modify Parameters' },

  // 关键变量
  'key-vars-title': { zh: '我们通常会重点复核的4个变量', en: '4 Key Variables We Usually Verify' },
  'key-var-1': { zh: '单台月收入是否真实达到目标值（建议取保守值）', en: 'Does per-unit monthly revenue actually hit target? (Use conservative estimate)' },
  'key-var-2': { zh: '商户分成是否可控在实际范围内（优先控在20%以内）', en: 'Is merchant split controllable? (Prioritize 20% or below)' },
  'key-var-3': { zh: '团队效率是否匹配投放规模（海外BD效率远低于国内）', en: 'Does team efficiency match scale? (Overseas BD is much less efficient)' },
  'key-var-4': { zh: '本地化系统成本是否被低估（支付/短信/服务器）', en: 'Are localization system costs underestimated? (Payment/SMS/Server)' },

  // 免责声明
  'disclaimer': { zh: '本结果基于初步参数测算，不代表最终投资建议<br>真实落地时，需结合国家支付、税务和商户结构进一步校准', en: 'Results are based on preliminary parameters and do not constitute final investment advice.<br>Real implementation requires further calibration with local payment, tax and merchant structures.' },

  // 联系页面
  'contact-title': { zh: '扫码领取完整版报告', en: 'Scan QR to Get Full Report' },
  'contact-subtitle': { zh: '包含：详细扩张节奏建议 · 现金流压力曲线 · 目标国家本地化落地指南 · 直营/代理模式对比', en: 'Includes: Detailed Expansion Plan · Cash Flow Analysis · Target Country Guide · Agent vs Direct Model' },
  'qr-wechat-title': { zh: '🇨🇳 微信咨询', en: '🇨🇳 WeChat Consultation' },
  'qr-wechat-placeholder': { zh: '微信二维码', en: 'WeChat QR Code' },
  'qr-wechat-hint': { zh: '请替换为您的微信二维码图片', en: 'Replace with your WeChat QR image' },
  'qr-whatsapp-title': { zh: '🌏 WhatsApp 咨询', en: '🌏 WhatsApp Consultation' },
  'qr-whatsapp-placeholder': { zh: 'WhatsApp 二维码', en: 'WhatsApp QR Code' },
  'qr-whatsapp-hint': { zh: '请替换为您的WhatsApp二维码图片', en: 'Replace with your WhatsApp QR image' },
  'qr-add-note': { zh: '添加时备注', en: 'Add Note' },
  'qr-note-calc': { zh: '「测算结果」', en: '"Calculator Result"' },
  'qr-note-title': { zh: '备注信息', en: 'Note' },
  'qr-note-report': { zh: '「测算报告」', en: '"Report Request"' },
  'wyg-title': { zh: '📦 领取后您将获得', en: '📦 What You\'ll Get' },
  'wyg-1': { zh: '适合您目标国家的详细财务模型（可编辑Excel版）', en: 'Detailed financial model for your target country (editable Excel)' },
  'wyg-2': { zh: '分阶段扩张节奏建议（从0到500台的具体步骤）', en: 'Phased expansion plan (concrete steps from 0 to 500 units)' },
  'wyg-3': { zh: '目标国家本地化落地checklist（支付/短信/税务）', en: 'Target country localization checklist (payment/SMS/tax)' },
  'wyg-4': { zh: '1对1项目诊断机会（30分钟语音）', en: '1-on-1 project diagnosis (30-min call)' },
  'btn-back-result': { zh: '← 返回查看结果', en: '← Back to Results' },

  // 首批设备盈亏分析
  'fb-badge': { zh: '📌 首批设备 · 静态测算', en: '📌 First Batch · Static Calculation' },
  'fb-title': { zh: '首批设备落地盈亏分析', en: 'First Batch Break-Even Analysis' },
  'fb-subtitle': { zh: '以下为仅落地首批设备的测算结果，持续扩张可加速回本', en: 'Results below are for first batch deployment only. Continuing expansion accelerates payback' },
  'fb-breakeven-label': { zh: '盈亏平衡点', en: 'Break-Even Point' },
  'fb-payback-label': { zh: '首批回本周期', en: 'First Batch Payback' }, // 显示在卡片中
  'fb-payback-note': { zh: '（停止发展，首批设备需', en: '(If paused, first batch needs ' }, // 补充说明
  'fb-scale-label': { zh: '首批规模', en: 'First Batch Scale' },
  'fb-months': { zh: '个月', en: ' months' },
  'fb-contr-text': {
    zh: '<strong>持续扩张 = 更快回本</strong><br><span>首批回本后，继续铺设第2、3批设备，边际成本更低（团队已成型、渠道已打通），回本周期将显著缩短。</span>',
    en: '<strong>Scale Further = Faster Payback</strong><br><span>After first batch pays back, adding batch 2 & 3 units lowers marginal cost (team is built, channels are open), significantly shortening payback.</span>'
  },
  'fb-note': { zh: '⚠️ 以上数据基于首批设备静态测算，未计入持续扩张带来的规模效应与运营效率提升', en: '⚠️ Results above are static for first batch only, excluding scale economy from continued expansion' },

  // 官网引流
  'website-text': { zh: '了解玖果科技完整解决方案', en: 'Explore Juugo Tech Full-Stack Solutions' },
  'website-link-text': { zh: '访问官网 www.jiuguotech.com', en: 'Visit www.jiuguotech.com' },

  // 建议动作（中英双语，因为建议是动态生成的，key用占位符，由JS判断语言返回）
  'suggest-breakeven-fail': { zh: '⚠️ 当前规模尚未达到盈亏平衡点，建议增加首批采购数量，确保首批落地后当月能覆盖固定运营成本，避免盘子断裂', en: '⚠️ Current scale has not reached break-even. Add more units to ensure monthly revenue covers fixed operating costs from day one' },
  'suggest-breakeven-slow': { zh: '📊 盈亏平衡需 ' + 'N' + ' 个月，建议在洽谈渠道时优先选择人流密集的连锁点位，缩短爬坡期', en: '📊 Break-even takes N months. Prioritize high-traffic chain locations to shorten the ramp-up period' },
  'suggest-breakeven-good': { zh: '✅ 首批规模已达到盈亏平衡点以上，盘子健康，建议快速锁定核心渠道启动落地', en: '✅ Scale exceeds break-even point — business is healthy. Move fast to lock in core channels' },
  'suggest-jiuguo-softpower': { zh: '🤝 玖果提供的不只是硬件，更是"软实力"：协助培养当地用户租借习惯、商户进店激活工具、扫码裂变获客功能，让首批设备快速跑出正向现金流', en: '🤝 Jiuguo offers more than hardware — user habit coaching, merchant activation tools, and QR scan referral features that accelerate positive cash flow' },
  'suggest-bd-ratio': { zh: '📍 海外市场BD效率偏低，建议以渠道/连锁合作为主，BD为辅，降低人力依赖', en: '📍 Overseas BD efficiency is low. Prioritize chain/channel partnerships over direct BD to reduce labor costs' },
  'suggest-split-ratio': { zh: '💰 商户分成比例建议控制在20%以内，可向商户强调玖果的导流工具和用户运营支持，提升谈判筹码', en: '💰 Keep merchant split under 20%. Emphasize Jiuguo\'s traffic tools and user operations support to strengthen your negotiating position' },
  'suggest-staged-purchase': { zh: '💵 建议分两批采购设备：首批60%快速落地验证，第2批40%在首批回本后再追加，降低资金压力', en: '💵 Split into two purchases: 60% first batch for validation, 40% after first batch breaks even — reduces capital pressure' },
  'suggest-consult': { zh: '📩 当前参数下盈亏难以平衡，欢迎扫码咨询玖果，获取目标市场的定制化落地方案', en: '📩 Break-even is difficult with current parameters. Scan to consult Jiuguo for a customized market entry plan' },
  'suggest-all-good': { zh: '🚀 各项指标健康，建议尽快与玖果顾问联系，获取目标市场的本地化落地指南和首批设备最优配置方案', en: '🚀 All indicators look good. Contact a Jiuguo advisor to get a localized market guide and optimal first-batch configuration plan' },
};

function switchLang(lang) {
  window.currentLang = lang;

  // 更新按钮状态
  document.getElementById('lang-zh').classList.toggle('active', lang === 'zh');
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');

  // 更新页面标题
  if (lang === 'en') {
    document.title = 'Overseas Power Bank Calculator | Juugo Tech';
  } else {
    document.title = '海外共享充电宝项目测算工具 | Juugo Tech';
  }

  // 翻译所有带 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] && translations[key][lang]) {
      el.innerHTML = translations[key][lang];
    }
  });

  // 翻译所有带 data-i18n-placeholder 属性的输入框
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[key] && translations[key][lang]) {
      el.placeholder = translations[key][lang];
    }
  });

  // 更新滑块显示值
  const channelSlider = document.getElementById('channel-ratio');
  if (channelSlider) {
    updateChannelSlider(channelSlider.value);
  }
}
