// getApi.js

// Function đóng / mở Modal Đăng Nhập
export function showLoginModal () {
  const modal = document.getElementById('loginModal')
  if (modal) {
    modal.classList.remove('hidden')
    modal.classList.add('flex')
  }
}

export function hideLoginModal () {
  const modal = document.getElementById('loginModal')
  if (modal) {
    modal.classList.remove('flex')
    modal.classList.add('hidden')
  }
}

// Biến Queue tránh việc mở nhiều Modal nếu gọi nhiều API đồng thời bị 401
let pendingAuthPromise = null

// Xử lý tạm dừng request khi thiếu/hết hạn Token & gọi lại sau khi người dùng đăng nhập thành công
function handleUnauthorized () {
  if (pendingAuthPromise) return pendingAuthPromise

  showLoginModal()

  pendingAuthPromise = new Promise((resolve, reject) => {
    const form = document.getElementById('reLoginForm')
    const errorBox = document.getElementById('loginModalError')
    const closeBtn = document.getElementById('closeModalBtn')

    // Element Toggle Mật khẩu
    const togglePasswordBtn = document.getElementById('toggleModalPassword')
    const passwordInput = document.getElementById('modalPassword')
    const eyeIconClosed = document.getElementById('eyeIconClosed')
    const eyeIconOpen = document.getElementById('eyeIconOpen')

    // Hàm Toggle Show/Hide Password
    const onTogglePassword = () => {
      if (!passwordInput) return
      const isPassword = passwordInput.type === 'password'
      passwordInput.type = isPassword ? 'text' : 'password'

      if (isPassword) {
        eyeIconClosed?.classList.add('hidden')
        eyeIconOpen?.classList.remove('hidden')
      } else {
        eyeIconClosed?.classList.remove('hidden')
        eyeIconOpen?.classList.add('hidden')
      }
    }

    // Gán sự kiện Toggle Password
    togglePasswordBtn?.addEventListener('click', onTogglePassword)

    const cleanup = () => {
      form?.removeEventListener('submit', onSubmit)
      closeBtn?.removeEventListener('click', onCancel)
      togglePasswordBtn?.removeEventListener('click', onTogglePassword)
      pendingAuthPromise = null
    }

    const onCancel = () => {
      cleanup()
      hideLoginModal()
      reject(new Error('Người dùng đã hủy đăng nhập.'))
    }

    const onSubmit = async e => {
      e.preventDefault()
      if (errorBox) errorBox.classList.add('hidden')

      const usernameInput = document.getElementById('modalUsername')?.value
      const passwordValue = passwordInput?.value

      try {
        const res = await fetchLoginApi(usernameInput, passwordValue)

        if (typeof res === 'string' || !res?.accessToken) {
          if (errorBox) {
            errorBox.innerText = res || 'Đăng nhập thất bại!'
            errorBox.classList.remove('hidden')
          }
          return
        }

        // Cập nhật Token và ID mới vào Storage
        localStorage.setItem('authToken', res.accessToken)
        localStorage.setItem('authUser', JSON.stringify(res))
        sessionStorage.setItem('accessToken', res.accessToken)
        sessionStorage.setItem('id', res.id)
        if (res.name) sessionStorage.setItem('name', res.name)

        hideLoginModal()
        cleanup()
        resolve(res.accessToken)
      } catch (err) {
        if (errorBox) {
          errorBox.innerText = 'Có lỗi kết nối, vui lòng thử lại!'
          errorBox.classList.remove('hidden')
        }
      }
    }

    form?.addEventListener('submit', onSubmit)
    closeBtn?.addEventListener('click', onCancel)
  })

  return pendingAuthPromise
}

// Hàm hỗ trợ kiểm tra và đảm bảo luôn có Token hợp lệ trước khi thực hiện Request
async function ensureValidToken () {
  let token = sessionStorage.getItem('accessToken') || localStorage.getItem('authToken')
  const id = sessionStorage.getItem('id') || JSON.parse(localStorage.getItem('authUser') || '{}')?.id

  if (!token || !id) {
    token = await handleUnauthorized()
  }
  return token
}

// 1. API Đăng Nhập
export const fetchLoginApi = async (username, password) => {
  try {
    const res = await fetch('https://hpo.hdsaison.com.vn/hpo/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      return body?.message || body?.error || 'HTTP ' + res.status
    }
    return body
  } catch (error) {
    console.error('Login Error:', error)
    throw error
  }
}

// 2. API Lấy Danh Sách Hợp Đồng
export const fetchContractsApi = async (fromDate, toDate, statusCodes) => {
  let token = await ensureValidToken()
  const id = sessionStorage.getItem('id') || JSON.parse(localStorage.getItem('authUser') || '{}')?.id
  const baseUrl = `https://hpo.hdsaison.com.vn/hpo/api/v1/contracts/usercreated/${id}`

  const queryParams = new URLSearchParams({
    page: 0,
    size: 1000,
    sort: 'created_date,desc',
    statusCodes: statusCodes || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
    contractNumber: ''
  })

  let response = await fetch(`${baseUrl}?${queryParams}`, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
  })

  // Khi Server trả lỗi HTTP 401 (Token hết hạn)
  if (response.status === 401) {
    sessionStorage.removeItem('accessToken')
    const newToken = await handleUnauthorized()
    response = await fetch(`${baseUrl}?${queryParams}`, {
      headers: {
        Authorization: 'Bearer ' + newToken,
        Accept: 'application/json'
      }
    })
  }

  if (!response.ok) {
    throw new Error('HTTP ' + response.status)
  }

  return await response.json()
}

// 3. API Lấy Chi Tiết Hợp Đồng
export const fetchContractDetailApi = async contractNumber => {
  let token = await ensureValidToken()
  const baseUrl = `https://hpo.hdsaison.com.vn/hpo/api/v1/contracts/contractnumber/${contractNumber}`

  let response = await fetch(`${baseUrl}`, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
  })

  if (response.status === 401) {
    sessionStorage.removeItem('accessToken')
    const newToken = await handleUnauthorized()
    response = await fetch(`${baseUrl}`, {
      headers: {
        Authorization: 'Bearer ' + newToken,
        Accept: 'application/json'
      }
    })
  }

  if (!response.ok) {
    throw new Error('HTTP ' + response.status)
  }

  return await response.json()
}
