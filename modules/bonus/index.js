import { exportToExcel } from './exportExcel.js';
import { getContractDetailsByNumbers, getContractNumbers } from './logic.js';
import { schemeIncentives } from './scheme.js';

const mockContracts = [];
let actualContracts = [];

let currentCalculatedContractsMc = [];
let currentCalculatedContractsDl = [];

// ==================== CÁC HÀM TÍNH TOÁN DL ====================
const getRiskFactorDL = (pr3, pr6) => {
  const val3 = typeof pr3 === 'number' && pr3 <= 1 && pr3 > 0 ? pr3 * 100 : pr3;
  const val6 = typeof pr6 === 'number' && pr6 <= 1 && pr6 > 0 ? pr6 * 100 : pr6;

  let rowKey = 'NA';
  if (val3 >= 92) rowKey = '>=92';
  else if (val3 >= 85) rowKey = '>=85';
  else if (val3 >= 80) rowKey = '>=80';
  else if (val3 !== null && val3 !== undefined && !Number.isNaN(val3)) rowKey = '<80';

  let colKey = 'NA';
  if (val6 >= 90) colKey = '>=90';
  else if (val6 >= 85) colKey = '>=85';
  else if (val6 >= 80) colKey = '>=80';
  else if (val6 !== null && val6 !== undefined && !Number.isNaN(val6)) colKey = '<80';

  const riskMatrix = {
    '<80': { '<80': 0, '>=80': 0, '>=85': 0, '>=90': 0, NA: 0 },
    '>=80': { '<80': 0, '>=80': 0.2, '>=85': 0.6, '>=90': 0.8, NA: 0.5 },
    '>=85': { '<80': 0.2, '>=80': 0.4, '>=85': 0.8, '>=90': 1.1, NA: 0.7 },
    '>=92': { '<80': 0.4, '>=80': 0.7, '>=85': 1.1, '>=90': 1.3, NA: 1 },
    NA: { '<80': 0, '>=80': 0.5, '>=85': 0.8, '>=90': 1, NA: 1 }
  };

  return riskMatrix[rowKey]?.[colKey] ?? 0;
};

const getCoefficientDL = (schemeGroup, term) => {
  let rowKey = 'NA';
  if (schemeGroup === 'E') rowKey = 'E';
  else if (schemeGroup === 'D') rowKey = 'D';
  else if (schemeGroup === 'C') rowKey = 'C';
  else if (schemeGroup === 'B') rowKey = 'B';
  else if (schemeGroup === 'A') rowKey = 'A';
  else if (schemeGroup !== null && schemeGroup !== undefined && !Number.isNaN(schemeGroup)) rowKey = 'E';

  let colKey = 'NA';
  if (term >= 24) colKey = '>=24';
  else if (term >= 18) colKey = '>=18';
  else if (term >= 15) colKey = '>=15';
  else if (term >= 12) colKey = '>=12';
  else if (term !== null && term !== undefined && !Number.isNaN(term)) colKey = '<12';

  const riskMatrix = {
    D: { '<12': 0, '>=12': 0, '>=15': 0, '>=18': 0, '>=24': 0 },
    C: { '<12': 0, '>=12': 0.1, '>=15': 0.3, '>=18': 0.4, '>=24': 0.5 },
    B: { '<12': 0.7, '>=12': 1, '>=15': 1.1, '>=18': 1.3, '>=24': 1.4 },
    A: { '<12': 0.9, '>=12': 1.2, '>=15': 1.3, '>=18': 1.5, '>=24': 1.6 }
  };

  return riskMatrix[rowKey]?.[colKey] / 100 ?? 0;
};

