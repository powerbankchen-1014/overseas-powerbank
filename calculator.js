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
  const lang = window.currentLang || 'zh';

  if (fromPage === 'page-basic') {
    if (!document.getElementById('country').value) {
      errors.push(lang === 'en' ? 'Please select target country/market' : '请选择目标国家/市场');
    }
    if (!getSelectedValue('city-type')) {
      errors.push(lang === 'en' ? 'Please select deployment scope (single city/multi-city)' : '请选择投放范围（单城市/跨城市）');
    }
    if (!getSelectedValue('stage')) {
      errors.push(lang === 'en' ? 'Please select current project stage' : '请选择当前项目阶段');
    }
    if (!getSelectedValue('scale')) {
      errors.push(lang === 'en' ? 'Please select estimated deployment scale' : '请选择预计投放规模');
    }
    if (!getSelectedValue('mode')) {
      errors.push(lang === 'en' ? 'Please select deployment model' : '请选择铺设方式');
    }
  }

  if (fromPage === 'page-operation') {
    if (!document.getElementById('monthly-income').value) {
      errors.push(lang === 'en' ? 'Please fill in estimated monthly revenue per unit' : '请填写预估单台月收入（可使用系统自动填入的建议值）');
    }
    if (!document.getElementById('hardware-cost').value) {
      errors.push(lang === 'en' ? 'Please fill in hardware cost per unit' : '请填写单台硬件综合投入成本');
    }
    if (!document.getElementById('labor-cost').value) {
      errors.push(lang === 'en' ? 'Please fill in average labor cost' : '请填写平均人力成本');
    }
  }

  if (fromPage === 'page-team') {
    if (!document.getElementById('labor-cost').value) {
      errors.push(lang === 'en' ? 'Please fill in average labor cost' : '请填写平均人力成本');
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
    display.innerHTML = value + '<span>' + t('unit-wan-display', '万元') + '</span>';
  }
}

// ========== 国家选择 → 单台月收入联动 ==========

function onCountryChange() {
  const country = document.getElementById('country');
  const otherInput = document.getElementById('other-country-input');
  const incomeInput = document.getElementById('monthly-income');
  const incomeHint = document.getElementById('income-hint');
  const lang = window.currentLang || 'zh';

  if (country.value === 'other') {
    otherInput.style.display = 'block';
    incomeHint.textContent = lang === 'en'
      ? 'Manually fill in per-unit monthly revenue based on your market knowledge (SE Asia reference: ¥120-300)'
      : '请根据对目标市场的了解，手动填写单台月收入估算值（参考：东南亚120-300元）';
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
      if (lang === 'en') {
        incomeHint.innerHTML = `<strong>Reference Range:</strong> ¥${minIncome}-${maxIncome}/unit/month (conservative estimate filled)`;
      } else {
        incomeHint.innerHTML = `<strong>参考区间：</strong>${minIncome}-${maxIncome} 元/台/月（已填保守估算值）`;
      }
    }
  } else {
    otherInput.style.display = 'none';
    incomeHint.textContent = lang === 'en'
      ? 'Please select target market first, system will auto-fill recommended range'
      : '请先选择目标市场，系统将自动给出建议区间';
    incomeInput.value = '';
  }
}

var checkIncomeTimer = null;

function checkIncomeValue() {
  if (checkIncomeTimer) clearTimeout(checkIncomeTimer);

  var incomeInput = document.getElementById('monthly-income');
  var alert = document.getElementById('income-alert');
  var lang = window.currentLang || 'zh';

  checkIncomeTimer = setTimeout(function() {
    if (incomeInput && alert) {
      var numValue = parseFloat(incomeInput.value);
      var country = document.getElementById('country');
      var idx = country.selectedIndex;
      var minIncome = 120;
      var maxIncome = 300;

      if (idx >= 0) {
        var opts = country.options[idx];
        var m = opts.getAttribute('data-income-min');
        var mx = opts.getAttribute('data-income-max');
        if (m) minIncome = parseInt(m);
        if (mx) maxIncome = parseInt(mx);
      }

      if (numValue > 0) {
        var txt;
        if (lang === 'en') {
          txt = `You entered ¥${numValue} — we will use this per-unit average for calculation`;
          if (numValue > maxIncome) {
            txt += `. Note: This is above market reference ceiling (¥${maxIncome}), results may be overly optimistic`;
          } else if (numValue < minIncome) {
            txt += `. Note: Per-unit average is below reference floor (¥${minIncome}), actual results may be better than calculated`;
          }
        } else {
          txt = `您填写的数字是${numValue}，我们将用这个台均进行测算`;
          if (numValue > maxIncome) {
            txt += `。但注意：这个数字高于市场参考上限（${maxIncome}元），可能导致结果过于乐观`;
          } else if (numValue < minIncome) {
            txt += `。但注意：台均低于参考下限（${minIncome}元），实际经营数据可能优于测算`;
          }
        }
        alert.textContent = txt;
        alert.classList.add('show');
      } else {
        alert.classList.remove('show');
      }
    }
  }, 150);
}

// ========== BD/渠道滑块 → 动态警告 ==========

