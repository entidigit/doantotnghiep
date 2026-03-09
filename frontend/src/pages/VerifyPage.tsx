import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ShieldCheck, AlertTriangle, Loader2, Leaf,
  Sprout, Droplets, Scissors, Sun, Settings2, Package,
  MapPin, Clock, ChevronDown, ChevronUp, User, CalendarDays,
  Scale, CheckCircle2, Link2,
} from 'lucide-react'
import { verifyApi, type VerifyData, type Event } from '../api/client'

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES = [
  { value: 'planting',    label: 'Trồng cây',  Icon: Sprout,    color: 'emerald' },
  { value: 'fertilizing', label: 'Bón phân',   Icon: Leaf,      color: 'lime'    },
  { value: 'spraying',    label: 'Phun thuốc', Icon: Droplets,  color: 'blue'    },
  { value: 'harvesting',  label: 'Thu hoạch',  Icon: Scissors,  color: 'green'   },
  { value: 'drying',      label: 'Phơi/Sấy',   Icon: Sun,       color: 'amber'   },
  { value: 'processing',  label: 'Chế biến',   Icon: Settings2, color: 'orange'  },
  { value: 'packaging',   label: 'Đóng gói',   Icon: Package,   color: 'teal'    },
]

type StageColor = 'emerald'|'lime'|'blue'|'green'|'amber'|'orange'|'teal'

