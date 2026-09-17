import { exportToExcel } from './exportExcel.js'
import { getContractDetailsByNumbers, getContractNumbers } from './logic.js'
import { schemeIncentives } from './scheme.js'

// Dữ liệu mock giả lập danh sách hợp đồng
const mockContracts = []
let actualContracts = []

// LƯU TRỮ DỮ LIỆU BẢNG HỢP ĐỒNG HIỆN TẠI ĐỂ XUẤT EXCEL
let currentCalculatedContracts = []

// Hàm phụ trợ tính ngày mặc định (tháng trước) dạng DD-MM-YYYY
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

    const contractDetails = await getContractDetailsByNumbers(numbers)
    actualContracts = contractDetails || []
    
    renderResults()
  } catch (error) {
    console.error('Lỗi API, dùng Mock Data:', error)
    renderResults()
  }
}

// 1. Trọng số rủi ro (PR3, PR6)
const getRiskFactor = (pr3, pr6) => {
  const val3 = typeof pr3 === 'number' && pr3 <= 1 && pr3 > 0 ? pr3 * 100 : pr3
  const val6 = typeof pr6 === 'number' && pr6 <= 1 && pr6 > 0 ? pr6 * 100 : pr6

  let rowKey = 'NA'
  if (val3 >= 90) rowKey = '>=90'
  else if (val3 >= 85) rowKey = '>=85'
  else if (val3 >= 75) rowKey = '>=75'
  else if (val3 !== null && val3 !== undefined && !Number.isNaN(val3))
    rowKey = '<75'

  let colKey = 'NA'
  if (val6 >= 85) colKey = '>=85'
  else if (val6 >= 75) colKey = '>=75'
  else if (val6 !== null && val6 !== undefined && !Number.isNaN(val6))
    colKey = '<75'

  const riskMatrix = {
    '<75': { '<75': 0, '>=75': 0, '>=85': 0, NA: 0 },
    '>=75': { '<75': 0, '>=75': 0.6, '>=85': 0.8, NA: 0.8 },
    '>=85': { '<75': 0.2, '>=75': 0.8, '>=85': 1.1, NA: 1 },
    '>=90': { '<75': 0.4, '>=75': 1.1, '>=85': 1.3, NA: 1 },
    NA: { '<75': 0, '>=75': 0.8, '>=85': 1, NA: 1 }
  }

  return riskMatrix[rowKey]?.[colKey] ?? 0
}

// 2. Hệ số Scheme & Kỳ hạn
const getCoefficient = (schemeGroup, tenure) => {
  if (!schemeGroup) return 0
  const normalizedScheme = String(schemeGroup).trim().toUpperCase()

  let tenureKey = '<12'
  if (tenure >= 24) tenureKey = '>=24'
  else if (tenure >= 18) tenureKey = '>=18'
  else if (tenure >= 15) tenureKey = '>=15'
  else if (tenure >= 12) tenureKey = '>=12'

  const coefficientMatrix = {
    D: { '<12': 0, '>=12': 0, '>=15': 0, '>=18': 0, '>=24': 0 },
    C: { '<12': 0, '>=12': 0.1, '>=15': 0.3, '>=18': 0.4, '>=24': 0.5 },
    B: { '<12': 0.7, '>=12': 1, '>=15': 1.1, '>=18': 1.3, '>=24': 1.4 },
    A: { '<12': 0.9, '>=12': 1.2, '>=15': 1.3, '>=18': 1.5, '>=24': 1.6 }
  }

  return coefficientMatrix[normalizedScheme]?.[tenureKey] ?? 0
}

// 3. Tiền thưởng bảo hiểm
const calculateInsuranceBonus = (dsgnInVnd, tenure) => {
  let dsgnKey = '<12'
  if (dsgnInVnd >= 50000000) dsgnKey = '>=50'
  else if (dsgnInVnd >= 25000000) dsgnKey = '>=25'
  else if (dsgnInVnd >= 12000000) dsgnKey = '>=12'

  let tenureKey = 0
  if (tenure >= 18) tenureKey = 18
  else if (tenure >= 15) tenureKey = 15
  else if (tenure >= 12) tenureKey = 12
  else return 0

  const bonusMatrix = {
    '<12': { 12: 10000, 15: 15000, 18: 20000 },
    '>=12': { 12: 18000, 15: 23000, 18: 28000 },
    '>=25': { 12: 26000, 15: 31000, 18: 36000 },
    '>=50': { 12: 34000, 15: 39000, 18: 44000 }
  }

  return bonusMatrix[dsgnKey]?.[tenureKey] ?? 0
}

