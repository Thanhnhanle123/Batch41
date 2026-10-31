// exportExcel.js (Phiên bản xuất gộp cả MC & DL trong cùng 1 file Excel)
export async function exportToExcel(contractsMc = [], contractsDl = []) {
  if (!window.ExcelJS) {
    alert("Chưa tải thư viện ExcelJS! Vui lòng kiểm tra lại file HTML.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  
  // Lấy dữ liệu cấu hình từ giao diện HTML
  const getVal = id => document.getElementById(id)?.value || "";
  const getNum = id => Number(getVal(id).replace(/\D/g, "")) || 0;
  const getNumFromText = id => Number((document.getElementById(id)?.innerText || "0").replace(/\D/g, "")) || 0;

  // Bảng màu chuẩn
  const COLOR_HEADER_BG = "1E293B"; // Slate Dark
  const COLOR_SECTION_BG = "059669"; // Emerald Medium
  const COLOR_ZEBRA_BG = "F8FAFC";   // Slate Light
  const COLOR_TOTAL_BG = "FEF3C7";   // Amber Light Accent
  const COLOR_BORDER = "CBD5E1";     // Slate Border

  const borderThin = {
    top: { style: "thin", color: { argb: COLOR_BORDER } },
    left: { style: "thin", color: { argb: COLOR_BORDER } },
    bottom: { style: "thin", color: { argb: COLOR_BORDER } },
    right: { style: "thin", color: { argb: COLOR_BORDER } }
  };

  // ==========================================
  // SHEET 1: BÁO CÁO TỔNG HỢP SI (MC + DL)
  // ==========================================
  const wsSummary = workbook.addWorksheet("Tổng Hop Thuong SI", { views: [{ showGridLines: true }] });

  // 1. Header Banner
  wsSummary.mergeCells("A1:F1");
  const titleCell = wsSummary.getCell("A1");
  titleCell.value = "BÁO CÁO TỔNG HỢP THƯỞNG SI MC & DL";
  titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  wsSummary.getRow(1).height = 32;

  // 2. Section Cấu hình
  wsSummary.mergeCells("A3:E3");
  const s1 = wsSummary.getCell("A3");
  s1.value = "1. THÔNG SỐ CẤU HÌNH & CHỈ TIÊU";
  s1.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFF" } };
  s1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_SECTION_BG } };

  const configRows = [
    ["Từ ngày:", getVal("fromDate"), "Chỉ tiêu DL (VNĐ):", getNum("chitieuDL")],
    ["Đến ngày:", getVal("toDate"), "Chỉ tiêu MC (VNĐ):", getNum("chitieuMC")],
    ["PR3 (%):", `${getVal("pr3")}%`, "Chỉ tiêu Tổng (VNĐ):", getNum("chitieuTong")],
    ["PR6 (%):", `${getVal("pr6")}%`, "", ""]
  ];

  configRows.forEach((rowData, idx) => {
    const row = wsSummary.getRow(4 + idx);
    row.values = [rowData[0], rowData[1], rowData[2], rowData[3]];
    [1, 3].forEach(colIdx => {
      const cell = row.getCell(colIdx);
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2E8F0" } };
    });
    if (idx < 3 && rowData[3]) row.getCell(4).numFmt = '#,##0" đ"';
    for (let c = 1; c <= 4; c++) row.getCell(c).border = borderThin;
  });

  // 3. Section Bảng Tổng Hợp Thưởng Chung
  wsSummary.mergeCells("A9:F9");
  const s2 = wsSummary.getCell("A9");
  s2.value = "2. TỔNG HỢP KẾT QUẢ THƯỞNG SI CHUNG";
  s2.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFF" } };
  s2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_SECTION_BG } };

  const sumHeaders = ["Khoản Mục", "Block A (Thưởng DS)", "Block B (Thưởng CT)", "Block C (Hệ Số)", "Block D (Thưởng BH)", "TỔNG THƯỞNG SI"];
  const hRow = wsSummary.getRow(10);
  hRow.values = sumHeaders;
  hRow.height = 24;

  sumHeaders.forEach((_, idx) => {
    const cell = hRow.getCell(idx + 1);
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderThin;
  });

  // Dòng MC
  const rowMc = wsSummary.getRow(11);
  rowMc.values = [
    "Thưởng SI MC",
    getNumFromText("blockAMc"),
    getNumFromText("blockBMc"),
    parseFloat(document.getElementById("blockCMc")?.innerText || "0"),
    getNumFromText("blockDMc"),
    getNumFromText("totalSIBountyMc")
  ];

  // Dòng DL
  const rowDl = wsSummary.getRow(12);
  rowDl.values = [
    "Thưởng SI DL",
    getNumFromText("blockADl"),
    getNumFromText("blockBDl"),
    parseFloat(document.getElementById("blockCDl")?.innerText || "0"),
    getNumFromText("blockDDl"),
    getNumFromText("totalSIBountyDl")
  ];

  [rowMc, rowDl].forEach(row => {
    row.getCell(1).font = { bold: true };
    [2, 3, 5, 6].forEach(col => row.getCell(col).numFmt = '#,##0" đ"');
    row.getCell(4).numFmt = '0.00';
    for (let c = 1; c <= 6; c++) {
      row.getCell(c).border = borderThin;
      row.getCell(c).alignment = { horizontal: c === 1 ? "left" : "right" };
    }
  });

  // Dòng TỔNG CHUNG (MC + DL)
  const rowTotalAll = wsSummary.getRow(13);
  wsSummary.mergeCells("A13:E13");
  rowTotalAll.getCell(1).value = "TỔNG THƯỞNG SI CHUNG (MC + DL):";
  rowTotalAll.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  rowTotalAll.getCell(6).value = { formula: "F11+F12" };
  rowTotalAll.getCell(6).numFmt = '#,##0" đ"';

  for (let c = 1; c <= 6; c++) {
    const cell = rowTotalAll.getCell(c);
    cell.font = { bold: true, size: 12, color: { argb: "92400E" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL_BG } };
    cell.border = { top: { style: "medium" }, bottom: { style: "double" } };
  }

  wsSummary.columns = [
    { width: 32 }, { width: 22 }, { width: 22 }, { width: 16 }, { width: 22 }, { width: 26 }
  ];

  // ==========================================
  // HÀM BỔ TRỢ TẠO SHEET CHI TIẾT HỢP ĐỒNG
  // ==========================================
  function createContractSheet(sheetTitle, contractList, themeColor) {
    const ws = workbook.addWorksheet(sheetTitle, { views: [{ showGridLines: true }] });

    ws.mergeCells("A1:G1");
    const tCell = ws.getCell("A1");
    tCell.value = `CHI TIẾT HỢP ĐỒNG - ${sheetTitle.toUpperCase()}`;
    tCell.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFF" } };
    tCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: themeColor } };
    tCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 28;

    const headers = ["Mã HĐ", "Kỳ Hạn", "DS Giải Ngân", "Group", "Hệ Số (%)", "Thưởng Doanh Số", "Thưởng Bảo Hiểm"];
    const headerRow = ws.getRow(3);
    headerRow.values = headers;
    headerRow.height = 24;

    headers.forEach((_, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderThin;
    });

    let startRow = 4;
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

      const isEven = index % 2 === 0;
      for (let c = 1; c <= 7; c++) {
        const cell = row.getCell(c);
        cell.border = borderThin;
        if (!isEven) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA_BG } };
      }

      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(2).alignment = { horizontal: "center" };
      row.getCell(3).numFmt = '#,##0" đ"';
      row.getCell(4).alignment = { horizontal: "center" };
      row.getCell(5).numFmt = '0.0%';
      row.getCell(6).numFmt = '#,##0" đ"';
      row.getCell(7).numFmt = '#,##0" đ"';
    });

    const totRowIdx = startRow + contractList.length;
    const totRow = ws.getRow(totRowIdx);

    ws.mergeCells(`A${totRowIdx}:B${totRowIdx}`);
    totRow.getCell(1).value = "Tổng cộng:";
    totRow.getCell(1).alignment = { horizontal: "right" };

    if (contractList.length > 0) {
      const lastDataRow = totRowIdx - 1;
      totRow.getCell(3).value = { formula: `SUM(C4:C${lastDataRow})` };
      totRow.getCell(6).value = { formula: `SUM(F4:F${lastDataRow})` };
      totRow.getCell(7).value = { formula: `SUM(G4:G${lastDataRow})` };
    } else {
      totRow.getCell(3).value = 0;
      totRow.getCell(6).value = 0;
      totRow.getCell(7).value = 0;
    }

    [3, 6, 7].forEach(c => totRow.getCell(c).numFmt = '#,##0" đ"');

    for (let c = 1; c <= 7; c++) {
      const cell = totRow.getCell(c);
      cell.font = { bold: true };
      cell.border = { top: { style: "medium" }, bottom: { style: "double" } };
    }

    ws.columns = [
      { width: 20 }, { width: 14 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 22 }, { width: 22 }
    ];
  }

  // 4. Tạo Sheet Chi tiết MC & DL
  createContractSheet("Chi Tiet MC", contractsMc, "312E81"); // Indigo Dark
  createContractSheet("Chi Tiet DL", contractsDl, "064E3B"); // Emerald Dark

  // 5. Tải File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Bao_Cao_Tong_Hop_SI_MC_DL_${getVal("fromDate")}_den_${getVal("toDate")}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}