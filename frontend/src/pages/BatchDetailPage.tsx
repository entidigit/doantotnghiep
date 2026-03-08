import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Plus, Package, QrCode, ExternalLink,
  CheckCircle2, Loader2, Camera, MapPin, CalendarDays,
  Scale, Hash, Clock, Sprout, Leaf, Activity, Archive,
  X, ChevronDown, ChevronUp, Info, Image as ImageIcon,
} from 'lucide-react'
import Layout from '../components/Layout'
import { batchApi, eventApi, type TeaBatch, type Event } from '../api/client'

// ── Stage config ─────────────────────────────────────────────────────────────

const STAGES = [
  { value: 'planting', label: 'Trồng cây', emoji: '🌱', color: 'emerald' },
  { value: 'fertilizing', label: 'Bón phân', emoji: '🌿', color: 'lime' },
  { value: 'spraying', label: 'Phun thuốc', emoji: '💧', color: 'blue' },
  { value: 'harvesting', label: 'Thu hoạch', emoji: '🍃', color: 'green' },
  { value: 'drying', label: 'Phơi sấy', emoji: '☀️', color: 'amber' },
  { value: 'processing', label: 'Chế biến', emoji: '⚙️', color: 'orange' },
  { value: 'packaging', label: 'Đóng gói', emoji: '📦', color: 'teal' },
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
  const stage = STAGE_MAP[ev.stage] || { emoji: '📌', label: ev.stage, color: 'gray' }
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
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-base shadow-md shadow-emerald-600/20 shrink-0">
            {stage.emoji}
          </div>
          {idx < total - 1 && (
            <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-200 to-transparent mt-2 min-h-[24px]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          <div
            className="card cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
            onClick={() => setExpanded(!expanded)}
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-sm">{stage.label}</span>
                  {ev.images?.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                      <ImageIcon className="w-2.5 h-2.5" /> {ev.images.length} ảnh
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmtFull(ev.timestamp)}
                  {ev.location && <><span className="mx-1">·</span><MapPin className="w-3 h-3" />{ev.location}</>}
                </p>
              </div>
              <div className="shrink-0 text-gray-400">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* Expandable body */}
            {expanded && (
              <div className="border-t border-gray-100 p-4 space-y-4 animate-fade-in">
                {ev.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Mô tả
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{ev.description}</p>
                  </div>
                )}

                {ev.images?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
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
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wide">Blockchain hash</p>
                    <p className="text-[11px] font-mono text-gray-600 break-all">{ev.eventHash}</p>
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

function AddEventForm({ batchId, onSaved }: { batchId: string; onSaved: () => void }) {
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
      alert(err.response?.data?.error || 'Lỗi khi thêm sự kiện')
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {STAGES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStage(s.value)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center transition-all ${stage === s.value
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
              >
                <span className="text-xl leading-none">{s.emoji}</span>
                <span className="text-[10px] font-semibold leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date & Location */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" /> Ngày xảy ra
              </span>
            </label>
            <input
              type="datetime-local"
              className="input-field"
              defaultValue={new Date().toISOString().slice(0, 16)}
              name="timestamp"
            />
          </div>
          <div>
            <label className="label">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Địa điểm
              </span>
            </label>
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
          <label className="label">
            <span className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-gray-400" /> Hình ảnh minh chứng
            </span>
          </label>
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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  const load = () => {
    if (!id) return
    batchApi.get(id).then((r) => {
      setBatch(r.data.batch)
      setEvents(r.data.events)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const finalize = async () => {
    if (!id) return
    if (!confirm('Xác nhận đóng gói lô chè?\nHành động này sẽ ghi hash lên blockchain và không thể hoàn tác.')) return
    setFinalizing(true)
    try {
      await batchApi.finalize(id)
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi khi đóng gói')
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
        <Link to="/" className="btn-primary mt-4 mx-auto w-fit">Quay lại</Link>
      </div>
    </Layout>
  )

  const isPackaged = batch.status === 'packaged'

  // Stage progress tracking
  const stagesDone = STAGES.filter((s) => events.some((e) => e.stage === s.value)).map((s) => s.value)
  const progressPct = Math.round((stagesDone.length / STAGES.length) * 100)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link to="/" className="btn-ghost mb-5 -ml-2">
          <ChevronLeft className="w-4 h-4" /> Quay lại Dashboard
        </Link>

        {/* ── Batch header ── */}
        <div className="card p-6 mb-6 animate-slide-up">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                </div>
                <span className={isPackaged ? 'badge-packaged' : 'badge-growing'}>
                  {isPackaged
                    ? <><CheckCircle2 className="w-3 h-3" />Đã đóng gói</>
                    : <><Activity className="w-3 h-3" />Đang sản xuất</>
                  }
                </span>
              </div>
              <h1 className="page-title">{batch.teaType || 'Lô chè'}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                {batch.farmName && (
                  <span className="flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5 text-emerald-400" /> {batch.farmName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-blue-400" /> {batch.weightGram}g / gói
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" /> {fmt(batch.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-gray-400" /> {batch.batchId.slice(0, 12)}...
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {!isPackaged && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiến độ giai đoạn</span>
                <span className="text-xs font-bold text-emerald-600">{stagesDone.length} / {STAGES.length} giai đoạn</span>
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
                    className={`text-sm transition-all ${stagesDone.includes(s.value) ? 'grayscale-0' : 'grayscale opacity-30'}`}
                  >
                    {s.emoji}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockchain info */}
          {isPackaged && batch.batchHash && (
            <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/60 rounded-xl">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                🔗 Blockchain Proof
                <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  ✓ Verified
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
                  href={batch.verifyUrl}
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
            {
              icon: <Activity className="w-4 h-4 text-blue-500" />,
              bg: 'bg-blue-50',
              value: events.length,
              label: 'Sự kiện ghi nhận',
            },
            {
              icon: <span className="text-base leading-none">🌱</span>,
              bg: 'bg-emerald-50',
              value: stagesDone.length,
              label: 'Giai đoạn đã qua',
            },
            {
              icon: <Camera className="w-4 h-4 text-purple-500" />,
              bg: 'bg-purple-50',
              value: events.reduce((s, e) => s + (e.images?.length || 0), 0),
              label: 'Ảnh đã chụp',
            },
            {
              icon: <Scale className="w-4 h-4 text-teal-500" />,
              bg: 'bg-teal-50',
              value: `${batch.weightGram}g`,
              label: 'Khối lượng gói',
            },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3 animate-fade-in">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                {s.icon}
              </div>
              <div>
                <div className="text-lg font-extrabold text-gray-900 leading-none">{s.value}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
              </div>
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
                onSaved={() => { setShowForm(false); load() }}
              />
            )}

            {/* Events list */}
            {events.length === 0 ? (
              <div className="card py-16 text-center animate-fade-in">
                <div className="text-5xl mb-3">🌱</div>
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
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" /> Thông tin lô
              </h3>
              <dl className="space-y-3">
                {[
                  { k: 'Mã lô', v: batch.batchId.slice(0, 12) + '...', icon: <Hash className="w-3.5 h-3.5" /> },
                  { k: 'Loại chè', v: batch.teaType, icon: <Leaf className="w-3.5 h-3.5" /> },
                  { k: 'Trang trại', v: batch.farmName, icon: <Sprout className="w-3.5 h-3.5" /> },
                  { k: 'Khối lượng', v: `${batch.weightGram}g / gói`, icon: <Scale className="w-3.5 h-3.5" /> },
                  { k: 'Ngày tạo', v: fmt(batch.createdAt), icon: <CalendarDays className="w-3.5 h-3.5" /> },
                  { k: 'Trạng thái', v: isPackaged ? '✅ Đã đóng gói' : '🌿 Đang sản xuất', icon: null },
                ].filter((r) => r.v).map(({ k, v, icon }) => (
                  <div key={k} className="flex items-start justify-between gap-2 py-1.5 border-b last:border-0 border-gray-50">
                    <dt className="text-xs text-gray-400 flex items-center gap-1 shrink-0 font-medium">
                      {icon && <span className="text-gray-300">{icon}</span>}
                      {k}
                    </dt>
                    <dd className="text-xs font-semibold text-right text-gray-800 truncate max-w-[140px]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Stage checklist */}
            <div className="card p-5 animate-fade-in">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <Archive className="w-4 h-4 text-gray-400" /> Giai đoạn sản xuất
              </h3>
              <div className="space-y-2">
                {STAGES.map((s) => {
                  const done = stagesDone.includes(s.value)
                  const eventsInStage = events.filter((e) => e.stage === s.value)
                  return (
                    <div
                      key={s.value}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${done ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-transparent'
                        }`}
                    >
                      <span className="text-base">{s.emoji}</span>
                      <span className={`text-sm flex-1 font-medium ${done ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {s.label}
                      </span>
                      {done ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          {eventsInStage.length}x
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
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
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Hệ thống sẽ tính <strong>BatchHash</strong> từ tất cả sự kiện và ghi lên blockchain IBN. Mỗi gói chè nhận được 1 mã QR riêng biệt để truy xuất nguồn gốc.
                </p>
                {events.length === 0 ? (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2.5 rounded-xl">
                    <span>⚠️</span>
                    <span>Cần ít nhất 1 sự kiện trước khi đóng gói.</span>
                  </div>
                ) : (
                  <button
                    onClick={finalize}
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
                    <QrCode className="w-4 h-4" /> Tải QR Code
                  </a>
                  <a
                    href={batch.verifyUrl}
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
      </div>
    </Layout>
  )
}
