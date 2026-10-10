import {
  fetchContractDetailApi,
  fetchContractsApi
} from './getApi.js'

// ==========================================
// HÀM 1: Lấy danh sách mã hợp đồng (numbers)
// ==========================================
export const getContractNumbers = async (fromDate, toDate, statusCodes) => {
  try {
    const data = await fetchContractsApi(fromDate, toDate, statusCodes)

    const arr =
      data && (data.content || data.contracts)
        ? data.content || data.contracts
        : Array.isArray(data)
        ? data
        : []

    // Trả về mảng chứa danh sách các number
    return arr.map(item => item.number).filter(num => num !== undefined)
  } catch (err) {
    console.warn('API load contract numbers failed:', err)
    return []
  }
}

// ==========================================
// HÀM 2: Nhận danh sách numbers -> Lấy chi tiết
// ==========================================
export const getContractDetailsByNumbers = async (numbers = []) => {
  if (!numbers.length) return []

  try {
    // Gọi API lấy chi tiết tất cả hợp đồng song song bằng Promise.all
    const detailsPromises = numbers.map(number =>
      fetchContractDetailApi(number)
    )
    const contractDetails = await Promise.all(detailsPromises)

    // Map lại cấu trúc dữ liệu an toàn với Optional Chaining (?.)
    const data = contractDetails
      .filter(Boolean) // Loại bỏ các item bị null/undefined nếu API chi tiết lỗi
      .map(d => ({
        contractNo: d.number ?? null,
        schemeName: d.submittedPosScheme?.schemeName ?? null,
        schemeCode: d.submittedPosScheme?.schemeCode ?? null,
        tenure: d.tenorInMonths ?? 0,
        dsgn: d.financedAmount ?? 0,
        Li: d.submittedPosScheme?.schemeLiCode ? 'YES' : 'NO'
      }))

    return data
  } catch (err) {
    console.warn('API load contract details failed:', err)
    return []
  }
}
