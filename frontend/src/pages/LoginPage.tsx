import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, LogIn, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
import { authApi } from '../api/client'

export default function LoginPage() {
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
      if (data.role === 'admin') {
        setError('Tài khoản admin vui lòng đăng nhập tại trang quản trị.')
        return
      }
      localStorage.setItem('token', data.token)
      nav('/dashboard')
    } catch {
      setError('Sai tên đăng nhập hoặc mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 sm:p-10 border border-gray-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tùng Dương Tea</h1>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">Đăng nhập tài khoản đại lý</p>
        </div>

        {/* Admin link */}
        <Link
          to="/admin/login"
          className="flex items-center justify-center gap-2 w-full text-sm text-violet-600 hover:text-violet-700 font-semibold border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 px-4 py-2.5 rounded-xl transition-all mb-6 group"
        >
          <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Đăng nhập với tư cách Quản trị viên
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Tên đăng nhập
            </label>
            <input
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
              placeholder="Nhập tên đăng nhập"
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
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
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
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
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
          <p className="text-sm text-gray-500">
            Liên hệ quản trị viên để được cấp tài khoản
          </p>
        </div>
      </div>
    </div>
  )
}
