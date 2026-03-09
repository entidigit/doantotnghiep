import { useEffect, useState, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Plus, Package, QrCode, ExternalLink,
  CheckCircle2, Loader2, Camera, MapPin,
  Clock, Sprout, Leaf, Activity,
  X, ChevronDown, ChevronUp, Info, Image as ImageIcon,
  Droplets, Scissors, Sun, Settings2, AlertTriangle, Link2, ShieldCheck,
  PackageCheck, CircleCheck, CircleX,
} from 'lucide-react'
import Layout from '../components/Layout'
import { batchApi, eventApi, type TeaBatch, type Event, type TeaPackage } from '../api/client'
import Toast, { ToastType } from '../components/Toast'

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

// ── Stage config ─────────────────────────────────────────────────────────────

const STAGES = [
  { value: 'planting',    label: 'Trồng cây',  Icon: Sprout,    bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'fertilizing', label: 'Bón phân',   Icon: Leaf,      bg: 'bg-lime-50',    text: 'text-lime-800',    border: 'border-lime-200',    dot: 'bg-lime-600'    },
  { value: 'spraying',    label: 'Phun thuốc', Icon: Droplets,  bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  { value: 'harvesting',  label: 'Thu hoạch',  Icon: Scissors,  bg: 'bg-green-50',   text: 'text-green-800',   border: 'border-green-200',   dot: 'bg-green-600'   },
  { value: 'drying',      label: 'Phơi sấy',   Icon: Sun,       bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  { value: 'processing',  label: 'Chế biến',   Icon: Settings2, bg: 'bg-orange-50',  text: 'text-orange-800',  border: 'border-orange-200',  dot: 'bg-orange-500'  },
  { value: 'packaging',   label: 'Đóng gói',   Icon: Package,   bg: 'bg-teal-50',    text: 'text-teal-800',    border: 'border-teal-200',    dot: 'bg-teal-600'    },
]

const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.value, s]))

