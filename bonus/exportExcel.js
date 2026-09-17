// exportExcel.js (Phiên bản dùng ExcelJS hỗ trợ đầy đủ màu sắc & style)
export async function exportToExcel(contractList = []) {
  if (!window.ExcelJS) {
    alert("Chưa tải thư viện ExcelJS! Vui lòng kiểm tra lại file HTML.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Báo Cáo Thưởng SI", {
    views: [{ showGridLines: true }]
  });

  // --- BẢNG MÀU CHUYÊN NGHIỆP (Emerald / Slate Theme) ---
  const COLOR_HEADER_BG = "1E293B"; // Slate Dark
  const COLOR_TITLE_BG = "064E3B";  // Emerald Dark
  const COLOR_SECTION_BG = "059669"; // Emerald Medium
  const COLOR_ZEBRA_BG = "F8FAFC";   // Slate Light
  const COLOR_TOTAL_BG = "D1FAE5";   // Mint Accent
  const COLOR_BORDER = "CBD5E1";     // Slate Border

  const borderThin = {
    top: { style: "thin", color: { argb: COLOR_BORDER } },
    left: { style: "thin", color: { argb: COLOR_BORDER } },
    bottom: { style: "thin", color: { argb: COLOR_BORDER } },
    right: { style: "thin", color: { argb: COLOR_BORDER } }
  };

  // 1. HEADER BANNER
  ws.mergeCells("A1:G1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "BÁO CÁO CHI TIẾT TÍNH THƯỞNG SI & HỢP ĐỒNG";
  titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TITLE_BG } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 32;

  // Lấy dữ liệu từ giao diện
  const getVal = id => document.getElementById(id)?.value || "";
  const getNum = id => Number(getVal(id).replace(/\D/g, "")) || 0;

  // 2. SECTION 1: CẤU HÌNH & CHỈ TIÊU
  ws.mergeCells("A3:D3");
  const sec1 = ws.getCell("A3");
  sec1.value = "1. THÔNG SỐ CẤU HÌNH & CHỈ TIÊU";
  sec1.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFF" } };
  sec1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_SECTION_BG } };

  const configRows = [
    ["Từ ngày:", getVal("fromDate"), "Chỉ tiêu DL (VNĐ):", getNum("chitieuDL")],
    ["Đến ngày:", getVal("toDate"), "Chỉ tiêu MC (VNĐ):", getNum("chitieuMC")],
    ["Phần trăm PR3 (%):", `${getVal("pr3")}%`, "Phần trăm PR6 (%):", `${getVal("pr6")}%`]
  ];

  configRows.forEach((rowData, idx) => {
    const row = ws.getRow(4 + idx);
    row.values = [rowData[0], rowData[1], rowData[2], rowData[3]];
    
    // Style nhãn
    [1, 3].forEach(colIdx => {
      const cell = row.getCell(colIdx);
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2E8F0" } };
    });
    
    // Format số
    if (idx < 2) row.getCell(4).numFmt = '#,##0" đ"';
    for (let c = 1; c <= 4; c++) row.getCell(c).border = borderThin;
  });

  // 3. SECTION 2: TỔNG HỢP THƯỞNG SI
  ws.mergeCells("A8:E8");
  const sec2 = ws.getCell("A8");
  sec2.value = "2. TỔNG HỢP THƯỞNG SI";
  sec2.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFF" } };
  sec2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_SECTION_BG } };

  const sumHeaders = ["Block A (Thưởng DS)", "Block B (Thưởng CT DL)", "Block C (Hệ Số NH)", "Block D (Thưởng BH)", "TỔNG THƯỞNG SI"];
  const hRow = ws.getRow(9);
  hRow.values = sumHeaders;
  hRow.height = 24;

  sumHeaders.forEach((_, idx) => {
    const cell = hRow.getCell(idx + 1);
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderThin;
  });

  const getNumFromText = id => Number((document.getElementById(id)?.innerText || "0").replace(/\D/g, "")) || 0;
  
  const valRow = ws.getRow(10);
  valRow.values = [
    getNumFromText("blockA"),
    getNumFromText("blockB"),
    parseFloat(document.getElementById("blockC")?.innerText || "0"),
    getNumFromText("blockD"),
    getNumFromText("totalSIBounty")
  ];

  [1, 2, 4, 5].forEach(col => valRow.getCell(col).numFmt = '#,##0" đ"');
  valRow.getCell(3).numFmt = '0.00';

  for (let c = 1; c <= 5; c++) {
    const cell = valRow.getCell(c);
    cell.font = { bold: true };
    cell.border = borderThin;
    cell.alignment = { horizontal: "right" };
  }
  // Highlight tổng thưởng
  valRow.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL_BG } };
  valRow.getCell(5).font = { bold: true, color: { argb: "065F46" }, size: 12 };

  // 4. SECTION 3: BẢNG DỮ LIỆU HỢP ĐỒNG CHI TIẾT
  ws.mergeCells("A12:G12");
  const sec3 = ws.getCell("A12");
  sec3.value = "3. CHI TIẾT TỪNG HỢP ĐỒNG";
  sec3.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFF" } };
  sec3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_SECTION_BG } };

  const tableHeaders = ["Mã HĐ", "Kỳ Hạn", "DS Giải Ngân", "Group", "Hệ Số (%)", "Thưởng Doanh Số", "Thưởng Bảo Hiểm"];
  const tRow = ws.getRow(13);
  tRow.values = tableHeaders;
  tRow.height = 24;

  tableHeaders.forEach((_, idx) => {
    const cell = tRow.getCell(idx + 1);
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderThin;
  });

  let startRow = 14;
  contractList.forEach((item, index) => {
    const row = ws.getRow(startRow + index);
    const dsgn = Number(item.dsgnInVnd || item.dsgn || 0);

    row.values = [
      item.contractNo || "",
      `${item.tenure || 0} tháng`,
      dsgn,
      item.schemeGroup || "",
      (Number(item.coefficient) || 0) / 100,
      Number(item.saleBonus) || 0,
      Number(item.insuranceBonus) || 0
    ];

    // Zebra striping
    const isEven = index % 2 === 0;
    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.border = borderThin;
      if (!isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA_BG } };
      }
    }

    // Alignment & Formatting
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "center" };
    row.getCell(3).numFmt = '#,##0" đ"';
    row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(5).numFmt = '0.0%';
    row.getCell(6).numFmt = '#,##0" đ"';
    row.getCell(7).numFmt = '#,##0" đ"';
  });

  // Hàng tổng cộng cuối bảng
  const totRowIndex = startRow + contractList.length;
  const totRow = ws.getRow(totRowIndex);
  
  ws.mergeCells(`A${totRowIndex}:B${totRowIndex}`);
  totRow.getCell(1).value = "Tổng cộng:";
  totRow.getCell(1).alignment = { horizontal: "right" };
  
  totRow.getCell(3).value = { formula: `SUM(C14:C${totRowIndex - 1})` };
  totRow.getCell(6).value = { formula: `SUM(F14:F${totRowIndex - 1})` };
  totRow.getCell(7).value = { formula: `SUM(G14:G${totRowIndex - 1})` };

  [3, 6, 7].forEach(c => totRow.getCell(c).numFmt = '#,##0" đ"');

  for (let c = 1; c <= 7; c++) {
    const cell = totRow.getCell(c);
    cell.font = { bold: true };
    cell.border = {
      top: { style: "medium" },
      bottom: { style: "double" }
    };
  }

  // 5. CẤU HÌNH ĐỘ RỘNG CỘT TỰ ĐỘNG
  ws.columns = [
    { width: 20 }, // Mã HĐ
    { width: 14 }, // Kỳ hạn
    { width: 22 }, // DSGN
    { width: 14 }, // Group
    { width: 14 }, // Hệ số
    { width: 22 }, // Thưởng DS
    { width: 22 }  // Thưởng BH
  ];

  // 6. XUẤT FILE
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Bao_Cao_SI_${getVal("fromDate")}_den_${getVal("toDate")}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}