// 4. Thưởng đạt chỉ tiêu DL cơ bản
const calculateTargetDLBonus = targetDL => {
  let targetDLKey = '<60'

  if (targetDL >= 300000000) targetDLKey = '>=300'
  else if (targetDL >= 200000000) targetDLKey = '>=200'
  else if (targetDL >= 150000000) targetDLKey = '>=150'
  else if (targetDL >= 100000000) targetDLKey = '>=100'
  else if (targetDL >= 60000000) targetDLKey = '>=60'

  const bonusMatrix = {
    '<60': 0,
    '>=60': 600000,
    '>=100': 800000,
    '>=150': 1100000,
    '>=200': 1300000,
    '>=300': 1800000
  }

  return bonusMatrix[targetDLKey] ?? 0
}

// 5. Hệ số vượt chỉ tiêu DL
const calculateDLBonusCoefficient = kpiCompletionRate => {
  let rateKey = '<=90'
  if (kpiCompletionRate >= 120) rateKey = '>=120'
  else if (kpiCompletionRate >= 110) rateKey = '>=110'
  else if (kpiCompletionRate >= 100) rateKey = '>=100'
  else if (kpiCompletionRate >= 90) rateKey = '>=90'

  const bonusMatrix = {
    '<=90': 0.0,
    '>=90': 0.7,
    '>=100': 1.0,
    '>=110': 1.3,
    '>=120': 1.6
  }

  return bonusMatrix[rateKey] ?? 0.0
}

// 6. Hệ số ngành hàng chính & tổng
const getMainAndTotalCategoryCoefficient = (mainCategoryRate, totalRate) => {
  let rowKey = '<50'
  if (mainCategoryRate >= 90) rowKey = '>=90'
  else if (mainCategoryRate >= 75) rowKey = '>=75'
  else if (mainCategoryRate >= 50) rowKey = '>=50'

  let colKey = '<=75'
  if (totalRate >= 115) colKey = '>=115'
  else if (totalRate >= 100) colKey = '>=100'
  else if (totalRate >= 90) colKey = '>=90'
  else if (totalRate >= 75) colKey = '>=75'

  const coefficientMatrix = {
    '<50': { '<=75': 0, '>=75': 0, '>=90': 0, '>=100': 0, '>=115': 0 },
    '>=50': { '<=75': 0, '>=75': 0.6, '>=90': 0.8, '>=100': 1.1, '>=115': 1.3 },
    '>=75': { '<=75': 0, '>=75': 0.7, '>=90': 0.9, '>=100': 1.2, '>=115': 1.5 },
    '>=90': { '<=75': 0, '>=75': 1, '>=90': 1.1, '>=100': 1.4, '>=115': 1.8 }
  }

  return coefficientMatrix[rowKey]?.[colKey] ?? 0
}

// 7. Tính toán từng hợp đồng
function calculateContractBonuses (contracts, schemeIncentives) {
  let totalSalesBonus = 0
  let totalInsuranceBonus = 0
  const listContractBonus = []

  for (const contract of contracts) {
    const dsgnInVnd = Number(contract.dsgn) || 0
    const schemeName = contract.schemeName || ''
    const schemeCode = contract.schemeCode || ''
    const tenure = Number(contract.tenure) || 0

    const schemeObj = schemeIncentives.find(
      s => s.schemeName === schemeName || s.scheme === schemeCode
    )
    let schemeGroup = schemeObj
      ? schemeObj.SchemeGroup || schemeObj.getSchemeGroup
      : 'D'

    if (schemeName.at(-1) !== schemeGroup && schemeGroup === 'D') {
      schemeGroup = schemeName.at(-1)
    }

    const coefficient = getCoefficient(schemeGroup, tenure)

    const saleBonus = dsgnInVnd * (coefficient / 100)
    totalSalesBonus += saleBonus

    const insuranceBonus =
      contract.Li === 'YES' ? calculateInsuranceBonus(dsgnInVnd, tenure) : 0
    totalInsuranceBonus += insuranceBonus

    listContractBonus.push({
      contractNo: contract.contractNo || contract.contractNumber || 'N/A',
      tenure,
      dsgn: dsgnInVnd,
      dsgnInVnd,
      dsgnInMil: (dsgnInVnd / 1000000).toFixed(1),
      schemeGroup,
      insuranceBonus,
      coefficient,
      saleBonus
    })
  }

  return {
    salesBonus: totalSalesBonus,
    insuranceBonus: totalInsuranceBonus,
    listContractBonus
  }
}