const TargetDL = targetDL => {
  let targetMCKey = '<100';
  if (targetDL >= 1000000000) targetMCKey = '>=1000';
  else if (targetDL >= 700000000) targetMCKey = '>=700';
  else if (targetDL >= 500000000) targetMCKey = '>=500';
  else if (targetDL >= 300000000) targetMCKey = '>=300';
  else if (targetDL >= 200000000) targetMCKey = '>=200';
  else if (targetDL >= 170000000) targetMCKey = '>=170';
  else if (targetDL >= 150000000) targetMCKey = '>=150';
  else if (targetDL >= 120000000) targetMCKey = '>=120';
  else if (targetDL >= 100000000) targetMCKey = '>=100';

  const targetMatrix = {
    '<100': 0,
    '>=100': 500000,
    '>=120': 600000,
    '>=150': 800000,
    '>=170': 1100000,
    '>=200': 1300000,
    '>=300': 1800000,
    '>=500': 2500000,
    '>=700': 4000000,
    '>=1000': 5000000
  };

  return targetMatrix[targetMCKey] ?? 0;
};

const BonusDL = bonusDL => {
  let bonusDLKey = '<90';
  if (bonusDL >= 160) bonusDLKey = '>=160';
  else if (bonusDL >= 150) bonusDLKey = '>=150';
  else if (bonusDL >= 140) bonusDLKey = '>=140';
  else if (bonusDL >= 130) bonusDLKey = '>=130';
  else if (bonusDL >= 120) bonusDLKey = '>=120';
  else if (bonusDL >= 110) bonusDLKey = '>=110';
  else if (bonusDL >= 100) bonusDLKey = '>=100';
  else if (bonusDL >= 90) bonusDLKey = '>=90';

  const bonusMatrix = {
    '<90': 0,
    '>=90': 0.7,
    '>=100': 1,
    '>=110': 1.1,
    '>=120': 1.2,
    '>=130': 1.3,
    '>=140': 1.4,
    '>=150': 1.5,
    '>=160': 1.6
  };

  return bonusMatrix[bonusDLKey] ?? 0;
};

const getBonusDL = (targetMC, targetTong) => {
  let rowIndex = 0;
  if (targetMC >= 120) rowIndex = 4;
  else if (targetMC >= 100) rowIndex = 3;
  else if (targetMC >= 75) rowIndex = 2;
  else if (targetMC >= 50) rowIndex = 1;
  else rowIndex = 0;

  let colIndex = 0;
  if (targetTong >= 115) colIndex = 4;
  else if (targetTong >= 100) colIndex = 3;
  else if (targetTong >= 90) colIndex = 2;
  else if (targetTong >= 75) colIndex = 1;
  else colIndex = 0;

  const bonusMatrix = [
    [0.2, 0.3, 0.5, 0.6, 0.7],
    [0.2, 0.6, 0.8, 1.0, 1.3],
    [0.2, 0.7, 0.8, 1.2, 1.5],
    [0.5, 1.0, 1.1, 1.4, 1.8],
    [1.0, 1.2, 1.4, 1.5, 2.0]
  ];

  return bonusMatrix[rowIndex][colIndex];
};

const calculateInsuranceBonusDL = (dsgnInVnd, tenure) => {
  let dsgnKey = '<12';
  if (dsgnInVnd >= 50000000) dsgnKey = '>=50';
  else if (dsgnInVnd >= 25000000) dsgnKey = '>=25';
  else if (dsgnInVnd >= 12000000) dsgnKey = '>=12';

  let tenureKey = '12';
  if (tenure >= 18) tenureKey = '18';
  else if (tenure >= 15) tenureKey = '15';
  else tenureKey = '12';

  const bonusMatrix = {
    '<12': { '12': 10, '15': 15, '18': 20 },
    '>=12': { '12': 18, '15': 23, '18': 28 },
    '>=25': { '12': 26, '15': 31, '18': 36 },
    '>=50': { '12': 34, '15': 39, '18': 44 }
  };

  return (bonusMatrix[dsgnKey]?.[tenureKey] || 0) * 1000;
};