const COLOR: Record<StageColor, { bg: string; text: string; border: string; dot: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  lime:    { bg: 'bg-lime-50',    text: 'text-lime-700',    border: 'border-lime-200',    dot: 'bg-lime-500'    },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  green:   { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   dot: 'bg-green-500'   },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500'  },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    dot: 'bg-teal-500'    },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const stage = STAGES.find((s) => s.value === event.stage)
  const color = COLOR[(stage?.color as StageColor) ?? 'teal']
  const Icon = stage?.Icon ?? Package
  const [showProof, setShowProof] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="preview" />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Stage header */}
        <div className={`flex items-center gap-3 px-4 py-3 ${color.bg} border-b ${color.border}`}>
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${color.dot}`}>
            <Icon className="w-4 h-4 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${color.text}`}>{stage?.label ?? event.stage}</p>
            <div className="flex flex-wrap gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" /> {fmtDateTime(event.timestamp)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" /> {event.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>

          {/* Images */}
          {event.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.images.map((src) => (
                <button key={src} onClick={() => setLightbox(src)} className="block">
                  <img
                    src={src}
                    alt=""
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200 hover:scale-105 transition shadow-sm"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Blockchain proof toggle */}
          <button
            onClick={() => setShowProof((v) => !v)}
            className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            <Link2 className="w-3 h-3" />
            Blockchain proof
            {showProof ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showProof && (
            <div className="mt-2 bg-gray-50 border rounded-xl p-3 text-[11px] font-mono break-all space-y-1.5 text-gray-500">
              <div><span className="font-semibold text-gray-600 not-italic font-sans">Event Hash</span><br />{event.eventHash}</div>
              <div><span className="font-semibold text-gray-600 not-italic font-sans">Tx Hash</span><br />{event.txHash}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function VerifyPage() {
  const { hash } = useParams<{ hash: string }>()
  const [data, setData] = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showChain, setShowChain] = useState(false)

  useEffect(() => {
    if (!hash) return
    verifyApi
      .get(hash)
      .then((r) => setData(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [hash])

  /* ── Loading ── */
  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-tea-900 to-tea-700 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
            <Leaf className="w-8 h-8 text-tea-200" />
          </div>
          <div className="flex items-center gap-2 text-tea-200">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Đang xác thực nguồn gốc...</span>
          </div>
        </div>
      </div>
    )

  /* ── Not found ── */
  if (notFound || !data)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Không thể xác thực</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Mã QR này không hợp lệ hoặc sản phẩm chưa được đăng ký trên hệ thống.
          </p>
          <p className="text-xs text-gray-400 mt-4 bg-gray-100 rounded-xl px-3 py-2">
            Nếu bạn nghi ngờ sản phẩm giả mạo, vui lòng liên hệ nhà sản xuất.
          </p>
        </div>
      </div>
    )

  const { batch, agent, events, blockchain } = data
  const pkg = (data as any).package as { packageIdx: number; total: number; packageHash: string } | undefined

  const stagesDone = STAGES.filter((s) => events.some((e) => e.stage === s.value))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO ══ */}
      <div className="bg-gradient-to-br from-tea-900 via-tea-800 to-tea-700 text-white">
        <div className="max-w-lg mx-auto px-5 pt-10 pb-8">

          {/* Brand */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-tea-200" />
            </div>
            <span className="text-tea-300 text-sm font-medium">Tùng Dương Tea</span>
          </div>

          {/* Verified stamp */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mb-5 w-fit">
            <div className="w-9 h-9 bg-green-400/20 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-300" />
            </div>
            <div>
              <p className="text-green-300 text-xs font-semibold uppercase tracking-wide">Đã xác thực</p>
              <p className="text-white text-xs opacity-70">Bảo đảm bởi Blockchain IBN</p>
            </div>
          </div>

          {/* Product name */}
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-1">
            {batch.teaType}
          </h1>
          <p className="text-tea-300 text-sm">
            {batch.farmName}
            {batch.weightGram > 0 && <> &middot; {batch.weightGram}g</>}
          </p>

          {/* Package badge */}
          {pkg && (
            <div className="mt-4 inline-flex items-center gap-2.5 bg-amber-400/20 border border-amber-300/30 rounded-2xl px-4 py-2.5">
              <div className="w-8 h-8 bg-amber-400/30 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 text-amber-200" />
              </div>
              <div>
                <p className="text-amber-200 text-[11px] font-semibold uppercase tracking-wide">Gói chè số</p>
                <p className="text-white font-extrabold text-lg leading-none">
                  {pkg.packageIdx}
                  <span className="text-tea-300 text-sm font-normal"> / {pkg.total} gói</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ── Thông tin sản phẩm ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800 text-base">Thông tin sản phẩm</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {([
              { Icon: Leaf,         label: 'Loại chè',       value: batch.teaType },
              { Icon: Scale,        label: 'Khối lượng',     value: batch.weightGram > 0 ? `${batch.weightGram} gram` : '—' },
              { Icon: User,         label: 'Cơ sở sản xuất', value: agent.farmName || agent.fullName },
              { Icon: MapPin,       label: 'Địa chỉ',        value: agent.location || '—' },
              { Icon: CalendarDays, label: 'Ngày đóng gói',  value: batch.finalizedAt ? fmtDate(batch.finalizedAt) : '—' },
            ] as { Icon: typeof Leaf; label: string; value: string }[]).map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Hành trình sản xuất ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-base mb-4">Hành trình sản xuất</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {STAGES.map((s) => {
              const done = events.some((e) => e.stage === s.value)
              const c = COLOR[s.color as StageColor]
              return (
                <div key={s.value} className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition ${
                    done ? `${c.bg} ${c.border}` : 'bg-gray-50 border-gray-100'
                  }`}>
                    {done
                      ? <s.Icon className={`w-5 h-5 ${c.text}`} />
                      : <s.Icon className="w-5 h-5 text-gray-300" />
                    }
                  </div>
                  <p className={`text-[10px] text-center leading-tight ${done ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                    {s.label}
                  </p>
                  {done && <CheckCircle2 className={`w-3 h-3 ${c.text}`} />}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            {stagesDone.length}/{STAGES.length} công đoạn được ghi nhận
          </p>
        </div>

        {/* ── Lịch sử chi tiết ── */}
        <div>
          <h2 className="font-bold text-gray-800 text-base mb-3 px-1">
            Lịch sử chi tiết
            <span className="ml-2 text-sm font-normal text-gray-400">({events.length} sự kiện)</span>
          </h2>
          <div className="space-y-3">
            {events.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </div>

        {/* ── Blockchain proof (collapsible) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowChain((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <Link2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800">Blockchain Proof</p>
                <p className="text-xs text-gray-400">Dữ liệu bất biến trên IBN Chain</p>
              </div>
            </div>
            {showChain ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showChain && (
            <div className="border-t border-gray-50 px-5 py-4 space-y-3">
              {pkg && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Package Hash (Gói #{pkg.packageIdx})</p>
                  <p className="text-[11px] font-mono break-all text-amber-600">{pkg.packageHash}</p>
                </div>
              )}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2.5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">Batch Hash</p>
                  <p className="text-[11px] font-mono break-all text-gray-600">{blockchain.batchHash}</p>
                </div>
                <div className="border-t border-gray-200 pt-2.5">
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">Transaction Hash</p>
                  <p className="text-[11px] font-mono break-all text-gray-600">{blockchain.txHash}</p>
                </div>
                <div className="border-t border-gray-200 pt-2.5">
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">Network</p>
                  <p className="text-[11px] font-mono text-gray-600">IBN — Chain ID: 1337</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hash được tính từ toàn bộ lịch sử sản xuất và ghi lên blockchain — không thể chỉnh sửa hay làm giả.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <div className="inline-flex items-center gap-2 text-tea-700 mb-2">
          <Leaf className="w-4 h-4" />
          <span className="font-bold text-sm">Tùng Dương Tea</span>
        </div>
        <p className="text-xs text-gray-400">
          Hệ thống truy xuất nguồn gốc bảo đảm bởi Blockchain IBN.<br />
          Mỗi gói chè mang một mã xác thực duy nhất — không thể làm giả.
        </p>
      </div>
    </div>
  )
}

