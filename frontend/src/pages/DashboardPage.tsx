import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Package, CheckCircle2, Clock, RefreshCw,
  Activity, ArrowRight, Sprout,
} from 'lucide-react'
import Layout from '../components/Layout'
import { batchApi, type TeaBatch } from '../api/client'
import { useAuth } from '../hooks/useAuth'

const STATUS_CONFIG: Record<TeaBatch['status'], {
  label: string; badgeClass: string; icon: React.ReactNode; dot: string
}> = {
  growing: {
    label: 'Đang trồng',
    badgeClass: 'badge-growing',
    icon: <Sprout className="w-3 h-3" />,
    dot: 'bg-emerald-400',
  },
  processing: {
    label: 'Chế biến',
    badgeClass: 'badge-processing',
    icon: <Clock className="w-3 h-3" />,
    dot: 'bg-amber-400',
  },
  packaged: {
    label: 'Đã đóng gói',
    badgeClass: 'badge-packaged',
    icon: <CheckCircle2 className="w-3 h-3" />,
    dot: 'bg-teal-400',
  },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function BatchCard({ b }: { b: TeaBatch }) {
  const s = STATUS_CONFIG[b.status]
  return (
    <Link
      to={`/batches/${b.batchId}`}
      className="card card-hover group block p-5 animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight truncate text-base">
            {b.teaType || 'Lô chè'}
          </h3>
          {b.farmName && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{b.farmName}</p>
          )}
        </div>
        <span className={s.badgeClass}>
          {s.icon} {s.label}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Khối lượng</div>
          <div className="text-sm font-bold text-gray-800 mt-0.5">{b.weightGram}g / gói</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Ngày tạo</div>
          <div className="text-sm font-bold text-gray-800 mt-0.5">{fmt(b.createdAt)}</div>
        </div>
      </div>

      {/* Blockchain info */}
      {b.status === 'packaged' && b.batchHash && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-600 bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1.5 truncate">
          <div className="w-1.5 h-1.5 bg-teal-400 rounded-full shrink-0 animate-pulse" />
          {b.batchHash.slice(0, 28)}...
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className="text-xs text-gray-400">Mã: {b.batchId.slice(0, 8)}...</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { agent } = useAuth()
  const [batches, setBatches] = useState<TeaBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | TeaBatch['status']>('all')

  const load = () => {
    setLoading(true)
    batchApi.list().then((r) => setBatches(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const packaged = batches.filter((b) => b.status === 'packaged').length
  const processing = batches.filter((b) => b.status === 'processing').length
  const growing = batches.filter((b) => b.status === 'growing').length
  const totalWeight = batches.reduce((s, b) => s + b.weightGram, 0)

  const filtered = filter === 'all' ? batches : batches.filter((b) => b.status === filter)

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Chào buổi sáng' : greetingHour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <Layout>
      {/* Hero header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="animate-slide-up">
            <p className="text-sm text-gray-400 font-medium">{greeting},</p>
            <h1 className="page-title mt-0.5">
              {agent?.farmName || agent?.username || 'Đại lý'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý toàn bộ lô chè từ trồng đến đóng gói
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={load}
              className="btn-ghost"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <Link to="/batches/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Tạo lô chè
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng lô chè',  value: batches.length, accent: 'text-blue-600',    border: 'border-blue-200'    },
          { label: 'Đang trồng',   value: growing,         accent: 'text-emerald-600', border: 'border-emerald-200' },
          { label: 'Chế biến',     value: processing,      accent: 'text-amber-600',   border: 'border-amber-200'   },
          { label: 'Đã đóng gói',  value: packaged,        accent: 'text-teal-600',    border: 'border-teal-200'    },
        ].map((s) => (
          <div key={s.label} className={`stat-card animate-fade-in border-l-4 ${s.border}`}>
            <div className={`text-3xl font-extrabold ${s.accent}`}>{s.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Total weight banner */}
      {batches.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-emerald-400 animate-fade-in">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Tổng sản lượng</div>
          <div className="text-xl font-extrabold text-emerald-700">
            {(totalWeight / 1000).toFixed(1)} kg
            <span className="text-sm font-normal text-gray-400 ml-1.5">{totalWeight.toLocaleString()}g</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {batches.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-gray-400 font-medium mr-1">Lọc:</span>
          {(
            [
              { key: 'all', label: 'Tất cả', count: batches.length },
              { key: 'growing', label: 'Đang trồng', count: growing },
              { key: 'processing', label: 'Chế biến', count: processing },
              { key: 'packaged', label: 'Đóng gói', count: packaged },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-sm px-3.5 py-1.5 rounded-lg font-medium transition-all border ${filter === tab.key
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Batch list */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded-lg w-1/2 mb-4" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-gray-100 rounded-lg" />
                <div className="h-12 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-20 text-center animate-fade-in">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-semibold">Chưa có lô chè nào</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Tạo lô chè đầu tiên để bắt đầu theo dõi</p>
          <Link to="/batches/new" className="btn-primary mx-auto w-fit">
            <Plus className="w-4 h-4" /> Tạo lô chè mới
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => <BatchCard key={b.id} b={b} />)}
        </div>
      )}
    </Layout>
  )
}
