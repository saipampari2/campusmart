import Cookies from 'js-cookie'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL
export const apiUrl = path => `${BASE_URL}${path}`

const ACCESS_TOKEN_KEY = 'jwt_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const getAccessToken = () => Cookies.get(ACCESS_TOKEN_KEY)
export const getRefreshToken = () => Cookies.get(REFRESH_TOKEN_KEY)

export const saveTokens = ({access, refresh}) => {
  Cookies.set(ACCESS_TOKEN_KEY, access, {expires: 30})
  if (refresh) Cookies.set(REFRESH_TOKEN_KEY, refresh, {expires: 30})
}

export const clearTokens = () => {
  Cookies.remove(ACCESS_TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
}

const send = (path, options) => {
  const token = getAccessToken()
  const headers = {'Content-Type': 'application/json', ...options.headers}
  if (token !== undefined) {
    headers.Authorization = `Bearer ${token}`
  }
  return fetch(apiUrl(path), {...options, headers})
}

// access token expires in 1 hour, so get a new one using refresh token
const tryRefresh = async () => {
  const refresh = getRefreshToken()
  if (!refresh) return false
  const res = await fetch(apiUrl('/api/users/token/refresh/'), {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({refresh}),
  })
  if (!res.ok) { clearTokens(); return false }
  saveTokens({access: (await res.json()).access})
  return true
}

export const apiFetch = async (path, options = {}) => {
  let res = await send(path, options)
  if (res.status === 401 && getAccessToken() !== undefined && await tryRefresh()) {
    res = await send(path, options)
  }
  return res
}

// login error has detail, register error has field name
export const getErrorMessage = data => {
  if (!data) return 'Something went wrong. Please try again.'
  if (typeof data.detail === 'string') return data.detail
  const key = Object.keys(data)[0]
  if (!key) return 'Something went wrong. Please try again.'
  const v = Array.isArray(data[key]) ? data[key][0] : data[key]
  return `${key}: ${v}`
}
