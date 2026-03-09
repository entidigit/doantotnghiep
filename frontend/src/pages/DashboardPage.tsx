import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Package, CheckCircle2, Clock, RefreshCw,
  Activity, ArrowRight, Sprout, TrendingUp, Leaf,
  BarChart3, Calendar, Weight
} from 'lucide-react'
import Layout from '../components/Layout'
import { batchApi, type TeaBatch } from '../api/client'
import { useAuth } from '../hooks/useAuth'

const STATUS_CONFIG: Record<TeaBatch['status'], {
  label: string; badgeClass: string; icon: React.ReactNode; dot: string; gradient: string
}> = {
  growing: {
    label: 'Đang trồng',
    badgeClass: 'badge-growing',
    icon: <Sprout className="w-3.5 h-3.5" />,
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-600'
  },
  processing: {
    label: 'Chế biến',
    badgeClass: 'badge-processing',
    icon: <Clock className="w-3.5 h-3.5" />,
    dot: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-600'
  },
  packaged: {
    label: 'Đã đóng gói',
    badgeClass: 'badge-packaged',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    dot: 'bg-teal-500',
    gradient: 'from-teal-500 to-cyan-600'
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
      className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Colored header bar */}
      <div className={`h-2 bg-gradient-to-r ${s.gradient}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight text-lg mb-1">
              {b.teaType || 'Lô chè'}
            </h3>
            {b.farmName && (
              <p className="text-sm text-gray-500 font-medium truncate">{b.farmName}</p>
            )}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${s.badgeClass} shadow-sm`}>
            {s.icon}
            <span className="text-xs font-bold">{s.label}</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl px-3 py-2.5 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Weight className="w-3.5 h-3.5 text-gray-400" />
              <div className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Khối lượng</div>
            </div>
            <div className="text-base font-black text-gray-900">{b.weightGram}g</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl px-3 py-2.5 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <div className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Ngày tạo</div>
            </div>
            <div className="text-sm font-bold text-gray-900">{fmt(b.createdAt)}</div>
          </div>
        </div>

        {/* Blockchain info */}
        {b.status === 'packaged' && b.batchHash && (
          <div className="flex items-center gap-2 text-[10px] font-mono text-teal-700 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl px-3 py-2 mb-3">
            <div className="w-2 h-2 bg-teal-500 rounded-full shrink-0 animate-pulse" />
            <span className="truncate font-bold">{b.batchHash.slice(0, 32)}...</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${s.dot} animate-pulse`} />
            <span className="text-xs text-gray-500 font-semibold">#{b.batchId.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm group-hover:gap-2 transition-all">
            <span>Xem chi tiết</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
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
      {/* Hero header with gradient */}
      <div className="mb-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-8 border-2 border-emerald-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-full px-4 py-1.5 mb-3 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs text-emerald-700 font-bold">{greeting}</p>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              {agent?.farmName || agent?.username || 'Đại lý'}
            </h1>
            <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              Quản lý toàn bộ lô chè từ trồng đến đóng gói
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-105 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <Link 
              to="/batches/new" 
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/30"
            >
              <Plus className="w-5 h-5" />
              Tạo lô chè
            </Link>
          </div>
        </div>
      </div>

      {/* Stats cards with gradients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: 'Tổng lô chè', 
            value: batches.length, 
            icon: BarChart3,
            gradient: 'from-blue-500 to-indigo-600',
            bg: 'from-blue-50 to-indigo-50',
            border: 'border-blue-200'
          },
          { 
            label: 'Đang trồng', 
            value: growing, 
            icon: Sprout,
            gradient: 'from-emerald-500 to-teal-600',
            bg: 'from-emerald-50 to-teal-50',
            border: 'border-emerald-200'
          },
          { 
            label: 'Chế biến', 
            value: processing, 
            icon: Activity,
            gradient: 'from-amber-500 to-orange-600',
            bg: 'from-amber-50 to-orange-50',
            border: 'border-amber-200'
          },
          { 
            label: 'Đã đóng gói', 
            value: packaged, 
            icon: CheckCircle2,
            gradient: 'from-teal-500 to-cyan-600',
            bg: 'from-teal-50 to-cyan-50',
            border: 'border-teal-200'
          },
        ].map((s) => (
          <div 
            key={s.label} 
            className={`bg-gradient-to-br ${s.bg} border-2 ${s.border} rounded-2xl p-5 animate-fade-in hover:scale-105 transition-transform duration-300 shadow-sm`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-4xl font-black text-gray-900 mb-1">{s.value}</div>
            <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Total weight banner */}
      {batches.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-6 mb-8 animate-fade-in shadow-xl shadow-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-white" />
                <p className="text-xs text-emerald-100 uppercase tracking-wide font-bold">Tổng sản lượng</p>
              </div>
              <div className="text-4xl font-black text-white">
                {(totalWeight / 1000).toFixed(1)} kg
              </div>
              <p className="text-sm text-emerald-100 mt-1 font-medium">
                {totalWeight.toLocaleString()} gram từ {batches.length} lô chè
              </p>
            </div>
            <div className="hidden sm:block w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Weight className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {batches.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm">
          <span className="text-sm text-gray-600 font-bold flex items-center gap-2">
            <Package className="w-4 h-4" />
            Lọc theo trạng thái:
          </span>
          {(
            [
              { key: 'all', label: 'Tất cả', count: batches.length, gradient: 'from-gray-600 to-gray-700' },
              { key: 'growing', label: 'Đang trồng', count: growing, gradient: 'from-emerald-500 to-teal-600' },
              { key: 'processing', label: 'Chế biến', count: processing, gradient: 'from-amber-500 to-orange-600' },
              { key: 'packaged', label: 'Đóng gói', count: packaged, gradient: 'from-teal-500 to-cyan-600' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-sm px-4 py-2 rounded-xl font-bold transition-all ${
                filter === tab.key
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === tab.key ? 'bg-white/30' : 'bg-white'
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