// ==================== CÁC HÀM TÍNH TOÁN MC ====================
const getRiskFactorMc = (pr3, pr6) => {
  const val3 = typeof pr3 === 'number' && pr3 <= 1 && pr3 > 0 ? pr3 * 100 : pr3;
  const val6 = typeof pr6 === 'number' && pr6 <= 1 && pr6 > 0 ? pr6 * 100 : pr6;

  let rowKey = 'NA';
  if (val3 >= 95) rowKey = '>=95';
  else if (val3 >= 89) rowKey = '>=89';
  else if (val3 >= 75) rowKey = '>=75';
  else if (val3 >= 70) rowKey = '>=70';
  else if (val3 !== null && val3 !== undefined && !Number.isNaN(val3)) rowKey = '<70';

  let colKey = 'NA';
  if (val6 >= 95) colKey = '>=95';
  else if (val6 >= 85) colKey = '>=85';
  else if (val6 !== null && val6 !== undefined && !Number.isNaN(val6)) colKey = '<85';

  const riskMatrix = {
    '<70': { '<85': 0, '>=85': 0, '>=95': 0, NA: 0 },
    '>=70': { '<85': 0.3, '>=85': 0.3, '>=95': 0.7, NA: 0.3 },
    '>=75': { '<85': 0.5, '>=85': 0.6, '>=95': 1, NA: 0.6 },
    '>=89': { '<85': 0.8, '>=85': 1, '>=95': 1.4, NA: 1 },
    '>=95': { '<85': 1, '>=85': 1.3, '>=95': 1.7, NA: 1.3 },
    NA: { '<85': 0, '>=85': 0.8, '>=95': 1, NA: 1 }
  };

  return riskMatrix[rowKey]?.[colKey] ?? 0;
};

const getCoefficientMc = (schemeGroup, term) => {
  let rowKey = 'NA';
  if (schemeGroup === 'E') rowKey = 'E';
  else if (schemeGroup === 'D') rowKey = 'D';
  else if (schemeGroup === 'C') rowKey = 'C';
  else if (schemeGroup === 'B') rowKey = 'B';
  else if (schemeGroup === 'A') rowKey = 'A';
  else if (schemeGroup !== null && schemeGroup !== undefined && !Number.isNaN(schemeGroup)) rowKey = 'E';

  let colKey = 'NA';
  if (term > 18) colKey = '>18';
  else if (term === 18) colKey = '=18';
  else if (term === 17) colKey = '=17';
  else if (term === 16) colKey = '=16';
  else if (term === 15) colKey = '=15';
  else if (term === 14) colKey = '=14';
  else if (term === 13) colKey = '=13';
  else if (term === 12) colKey = '=12';
  else if (term === 11) colKey = '=11';
  else if (term === 10) colKey = '=10';
  else if (term === 9) colKey = '=9';
  else if (term !== null && term !== undefined && !Number.isNaN(term)) colKey = '<9';

  const riskMatrix = {
    'E': { '<9': 0, '=9': 0, '=10': 0, '=11': 0, '=12': 0, '=13': 0, '=14': 0, '=15': 0, '=16': 0, '=17': 0, '=18': 0, '>18': 0 },
    'D': { '<9': 0.05, '=9': 0.05, '=10': 0.05, '=11': 0.05, '=12': 0.12, '=13': 0.14, '=14': 0.16, '=15': 0.18, '=16': 0.2, '=17': 0.22, '=18': 0.24, '>18': 0.26 },
    'C': { '<9': 0.09, '=9': 0.16, '=10': 0.17, '=11': 0.18, '=12': 0.22, '=13': 0.25, '=14': 0.28, '=15': 0.31, '=16': 0.34, '=17': 0.37, '=18': 0.4, '>18': 0.43 },
    'B': { '<9': 0.37, '=9': 0.46, '=10': 0.48, '=11': 0.5, '=12': 0.65, '=13': 0.68, '=14': 0.71, '=15': 0.75, '=16': 0.77, '=17': 0.8, '=18': 0.83, '>18': 0.88 },
    'A': { '<9': 0.42, '=9': 0.48, '=10': 0.51, '=11': 0.54, '=12': 0.7, '=13': 0.73, '=14': 0.78, '=15': 0.79, '=16': 0.84, '=17': 0.87, '=18': 0.9, '>18': 0.93 }
  };

  return riskMatrix[rowKey]?.[colKey] / 100 ?? 0;
};

