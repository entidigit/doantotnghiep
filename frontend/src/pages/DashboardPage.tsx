import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package, Leaf, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import { batchApi, type TeaBatch } from '../api/client'

const STATUS: Record<TeaBatch['status'], { label: string; color: string; icon: React.ReactNode }> = {
  growing:    { label: 'Đang trồng',  color: 'bg-green-100 text-green-700 border-green-200',   icon: <Leaf className="w-3.5 h-3.5" /> },
  processing: { label: 'Chế biến',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock className="w-3.5 h-3.5" /> },
  packaged:   { label: 'Đã đóng gói', color: 'bg-tea-100 text-tea-700 border-tea-200',          icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('vi-VN')
}

export default function DashboardPage() {
  const [batches, setBatches] = useState<TeaBatch[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    batchApi.list().then((r) => setBatches(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const packaged = batches.filter((b) => b.status === 'packaged').length
  const active   = batches.length - packaged

  return (
    <Layout>
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lô chè</h1>
          <p className="text-gray-500 text-sm mt-1">
            Theo dõi toàn bộ quá trình từ trồng đến đóng gói
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm px-3 py-2 border rounded-xl hover:bg-gray-50 text-gray-600 transition"
          >
            <RefreshCw className="w-4 h-4" /> Tải lại
          </button>
          <Link
            to="/batches/new"
            className="flex items-center gap-1.5 bg-tea-700 hover:bg-tea-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Tạo lô mới
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Tổng lô', value: batches.length, color: 'text-gray-700' },
          { label: 'Đang sản xuất', value: active, color: 'text-yellow-600' },
          { label: 'Đã đóng gói', value: packaged, color: 'text-tea-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border shadow-sm p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Batch grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 animate-pulse">Đang tải dữ liệu...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Chưa có lô chè nào.</p>
          <Link
            to="/batches/new"
            className="text-tea-700 text-sm font-semibold hover:underline mt-2 inline-block"
          >
            Tạo lô chè đầu tiên →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => {
            const s = STATUS[b.status]
            return (
              <Link
                key={b.id}
                to={`/batches/${b.batchId}`}
                className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md hover:border-tea-300 transition group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-semibold text-gray-900 group-hover:text-tea-700 transition leading-tight">
                    {b.teaType || 'Lô chè'}
                  </h2>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${s.color}`}>
                    {s.icon} {s.label}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-500">
                  {b.farmName && <p>🏡 {b.farmName}</p>}
                  <p>⚖️ {b.weightGram}g &nbsp;|&nbsp; 📅 {fmt(b.createdAt)}</p>
                </div>

                {b.status === 'packaged' && b.batchHash && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-1.5 text-xs text-tea-600 font-mono truncate">
                    🔗 {b.batchHash.slice(0, 24)}...
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
