import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Plus, Package, QrCode, ExternalLink,
  CheckCircle2, Loader2,
} from 'lucide-react'
import Layout from '../components/Layout'
import StageTimeline from '../components/StageTimeline'
import { batchApi, eventApi, type TeaBatch, type Event } from '../api/client'

const STAGES = [
  { value: 'planting',    label: '🌱 Trồng cây' },
  { value: 'fertilizing', label: '🌿 Bón phân' },
  { value: 'spraying',    label: '💧 Phun thuốc' },
  { value: 'harvesting',  label: '🍃 Thu hoạch' },
  { value: 'drying',      label: '☀️ Phơi sấy' },
  { value: 'processing',  label: '⚙️ Chế biến' },
  { value: 'packaging',   label: '📦 Đóng gói' },
]

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [batch, setBatch] = useState<TeaBatch | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [stage, setStage] = useState('fertilizing')
  const [desc, setDesc] = useState('')
  const [location, setLocation] = useState('')
  const [images, setImages] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [finalizing, setFinalizing] = useState(false)
  const [finalResult, setFinalResult] = useState<{ batchHash: string; txHash: string; verifyUrl: string } | null>(null)

  const load = () => {
    if (!id) return
    batchApi.get(id).then((r) => {
      setBatch(r.data.batch)
      setEvents(r.data.events)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    const fd = new FormData()
    fd.append('stage', stage)
    fd.append('description', desc)
    fd.append('location', location)
    if (images) Array.from(images).forEach((f) => fd.append('images', f))
    try {
      await eventApi.create(id, fd)
      setDesc('')
      setLocation('')
      setImages(null)
      if (fileRef.current) fileRef.current.value = ''
      setShowForm(false)
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi khi thêm sự kiện')
    } finally {
      setSubmitting(false)
    }
  }

  const finalize = async () => {
    if (!id) return
    if (!confirm('Xác nhận đóng gói lô chè?\nHành động này sẽ ghi hash lên blockchain và không thể hoàn tác.')) return
    setFinalizing(true)
    try {
      const { data } = await batchApi.finalize(id)
      setFinalResult({ batchHash: data.batchHash, txHash: data.txHash, verifyUrl: data.verifyUrl })
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi khi đóng gói')
    } finally {
      setFinalizing(false)
    }
  }

  if (loading)
    return <Layout><div className="py-20 text-center text-gray-400 animate-pulse">Đang tải...</div></Layout>
  if (!batch)
    return <Layout><div className="py-20 text-center text-gray-500">Không tìm thấy lô chè.</div></Layout>

  const isPackaged = batch.status === 'packaged'

  return (
    <Layout>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </Link>

      {/* ── Batch header ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{batch.teaType || 'Lô chè'}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {batch.farmName && <>🏡 {batch.farmName} &nbsp;|&nbsp;</>}
              ⚖️ {batch.weightGram}g &nbsp;|&nbsp;
              📅 {new Date(batch.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
            isPackaged
              ? 'bg-tea-50 text-tea-800 border-tea-200'
              : 'bg-yellow-50 text-yellow-800 border-yellow-200'
          }`}>
            {isPackaged ? '✅ Đã đóng gói' : '🌿 Đang sản xuất'}
          </span>
        </div>

        {/* Blockchain info after finalization */}
        {(isPackaged || finalResult) && (
          <div className="mt-5 p-4 bg-tea-50 rounded-xl border border-tea-200">
            <p className="text-xs font-semibold text-tea-700 mb-2 uppercase tracking-wide">
              🔗 Blockchain Proof
            </p>
            <div className="text-xs font-mono break-all text-gray-600 space-y-1">
              <div><span className="font-semibold">Hash: </span>{batch.batchHash}</div>
              <div><span className="font-semibold">Tx: </span>{batch.txHash}</div>
            </div>
            <div className="flex gap-2 mt-3">
              <a
                href={`/qr/${batch.batchHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs bg-tea-700 hover:bg-tea-800 text-white px-3 py-1.5 rounded-lg transition"
              >
                <QrCode className="w-3.5 h-3.5" /> Tải QR Code
              </a>
              <a
                href={batch.verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs border border-tea-600 text-tea-700 px-3 py-1.5 rounded-lg hover:bg-tea-50 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Trang xác thực
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Lịch sử sự kiện
              <span className="ml-2 text-sm font-normal text-gray-400">({events.length})</span>
            </h2>
            {!isPackaged && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 text-sm bg-tea-700 hover:bg-tea-800 text-white px-3.5 py-1.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                {showForm ? 'Đóng' : 'Thêm sự kiện'}
              </button>
            )}
          </div>

          {/* Add event form */}
          {showForm && !isPackaged && (
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">📝 Ghi nhận sự kiện mới</h3>
              <form onSubmit={addEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Giai đoạn</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tea-500 transition"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả chi tiết *</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tea-500 transition resize-none"
                    placeholder="Mô tả hoạt động, loại phân bón, tình trạng cây..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa điểm</label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tea-500 transition"
                    placeholder="VD: Khu vực A, lô B..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ảnh minh chứng
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="block text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-tea-100 file:text-tea-700 hover:file:bg-tea-200 transition"
                    onChange={(e) => setImages(e.target.files)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Có thể chọn nhiều ảnh cùng lúc.</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-tea-700 hover:bg-tea-800 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang ghi blockchain...</>
                      : '✓ Lưu & Ghi blockchain'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 border rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          <StageTimeline events={events} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Thông tin lô</h3>
            <dl className="space-y-2.5 text-sm">
              {[
                ['Mã lô', batch.batchId.slice(0, 8) + '...'],
                ['Loại chè', batch.teaType],
                ['Khối lượng', `${batch.weightGram}g`],
                ['Trạng thái', isPackaged ? '✅ Đóng gói' : '🌿 Sản xuất'],
                ['Số sự kiện', String(events.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-gray-400 shrink-0">{k}</dt>
                  <dd className="font-medium text-right truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Finalize card */}
          {!isPackaged && (
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-2">Đóng gói lô chè</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Hệ thống sẽ tính <strong>BatchHash</strong> từ tất cả sự kiện và ghi lên blockchain IBN.
                Mỗi gói chè nhận được 1 mã QR riêng biệt.
              </p>
              {events.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  ⚠️ Cần ít nhất 1 sự kiện trước khi đóng gói.
                </p>
              ) : (
                <button
                  onClick={finalize}
                  disabled={finalizing}
                  className="w-full flex items-center justify-center gap-2 bg-tea-700 hover:bg-tea-800 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
                >
                  {finalizing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang ghi blockchain...</>
                    : <><Package className="w-4 h-4" /> Hoàn tất & Đóng gói</>}
                </button>
              )}
            </div>
          )}

          {/* Packaged card */}
          {isPackaged && (
            <div className="bg-white rounded-2xl border shadow-sm p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-tea-600 mx-auto mb-2" />
              <p className="font-semibold text-tea-700">Lô đã đóng gói</p>
              {batch.finalizedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(batch.finalizedAt).toLocaleDateString('vi-VN')}
                </p>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={`/qr/${batch.batchHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 text-sm bg-tea-700 hover:bg-tea-800 text-white py-2 rounded-xl transition"
                >
                  <QrCode className="w-4 h-4" /> Tải QR Code
                </a>
                <a
                  href={batch.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 text-sm border border-tea-600 text-tea-700 py-2 rounded-xl hover:bg-tea-50 transition"
                >
                  <ExternalLink className="w-4 h-4" /> Trang xác thực
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
