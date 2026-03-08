import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Loader2, Scale, Sprout, ArrowRight } from 'lucide-react'
import Layout from '../components/Layout'
import { batchApi } from '../api/client'

const TEA_TYPES = [
  'Trà xanh Thái Nguyên',
  'Trà ô long',
  'Trà đen',
  'Trà trắng',
  'Trà Shan Tuyết',
  'Trà Pu-erh',
]

export default function CreateBatchPage() {
  const nav = useNavigate()
  const [form, setForm] = useState({
    teaType: '',
    farmName: '',
    weightGram: 100,
    location: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'weightGram' ? Number(e.target.value) : e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await batchApi.create({
        teaType: form.teaType,
        farmName: form.farmName,
        weightGram: form.weightGram,
      })
      nav(`/batches/${data.batchId}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Tạo lô thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4 animate-slide-up">
        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <Sprout className="w-3.5 h-3.5" /> Tạo lô mới
          </div>
          <h1 className="page-title">Tạo lô chè mới</h1>
          <p className="text-sm text-gray-500 mt-2">
            Mỗi lô sẽ có mã định danh riêng và được theo dõi toàn bộ từ trồng đến đóng gói.
          </p>
        </div>

        {/* Form */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            {/* Tea type */}
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                  Loại chè <span className="text-red-400">*</span>
                </span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {TEA_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, teaType: t }))}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${form.teaType === t
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                required
                className="input-field"
                placeholder="Hoặc nhập tên loại chè..."
                value={form.teaType}
                onChange={set('teaType')}
              />
            </div>

            {/* Farm name */}
            <div>
              <label className="label">
                Tên trang trại / cơ sở sản xuất <span className="text-red-400">*</span>
              </label>
              <input
                required
                className="input-field"
                placeholder="VD: Trang trại Thái Nguyên, HTX Chè Mộc Châu..."
                value={form.farmName}
                onChange={set('farmName')}
              />
            </div>

            {/* Weight */}
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-500" />
                  Khối lượng mỗi gói thành phẩm (gram) <span className="text-red-400">*</span>
                </span>
              </label>
              <div className="flex gap-2 mb-2">
                {[50, 100, 200, 500, 1000].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, weightGram: w }))}
                    className={`flex-1 text-xs py-1.5 rounded-lg border font-semibold transition-all ${form.weightGram === w
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    {w}g
                  </button>
                ))}
              </div>
              <input
                required
                type="number"
                min={1}
                className="input-field"
                value={form.weightGram}
                onChange={set('weightGram')}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Đây là khối lượng của mỗi gói chè thành phẩm sau khi đóng gói.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}

            {/* Summary preview */}
            {form.teaType && form.farmName && (
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-4 animate-fade-in">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Xem trước</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><span className="text-gray-400">Loại:</span> <strong>{form.teaType}</strong></div>
                  <div><span className="text-gray-400">Trang trại:</span> <strong>{form.farmName}</strong></div>
                  <div><span className="text-gray-400">Gói:</span> <strong>{form.weightGram}g / gói</strong></div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo lô chè...</>
                : <><ArrowRight className="w-4 h-4" /> Tạo lô chè & Bắt đầu theo dõi</>
              }
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