const calculateInsuranceBonusMc = (dsgnInVnd, tenure) => {
  let dsgnKey = '<12';
  if (dsgnInVnd >= 50000000) dsgnKey = '>=50';
  else if (dsgnInVnd >= 25000000) dsgnKey = '>=25';
  else if (dsgnInVnd >= 12000000) dsgnKey = '>=12';

  let tenureKey = '<12';
  if (tenure >= 12) tenureKey = '>=12';

  const bonusMatrix = {
    '<12': { '<12': 18, '>=12': 25 },
    '>=12': { '<12': 30, '>=12': 35 },
    '>=25': { '<12': 35, '>=12': 40 },
    '>=50': { '<12': 45, '>=12': 55 }
  };

  return (bonusMatrix[dsgnKey]?.[tenureKey] ?? 0) * 1000;
};

const TargetMC = targetMC => {
  let targetMCKey = '<120';
  if (targetMC >= 820000000) targetMCKey = '>=820';
  else if (targetMC >= 720000000) targetMCKey = '>=720';
  else if (targetMC >= 620000000) targetMCKey = '>=620';
  else if (targetMC >= 520000000) targetMCKey = '>=520';
  else if (targetMC >= 420000000) targetMCKey = '>=420';
  else if (targetMC >= 320000000) targetMCKey = '>=320';
  else if (targetMC >= 220000000) targetMCKey = '>=220';
  else if (targetMC >= 180000000) targetMCKey = '>=180';
  else if (targetMC >= 120000000) targetMCKey = '>=120';

  const targetMatrix = {
    '<120': 0,
    '>=120': 800000,
    '>=180': 900000,
    '>=220': 1200000,
    '>=320': 1500000,
    '>=420': 2000000,
    '>=520': 2500000,
    '>=620': 3000000,
    '>=720': 3500000,
    '>=820': 4000000
  };

  return targetMatrix[targetMCKey] ?? 0;
};

const BonusMC = bonusMC => {
  let bonusMCKey = '<80';
  if (bonusMC >= 140) bonusMCKey = '>=140';
  else if (bonusMC >= 130) bonusMCKey = '>=130';
  else if (bonusMC >= 120) bonusMCKey = '>=120';
  else if (bonusMC >= 110) bonusMCKey = '>=110';
  else if (bonusMC >= 100) bonusMCKey = '>=100';
  else if (bonusMC >= 95) bonusMCKey = '>=95';
  else if (bonusMC >= 90) bonusMCKey = '>=90';
  else if (bonusMC >= 80) bonusMCKey = '>=80';

  const bonusMatrix = {
    '<80': 0,
    '>=80': 0.5,
    '>=90': 0.8,
    '>=95': 0.85,
    '>=100': 1,
    '>=110': 1.1,
    '>=120': 1.15,
    '>=130': 1.2,
    '>=140': 1.3
  };

  return bonusMatrix[bonusMCKey] ?? 0;
};

