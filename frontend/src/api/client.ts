import axios from 'axios'

const api = axios.create({ baseURL: '/' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // Chỉ redirect về login nếu không phải public routes
      const publicPaths = ['/', '/shop', '/verify']
      const currentPath = window.location.pathname
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path))
      
      localStorage.removeItem('token')
      
      // Không redirect nếu đang ở trang public
      if (!isPublicPath && !currentPath.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Agent {
  id: string
  username: string
  fullName: string
  farmName: string
  location: string
  bankName?: string
  bankAccount?: string
  bankOwner?: string
  role: 'agent' | 'admin'
  createdAt: string
}

export interface TeaBatch {
  id: string
  batchId: string
  agentId: string
  farmName: string
  teaType: string
  weightGram: number
  quantity: number
  status: 'growing' | 'processing' | 'packaged'
  batchHash: string
  txHash: string
  qrCode: string
  verifyUrl: string
  createdAt: string
  finalizedAt: string | null
}

export interface TeaPackage {
  id: string
  batchId: string
  packageIdx: number
  packageHash: string
  verifyUrl: string
  qrCode: string
  createdAt: string
}

export interface Event {
  id: string
  batchId: string
  stage: string
  description: string
  images: string[]
  location: string
  recordedBy: string
  eventHash: string
  txHash: string
  timestamp: string
  createdAt: string
}

export interface VerifyData {
  batch: TeaBatch
  agent: Agent
  events: Event[]
  blockchain: {
    batchHash: string
    txHash: string
    verifyUrl: string
  }
  package?: {
    packageIdx: number
    total: number
    packageHash: string
    verifyUrl: string
  }
  buyer?: {
    name: string
    phone: string
    address: string
    purchaseAt: string
    txHash: string
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    username: string
    password: string
    fullName: string
    farmName: string
    location: string
  }) => api.post('/api/auth/register', data),

  login: (data: { username: string; password: string }) =>
    api.post<{ token: string; agentId: string; username: string; farmName: string; role: string }>(
      '/api/auth/login',
      data
    ),

  me: () => api.get<Agent>('/api/auth/me'),

  updateProfile: (data: Partial<{
    fullName: string
    farmName: string
    location: string
    bankName: string
    bankAccount: string
    bankOwner: string
  }>) => api.patch<Agent>('/api/auth/profile', data),
}

// ── Batches ───────────────────────────────────────────────────────────────────

export const batchApi = {
  list: () => api.get<TeaBatch[]>('/api/batches'),

  create: (data: { teaType: string; weightGram: number; farmName: string }) =>
    api.post<TeaBatch>('/api/batches', data),

  get: (id: string) =>
    api.get<{ batch: TeaBatch; events: Event[] }>(`/api/batches/${id}`),

  finalize: (id: string, quantity: number) =>
    api.post<{ message: string; batchHash: string; txHash: string; verifyUrl: string; qrCode: string; quantity: number; packages: TeaPackage[] }>(
      `/api/batches/${id}/finalize`,
      { quantity }
    ),

  listPackages: (id: string) =>
    api.get<TeaPackage[]>(`/api/batches/${id}/packages`),
}

// ── Events ────────────────────────────────────────────────────────────────────

export const eventApi = {
  create: (batchId: string, form: FormData) =>
    api.post<Event>(`/api/batches/${batchId}/events`, form),
}

// ── Verify (public) ───────────────────────────────────────────────────────────

export const verifyApi = {
  get: (hash: string) => api.get<VerifyData>(`/api/verify/${hash}`),
}

// ── Listings ──────────────────────────────────────────────────────────────────

export interface Listing {
  id: string
  batchId: string
  agentId: string
  agentName: string
  farmName: string
  location: string
  teaType: string
  weightGram: number
  quantityAvailable: number
  price: number          // VND / gói
  description: string
  contact: string
  bankName?: string      // Tên ngân hàng
  bankAccount?: string   // Số tài khoản
  bankOwner?: string     // Chủ tài khoản
  verifyUrl: string
  status: 'active' | 'closed' | 'sold'
  createdAt: string
  updatedAt: string
}

export const listingApi = {
  list: () => api.get<Listing[]>('/api/listings'),
  mine: () => api.get<Listing[]>('/api/listings/mine'),
  get: (id: string) => api.get<Listing>(`/api/listings/${id}`),
  create: (data: {
    batchId: string
    price: number
    quantityAvailable: number
    description: string
    contact: string
    bankName?: string
    bankAccount?: string
    bankOwner?: string
  }) => api.post<Listing>('/api/listings', data),
  update: (id: string, data: Partial<{
    price: number
    quantityAvailable: number
    description: string
    contact: string
    bankName: string
    bankAccount: string
    bankOwner: string
    status: 'active' | 'closed' | 'sold'
  }>) => api.patch<Listing>(`/api/listings/${id}`, data),
  delete: (id: string) => api.delete(`/api/listings/${id}`),
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface Order {
  id: string
  listingId: string
  agentId: string
  packageHash: string
  buyerName: string
  buyerPhone: string
  buyerAddress: string
  buyerEmail: string
  quantity: number
  totalPrice: number
  paymentImage: string
  status: 'pending' | 'paid' | 'confirmed' | 'rejected'
  buyerTxHash: string
  createdAt: string
  updatedAt: string
}

export interface OrderResult extends Order {
  teaType: string
  farmName: string
  weightGram: number
  verifyUrl: string
}

export const orderApi = {
  create: (data: {
    listingId: string
    packageHash: string
    buyerName: string
    buyerPhone: string
    buyerAddress: string
    buyerEmail: string
    quantity: number
  }) => api.post<Order>('/api/orders', data),
  
  uploadPayment: (orderId: string, file: File) => {
    const formData = new FormData()
    formData.append('paymentImage', file)
    return api.post<Order>(`/api/orders/${orderId}/payment`, formData)
  },
  
  get: (orderId: string) => api.get<Order>(`/api/orders/${orderId}`),
  
  listForAgent: () => api.get<Order[]>('/api/orders/agent'),
  
  confirm: (orderId: string) => api.post<Order>(`/api/orders/${orderId}/confirm`),
  
  reject: (orderId: string) => api.post<Order>(`/api/orders/${orderId}/reject`),
  
  // Tra cứu đơn hàng đã xác nhận theo SĐT người mua
  searchByPhone: (phone: string) =>
    api.get<OrderResult[]>(`/api/orders/by-phone?phone=${encodeURIComponent(phone)}`),
  
  // Lấy danh sách packageHash đã được bán (confirmed orders)
  getSoldPackages: (batchId: string) => 
    api.get<string[]>(`/api/orders/sold-packages/${batchId}`),
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export interface AdminBatch extends TeaBatch {
  agentName: string
  agentFarm: string
}

export const adminApi = {
  listUsers: () => api.get<Agent[]>('/api/admin/users'),
  createAgent: (data: { username: string; password: string; fullName: string; farmName: string; location: string }) =>
    api.post<Agent>('/api/admin/users', data),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),
  listBatches: () => api.get<AdminBatch[]>('/api/admin/batches'),
}
