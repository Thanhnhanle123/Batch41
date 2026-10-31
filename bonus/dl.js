// 1. Trọng số rủi ro (PR3, PR6) DL
const getRiskFactorDL = (pr3, pr6) => {
  const val3 = typeof pr3 === 'number' && pr3 <= 1 && pr3 > 0 ? pr3 * 100 : pr3
  const val6 = typeof pr6 === 'number' && pr6 <= 1 && pr6 > 0 ? pr6 * 100 : pr6

  let rowKey = 'NA'
  if (val3 >= 92) rowKey = '>=92'
  else if (val3 >= 85) rowKey = '>=85'
  else if (val3 >= 80) rowKey = '>=80'
  else if (val3 !== null && val3 !== undefined && !Number.isNaN(val3))
    rowKey = '<80'

  let colKey = 'NA'
  if (val6 >= 90) colKey = '>=90'
  else if (val6 >= 85) colKey = '>=85'
  else if (val6 >= 80) colKey = '>=80'
  else if (val6 !== null && val6 !== undefined && !Number.isNaN(val6))
    colKey = '<80'

  const riskMatrix = {
    '<80': { '<80': 0, '>=80': 0, '>=85': 0, '>=90': 0, NA: 0 },
    '>=80': { '<80': 0, '>=80': 0.2, '>=85': 0.6, '>=90': 0.8, NA: 0.5 },
    '>=85': { '<80': 0.2, '>=80': 0.4, '>=85': 0.8, '>=90': 1.1, NA: 0.7 },
    '>=92': { '<80': 0.4, '>=80': 0.7, '>=85': 1.1, '>=90': 1.3, NA: 1 },
    NA: { '<80': 0, '>=80': 0.5, '>=85': 0.8, '>=90': 1, NA: 1 }
  }

  return riskMatrix[rowKey]?.[colKey] ?? 0
}

// 2. Hệ số Scheme & Kỳ hạn DL
const getCoefficientDL = (schemeGroup, term) => {
  let rowKey = 'NA'
  if (schemeGroup === 'E') rowKey = 'E'
  else if (schemeGroup == 'D') rowKey = 'D'
  else if (schemeGroup == 'C') rowKey = 'C'
  else if (schemeGroup == 'B') rowKey = 'B'
  else if (schemeGroup == 'A') rowKey = 'A'
  else if (
    schemeGroup !== null &&
    schemeGroup !== undefined &&
    !Number.isNaN(schemeGroup)
  )
    rowKey = 'E'

  let colKey = 'NA'
  if (term >= 24) colKey = '>=24'
  else if (term >= 18) colKey = '>=18'
  else if (term >= 15) colKey = '>=15'
  else if (term >= 12) colKey = '>=12'
  else if (term !== null && term !== undefined && !Number.isNaN(term))
    colKey = '<12'

  const riskMatrix = {
    D: { '<12': 0, '>=12': 0, '>=15': 0, '>=18': 0, '>24': 0 },
    C: { '<12': 0, '>=12': 0.1, '>=15': 0.3, '>=18': 0.4, '>24': 0.5 },
    B: { '<12': 0.7, '>=12': 1, '>=15': 1.1, '>=18': 1.3, '>24': 1.4 },
    A: { '<12': 0.9, '>=12': 1.2, '>=15': 1.3, '>=18': 1.5, '>24': 1.6 },
  }

  return riskMatrix[rowKey]?.[colKey] / 100 ?? 0
}

// 3. Thưởng đạt chỉ tiêu DL
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
    '>=100': 0.1,
    '>=110': 1.1,
    '>=120': 1.2,
    '>=130': 1.3,
    '>=140': 1.4,
    '>=150': 1.5,
    '>=160': 1.6
  };

  return bonusMatrix[bonusDLKey] ?? 0;
};

// Hệ số đạt chỉ tiêu hàng hàng chính và tổng
// Hệ số đạt chỉ tiêu ngành hàng chính và tổng
const getBonusDL = (targetMC, targetTong) => {
  // 1. Xác định chỉ số hàng dựa vào %Target MC/ED (từ cao xuống thấp)
  let rowIndex = 0;
  if (targetMC >= 120) {
    rowIndex = 4; // >=120%
  } else if (targetMC >= 100) {
    rowIndex = 3; // >=100%
  } else if (targetMC >= 75) {
    rowIndex = 2; // >=75%
  } else if (targetMC >= 50) {
    rowIndex = 1; // >=50%
  } else {
    rowIndex = 0; // <50%
  }

  // 2. Xác định chỉ số cột dựa vào %Target tổng (từ cao xuống thấp)
  let colIndex = 0;
  if (targetTong >= 115) {
    colIndex = 4; // >=115%
  } else if (targetTong >= 100) {
    colIndex = 3; // >=100%
  } else if (targetTong >= 90) {
    colIndex = 2; // >=90%
  } else if (targetTong >= 75) {
    colIndex = 1; // >=75%
  } else {
    colIndex = 0; // <=75%
  }

  // 3. Ma trận giá trị tương ứng từ bảng trong hình
  const bonusMatrix = [
    // <=75%  >=75%  >=90%  >=100%  >=115%
    [  0.2,   0.3,   0.5,    0.6,    0.7 ], // <50%
    [  0.2,   0.6,   0.8,    1.0,    1.3 ], // >=50%
    [  0.2,   0.7,   0.8,    1.2,    1.5 ], // >=75%
    [  0.5,   1.0,   1.1,    1.4,    1.8 ], // >=100%
    [  1.0,   1.2,   1.4,    1.5,    2.0 ]  // >=120%
  ];

  // Trả về giá trị hệ số tương ứng trong ma trận
  return bonusMatrix[rowIndex][colIndex];
};

// Tiền thưởng bảo hiểm
const calculateInsuranceBonusDL = (dsgnInVnd, tenure) => {
  // 1. Xác định mức doanh số giải ngân (DSGN)
  let dsgnKey = '<12';
  if (dsgnInVnd >= 50000000) dsgnKey = '>=50';
  else if (dsgnInVnd >= 25000000) dsgnKey = '>=25';
  else if (dsgnInVnd >= 12000000) dsgnKey = '>=12';

  // 2. Xác định kỳ hạn tương ứng (>= 18 sẽ tự động lấy mốc cao nhất là '18')
  let tenureKey = '12';
  if (tenure >= 18) {
    tenureKey = '18'; // Lấy mốc cao nhất cho các kỳ hạn từ 18 tháng trở lên
  } else if (tenure >= 15) {
    tenureKey = '15';
  } else {
    tenureKey = '12'; // Dưới 15 tháng (hoặc < 12) lấy mốc thấp nhất là 12
  }

  // 3. Ma trận tiền thưởng dựa theo bảng (Đơn vị: VNĐ)
  const bonusMatrix = {
    '<12':  { '12': 100, '15': 150, '18': 200 },
    '>=12': { '12': 180, '15': 230, '18': 280 },
    '>=25': { '12': 260, '15': 310, '18': 360 },
    '>=50': { '12': 340, '15': 390, '18': 440 }
  };

  return (bonusMatrix[dsgnKey]?.[tenureKey] || 0) * 1000;
};