// ==================== TÍNH TOÁN HỢP ĐỒNG ====================
function calculateContractBonuses(contracts, schemeIncentives, type = 'MC') {
  let totalSalesBonus = 0;
  let totalInsuranceBonus = 0;
  const listContractBonus = [];
  contracts = contracts.filter(v => v.type === type);
  for (const contract of contracts) {
    const dsgnInVnd = Number(contract.dsgn) || 0;
    const schemeName = contract.schemeName || '';
    const schemeCode = contract.schemeCode || '';
    const tenure = Number(contract.tenure) || 0;

    const schemeObj = schemeIncentives.find(
      s => s.schemeName === schemeName || s.scheme === schemeCode
    );
    let schemeGroup = schemeObj
      ? schemeObj.SchemeGroup || schemeObj.getSchemeGroup
      : 'D';

    if (schemeName.length > 0 && schemeName.at(-1) !== schemeGroup && schemeGroup === 'D') {
      schemeGroup = schemeName.at(-1);
    }

    const coefficient = type === 'DL'
      ? getCoefficientDL(schemeGroup, tenure)
      : getCoefficientMc(schemeGroup, tenure);

    const saleBonus = dsgnInVnd * coefficient;
    totalSalesBonus += saleBonus;

    const insuranceBonus = contract.Li === 'YES'
      ? (type === 'DL' ? calculateInsuranceBonusDL(dsgnInVnd, tenure) : calculateInsuranceBonusMc(dsgnInVnd, tenure))
      : 0;
    totalInsuranceBonus += insuranceBonus;

    listContractBonus.push({
      contractNo: contract.contractNo || 'N/A',
      tenure,
      dsgn: dsgnInVnd,
      dsgnInVnd,
      dsgnInMil: (dsgnInVnd / 1000000).toFixed(1),
      schemeGroup,
      insuranceBonus,
      coefficient: coefficient * 100,
      saleBonus
    });
  }

  return { salesBonus: totalSalesBonus, insuranceBonus: totalInsuranceBonus, listContractBonus };
}

function calculateTotalSIBounty(data) {
  const { contracts, schemeIncentives, pr3, pr6, targetMC, targetDL, targetTong } = data;

  // Tính MC
  const bonusDataMc = calculateContractBonuses(contracts, schemeIncentives, '2W');
  const riskFactorMc = getRiskFactorMc(pr3, pr6);
  const salesBonus_A_Mc = bonusDataMc.salesBonus * riskFactorMc;
  const targetMCAchieve = bonusDataMc.listContractBonus
    .filter(c => c.contractNo && c.contractNo.startsWith('2W'))
    .reduce((sum, c) => sum + c.dsgnInVnd, 0);
  const salesBonus_B_Mc = BonusMC((targetMCAchieve / targetMC) * 100) * TargetMC(targetMCAchieve);
  const salesBonus_C_Mc = bonusDataMc.insuranceBonus;
  const totalSIBountyMc = salesBonus_A_Mc + salesBonus_B_Mc + salesBonus_C_Mc;

  // Tính DL
  const bonusDataDl = calculateContractBonuses(contracts, schemeIncentives, 'DL');
  const riskFactorDl = getRiskFactorDL(pr3, pr6);
  const salesBonus_A_Dl = bonusDataDl.salesBonus * riskFactorDl;
  const targetDLAchieve = bonusDataDl.listContractBonus.reduce((sum, c) => sum + c.dsgnInVnd, 0);
  const salesBonus_B_Dl = BonusDL((targetDLAchieve / targetDL) * 100) * TargetDL(targetDLAchieve);
  const coefficient_C_Dl = getBonusDL((targetDLAchieve / targetDL) * 100, (targetDLAchieve / targetTong) * 100);
  const salesBonus_D_Dl = bonusDataDl.insuranceBonus;

  // Công thức DL: (A + B) * C + D
  const totalSIBountyDl = (salesBonus_A_Dl + salesBonus_B_Dl) * coefficient_C_Dl + salesBonus_D_Dl;

  return {
    totalSIBountyMc,
    detailsMc: {
      salesBonus_A: salesBonus_A_Mc,
      salesBonus_B: salesBonus_B_Mc,
      mainCoefficient_C: riskFactorMc,
      salesBonus_C: salesBonus_C_Mc,
      listContractBonus: bonusDataMc.listContractBonus
    },
    totalSIBountyDl,
    detailsDl: {
      salesBonus_A: salesBonus_A_Dl,
      salesBonus_B: salesBonus_B_Dl,
      coefficient_C: coefficient_C_Dl,
      salesBonus_D: salesBonus_D_Dl,
      listContractBonus: bonusDataDl.listContractBonus
    }
  };
}

