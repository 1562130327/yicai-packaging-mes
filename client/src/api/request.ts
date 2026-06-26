const BASE_URL = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })

  // 401 未授权：跳转登录页
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('登录已过期，请重新登录')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }

  return response.json()
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data: any) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data: any) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}
