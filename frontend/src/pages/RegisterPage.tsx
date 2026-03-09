import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { authApi } from '../api/client'

const FIELDS = [
  { key: 'username',  label: 'Tên đăng nhập *',         type: 'text',     required: true },
  { key: 'password',  label: 'Mật khẩu *',               type: 'password', required: true },
  { key: 'fullName',  label: 'Họ và tên',                 type: 'text',     required: false },
  { key: 'farmName',  label: 'Tên trang trại / cơ sở *',  type: 'text',     required: true },
  { key: 'location',  label: 'Địa chỉ',                   type: 'text',     required: false },
] as const

type FieldKey = (typeof FIELDS)[number]['key']

export default function RegisterPage() {
  const nav = useNavigate()
  const [form, setForm] = useState<Record<FieldKey, string>>({
    username: '', password: '', fullName: '', farmName: '', location: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register(form)
      const { data } = await authApi.login({ username: form.username, password: form.password })
      localStorage.setItem('token', data.token)
      nav('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng ký thất bại, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tea-800 via-tea-700 to-tea-600 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-tea-100 p-4 rounded-2xl mb-4">
            <Leaf className="w-9 h-9 text-tea-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản đại lý</h1>
          <p className="text-gray-500 text-sm mt-1">Tùng Dương Tea</p>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {FIELDS.map(({ key, label, type, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input
                type={type}
                required={required}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-transparent transition"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tea-700 hover:bg-tea-800 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-60 mt-1"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký & Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-tea-700 font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
