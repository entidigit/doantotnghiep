import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Building2, MapPin, Save, Loader2, CheckCircle2, AlertCircle, ArrowLeft, CreditCard, Wallet
} from 'lucide-react'
import Layout from '../components/Layout'
import { authApi, listingApi, Agent } from '../api/client'
import Toast, { ToastType } from '../components/Toast'

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  const [fullName, setFullName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [location, setLocation] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankOwner, setBankOwner] = useState('')

  useEffect(() => {
    authApi.me().then(r => {
      setAgent(r.data)
      setFullName(r.data.fullName || '')
      setFarmName(r.data.farmName || '')
      setLocation(r.data.location || '')
      setBankName(r.data.bankName || '')
      setBankAccount(r.data.bankAccount || '')
      setBankOwner(r.data.bankOwner || '')
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName.trim()) {
      showToast('Vui lòng nhập họ tên', 'error')
      return
    }

    setSubmitting(true)
    try {
      // Update profile
      const updated = await authApi.updateProfile({
        fullName: fullName.trim(),
        farmName: farmName.trim(),
        location: location.trim(),
        bankName: bankName.trim() || undefined,
        bankAccount: bankAccount.trim() || undefined,
        bankOwner: bankOwner.trim() || undefined,
      })
      setAgent(updated.data)
      
      // Auto-sync bank info to all listings
      if (bankName.trim() || bankAccount.trim() || bankOwner.trim()) {
        try {
          const listings = await listingApi.mine()
          const updates = listings.data.map(listing => 
            listingApi.update(listing.id, {
              bankName: bankName.trim() || undefined,
              bankAccount: bankAccount.trim() || undefined,
              bankOwner: bankOwner.trim() || undefined,
            })
          )
          await Promise.all(updates)
        } catch (err) {
          console.error('Failed to sync listings:', err)
        }
      }
      
      showToast('Cập nhật thông tin thành công!', 'success')
      
      // Reload to update navbar
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Có lỗi xảy ra', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Dashboard
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Thông tin cá nhân</h1>
              <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin đại lý của bạn</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account info (read-only) */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-black text-gray-900">Thông tin tài khoản</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Tên đăng nhập
                </label>
                <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 font-mono">
                  {agent?.username}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Vai trò
                </label>
                <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                    agent?.role === 'admin' 
                      ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {agent?.role === 'admin' ? '👑 Admin' : '🌱 Đại lý'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Editable info */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Thông tin cá nhân</h2>
                  <p className="text-xs text-emerald-100 font-medium">Có thể chỉnh sửa</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Tên trang trại / Cơ sở
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  placeholder="VD: Trang trại chè Tùng Dương"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="VD: Thái Nguyên, Việt Nam"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Thông tin này sẽ hiển thị trên các lô chè và sản phẩm của bạn. Hãy đảm bảo thông tin chính xác.
                </p>
              </div>
            </div>
          </div>

          {/* Bank info section */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Thông tin ngân hàng</h2>
                  <p className="text-xs text-blue-100 font-medium">Để khách hàng có thể chuyển khoản (tuỳ chọn)</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Tên ngân hàng
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="VD: Vietcombank, Techcombank..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Số tài khoản
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  placeholder="VD: 1234567890"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all font-mono"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Chủ tài khoản
                </label>
                <input
                  type="text"
                  value={bankOwner}
                  onChange={e => setBankOwner(e.target.value)}
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all uppercase"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold mb-1">Tự động đồng bộ:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Khi bạn lưu thông tin ngân hàng, hệ thống sẽ tự động cập nhật cho TẤT CẢ sản phẩm của bạn</li>
                    <li>Khách hàng sẽ thấy thông tin mới nhất khi thanh toán</li>
                    <li>Không cần cập nhật từng sản phẩm một</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-4 rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
