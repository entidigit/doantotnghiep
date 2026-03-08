import { useEffect, useState } from 'react'
import {
  Package, RefreshCw, Scale, Calendar, Leaf, ExternalLink,
  ChevronDown, ChevronUp, Sprout, Clock, CheckCircle2,
} from 'lucide-react'
import AdminLayout from '../components/AdminLayout'
import { adminApi, type AdminBatch } from '../api/client'

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  growing:    { label: 'Đang trồng',  cls: 'bg-emerald-100 text-emerald-700', icon: <Sprout className="w-3 h-3" /> },
  processing: { label: 'Chế biến',    cls: 'bg-amber-100 text-amber-700',     icon: <Clock className="w-3 h-3" /> },
  packaged:   { label: 'Đóng gói',    cls: 'bg-teal-100 text-teal-700',       icon: <CheckCircle2 className="w-3 h-3" /> },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type SortKey = 'createdAt' | 'agentFarm' | 'teaType' | 'status' | 'weightGram'

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<AdminBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'growing' | 'processing' | 'packaged'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' })

  const load = () => {
    setLoading(true)
    adminApi.listBatches().then((r) => setBatches(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const packaged    = batches.filter((b) => b.status === 'packaged').length
  const processing  = batches.filter((b) => b.status === 'processing').length
  const growing     = batches.filter((b) => b.status === 'growing').length
  const totalWeight = batches.reduce((s, b) => s + b.weightGram, 0)

  const toggleSort = (key: SortKey) => {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort.key !== k) return null
    return sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />
  }

  const filtered = batches
    .filter((b) => filter === 'all' || b.status === filter)
    .filter((b) => {
      const q = search.toLowerCase()
      return !q || b.teaType.toLowerCase().includes(q) || b.agentFarm.toLowerCase().includes(q) || b.agentName.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      let av: string | number = a[sort.key as keyof AdminBatch] as string | number
      let bv: string | number = b[sort.key as keyof AdminBatch] as string | number
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-teal-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Tất cả lô chè</h1>
          </div>
          <p className="text-sm text-gray-500">Xem toàn bộ lô chè của tất cả đại lý</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng lô chè', value: batches.length, cls: 'text-blue-700', bg: 'bg-blue-50', icon: <Package className="w-4 h-4 text-blue-500" /> },
          { label: 'Đang trồng',  value: growing,         cls: 'text-emerald-700', bg: 'bg-emerald-50', icon: <Sprout className="w-4 h-4 text-emerald-500" /> },
          { label: 'Chế biến',    value: processing,      cls: 'text-amber-700', bg: 'bg-amber-50', icon: <Clock className="w-4 h-4 text-amber-500" /> },
          { label: 'Đóng gói',    value: packaged,        cls: 'text-teal-700', bg: 'bg-teal-50', icon: <CheckCircle2 className="w-4 h-4 text-teal-500" /> },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <div className={`text-xl font-extrabold ${s.cls}`}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Total weight */}
      {batches.length > 0 && (
        <div className="card p-4 mb-5 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-teal-600/20">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Tổng sản lượng hệ thống</div>
              <div className="text-xl font-extrabold text-teal-800">
                {(totalWeight / 1000).toFixed(1)} kg
                <span className="text-sm font-normal text-teal-600 ml-1.5">({totalWeight.toLocaleString()}g)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'growing', 'processing', 'packaged'] as const).map((key) => {
            const labels = { all: 'Tất cả', growing: 'Đang trồng', processing: 'Chế biến', packaged: 'Đóng gói' }
            const counts = { all: batches.length, growing, processing, packaged }
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all border ${filter === key
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {labels[key]}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>
        <input
          className="ml-auto border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent w-full sm:w-60"
          placeholder="Tìm theo tên chè, trang trại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-64" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">Không có lô chè nào</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_80px_100px_44px] gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              <button onClick={() => toggleSort('teaType')} className="text-left hover:text-gray-600 transition-colors">Loại chè <SortIcon k="teaType" /></button>
              <button onClick={() => toggleSort('agentFarm')} className="text-left hover:text-gray-600 transition-colors">Đại lý / Trang trại <SortIcon k="agentFarm" /></button>
              <button onClick={() => toggleSort('status')} className="text-left hover:text-gray-600 transition-colors">Trạng thái <SortIcon k="status" /></button>
              <button onClick={() => toggleSort('weightGram')} className="text-right hover:text-gray-600 transition-colors">KL (g) <SortIcon k="weightGram" /></button>
              <button onClick={() => toggleSort('createdAt')} className="text-left hover:text-gray-600 transition-colors">Ngày tạo <SortIcon k="createdAt" /></button>
              <div />
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map((b) => {
                const s = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.growing
                return (
                  <div key={b.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_80px_100px_44px] gap-2 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    {/* Tea type */}
                    <div>
                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {b.teaType || '—'}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-mono truncate">{b.batchId.slice(0, 16)}…</div>
                    </div>

                    {/* Agent */}
                    <div>
                      <div className="text-sm text-gray-700 font-medium truncate">{b.agentFarm || b.agentName || '—'}</div>
                      {b.agentName && <div className="text-xs text-gray-400">{b.agentName}</div>}
                    </div>

                    {/* Status badge */}
                    <div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${s.cls}`}>
                        {s.icon} {s.label}
                      </span>
                    </div>

                    {/* Weight */}
                    <div className="text-sm font-bold text-gray-700 text-right md:text-right">
                      {b.weightGram.toLocaleString()}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {fmt(b.createdAt)}
                    </div>

                    {/* Blockchain link */}
                    <div className="flex justify-end">
                      {b.verifyUrl && (
                        <a
                          href={b.verifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Xem trên blockchain"
                          className="text-teal-500 hover:text-teal-700 p-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