function updateChannelSlider(value) {
  const valueElement = document.getElementById('channel-value');
  const bdPercent = 100 - parseInt(value);
  const lang = window.currentLang || 'zh';
  if (valueElement) {
    const channelText = lang === 'en' ? '% Channel | ' : '% 渠道 | ';
    valueElement.innerHTML = `${value}<span>${channelText}${bdPercent}% BD</span>`;
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
  const lang = window.currentLang || 'zh';
  const countryText = country === 'other'
    ? document.getElementById('other-country').value || (lang === 'en' ? 'Other Markets' : '其他市场')
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
  const bdCapacity = parseFloat(document.getElementById('bd-capacity').value) || 45;
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

  // ===== 8. 月利润 =====
  const monthlyProfit = monthlyNetIncome - totalMonthlyCost;

  // ===== 9. 回本周期 =====
  // 初始投入 = 设备成本 + 开办费
  const initialInvestment = totalHardwareInvestment + 50000;

  let paybackMonths;
  if (monthlyProfit <= 0) {
    paybackMonths = 999;
  } else {
    paybackMonths = Math.ceil(initialInvestment / monthlyProfit);
    paybackMonths = Math.min(paybackMonths, 60);
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

  // ===== 12. 利润潜力等级（使用英文key，由displayResults翻译） =====
  let profitLevel;
  if (monthlyProfit > 200000) {
    profitLevel = 'high';
  } else if (monthlyProfit > 80000) {
    profitLevel = 'medium';
  } else if (monthlyProfit > 0) {
    profitLevel = 'low';
  } else {
    profitLevel = 'loss';
  }

  // ===== 9.5 首批设备落地盈亏分析（静态测算） =====
  // 盈亏平衡点：当月现金流 = 0
  // 月净收入 - 月固定成本 = 0
  // scale × netPerUnit - totalTeamSize × laborCost - overhead = 0
  // scale = (totalTeamSize × laborCost + overhead) / netPerUnit
  const netPerUnit = monthlyIncome * (1 - splitRatio - systemCostRatio);
  const breakevenScale = netPerUnit > 0 ? Math.ceil((totalTeamSize * laborCost + monthlyOverhead) / netPerUnit) : 999;

  // 首批回本周期（停止发展时）
  // 首批规模 × (设备成本 + 安装成本) + 开办费
  const firstBatchCost = scale * (hardwareCost + installCost) + 50000;
  // 首批月净收入
  const firstBatchNetIncome = scale * netPerUnit;
  // 首批月利润 = 月净收入 - 固定团队成本 - 运营成本
  const firstBatchMonthlyProfit = firstBatchNetIncome - totalTeamSize * laborCost - monthlyOverhead;
  let firstBatchPayback;
  if (firstBatchMonthlyProfit <= 0) {
    firstBatchPayback = 999;
  } else {
    firstBatchPayback = Math.ceil(firstBatchCost / firstBatchMonthlyProfit);
    firstBatchPayback = Math.min(firstBatchPayback, 60);
  }

  // 最低准备资金 = 硬件投入 + 开办费 + 6个月运营备用金
  const minRequiredFund = totalHardwareInvestment + 50000 + Math.max(0, totalTeamSize * laborCost + monthlyOverhead) * 6;

  return {
    investment: Math.round(investment),
    paybackMonths,
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
    adminCount,
    // V4新增字段
    breakevenScale,
    firstBatchPayback,
    minRequiredFund
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
  const { monthlyIncome, splitRatio, channelRatio, bdRatio, scale, mode, countryText, totalInvestment, systemCostRatio, laborCost } = params;
  const { monthlyProfit, paybackMonths, fundPressure, complexity, monthlyNetIncome, monthlyLaborCost, monthlyOverhead } = results;

  // 盈利核心判断 - 改为积极引导（支持中英文）
  let profitAnalysis = '';
  const lang = window.currentLang || 'zh';

  // 格式化金额函数 - 英文使用千分位，中文使用万
  const formatAmount = (num) => {
    if (lang === 'en') {
      // 英文模式：¥ + 千分位格式
      return '¥' + num.toLocaleString();
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  if (monthlyProfit > 0) {
    const profitRate = ((monthlyProfit / monthlyNetIncome) * 100).toFixed(1);
    const bdNote = bdRatio <= 0.2
      ? (lang === 'en' ? ' (Channel-focused, BD team can be 1-2 people)' : '（以渠道铺设为主，BD人数精简至1-2人）')
      : '';

    if (lang === 'en') {
      profitAnalysis = `Under current parameters, monthly net revenue is approximately ${formatAmount(monthlyNetIncome)}, with estimated monthly profit of ${formatAmount(monthlyProfit)} after costs (net margin ~${profitRate}%)${bdNote}. The project has profit potential — further optimization can improve returns.`;
    } else {
      profitAnalysis = `当前参数下，月度净收入约${formatAmount(monthlyNetIncome)}元，扣除成本后预计月利润约${formatAmount(monthlyProfit)}元（净利率约${profitRate}%）${bdNote}。项目具备盈利基础，继续优化可进一步提升收益。`;
    }
  } else {
    const mainCost = monthlyLaborCost > monthlyOverhead
      ? (lang === 'en' ? 'labor costs' : '人力成本')
      : (lang === 'en' ? 'operating costs' : '运营成本');

    if (lang === 'en') {
      profitAnalysis = `Under current parameters, monthly cash flow needs optimization, mainly because ${mainCost} account for a relatively high proportion. This is common in overseas markets — Juugo has multiple proven solutions to help you optimize to profitability.`;
    } else {
      profitAnalysis = `当前参数下，月度现金流需要优化，主要因为${mainCost}占比较高。这个问题在海外市场很常见，玖果有多套成熟方案可以帮您优化到盈利区间。`;
    }
  }

  // 优化提示（改为建设性语言）
  const risks = [];
  const unitYuan = lang === 'en' ? '' : '元';

  if (monthlyIncome > 200) {
    risks.push(lang === 'en'
      ? `💡 Per-unit revenue (¥${monthlyIncome}${unitYuan}) is set high — can be validated in actual operations`
      : `💡 单台月收入（${monthlyIncome}${unitYuan}）设定较高，实际运营中可逐步验证提升`);
  }

  if (splitRatio > 0.25) {
    risks.push(lang === 'en'
      ? `💡 Merchant split ${(splitRatio * 100).toFixed(0)}% has optimization potential — Juugo can provide quality channel negotiation support`
      : `💡 商户分成${(splitRatio * 100).toFixed(0)}%有一定优化空间，玖果可提供优质渠道谈判支持`);
  }

  if (bdRatio > 0.4) {
    risks.push(lang === 'en'
      ? `💡 Recommend increasing channel deployment ratio — Juugo can assist connecting with large chain resources`
      : `💡 建议增加渠道铺设比例，玖果可协助对接大型连锁渠道资源`);
  }

  if (bdRatio > 0.6) {
    risks.push(lang === 'en'
      ? `💡 Recommend prioritizing large chain/channel partnerships — Juugo has proven channel experience`
      : `💡 建议优先开发大渠道/连锁合作，玖果有成熟的渠道对接经验`);
  }

  if (scale > 800) {
    risks.push(lang === 'en'
      ? `💡 Large-scale deployment recommended in phases — Juugo can provide detailed expansion plans`
      : `💡 大规模投放建议分阶段推进，玖果可提供详细的扩张节奏方案`);
  }

  if (monthlyProfit <= 0) {
    risks.push(lang === 'en'
      ? `🎯 Current parameters have optimization space — project viability will significantly improve after adjustments`
      : `🎯 当前参数有优化空间，调整后项目可行性会显著提升`);
  }

  if (fundPressure === 'high') {
    risks.push(lang === 'en'
      ? `💡 Recommend phased deployment to reduce initial capital pressure`
      : `💡 建议分阶段投放，降低初期资金压力`);
  }

  if (totalInvestment > 3000000) {
    risks.push(lang === 'en'
      ? `💡 Recommend batch equipment procurement — Juugo can provide flexible cooperation plans`
      : `💡 建议分批采购设备，玖果可提供灵活的合作方案`);
  }

  if (risks.length === 0) {
    risks.push(lang === 'en'
      ? '✨ Current parameters are set well — project has good profit foundation'
      : '✨ 当前参数设置良好，项目具备良好的盈利基础');
  }

  // 玖果支持 - 改为积极引导
  const suggestions = [];

  if (bdRatio > 0.3) {
    suggestions.push(lang === 'en'
      ? '🔥 Prioritize large chain supermarkets, shopping centers, airports — Juugo has existing channel resources to connect'
      : '🔥 优先对接大型连锁商超、购物中心、机场等优质渠道，玖果有现成渠道资源可对接');
  }

  if (channelRatio < 0.5) {
    suggestions.push(lang === 'en'
      ? '🔥 Increase channel deployment to 50%+ to significantly reduce team management difficulty — Juugo assists throughout'
      : '🔥 将渠道铺设提升至50%以上，可大幅降低团队管理难度，玖果全程协助');
  }

  if (scale > 500) {
    suggestions.push(lang === 'en'
      ? '💡 Recommend phased expansion — Juugo provides detailed 3-phase deployment plan to reduce trial costs'
      : '💡 建议分阶段扩张，玖果提供详细的3阶段投放方案，降低试错成本');
  }

  if (splitRatio > 0.2) {
    suggestions.push(lang === 'en'
      ? '💡 Merchant split has optimization space — Juugo can provide negotiation tactics and case references'
      : '💡 商户分成优化空间大，玖果可提供谈判话术和成功案例参考');
  }

  if (fundPressure === 'high') {
    suggestions.push(lang === 'en'
      ? '💡 Juugo provides operational support to help you start with lower risk'
      : '💡 玖果提供运营支持，帮助您以更低风险起步');
  }

  if (scale < 200) {
    suggestions.push(lang === 'en'
      ? '💡 Recommend starting scale of at least 300 units — Juugo can assist planning optimal start plan'
      : '💡 建议起步规模至少300台，玖果可协助规划最优起步方案');
  }

  if (monthlyProfit <= 0) {
    suggestions.push(lang === 'en'
      ? '🎯 Project viability will significantly improve after parameter adjustments — Juugo consultant can help you find optimal plan'
      : '🎯 调整参数后项目可行性会大幅提升，玖果顾问可帮您测算最优方案');
  }

  // 玖果支持 - 始终显示
  suggestions.push(lang === 'en'
    ? '🚀 Juugo provides full operational training and market launch support — quick ramp-up even in new markets'
    : '🚀 玖果提供全套运营培训和市场启动支持，新市场也能快速起量');
  suggestions.push(lang === 'en'
    ? '🎯 Juugo provides user fission system, lucky draw marketing, store acquisition & review management tools — lower CAC, faster user adoption, rapid market expansion'
    : '🎯 玖果提供用户裂变系统、大转盘抽奖营销、门店获客、评价管理工具，降低获客成本，加速用户培养，快速市场扩张');
  suggestions.push(lang === 'en'
    ? '💬 Scan QR to get "SE Asia Power Bank Localization Guide" with detailed market analysis of 12 countries'
    : '💬 扫码领取《东南亚共享充电宝落地指南》，含12个国家详细市场分析');

  if (suggestions.length === 0) {
    suggestions.push(lang === 'en'
      ? '✨ Current parameters are excellent — project has good profit foundation, welcome to scan for in-depth exchange'
      : '✨ 当前参数优秀，项目具备良好盈利基础，欢迎扫码深入交流');
  }

  // 生成优化建议（告诉用户具体怎么调）
  const optimizationTips = generateOptimizationTips(params, results);

  return {
    profitAnalysis,
    risks,
    suggestions,
    optimizationTips
  };
}

// ========== 生成具体优化建议 ==========
function generateOptimizationTips(params, results) {
  const tips = [];
  const { monthlyIncome, splitRatio, channelRatio, bdRatio, scale, laborCost, systemCostRatio } = params;
  const { monthlyProfit, monthlyNetIncome, monthlyLaborCost } = results;

  // 获取当前语言
  const tipLang = window.currentLang || 'zh';

  // 格式化金额函数 - 英文使用千分位，中文使用万
  const formatTipAmount = (num) => {
    if (tipLang === 'en') {
      // 英文模式：¥ + 千分位格式
      return '¥' + num.toLocaleString();
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  // 1. 如果分成比例高
  if (splitRatio > 0.2) {
    const diff = splitRatio - 0.2;
    const lossPerUnit = monthlyIncome * diff;
    const monthlyLoss = scale * lossPerUnit;
    const desc = tipLang === 'en'
      ? `Reducing split from ${(splitRatio * 100).toFixed(0)}% to 20% can increase monthly net income by ~${formatTipAmount(monthlyLoss)}`
      : `将分成从${(splitRatio * 100).toFixed(0)}%降至20%，预计每月可增加约${formatTipAmount(monthlyLoss)}元净收入`;
    tips.push({
      icon: '🏪',
      titleKey: 'opt-title-split',
      descKey: 'opt-desc-split',
      actionKey: 'opt-action-split',
      title: tipLang === 'en' ? 'Optimize Merchant Split' : '优化商户分成',
      desc: desc,
      action: tipLang === 'en' ? 'Juugo can help connect you with quality channels with better splits' : '玖果可协助对接分成友好的优质渠道'
    });
  }

  // 2. 如果BD比例高
  if (bdRatio > 0.3) {
    const desc = tipLang === 'en'
      ? `Increasing channel deployment from ${(channelRatio * 100).toFixed(0)}% to 70%+ can significantly reduce labor costs`
      : `将渠道铺设从${(channelRatio * 100).toFixed(0)}%提升至70%以上，可显著降低人力成本`;
    tips.push({
      icon: '🤝',
      titleKey: 'opt-title-channel',
      descKey: 'opt-desc-channel',
      actionKey: 'opt-action-channel',
      title: tipLang === 'en' ? 'Increase Channel Deployment' : '增加渠道铺设',
      desc: desc,
      action: tipLang === 'en' ? 'Juugo has SE Asia chain channel resources for quick deployment' : '玖果有东南亚大型连锁渠道资源，可快速对接'
    });
  }

  // 3. 如果单台收入偏低
  if (monthlyIncome < 200) {
    const desc = tipLang === 'en'
      ? `Current per-unit revenue of ¥${monthlyIncome} can be improved to ¥200-300 by targeting high-traffic locations (malls, bars, airports)`
      : `当前台均${monthlyIncome}元，可通过入驻高客流场所（商场、酒吧、机场）提升至200-300元`;
    tips.push({
      icon: '📈',
      titleKey: 'opt-title-income',
      descKey: 'opt-desc-income',
      actionKey: 'opt-action-income',
      title: tipLang === 'en' ? 'Increase Per-Unit Revenue' : '提升台均收入',
      desc: desc,
      action: tipLang === 'en' ? 'Juugo provides location selection guide and channel connection service' : '玖果提供点位筛选指南和渠道对接服务'
    });
  }

  // 4. 如果规模偏小
  if (scale < 300) {
    const desc = tipLang === 'en'
      ? `Starting with ${scale} units is small. Recommend 300-500 units for scale effect`
      : `首批${scale}台规模较小，建议增至300-500台以形成规模效应`;
    tips.push({
      icon: '📦',
      titleKey: 'opt-title-scale',
      descKey: 'opt-desc-scale',
      actionKey: 'opt-action-scale',
      title: tipLang === 'en' ? 'Increase Starting Scale' : '适当增加起步规模',
      desc: desc,
      action: tipLang === 'en' ? 'Juugo provides professional operational support to help you get started' : '玖果提供专业运营支持，帮助您顺利起步'
    });
  }

  // 5. 如果人力成本高
  if (monthlyLaborCost > monthlyNetIncome * 0.5) {
    tips.push({
      icon: '👥',
      titleKey: 'opt-title-team',
      descKey: 'opt-desc-team',
      actionKey: 'opt-action-team',
      title: tipLang === 'en' ? 'Optimize Team Setup' : '优化团队配置',
      desc: tipLang === 'en' ? 'Current labor cost is relatively high — channel deployment can reduce BD needs' : '当前人力成本占比较高，可通过渠道铺设减少BD人员需求',
      action: tipLang === 'en' ? 'Juugo provides team building standards and training support' : '玖果提供团队搭建标准和培训支持'
    });
  }

  // 6. 如果亏损但有潜力
  if (monthlyProfit <= 0 && tips.length > 0) {
    const monthsMin = Math.max(6, Math.round(results.paybackMonths * 0.7));
    const monthsMax = Math.round(results.paybackMonths);
    const desc = tipLang === 'en'
      ? `After implementing combined optimizations, project can be profitable within ${monthsMin}-${monthsMax} months`
      : `上述优化方案组合实施后，项目有望在${monthsMin}-${monthsMax}个月内实现盈利`;
    tips.push({
      icon: '💡',
      titleKey: 'opt-title-forecast',
      descKey: 'opt-desc-forecast',
      actionKey: 'opt-action-forecast',
      title: tipLang === 'en' ? 'Combined Optimization Forecast' : '综合优化效果预估',
      desc: desc,
      action: tipLang === 'en' ? 'Scan QR for detailed optimization plan and financial projection' : '扫码获取详细优化方案和财务测算'
    });
  }

  // 7. 如果所有参数都挺好
  if (tips.length === 0) {
    tips.push({
      icon: '🎉',
      titleKey: 'opt-title-good',
      descKey: 'opt-desc-good',
      actionKey: 'opt-action-good',
      title: tipLang === 'en' ? 'Good Project Conditions' : '项目条件良好',
      desc: tipLang === 'en' ? 'Current parameters are reasonable with good profit potential' : '当前参数设置合理，具备良好的盈利基础',
      action: tipLang === 'en' ? 'Recommend locking in quality channels and starting operations soon' : '建议尽快锁定优质渠道开始运营'
    });
  }

  return tips;
}

function formatMoney(num, lang) {
  lang = lang || window.currentLang || 'zh';
  if (num >= 10000) {
    if (lang === 'en') {
      return (num / 10000).toFixed(1) + '万';
    }
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function formatMoneyLocalized(num) {
  const lang = window.currentLang || 'zh';
  if (num >= 10000) {
    const wan = (num / 10000).toFixed(1);
    if (lang === 'en') {
      return '$' + (num / 10000).toFixed(1) + '万';
    }
    return wan + '万';
  }
  return lang === 'en' ? '$' + num.toLocaleString() : num.toLocaleString();
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
  const lang = window.currentLang || 'zh';

  // ========== V4: 首批设备落地盈亏分析 ==========
  const breakevenPoint = document.getElementById('breakeven-point');
  const firstBatchPaybackEl = document.getElementById('first-batch-payback');
  const firstBatchPaybackUnit = document.getElementById('first-batch-payback-unit');
  const firstBatchScaleEl = document.getElementById('first-batch-scale');
  const minFundDisplay = document.getElementById('min-fund-display');

  if (results.breakevenScale >= 999) {
    breakevenPoint.textContent = t('breakeven-more', '需更多台数');
    document.querySelectorAll('.fba-item:first-child .fba-unit').forEach(el => {
      el.textContent = lang === 'en' ? 'units' : '台';
    });
  } else {
    // 盈亏平衡点：只显示数字 + 单位
    breakevenPoint.textContent = results.breakevenScale;
    document.querySelectorAll('.fba-item:first-child .fba-unit').forEach(el => {
      el.textContent = lang === 'en' ? 'units' : '台';
    });
  }

  if (results.firstBatchPayback >= 999) {
    firstBatchPaybackEl.textContent = t('payback-optimize', '需优化');
    firstBatchPaybackUnit.textContent = t('payback-params', '参数');
  } else if (results.firstBatchPayback > 24) {
    // 24个月以上：显示"大于24个月（静态发展）"，不显示具体数字，不打击客户
    firstBatchPaybackEl.textContent = t('breakeven-over-24', '大于24个月');
    firstBatchPaybackUnit.textContent = t('breakeven-static-dev', '（静态发展）');
  } else {
    firstBatchPaybackEl.textContent = results.firstBatchPayback;
    firstBatchPaybackUnit.textContent = t('unit-months', '个月');
  }

  firstBatchScaleEl.textContent = params.scale;
  // 首批规模的单位：英文显示 units，中文显示台
  document.querySelectorAll('.fba-item:nth-child(3) .fba-unit').forEach(el => {
    el.textContent = lang === 'en' ? 'units' : '台';
  });

  // ========== V4: 最低准备资金 ==========
  if (minFundDisplay) {
    if (lang === 'en') {
      // 英文模式：¥ + 千分位
      minFundDisplay.textContent = '¥' + Math.round(results.minRequiredFund).toLocaleString();
    } else {
      // 中文模式：万
      const minFundWan = Math.round(results.minRequiredFund / 10000);
      minFundDisplay.textContent = minFundWan + '万元';
    }
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
      const unitScale = lang === 'en' ? ' units' : '台';
      minScaleCurrent.textContent = params.scale + unitScale;

      // 最低盈利台数
      if (viability.status === 'impossible') {
        minScaleStatus.innerHTML = '<span class="ms-status-icon warning">💡</span><span class="ms-status-text warning">' + t('ms-status-optimize', '需要优化参数') + '</span>';
        minScaleRequired.textContent = t('ms-need-adjust', '需调整');
        minScaleBar.style.width = '0%';
        minScaleWarning.style.display = 'block';
        if (lang === 'en') {
          minScaleWarning.innerHTML = `<strong>💡 Optimization Suggestion:</strong> Current per-unit revenue (¥${params.monthlyIncome}) can be optimized.<br><br><strong>Juugo Support:</strong> We help connect you with high-traffic locations to significantly improve per-unit revenue — scan QR for detailed optimization plan.`;
        } else {
          minScaleWarning.innerHTML = `<strong>💡 优化建议：</strong>当前单台月收入（${params.monthlyIncome}元）可以优化。<br><br><strong>玖果支持：</strong>我们帮您对接当地高客流点位，可显著提升台均收入，扫码获取详细优化方案。`;
        }
      } else {
        minScaleRequired.textContent = viability.minimumScale + unitScale;

        // 计算进度条比例（当前台数 / 最低台数，上限100%）
        const progressPercent = Math.min(100, Math.round((params.scale / viability.minimumScale) * 100));
        minScaleBar.style.width = progressPercent + '%';

        // 根据状态显示不同颜色和提示 - 改为积极引导
        if (viability.status === 'too-low' || viability.status === 'risky') {
          minScaleStatus.innerHTML = '<span class="ms-status-icon warning">🎯</span><span class="ms-status-text warning">' + t('ms-status-scale-tip', '起步规模建议') + '</span>';
          minScaleBar.style.background = '#f59e0b';
          minScaleWarning.style.display = 'block';
          if (lang === 'en') {
            minScaleWarning.innerHTML = `<strong>💡 Optimization Suggestion:</strong> Current scale (${params.scale} units) needs more support at startup.<br><br><strong>Juugo Solution:</strong> We can assist connecting with quality local channels and provide operational training — helping you start with lower risk.`;
          } else {
            minScaleWarning.innerHTML = `<strong>💡 建议优化：</strong>当前规模（${params.scale}台）起步阶段需要更多支持。<br><br><strong>玖果方案：</strong>我们可以协助对接当地优质渠道，提供运营培训支持，帮助您以更低风险起步。`;
          }
        } else if (viability.status === 'marginal') {
          minScaleStatus.innerHTML = '<span class="ms-status-icon good">👍</span><span class="ms-status-text good">' + t('ms-status-good-scale', '规模基本达标') + '</span>';
          minScaleBar.style.background = '#10b981';
          minScaleWarning.style.display = 'block';
          if (lang === 'en') {
            minScaleWarning.innerHTML = `<strong>✨ Good Starting Point:</strong> Current scale (${params.scale} units) has operational foundation — continued expansion can gradually improve profitability.<br><br><strong>Juugo Support:</strong> Provides channel resources and operational guidance — helping you steadily expand to healthy scale of ${viability.healthyScale} units.`;
          } else {
            minScaleWarning.innerHTML = `<strong>✨ 良好起步点：</strong>当前规模（${params.scale}台）具备运营基础，继续扩张可逐步提升盈利。<br><br><strong>玖果支持：</strong>提供渠道资源和运营指导，帮助您稳健扩张到${viability.healthyScale}台的健康规模。`;
          }
        }
      }
    }
  }

  // 投入资金量
  const investmentDisplay = document.getElementById('total-investment-display');
  if (lang === 'en') {
    // 英文模式：¥ + 千分位
    investmentDisplay.textContent = '¥' + results.investment.toLocaleString();
  } else {
    // 中文模式：万
    const investmentWan = Math.round(results.investment / 10000);
    investmentDisplay.innerHTML = investmentWan + '<span class="metric-unit">' + t('unit-wan', '万') + '</span>';
  }

  // 项目评级
  const badge = document.getElementById('result-badge');
  badge.className = 'result-badge';
  if (results.rating === 'excellent') {
    badge.classList.add('excellent');
    badge.textContent = t('badge-excellent', '⭐ 潜力项目');
  } else if (results.rating === 'good') {
    badge.classList.add('good');
    badge.textContent = t('badge-good', '✓ 值得关注');
  } else if (results.rating === 'moderate') {
    badge.classList.add('moderate');
    badge.textContent = t('badge-moderate', '💡 优化空间大');
  } else {
    badge.classList.add('risky');
    badge.textContent = t('badge-risky', '🎯 值得探索');
  }

  // 回本周期 - 大于24个月显示"静态发展"而非具体数字，不打击客户
  const paybackEl = document.getElementById('payback-period');
  if (results.paybackMonths >= 999) {
    paybackEl.innerHTML = t('payback-optimize', '需优化') + `<span class="metric-unit">${t('payback-params', '参数')}</span>`;
  } else if (results.paybackMonths > 24) {
    // 24个月以上：显示"大于24个月" + "(静态发展)" 换行，避免打击客户信心
    const over24Label = lang === 'en' ? '&gt;24 months' : '大于24个月';
    const staticDev = lang === 'en' ? '(Static Dev)' : '（静态发展）';
    paybackEl.innerHTML = over24Label + `<br><span class="metric-unit">${staticDev}</span>`;
  } else {
    const min = Math.max(6, results.paybackMonths - 3);
    const max = results.paybackMonths + 4;
    paybackEl.innerHTML = `${min}-${max}<span class="metric-unit">${t('unit-months', '个月')}</span>`;
  }

  // 月利润潜力 - 使用翻译
  const profitKey = 'profit-level-' + results.profitLevel;
  const profitFallback = results.profitLevel === 'high' ? '高' : (results.profitLevel === 'medium' ? '中等' : (results.profitLevel === 'low' ? '较低' : '需优化'));
  document.getElementById('monthly-profit').textContent = t(profitKey, profitFallback);

  // 资金压力
  const fundDot = document.getElementById('fund-pressure-dot');
  const fundText = document.getElementById('fund-pressure-text');
  fundDot.className = 'risk-dot';
  fundDot.classList.add(results.fundPressure === 'high' ? 'high' : (results.fundPressure === 'medium' ? 'medium' : 'low'));
  const fundKey = results.fundPressure === 'high' ? 'fund-high' : (results.fundPressure === 'medium' ? 'fund-medium' : 'fund-low');
  fundText.textContent = t(fundKey, results.fundPressure === 'high' ? '高' : (results.fundPressure === 'medium' ? '中等' : '低'));

  // 运营复杂度
  const complexityDot = document.getElementById('complexity-dot');
  const complexityText = document.getElementById('complexity-text');
  complexityDot.className = 'risk-dot';
  complexityDot.classList.add(results.complexity === 'high' ? 'high' : (results.complexity === 'medium' ? 'medium' : 'low'));
  const complexityKey = results.complexity === 'high' ? 'complexity-high' : (results.complexity === 'medium' ? 'complexity-medium' : 'complexity-low');
  complexityText.textContent = t(complexityKey, results.complexity === 'high' ? '高' : (results.complexity === 'medium' ? '中等' : '低'));

  // 团队规模
  document.getElementById('team-size-display').textContent = results.totalTeamSize + t('unit-person', '人');

  // 盈利核心判断 - 使用翻译
  document.getElementById('profit-analysis').textContent = t('analysis-profit-text', analysis.profitAnalysis);

  // 风险提示 - 使用翻译
  const riskList = analysis.risks.map(r => `<li>${r}</li>`).join('');
  document.getElementById('risk-analysis').innerHTML = `<ul>${riskList}</ul>`;

  // 建议动作 - 使用翻译
  const suggestionList = analysis.suggestions.map(s => `<li>${s}</li>`).join('');
  document.getElementById('suggestion-analysis').innerHTML = `<ul>${suggestionList}</ul>`;

  // 优化提示区块
  updateOptimizationTips(analysis.optimizationTips);

  // 成本结构 - 使用本地化格式
  const formatCostAmount = (num) => {
    if (lang === 'en') {
      // 英文模式：统一用 ¥ + 千分位格式
      return '¥' + num.toLocaleString();
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString() + '元';
  };

  document.getElementById('cost-labor').textContent = formatCostAmount(results.monthlyLaborCost);
  document.getElementById('cost-overhead').textContent = formatCostAmount(results.monthlyOverhead);
  document.getElementById('cost-split').textContent = formatCostAmount(results.monthlySplitCost);
  document.getElementById('cost-system').textContent = formatCostAmount(results.monthlySystemCost);
  document.getElementById('cost-total').textContent = formatCostAmount(results.monthlyLaborCost + results.monthlyOverhead);
  document.getElementById('cost-revenue').textContent = formatCostAmount(results.monthlyGrossIncome);
}

// ========== 渲染优化建议区块 ==========
function updateOptimizationTips(tips) {
  const container = document.getElementById('optimization-tips');
  if (!container) return;

  const lang = window.currentLang || 'zh';
  const titleKey = 'opt-tips-title';
  const title = translations[titleKey] ? translations[titleKey][lang] : '💡 优化建议（调整这些参数可提升项目可行性）';

  const tipsHTML = tips.map(tip => {
    const title = translations[tip.titleKey] ? translations[tip.titleKey][lang] : tip.title;
    const desc = translations[tip.descKey] ? translations[tip.descKey][lang] : tip.desc;
    const action = translations[tip.actionKey] ? translations[tip.actionKey][lang] : tip.action;

    return `
      <div class="opt-tip-item">
        <div class="opt-tip-icon">${tip.icon}</div>
        <div class="opt-tip-content">
          <div class="opt-tip-title">${title}</div>
          <div class="opt-tip-desc">${desc}</div>
          <div class="opt-tip-action">→ ${action}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="opt-tips-title">${title}</div>
    <div class="opt-tips-list">${tipsHTML}</div>
  `;
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

  // IP自动语言切换 - 中国大陆/港澳台显示中文，其他显示英文
  detectLanguageByIP();
});

// ========== IP自动语言切换 ==========
async function detectLanguageByIP() {
  try {
    // 使用 ipapi.co 免费API检测IP位置
    const response = await fetch('https://ipapi.co/json/', { timeout: 5000 });
    const data = await response.json();

    if (data && data.country_code) {
      const country = data.country_code;

      // 中国大陆、香港、澳门、台湾 -> 中文
      const chineseRegions = ['CN', 'HK', 'MO', 'TW'];

      if (chineseRegions.includes(country)) {
        window.currentLang = 'zh';
      } else {
        window.currentLang = 'en';
      }

      // 立即应用语言切换
      switchLang(window.currentLang);
    }
  } catch (error) {
    console.log('IP检测失败，使用默认语言中文');
    switchLang('zh');
  }
}

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
  'analysis-risk': { zh: '优化要点', en: 'Optimization Tips' },
  'analysis-suggestion': { zh: '玖果支持', en: 'Juugo Support' },
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
  'learn-more': { zh: '了解更多', en: 'Learn More' },
  'official-website': { zh: '官网', en: 'Official Website' },
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

  // 优化建议区块
  'opt-tips-title': { zh: '💡 优化建议（调整这些参数可提升项目可行性）', en: '💡 Optimization Tips (adjust these to improve viability)' },

  // 优化建议 - 分成优化
  'opt-title-split': { zh: '优化商户分成', en: 'Optimize Merchant Split' },
  'opt-desc-split': { zh: '将分成从25%降至20%，预计每月可增加约1.5万元净收入', en: 'Reducing split from 25% to 20% can increase monthly net income by ~¥15,000' },
  'opt-action-split': { zh: '玖果可协助对接分成友好的优质渠道', en: 'Juugo can help connect you with quality channels with better splits' },

  // 优化建议 - 渠道铺设
  'opt-title-channel': { zh: '增加渠道铺设', en: 'Increase Channel Deployment' },
  'opt-desc-channel': { zh: '将渠道铺设提升至70%以上，可显著降低人力成本', en: 'Increasing channel deployment to 70%+ can significantly reduce labor costs' },
  'opt-action-channel': { zh: '玖果有东南亚大型连锁渠道资源，可快速对接', en: 'Juugo has SE Asia chain channel resources for quick deployment' },

  // 优化建议 - 台均收入
  'opt-title-income': { zh: '提升台均收入', en: 'Increase Per-Unit Revenue' },
  'opt-desc-income': { zh: '当前台均较低，可通过入驻高客流场所提升至200-300元', en: 'Current per-unit revenue can be improved to ¥200-300 by targeting high-traffic locations' },
  'opt-action-income': { zh: '玖果提供点位筛选指南和渠道对接服务', en: 'Juugo provides location selection guide and channel connection service' },

  // 优化建议 - 规模
  'opt-title-scale': { zh: '适当增加起步规模', en: 'Increase Starting Scale' },
  'opt-desc-scale': { zh: '首批规模较小，建议增至300-500台以形成规模效应', en: 'Starting scale is small. Recommend 300-500 units for scale effect' },
  'opt-action-scale': { zh: '玖果提供专业运营支持，帮助您顺利起步', en: 'Juugo provides professional operational support to help you get started' },

  // 优化建议 - 团队配置
  'opt-title-team': { zh: '优化团队配置', en: 'Optimize Team Setup' },
  'opt-desc-team': { zh: '当前人力成本占比较高，可通过渠道铺设减少BD人员需求', en: 'Current labor cost is relatively high — channel deployment can reduce BD needs' },
  'opt-action-team': { zh: '玖果提供团队搭建标准和培训支持', en: 'Juugo provides team building standards and training support' },

  // 优化建议 - 效果预估
  'opt-title-forecast': { zh: '综合优化效果预估', en: 'Combined Optimization Forecast' },
  'opt-desc-forecast': { zh: '上述优化方案组合实施后，项目有望在指定时间内实现盈利', en: 'After implementing combined optimizations, project can be profitable within target period' },
  'opt-action-forecast': { zh: '扫码获取详细优化方案和财务测算', en: 'Scan QR for detailed optimization plan and financial projection' },

  // 优化建议 - 良好情况
  'opt-title-good': { zh: '项目条件良好', en: 'Good Project Conditions' },
  'opt-desc-good': { zh: '当前参数设置合理，具备良好的盈利基础', en: 'Current parameters are reasonable with good profit potential' },
  'opt-action-good': { zh: '建议尽快锁定优质渠道开始运营', en: 'Recommend locking in quality channels and starting operations soon' },

  // 结果页通用翻译
  'profit-level-high': { zh: '高', en: 'High' },
  'profit-level-medium': { zh: '中等', en: 'Medium' },
  'profit-level-low': { zh: '较低', en: 'Low' },
  'profit-level-loss': { zh: '需优化', en: 'Optimize' },
  'fund-high': { zh: '高', en: 'High' },
  'fund-medium': { zh: '中等', en: 'Medium' },
  'fund-low': { zh: '低', en: 'Low' },
  'complexity-high': { zh: '高', en: 'High' },
  'complexity-medium': { zh: '中等', en: 'Medium' },
  'complexity-low': { zh: '低', en: 'Low' },
  'unit-person': { zh: '人', en: ' people' },
  'unit-months': { zh: '个月', en: ' months' },
  'unit-yuan': { zh: '元', en: '' },
  'unit-wan-display': { zh: '万元', en: '' },

  // 最低规模状态
  'ms-status-optimize': { zh: '需要优化参数', en: 'Needs Parameter Optimization' },
  'ms-need-adjust': { zh: '需调整', en: 'Need Adjustment' },
  'ms-status-scale-tip': { zh: '起步规模建议', en: 'Starting Scale Suggestion' },
  'ms-status-good-scale': { zh: '规模基本达标', en: 'Scale Basically Qualified' },

  // 评级徽章
  'badge-excellent': { zh: '⭐ 潜力项目', en: '⭐ Promising' },
  'badge-good': { zh: '✓ 值得关注', en: '✓ Worth It' },
  'badge-moderate': { zh: '💡 优化空间大', en: '💡 Optimize' },
  'badge-risky': { zh: '🎯 值得探索', en: '🎯 Explore' },

  // 回本周期
  'payback-optimize': { zh: '需优化', en: 'Optimize' },
  'payback-params': { zh: '参数', en: 'Params' },

  // 首批设备盈亏分析
  'breakeven-more': { zh: '需更多台数', en: 'Need More Units' },
  'breakeven-units': { zh: '台起', en: ' units' },
  'breakeven-static': { zh: '静态', en: 'Static' },
  'breakeven-static-note': { zh: '发展', en: 'Growth' },
  'breakeven-over-24': { zh: '大于24个月', en: 'Over 24 months' },
  'breakeven-static-dev': { zh: '（静态发展）', en: ' (Static Dev)' },

  // 最低准备资金
  'min-fund-label': { zh: '最低准备资金', en: 'Minimum Required Fund' },
  'mf-label': { zh: '💰 最低准备资金', en: '💰 Minimum Required Fund' },
  'mf-hint': { zh: '硬件投入 + 开办费5万 + 6个月运营备用金', en: 'Hardware + Setup Fee + 6-Month Operating Reserve' },

  // 首批设备盈亏分析
  'fba-title': { zh: '📊 首批设备落地盈亏分析', en: '📊 First Batch Profitability Analysis' },
  'fba-note': { zh: '静态测算（停止发展时）', en: 'Static Calculation (No Further Expansion)' },
  'fba-breakeven-label': { zh: '盈亏平衡点', en: 'Break-even Point' },
  'fba-payback-label': { zh: '首批回本周期', en: 'First Batch Payback' },
  'fba-scale-label': { zh: '首批规模', en: 'First Batch Scale' },
  'fba-unit': { zh: '台', en: '' },
  'fba-expansion-hint': { zh: '持续扩张 = 更快回本', en: 'Continued Expansion = Faster ROI' },
  'fba-expansion-desc': { zh: '首批回本后，继续扩张的边际成本极低，新增设备几乎全是净利润，可显著加速整体回本', en: 'After first batch ROI, continued expansion has near-zero marginal cost — new devices are almost pure profit, significantly accelerating overall payback' },
};

function switchLang(lang) {
  window.currentLang = lang;

  // 更新按钮状态
  document.getElementById('lang-zh').classList.toggle('active', lang === 'zh');
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');

  // 更新页面标题
  if (lang === 'en') {
    document.title = 'Overseas Power Bank ROI Calculator | Juugo Tech';
    // 更新 meta 标签
    document.getElementById('seo-title').content = 'Overseas Power Bank ROI Calculator | Juugo Tech';
    document.getElementById('seo-description').content = 'Enter key parameters to quickly assess overseas power bank project payback period, ROI potential and risk level. Supports SE Asia, Middle East, Japan/Korea, Europe/US markets. Juugo Tech provides full hardware + software + operations solutions.';
    document.getElementById('og-title').content = 'Overseas Power Bank ROI Calculator | Juugo Tech';
    document.getElementById('og-description').content = 'Enter key parameters to quickly assess overseas power bank project payback period, ROI potential and risk level. Supports SE Asia, Middle East, Japan/Korea, Europe/US markets.';
    document.getElementById('twitter-title').content = 'Overseas Power Bank ROI Calculator | Juugo Tech';
    document.getElementById('twitter-description').content = 'Enter key parameters to quickly assess overseas power bank project payback period, ROI potential and risk level.';
  } else {
    document.title = '海外共享充电宝项目测算工具 | Juugo Tech';
    // 更新 meta 标签
    document.getElementById('seo-title').content = '海外共享充电宝项目测算工具 | Juugo Tech';
    document.getElementById('seo-description').content = '输入关键参数，快速评估海外共享充电宝项目的回本周期、收益潜力与风险等级。支持东南亚、中东、日韩、欧美等市场。玖果科技提供全套软硬件+运营解决方案。';
    document.getElementById('og-title').content = '海外共享充电宝项目测算工具 | Juugo Tech';
    document.getElementById('og-description').content = '输入关键参数，快速评估海外共享充电宝项目的回本周期、收益潜力与风险等级。支持东南亚、中东、日韩、欧美等市场。';
    document.getElementById('twitter-title').content = '海外共享充电宝项目测算工具 | Juugo Tech';
    document.getElementById('twitter-description').content = '输入关键参数，快速评估海外共享充电宝项目的回本周期、收益潜力与风险等级。';
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

  // 如果当前在结果页，需要重新渲染动态内容
  const resultPage = document.getElementById('page-result');
  if (resultPage && resultPage.classList.contains('active')) {
    // 触发重新计算以刷新动态内容
    const params = getUserInputs();
    if (params.scale) {
      const results = calculateResults(params);
      const analysis = generateAnalysis(params, results);
      const viability = calculateMinimumViableScale(params);
      updateResultUI(params, results, analysis, viability);
    }
  }
}

// ========== 获取翻译辅助函数 ==========
function t(key, fallback) {
  const lang = window.currentLang || 'zh';
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return fallback || key;
}
