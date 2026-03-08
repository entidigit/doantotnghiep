import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Trash2, RefreshCw, MapPin, Leaf, Calendar,
  Shield, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import AdminLayout from '../components/AdminLayout'
import { adminApi, type Agent } from '../api/client'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Agent | null>(null)

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
    } finally {
      setDeleting(null)
      setConfirm(null)
    }
  }

  const admins = users.filter((u) => u.role === 'admin').length
  const agents = users.filter((u) => u.role !== 'admin').length

  return (
    <AdminLayout>
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

      {/* Confirm modal */}
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
