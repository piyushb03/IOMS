import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8000')

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime ?? Date.now())
    if (import.meta.env.DEV) {
      console.debug(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status} (${duration}ms)`)
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred.'

    if (import.meta.env.DEV) {
      console.error(`[API Error] ${status}: ${message}`, error.response?.data)
    }

    // Attach a clean message to the error object for UI consumption
    error.userMessage = message
    error.statusCode = status
    return Promise.reject(error)
  },
)

export default apiClient
