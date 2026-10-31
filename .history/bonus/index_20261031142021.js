import { exportToExcel } from './exportExcel.js';
import { getContractDetailsByNumbers, getContractNumbers } from './logic.js';
import { schemeIncentives } from './scheme.js';

// Dữ liệu mock giả lập danh sách hợp đồng
const mockContracts = [
  
];

let actualContracts = []

// Lưu trữ dữ liệu bảng hợp đồng hiện tại để xuất Excel
let currentCalculatedContracts = [];

// 1. Trọng số rủi ro (PR3, PR6)
const getRiskFactor = (pr3, pr6) => {
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

// 2. Hệ số Scheme & Kỳ hạn
const getCoefficient = (schemeGroup, term) => {
  let rowKey = 'NA';
  if (schemeGroup === 'E') rowKey = 'E';
  else if (schemeGroup >= 'D') rowKey = 'D';
  else if (schemeGroup >= 'C') rowKey = 'C';
  else if (schemeGroup >= 'B') rowKey = 'B';
  else if (schemeGroup >= 'A') rowKey = 'A';
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
    E: { '<9': 0, '=9': 0, '=10': 0, '=11': 0, '=12': 0, '=13': 0, '=14': 0, '=15': 0, '=16': 0, '=17': 0, '=18': 0, '>18': 0 },
    D: { '<9': 0.05, '=9': 0.05, '=10': 0.05, '=11': 0.05, '=12': 0.12, '=13': 0.14, '=14': 0.16, '=15': 0.18, '=16': 0.2, '=17': 0.22, '=18': 0.24, '>18': 0.26 },
    C: { '<9': 0.09, '=9': 0.16, '=10': 0.17, '=11': 0.18, '=12': 0.22, '=13': 0.25, '=14': 0.28, '=15': 0.31, '=16': 0.34, '=17': 0.37, '=18': 0.4, '>18': 0.43 },
    B: { '<9': 0.37, '=9': 0.46, '=10': 0.48, '=11': 0.5, '=12': 0.65, '=13': 0.68, '=14': 0.71, '=15': 0.75, '=16': 0.77, '=17': 0.8, '=18': 0.83, '>18': 0.88 },
    A: { '<9': 0.42, '=9': 0.48, '=10': 0.51, '=11': 0.54, '=12': 0.7, '=13': 0.73, '=14': 0.78, '=15': 0.79, '=16': 0.84, '=17': 0.87, '=18': 0.9, '>18': 0.93 }
  };

  return riskMatrix[rowKey]?.[colKey]/100 ?? 0;
};

// 3. Tiền thưởng bảo hiểm
const calculateInsuranceBonus = (dsgnInVnd, tenure) => {
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

// 4. Thưởng đạt chỉ tiêu MC
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

// 5. Tính toán từng hợp đồng
function calculateContractBonuses(contracts, schemeIncentives) {
  let totalSalesBonus = 0;
  let totalInsuranceBonus = 0;
  const listContractBonus = [];

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

    const coefficient = getCoefficient(schemeGroup, tenure);
    const saleBonus = dsgnInVnd * coefficient;
    totalSalesBonus += saleBonus;

    const insuranceBonus =
      contract.Li === 'YES' ? calculateInsuranceBonus(dsgnInVnd, tenure) : 0;
    totalInsuranceBonus += insuranceBonus;

    listContractBonus.push({
      contractNo: contract.contractNo || 'N/A',
      tenure,
      dsgn: dsgnInVnd,
      dsgnInVnd,
      dsgnInMil: (dsgnInVnd / 1000000).toFixed(1),
      schemeGroup,
      insuranceBonus,
      coefficient: coefficient * 100, // Hiển thị dạng phần trăm (%)
      saleBonus
    });
  }

  return {
    salesBonus: totalSalesBonus,
    insuranceBonus: totalInsuranceBonus,
    listContractBonus
  };
}

// 6. Tính Tổng Thưởng SI
function calculateTotalSIBounty(data) {
  const { contracts, schemeIncentives, pr3, pr6, targetMC } = data;

  const bonusData = calculateContractBonuses(contracts, schemeIncentives);
  
  // A. Thưởng doanh số
  const riskFactor = getRiskFactor(pr3, pr6);
  const salesBonus_A = bonusData.salesBonus * riskFactor;

  // B. Thưởng đạt chỉ tiêu MC
  const targetMCAchieve = bonusData.listContractBonus
    .filter(c => c.contractNo && c.contractNo.startsWith('2W'))
    .reduce((sum, c) => sum + c.dsgnInVnd, 0);
  
  const salesBonus_B =
    BonusMC((targetMCAchieve / targetMC) * 100) * TargetMC(targetMCAchieve);

  // C. Thưởng bảo hiểm khoản vay
  const salesBonus_C = bonusData.insuranceBonus;

  const totalSIBounty = salesBonus_A + salesBonus_B + salesBonus_C;

  return {
    totalSIBounty,
    details: {
      salesBonus_A,
      salesBonus_B,
      mainCoefficient_C: riskFactor, // Hoặc giá trị hệ số phù hợp hiển thị Block C
      salesBonus_C,
      listContractBonus: bonusData.listContractBonus
    }
  };
}

