import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader2, LogIn, ArrowLeft } from 'lucide-react'
import { authApi } from '../api/client'

export default function AdminLoginPage() {
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      if (data.role !== 'admin') {
        setError('Tài khoản này không có quyền quản trị.')
        return
      }
      localStorage.setItem('token', data.token)
      nav('/admin/users')
    } catch {
      setError('Sai tên đăng nhập hoặc mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-purple-400/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 sm:p-10 border border-gray-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tùng Dương Tea</h1>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">Đăng nhập quản trị viên</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Tên đăng nhập
            </label>
            <input
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
              placeholder="Nhập tên đăng nhập admin"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl font-medium">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-700 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-60 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-semibold transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Đăng nhập với tư cách đại lý
          </a>
        </div>
      </div>
    </div>
  )
}