// 8. Tính Tổng Thưởng SI
function calculateTotalSIBounty (data) {
  const { contracts, schemeIncentives, pr3, pr6, targetDL, targetMC } = data

  const bonusData = calculateContractBonuses(contracts, schemeIncentives)
  const riskFactor = getRiskFactor(pr3, pr6)

  const targetAchieve = bonusData.listContractBonus.reduce(
    (sum, c) => sum + c.dsgnInVnd,
    0
  )

  const targetMCAchieve = bonusData.listContractBonus
    .filter(c => c.contractNo && c.contractNo.startsWith('2W'))
    .reduce((sum, c) => sum + c.dsgnInVnd, 0)

  const salesBonus_A = bonusData.salesBonus * riskFactor

  const kpiCompletionRate =
    targetDL > 0 && targetMC > 0
      ? (targetAchieve / (targetDL + targetMC)) * 100
      : 0
  const baseDLBonus = calculateTargetDLBonus(targetDL)
  const dlBonusCoefficient = calculateDLBonusCoefficient(kpiCompletionRate)
  const dlTargetBonusAmount_B = baseDLBonus * dlBonusCoefficient

  const mainCategoryRate = targetMC > 0 ? (targetMCAchieve / targetMC ) * 100 : 0
  
  const totalRate = kpiCompletionRate
  const mainCoefficient_C = getMainAndTotalCategoryCoefficient(
    mainCategoryRate,
    totalRate
  )

  const insuranceBonus_D = bonusData.insuranceBonus

  const totalSIBounty =
    (salesBonus_A + dlTargetBonusAmount_B) * mainCoefficient_C +
    insuranceBonus_D

  return {
    totalSIBounty,
    details: {
      salesBonus_A,
      dlTargetBonusAmount_B,
      mainCoefficient_C,
      insuranceBonus_D,
      listContractBonus: bonusData.listContractBonus
    }
  }
}

const formatCurrency = amount => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

function renderResults () {
  const targetDL =
    typeof window.getNumericValue === 'function'
      ? window.getNumericValue('chitieuDL')
      : 0
  const targetMC =
    typeof window.getNumericValue === 'function'
      ? window.getNumericValue('chitieuMC')
      : 0
  const pr3 =
    typeof window.getNumericValue === 'function'
      ? window.getNumericValue('pr3')
      : 0
  const pr6 =
    typeof window.getNumericValue === 'function'
      ? window.getNumericValue('pr6')
      : 0

  const contractsToCalculate =
    actualContracts.length > 0 ? actualContracts : mockContracts

  const result = calculateTotalSIBounty({
    contracts: contractsToCalculate,
    schemeIncentives,
    pr3,
    pr6,
    targetDL,
    targetMC
  })

  const { totalSIBounty, details } = result

  // Cập nhật biến dữ liệu để dùng cho việc xuất file Excel
  currentCalculatedContracts = details.listContractBonus

  if (document.getElementById('totalSIBounty'))
    document.getElementById('totalSIBounty').innerText =
      formatCurrency(totalSIBounty)
  if (document.getElementById('blockA'))
    document.getElementById('blockA').innerText = formatCurrency(
      details.salesBonus_A
    )
  if (document.getElementById('blockB'))
    document.getElementById('blockB').innerText = formatCurrency(
      details.dlTargetBonusAmount_B
    )
  if (document.getElementById('blockC'))
    document.getElementById('blockC').innerText = details.mainCoefficient_C
  if (document.getElementById('blockD'))
    document.getElementById('blockD').innerText = formatCurrency(
      details.insuranceBonus_D
    )

  const tableBody = document.getElementById('contractTableBody')
  if (tableBody) {
    tableBody.innerHTML = details.listContractBonus
      .map(
        contract => `
      <tr class="bg-white border-b hover:bg-slate-50">
        <td class="px-4 py-3 font-medium text-slate-900">${
          contract.contractNo
        }</td>
        <td class="px-4 py-3">${contract.tenure} tháng</td>
        <td class="px-4 py-3">${formatCurrency(contract.dsgnInVnd)} (${
          contract.dsgnInMil
        } Tr)</td>
        <td class="px-4 py-3"><span class="px-2 py-1 bg-slate-200 rounded text-xs font-bold">${
          contract.schemeGroup
        }</span></td>
        <td class="px-4 py-3">${contract.coefficient}%</td>
        <td class="px-4 py-3 font-semibold text-slate-700">${formatCurrency(
          contract.saleBonus
        )}</td>
        <td class="px-4 py-3 text-emerald-600 font-semibold">${formatCurrency(
          contract.insuranceBonus
        )}</td>
      </tr>
    `
      )
      .join('')
  }

  const totalDsgnInVnd = details.listContractBonus.reduce(
    (sum, c) => sum + c.dsgnInVnd,
    0
  )
  const totalDsgnElement = document.getElementById('totalDSGN')
  if (totalDsgnElement) {
    totalDsgnElement.innerText = `${formatCurrency(totalDsgnInVnd)} (${(
      totalDsgnInVnd / 1000000
    ).toFixed(1)} Tr)`
  }
}

// Bắt sự kiện khi bấm nút "Tính Thưởng"
document.getElementById('btnCalculate')?.addEventListener('click', () => {
  main()
})

// Bắt sự kiện khi bấm nút "Tải File Excel"
document.getElementById('btnExportExcel')?.addEventListener('click', () => {
  exportToExcel(currentCalculatedContracts)
})

// Khởi chạy khi trang load
renderResults()
main()
