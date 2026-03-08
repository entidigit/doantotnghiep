import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Layout from '../components/Layout'
import { batchApi } from '../api/client'

export default function CreateBatchPage() {
  const nav = useNavigate()
  const [form, setForm] = useState({ teaType: '', farmName: '', weightGram: 100 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await batchApi.create(form)
      nav(`/batches/${data.batchId}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Tạo lô thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </Link>

      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tạo lô chè mới</h1>
        <p className="text-gray-500 text-sm mb-6">
          Mỗi lô sẽ có mã định danh riêng và được theo dõi từ trồng đến đóng gói.
        </p>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Loại chè *
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-transparent transition"
                placeholder="VD: Trà xanh Thái Nguyên, Trà ô long..."
                value={form.teaType}
                onChange={(e) => setForm({ ...form, teaType: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên trang trại / cơ sở *
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-transparent transition"
                placeholder="VD: Trang trại Thái Nguyên"
                value={form.farmName}
                onChange={(e) => setForm({ ...form, farmName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Khối lượng gói (gram) *
              </label>
              <input
                required
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-transparent transition"
                value={form.weightGram}
                onChange={(e) => setForm({ ...form, weightGram: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-400 mt-1">Khối lượng của mỗi gói thành phẩm.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tea-700 hover:bg-tea-800 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-60"
            >
              {loading ? 'Đang tạo...' : 'Tạo lô chè'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