function fmt(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
function fmtFull(d: string) {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  quantity, setQuantity, onConfirm, onCancel,
}: {
  quantity: number
  setQuantity: (n: number) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Xác nhận đóng gói lô chè</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Hệ thống sẽ tính <strong className="text-gray-700">BatchHash</strong> từ toàn bộ sự kiện và ghi lên blockchain.<br />
              <span className="text-amber-600 font-medium">Hành động này không thể hoàn tác.</span>
            </p>
          </div>
        </div>
        {/* Số lượng gói */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Số lượng gói chè sản xuất
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition font-bold text-lg"
            >−</button>
            <input
              type="number"
              min={1}
              max={10000}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 text-center border border-gray-200 rounded-xl py-2 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition font-bold text-lg"
            >+</button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Mỗi gói sẽ có 1 mã QR riêng biệt để truy xuất nguồn gốc.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-ghost justify-center">Hủy</button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            <PackageCheck className="w-4 h-4" /> Đóng gói {quantity} gói
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
// ── Image Gallery Modal ────────────────────────────────────────────────────────

function ImageGallery({ images, onClose, startIdx = 0 }: {
  images: string[]; onClose: () => void; startIdx?: number
}) {
  const [idx, setIdx] = useState(startIdx)
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={images[idx]}
          alt=""
          className="w-full max-h-[70vh] object-contain rounded-xl"
        />
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ ev, idx, total }: { ev: Event; idx: number; total: number }) {
  const stage = STAGE_MAP[ev.stage] ?? { label: ev.stage, Icon: Package, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' }
  const [expanded, setExpanded] = useState(idx === 0)
  const [gallery, setGallery] = useState<{ images: string[]; start: number } | null>(null)

  return (
    <div className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
      {gallery && (
        <ImageGallery
          images={gallery.images}
          startIdx={gallery.start}
          onClose={() => setGallery(null)}
        />
      )}
      <div className="flex gap-4">
        {/* Timeline line */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${stage.dot}`}>
            <stage.Icon className="w-4 h-4 text-white" />
          </div>
          {idx < total - 1 && (
            <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-200 to-transparent mt-2 min-h-[24px]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          <div className="card overflow-hidden hover:shadow-md transition-all duration-200">
            {/* Colored stage header */}
            <div
              className={`flex items-center gap-3 px-4 py-3 ${stage.bg} border-b ${stage.border} cursor-pointer select-none`}
              onClick={() => setExpanded(!expanded)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-sm ${stage.text}`}>{stage.label}</span>
                  {ev.images?.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-semibold">
                      <ImageIcon className="w-2.5 h-2.5" /> {ev.images.length} ảnh
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmtFull(ev.timestamp)}
                  {ev.location && <><span className="mx-1">·</span><MapPin className="w-3 h-3" />{ev.location}</>}
                </p>
              </div>
              <div className="shrink-0 text-gray-500">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* Expandable body */}
            {expanded && (
              <div className="border-t border-gray-100 p-4 space-y-4 animate-fade-in">
                {ev.description && (
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Mô tả
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{ev.description}</p>
                  </div>
                )}

                {ev.images?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Hình ảnh ({ev.images.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {ev.images.map((img, i) => (
                        <div
                          key={i}
                          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-gray-100 hover:border-emerald-300 transition-all"
                          onClick={(e) => {
                            e.stopPropagation()
                            setGallery({ images: ev.images, start: i })
                          }}
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ev.eventHash && (
                  <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-700 font-bold mb-1 uppercase tracking-wide">Blockchain hash</p>
                    <p className="text-[11px] font-mono text-gray-700 break-all">{ev.eventHash}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add event form ─────────────────────────────────────────────────────────────

function AddEventForm({ batchId, onSaved, onError }: { batchId: string; onSaved: () => void; onError: (msg: string) => void }) {
  const [stage, setStage] = useState('fertilizing')
  const [desc, setDesc] = useState('')
  const [location, setLocation] = useState('')
  const [images, setImages] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setImages(files)
    if (files) {
      const urls = Array.from(files).map((f) => URL.createObjectURL(f))
      setPreviews(urls)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData()
    fd.append('stage', stage)
    fd.append('description', desc)
    fd.append('location', location)
    if (images) Array.from(images).forEach((f) => fd.append('images', f))
    try {
      await eventApi.create(batchId, fd)
      setDesc('')
      setLocation('')
      setImages(null)
      setPreviews([])
      if (fileRef.current) fileRef.current.value = ''
      onSaved()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Lỗi khi thêm sự kiện')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-5 animate-slide-up border-emerald-200/60">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        Ghi nhận sự kiện mới
      </h3>
      <form onSubmit={submit} className="space-y-4">
        {/* Stage selector */}
        <div>
          <label className="label">Giai đoạn sản xuất</label>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStage(s.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  stage === s.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {/* selected indicator */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            {(() => { const s = STAGES.find(x => x.value === stage)!; return <><s.Icon className="w-3.5 h-3.5" />{s.label}</> })()} 
            <span className="text-gray-300">đã chọn</span>
          </div>
        </div>

        {/* Date & Location */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ngày xảy ra</label>
            <input
              type="datetime-local"
              className="input-field"
              defaultValue={new Date().toISOString().slice(0, 16)}
              name="timestamp"
            />
          </div>
          <div>
            <label className="label">Địa điểm</label>
            <input
              className="input-field"
              placeholder="VD: Khu A, lô B..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">
            Mô tả chi tiết <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            rows={3}
            className="input-field resize-none"
            placeholder="Mô tả hoạt động, tình trạng cây, loại vật tư sử dụng..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="label">Hình ảnh minh chứng</label>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
            <ImageIcon className="w-7 h-7 text-gray-300 mb-1.5" />
            <span className="text-sm text-gray-400 font-medium">Nhấn để chọn ảnh</span>
            <span className="text-xs text-gray-300">PNG, JPG, WebP · Nhiều ảnh</span>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFiles}
            />
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {previews.map((p, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-100">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 py-2.5"
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang ghi blockchain...</>
              : <><CheckCircle2 className="w-4 h-4" /> Lưu & Ghi blockchain</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [batch, setBatch] = useState<TeaBatch | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [packages, setPackages] = useState<TeaPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [showAllPkgs, setShowAllPkgs] = useState(false)

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    setToast({ show: true, message, type })
  }, [])

  const load = () => {
    if (!id) return
    batchApi.get(id).then((r) => {
      setBatch(r.data.batch)
      setEvents(r.data.events)
      if (r.data.batch.status === 'packaged') {
        batchApi.listPackages(id).then((pr) => setPackages(pr.data)).catch(() => {})
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const doFinalize = async () => {
    if (!id) return
    setShowConfirm(false)
    setFinalizing(true)
    try {
      const res = await batchApi.finalize(id, quantity)
      setPackages(res.data.packages || [])
      load()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Lỗi khi đóng gói')
    } finally {
      setFinalizing(false)
    }
  }

  if (loading) return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
        <div className="card p-6 h-36" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 h-64" />
          <div className="card p-6 h-48" />
        </div>
      </div>
    </Layout>
  )
  if (!batch) return (
    <Layout>
      <div className="py-20 text-center">
        <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500">Không tìm thấy lô chè</p>
        <Link to="/dashboard" className="btn-primary mt-4 mx-auto w-fit">Quay lại</Link>
      </div>
    </Layout>
  )

  const isPackaged = batch.status === 'packaged'

  // Stage progress tracking
  const stagesDone = STAGES.filter((s) => events.some((e) => e.stage === s.value)).map((s) => s.value)
  const progressPct = Math.round((stagesDone.length / STAGES.length) * 100)

  return (
    <Layout>
      {showConfirm && (
        <ConfirmModal
          quantity={quantity}
          setQuantity={setQuantity}
          onConfirm={doFinalize}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link to="/dashboard" className="btn-ghost mb-5 -ml-2">
          <ChevronLeft className="w-4 h-4" /> Quay lại Dashboard
        </Link>

        {/* ── Batch header ── */}
        <div className="card p-6 mb-6 animate-slide-up">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <div className="mb-2">
                <span className={isPackaged ? 'badge-packaged' : 'badge-growing'}>
                  {isPackaged
                    ? <><CheckCircle2 className="w-3 h-3" />Đã đóng gói</>
                    : <><Activity className="w-3 h-3" />Đang sản xuất</>
                  }
                </span>
              </div>
              <h1 className="page-title">{batch.teaType || 'Lô chè'}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-700">
                {batch.farmName && <span className="font-semibold">{batch.farmName}</span>}
                <span>{batch.weightGram}g / gói</span>
                <span>{fmt(batch.createdAt)}</span>
                <span className="font-mono text-xs text-gray-500">{batch.batchId.slice(0, 12)}...</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {!isPackaged && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Tiến độ giai đoạn</span>
                <span className="text-xs font-bold text-emerald-700">{stagesDone.length} / {STAGES.length} giai đoạn</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                {STAGES.map((s) => (
                  <div
                    key={s.value}
                    title={s.label}
                    className={`w-2 h-2 rounded-full transition-all ${stagesDone.includes(s.value) ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Blockchain info */}
          {isPackaged && batch.batchHash && (
            <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/60 rounded-xl">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Blockchain Proof
                <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0 font-sans font-semibold">Hash:</span>
                  <span className="text-gray-700 break-all">{batch.batchHash}</span>
                </div>
                {batch.txHash && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0 font-sans font-semibold">Tx:</span>
                    <span className="text-gray-700 break-all">{batch.txHash}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <a
                  href={`/qr/${batch.batchHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  <QrCode className="w-3.5 h-3.5" /> Tải QR Code
                </a>
                <a
                  href={`${window.location.origin}/verify/${batch.batchHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Trang xác thực
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Summary stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { value: events.length,                                              label: 'Sự kiện',       accent: 'text-blue-600',    border: 'border-blue-200'    },
            { value: stagesDone.length,                                          label: 'Giai đoạn',     accent: 'text-emerald-600', border: 'border-emerald-200' },
            { value: events.reduce((s, e) => s + (e.images?.length || 0), 0),   label: 'Ảnh',           accent: 'text-purple-600',  border: 'border-purple-200'  },
            { value: `${batch.weightGram}g`,                                     label: 'Khối lượng',    accent: 'text-teal-600',    border: 'border-teal-200'    },
          ].map((s) => (
            <div key={s.label} className={`card p-4 border-l-4 ${s.border} animate-fade-in`}>
              <div className={`text-2xl font-extrabold ${s.accent}`}>{s.value}</div>
              <div className="text-xs text-gray-600 font-semibold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timeline column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="section-title flex items-center gap-2">
                Lịch sử sản xuất
                <span className="text-sm font-normal text-gray-400">({events.length})</span>
              </h2>
              {!isPackaged && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className={showForm ? 'btn-secondary' : 'btn-primary'}
                >
                  {showForm ? <><X className="w-4 h-4" /> Đóng</> : <><Plus className="w-4 h-4" /> Thêm sự kiện</>}
                </button>
              )}
            </div>

            {/* Add event form */}
            {showForm && !isPackaged && (
              <AddEventForm
                batchId={id!}
                onSaved={() => { setShowForm(false); load(); showToast('Đã thêm sự kiện', 'success') }}
                onError={(message) => showToast(message, 'error')}
              />
            )}

            {/* Events list */}
            {events.length === 0 ? (
              <div className="card py-16 text-center animate-fade-in">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-7 h-7 text-emerald-400" />
              </div>
                <p className="text-gray-500 font-semibold">Chưa có sự kiện nào</p>
                <p className="text-sm text-gray-400 mt-1">
                  Bắt đầu ghi nhận từ giai đoạn trồng cây
                </p>
                {!isPackaged && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary mt-4 mx-auto w-fit"
                  >
                    <Plus className="w-4 h-4" /> Thêm sự kiện đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <div>
                {events.map((ev, i) => (
                  <EventCard key={ev.id} ev={ev} idx={i} total={events.length} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Batch info card */}
            <div className="card p-5 animate-fade-in">
              <h3 className="section-title mb-4">Thông tin lô</h3>
              <dl className="divide-y divide-gray-50">
                {[
                  { k: 'Mã lô',      v: batch.batchId.slice(0, 12) + '...' },
                  { k: 'Loại chè',   v: batch.teaType },
                  { k: 'Trang trại', v: batch.farmName },
                  { k: 'Khối lượng', v: `${batch.weightGram}g / gói` },
                  { k: 'Ngày tạo',   v: fmt(batch.createdAt) },
                  { k: 'Trạng thái', v: isPackaged ? 'Đã đóng gói' : 'Đang sản xuất' },
                ].filter((r) => r.v).map(({ k, v }) => (
                  <div key={k} className="flex items-start justify-between gap-2 py-2">
                    <dt className="text-xs text-gray-600 font-medium shrink-0">{k}</dt>
                    <dd className="text-xs font-bold text-right text-gray-900 truncate max-w-[140px]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Stage checklist */}
            <div className="card p-5 animate-fade-in">
              <h3 className="section-title mb-3">Giai đoạn sản xuất</h3>
              <div className="divide-y divide-gray-50">
                {STAGES.map((s, idx) => {
                  const done = stagesDone.includes(s.value)
                  const eventsInStage = events.filter((e) => e.stage === s.value)
                  return (
                    <div key={s.value} className="flex items-center gap-3 py-2">
                      <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>{idx + 1}</span>
                      <span className={`text-sm flex-1 ${done ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                        {s.label}
                      </span>
                      {done && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {eventsInStage.length}x
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Finalize card */}
            {!isPackaged && (
              <div className="card p-5 animate-fade-in border-amber-200/60">
                <h3 className="section-title mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" /> Đóng gói lô chè
                </h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  Hệ thống sẽ tính <strong className="text-gray-900">BatchHash</strong> từ tất cả sự kiện và ghi lên blockchain IBN. Mỗi gói chè nhận được 1 mã QR riêng biệt để truy xuất nguồn gốc.
                </p>
                {events.length === 0 ? (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2.5 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Cần ít nhất 1 sự kiện trước khi đóng gói.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={finalizing}
                    className="btn-primary w-full py-3 from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20"
                  >
                    {finalizing
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang ghi blockchain...</>
                      : <><Package className="w-4 h-4" /> Hoàn tất & Đóng gói</>
                    }
                  </button>
                )}
              </div>
            )}

            {/* Already packaged */}
            {isPackaged && (
              <div className="card p-5 text-center animate-fade-in bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200/60">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-600/20">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-teal-800">Lô đã đóng gói thành công</p>
                {batch.quantity > 0 && (
                  <p className="text-sm text-teal-700 mt-1 font-medium">{batch.quantity} gói chè</p>
                )}
                {batch.finalizedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtFull(batch.finalizedAt)}
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <a
                    href={`/qr/${batch.batchHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-full"
                  >
                    <QrCode className="w-4 h-4" /> QR Lô chè
                  </a>
                  <a
                    href={`${window.location.origin}/verify/${batch.batchHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary w-full"
                  >
                    <ExternalLink className="w-4 h-4" /> Trang xác thực công khai
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Packages grid ── */}
        {isPackaged && packages.length > 0 && (
          <div className="card p-6 animate-fade-in">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-500" />
              Danh sách {packages.length} gói chè
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(showAllPkgs ? packages : packages.slice(0, 12)).map((pkg) => (
                <div key={pkg.id} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition">
                  <QRCodeSVG value={`${window.location.origin}/verify/${pkg.packageHash}`} size={80} />
                  <span className="text-xs font-semibold text-gray-700">Gói #{pkg.packageIdx}</span>
                  <a
                    href={`${window.location.origin}/verify/${pkg.packageHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-2.5 h-2.5" /> Xác thực
                  </a>
                </div>
              ))}
            </div>
            {packages.length > 12 && (
              <button
                onClick={() => setShowAllPkgs((v) => !v)}
                className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition flex items-center justify-center gap-2"
              >
                {showAllPkgs
                  ? <><ChevronUp className="w-4 h-4" /> Thu gọn</>
                  : <><ChevronDown className="w-4 h-4" /> Xem thêm {packages.length - 12} gói còn lại</>
                }
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