const formatCurrency = amount => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// 7. Hàm Render kết quả lên giao diện
function renderResults() {
  const targetMC = window.getNumericValue ? window.getNumericValue('chitieuMC') : 100000000;
  const pr3 = window.getNumericValue ? window.getNumericValue('pr3') : 90;
  const pr6 = window.getNumericValue ? window.getNumericValue('pr6') : 90;

  // Sử dụng trực tiếp mockContracts không cần gọi API đăng nhập
  const contractsToCalculate =
    actualContracts.length > 0 ? actualContracts : mockContracts
  const result = calculateTotalSIBounty({
    contracts: contractsToCalculate,
    schemeIncentives,
    pr3,
    pr6,
    targetMC
  });

  const { totalSIBounty, details } = result;

  // Cập nhật biến dữ liệu để dùng cho việc xuất file Excel
  currentCalculatedContracts = details.listContractBonus;

  if (document.getElementById('totalSIBounty'))
    document.getElementById('totalSIBounty').innerText = formatCurrency(totalSIBounty);
  if (document.getElementById('blockA'))
    document.getElementById('blockA').innerText = formatCurrency(details.salesBonus_A);
  if (document.getElementById('blockB'))
    document.getElementById('blockB').innerText = formatCurrency(details.salesBonus_B);
  if (document.getElementById('blockC'))
    document.getElementById('blockC').innerText = details.mainCoefficient_C;
  if (document.getElementById('blockD'))
    document.getElementById('blockD').innerText = formatCurrency(details.salesBonus_C);

  const tableBody = document.getElementById('contractTableBody');
  if (tableBody) {
    tableBody.innerHTML = details.listContractBonus
      .map(
        contract => `
      <tr class="bg-white border-b hover:bg-slate-50">
        <td class="px-4 py-3 font-medium text-slate-900">${contract.contractNo}</td>
        <td class="px-4 py-3">${contract.tenure} tháng</td>
        <td class="px-4 py-3">${formatCurrency(contract.dsgnInVnd)} (${contract.dsgnInMil} Tr)</td>
        <td class="px-4 py-3 text-center"><span class="badge-group">${contract.schemeGroup}</span></td>
        <td class="px-4 py-3 text-center">${contract.coefficient.toFixed(2)}%</td>
        <td class="px-4 py-3 text-end font-semibold text-slate-700">${formatCurrency(contract.saleBonus)}</td>
        <td class="px-4 py-3 text-end text-emerald-600 font-semibold">${formatCurrency(contract.insuranceBonus)}</td>
      </tr>
    `
      )
      .join('');
  }

  const totalDsgnInVnd = details.listContractBonus.reduce(
    (sum, c) => sum + c.dsgnInVnd,
    0
  );
  const totalSaleBonusTable = details.listContractBonus.reduce(
    (sum, c) => sum + c.saleBonus,
    0
  );
  const totalInsBonusTable = details.listContractBonus.reduce(
    (sum, c) => sum + c.insuranceBonus,
    0
  );

  const totalDsgnElement = document.getElementById('totalDSGN');
  if (totalDsgnElement) {
    totalDsgnElement.innerText = `${formatCurrency(totalDsgnInVnd)} (${(totalDsgnInVnd / 1000000).toFixed(1)} Tr)`;
  }
  const sumSaleBonusElement = document.getElementById('sumSaleBonus');
  if (sumSaleBonusElement) {
    sumSaleBonusElement.innerText = formatCurrency(totalSaleBonusTable);
  }
  const sumInsuranceBonusElement = document.getElementById('sumInsuranceBonus');
  if (sumInsuranceBonusElement) {
    sumInsuranceBonusElement.innerText = formatCurrency(totalInsBonusTable);
  }
}

function getDefaultPrevMonthRange () {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)

  const format = d => {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }

  return {
    startDate: format(firstDay),
    endDate: format(lastDay)
  }
}

async function main () {
  try {
    const defaultRange = getDefaultPrevMonthRange()
    const startDate =
      (typeof window.getDateValue === 'function' &&
        window.getDateValue('fromDate')) ||
      defaultRange.startDate
    const endDate =
      (typeof window.getDateValue === 'function' &&
        window.getDateValue('toDate')) ||
      defaultRange.endDate

    const numbers = await getContractNumbers(
      startDate,
      endDate,
      'WAIT_FOR_CHECKING_DISBURSEMENT_STATUS-APPROVE_DISBURSEMENT_STATUS-APPROVED_HARD_COPY_STATUS'
    )

    const contractDetails = await getContractDetailsByNumbers(numbers, "DL")
    actualContracts = contractDetails || []
    
    renderResults()
  } catch (error) {
    console.error('Lỗi API, dùng Mock Data:', error)
    renderResults()
  }
}

// Bắt sự kiện khi bấm nút "Tính Thưởng"
document.getElementById('btnCalculate')?.addEventListener('click', () => {
  main();
});

// Bắt sự kiện khi bấm nút "Tải File Excel"
document.getElementById('btnExportExcel')?.addEventListener('click', () => {
  exportToExcel(currentCalculatedContracts);
});

// Khởi chạy khi trang load
window.onload = () => {
  renderResults();
};