const formatCurrency = amount => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

function renderResults() {
  const targetMC = window.getNumericValue ? window.getNumericValue('chitieuMC') : 100000000;
  const targetDL = window.getNumericValue ? window.getNumericValue('chitieuDL') : 100000000;
  const targetTong = window.getNumericValue ? window.getNumericValue('chitieuTong') : 500000000;
  const pr3 = window.getNumericValue ? window.getNumericValue('pr3') : 90;
  const pr6 = window.getNumericValue ? window.getNumericValue('pr6') : 90;

  const contractsToCalculate = actualContracts.length > 0 ? actualContracts : mockContracts;
  const result = calculateTotalSIBounty({
    contracts: contractsToCalculate,
    schemeIncentives,
    pr3,
    pr6,
    targetMC,
    targetDL,
    targetTong
  });

  const { totalSIBountyMc, detailsMc, totalSIBountyDl, detailsDl } = result;
  currentCalculatedContractsMc = detailsMc.listContractBonus;
  currentCalculatedContractsDl = detailsDl.listContractBonus;
  // Cập nhật Block Tổng Thưởng SI DL + MC
  const totalSIBountyCombined = totalSIBountyMc + totalSIBountyDl;
  if (document.getElementById('totalSIBountyCombined')) {
    document.getElementById('totalSIBountyCombined').innerText = formatCurrency(totalSIBountyCombined);
  }

  // Render MC UI
  if (document.getElementById('totalSIBountyMc')) document.getElementById('totalSIBountyMc').innerText = formatCurrency(totalSIBountyMc);
  if (document.getElementById('blockAMc')) document.getElementById('blockAMc').innerText = formatCurrency(detailsMc.salesBonus_A);
  if (document.getElementById('blockBMc')) document.getElementById('blockBMc').innerText = formatCurrency(detailsMc.salesBonus_B);
  if (document.getElementById('blockCMc')) document.getElementById('blockCMc').innerText = detailsMc.mainCoefficient_C;
  if (document.getElementById('blockDMc')) document.getElementById('blockDMc').innerText = formatCurrency(detailsMc.salesBonus_C);

  const tableBodyMc = document.getElementById('contractTableBodyMc');
  if (tableBodyMc) {
    tableBodyMc.innerHTML = detailsMc.listContractBonus.map(c => `
      <tr class="bg-white border-b hover:bg-slate-50">
        <td class="px-4 py-3 font-medium text-slate-900">${c.contractNo}</td>
        <td class="px-4 py-3">${c.tenure} tháng</td>
        <td class="px-4 py-3">${formatCurrency(c.dsgnInVnd)} (${c.dsgnInMil} Tr)</td>
        <td class="px-4 py-3 text-center"><span class="badge-group">${c.schemeGroup}</span></td>
        <td class="px-4 py-3 text-center">${c.coefficient.toFixed(2)}%</td>
        <td class="px-4 py-3 text-end font-semibold text-slate-700">${formatCurrency(c.saleBonus)}</td>
        <td class="px-4 py-3 text-end text-emerald-600 font-semibold">${formatCurrency(c.insuranceBonus)}</td>
      </tr>
    `).join('');
  }

  const totalDsgnMc = detailsMc.listContractBonus.reduce((sum, c) => sum + c.dsgnInVnd, 0);
  const sumSaleMc = detailsMc.listContractBonus.reduce((sum, c) => sum + c.saleBonus, 0);
  const sumInsMc = detailsMc.listContractBonus.reduce((sum, c) => sum + c.insuranceBonus, 0);

  if (document.getElementById('totalDSGNMc')) document.getElementById('totalDSGNMc').innerText = formatCurrency(totalDsgnMc);
  if (document.getElementById('sumSaleBonusMc')) document.getElementById('sumSaleBonusMc').innerText = formatCurrency(sumSaleMc);
  if (document.getElementById('sumInsuranceBonusMc')) document.getElementById('sumInsuranceBonusMc').innerText = formatCurrency(sumInsMc);

  // Render DL UI
  if (document.getElementById('totalSIBountyDl')) document.getElementById('totalSIBountyDl').innerText = formatCurrency(totalSIBountyDl);
  if (document.getElementById('blockADl')) document.getElementById('blockADl').innerText = formatCurrency(detailsDl.salesBonus_A);
  if (document.getElementById('blockBDl')) document.getElementById('blockBDl').innerText = formatCurrency(detailsDl.salesBonus_B);
  if (document.getElementById('blockCDl')) document.getElementById('blockCDl').innerText = detailsDl.coefficient_C;
  if (document.getElementById('blockDDl')) document.getElementById('blockDDl').innerText = formatCurrency(detailsDl.salesBonus_D);

  const tableBodyDl = document.getElementById('contractTableBodyDl');
  if (tableBodyDl) {
    tableBodyDl.innerHTML = detailsDl.listContractBonus.map(c => `
      <tr class="bg-white border-b hover:bg-slate-50">
        <td class="px-4 py-3 font-medium text-slate-900">${c.contractNo}</td>
        <td class="px-4 py-3">${c.tenure} tháng</td>
        <td class="px-4 py-3">${formatCurrency(c.dsgnInVnd)} (${c.dsgnInMil} Tr)</td>
        <td class="px-4 py-3 text-center"><span class="badge-group">${c.schemeGroup}</span></td>
        <td class="px-4 py-3 text-center">${c.coefficient.toFixed(2)}%</td>
        <td class="px-4 py-3 text-end font-semibold text-slate-700">${formatCurrency(c.saleBonus)}</td>
        <td class="px-4 py-3 text-end text-emerald-600 font-semibold">${formatCurrency(c.insuranceBonus)}</td>
      </tr>
    `).join('');
  }

  const totalDsgnDl = detailsDl.listContractBonus.reduce((sum, c) => sum + c.dsgnInVnd, 0);
  const sumSaleDl = detailsDl.listContractBonus.reduce((sum, c) => sum + c.saleBonus, 0);
  const sumInsDl = detailsDl.listContractBonus.reduce((sum, c) => sum + c.insuranceBonus, 0);

  if (document.getElementById('totalDSGNDl')) document.getElementById('totalDSGNDl').innerText = formatCurrency(totalDsgnDl);
  if (document.getElementById('sumSaleBonusDl')) document.getElementById('sumSaleBonusDl').innerText = formatCurrency(sumSaleDl);
  if (document.getElementById('sumInsuranceBonusDl')) document.getElementById('sumInsuranceBonusDl').innerText = formatCurrency(sumInsDl);
}

function getDefaultPrevMonthRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

  const format = d => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return { startDate: format(firstDay), endDate: format(lastDay) };
}

async function main() {
  try {
    const defaultRange = getDefaultPrevMonthRange();
    const startDate = (typeof window.getDateValue === 'function' && window.getDateValue('fromDate')) || defaultRange.startDate;
    const endDate = (typeof window.getDateValue === 'function' && window.getDateValue('toDate')) || defaultRange.endDate;

    const numbers = await getContractNumbers(
      startDate,
      endDate,
      'WAIT_FOR_CHECKING_DISBURSEMENT_STATUS-APPROVE_DISBURSEMENT_STATUS-APPROVED_HARD_COPY_STATUS'
    );

    const contractDetails = await getContractDetailsByNumbers(numbers);
    actualContracts = contractDetails || [];
    renderResults();
  } catch (error) {
    console.error('Lỗi API, dùng Mock Data:', error);
    renderResults();
  }
}

document.getElementById('btnCalculate')?.addEventListener('click', () => {
  main();
});

document.getElementById('btnExportExcel')?.addEventListener('click', () => {
  exportToExcel(currentCalculatedContractsMc, currentCalculatedContractsDl);
});

window.onload = () => {
  renderResults();
};