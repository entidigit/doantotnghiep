import { useEffect, useState } from 'react'
import {
  Users, Trash2, RefreshCw, MapPin, Leaf, Calendar,
  Shield, ShieldCheck, AlertTriangle, Plus, X, Eye, EyeOff,
} from 'lucide-react'
import AdminLayout from '../components/AdminLayout'
import { adminApi, type Agent } from '../api/client'
import Toast, { ToastType } from '../components/Toast'

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Agent | null>(null)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  // Create form state
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ username: '', password: '', fullName: '', farmName: '', location: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type })
  }

  const load = () => {
    setLoading(true)
    adminApi.listUsers().then((r) => setUsers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (user: Agent) => {
    setDeleting(user.id)
    try {
      await adminApi.deleteUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      showToast('Đã xóa người dùng', 'success')
    } catch {
      showToast('Có lỗi xảy ra', 'error')
    } finally {
      setDeleting(null)
      setConfirm(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)
    try {
      const { data } = await adminApi.createAgent(createForm)
      setUsers((prev) => [data, ...prev])
      setShowCreate(false)
      setCreateForm({ username: '', password: '', fullName: '', farmName: '', location: '' })
      showToast('Đã tạo đại lý mới', 'success')
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Tạo tài khoản thất bại.')
    } finally {
      setCreateLoading(false)
    }
  }

  const admins = users.filter((u) => u.role === 'admin').length
  const agents = users.filter((u) => u.role !== 'admin').length

  return (
    <AdminLayout>
      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Quản lý người dùng</h1>
          </div>
          <p className="text-sm text-gray-500">Danh sách toàn bộ tài khoản đã đăng ký</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
        <button onClick={() => { setShowCreate(true); setCreateError('') }} className="btn-primary">
          <Plus className="w-4 h-4" /> Tạo tài khoản đại lý
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng tài khoản', value: users.length, icon: <Users className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Đại lý', value: agents, icon: <Leaf className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'Quản trị viên', value: admins, icon: <ShieldCheck className="w-4 h-4 text-violet-500" />, bg: 'bg-violet-50', text: 'text-violet-700' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <div className={`text-xl font-extrabold ${s.text}`}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-56" />
                </div>
                <div className="h-6 w-16 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">Chưa có tài khoản nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${u.role === 'admin' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {(u.fullName || u.username).charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {u.fullName || u.username}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.role === 'admin' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {u.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <Leaf className="w-2.5 h-2.5" />}
                      {u.role === 'admin' ? 'Admin' : 'Đại lý'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">@{u.username}</span>
                    {u.farmName && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Leaf className="w-3 h-3 text-emerald-400" />{u.farmName}
                      </span>
                    )}
                    {u.location && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-gray-300" />{u.location}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3 text-gray-300" />{fmt(u.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {u.role !== 'admin' && (
                  <button
                    onClick={() => setConfirm(u)}
                    disabled={deleting === u.id}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-all"
                    title="Xóa tài khoản"
                  >
                    {deleting === u.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                    Xóa
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">Tạo tài khoản đại lý</h3>
                <p className="text-xs text-gray-400 mt-0.5">Đại lý sẽ dùng tên đăng nhập này để vào hệ thống</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tên đăng nhập *</label>
                  <input
                    autoFocus
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="vd: dailyA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu *</label>
                  <div className="relative">
                    <input
                      required
                      type={showPwd ? 'text' : 'password'}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên trang trại / cơ sở *</label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                  value={createForm.farmName}
                  onChange={(e) => setCreateForm({ ...createForm, farmName: e.target.value })}
                  placeholder="HTX Chè Thái Nguyên"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  placeholder="Thái Nguyên"
                />
              </div>

              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3.5 py-2.5 rounded-xl">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 btn-ghost justify-center">Hủy</button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-xl font-medium text-sm transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {createLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Xóa tài khoản?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Tài khoản <span className="font-semibold text-gray-800">{confirm.username}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 btn-ghost justify-center">Hủy</button>
              <button
                onClick={() => handleDelete(confirm)}
                disabled={!!deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-medium text-sm transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
