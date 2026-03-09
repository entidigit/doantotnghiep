import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Leaf, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import StageTimeline from '../components/StageTimeline'
import { verifyApi, type VerifyData } from '../api/client'

export default function VerifyPage() {
  const { hash } = useParams<{ hash: string }>()
  const [data, setData] = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
      <div className="min-h-screen bg-gradient-to-br from-tea-800 to-tea-600 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Đang xác thực nguồn gốc...</span>
        </div>
      </div>
    )

  /* ── Not found ── */
  if (notFound || !data)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="bg-red-100 p-4 rounded-2xl inline-block mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Mã QR không hợp lệ hoặc lô chè chưa được đóng gói lên blockchain.
          </p>
        </div>
      </div>
    )

  const { batch, agent, events, blockchain } = data

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-tea-900 via-tea-800 to-tea-600 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-tea-300 text-sm mb-4">
            <Leaf className="w-4 h-4" />
            Tùng Dương Tea — Blockchain IBN
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight">
            {batch.teaType}
          </h1>
          <p className="text-tea-200 text-sm">
            {batch.farmName && <>🏡 {batch.farmName} &nbsp;|&nbsp;</>}
            ⚖️ {batch.weightGram}g
            {batch.finalizedAt && (
              <> &nbsp;|&nbsp; 📅 Đóng gói {new Date(batch.finalizedAt).toLocaleDateString('vi-VN')}</>
            )}
          </p>

          {/* Verified badge */}
          <div className="mt-6 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
            <ShieldCheck className="w-5 h-5 text-green-300" />
            <span className="text-sm font-semibold">Đã xác minh trên blockchain IBN</span>
          </div>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Nhà sản xuất */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">🏭 Nhà sản xuất</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Cơ sở sản xuất', agent.farmName],
              ['Người phụ trách', agent.fullName || agent.username],
              ['Địa chỉ', agent.location || '—'],
              ['Ngày đóng gói', batch.finalizedAt ? new Date(batch.finalizedAt).toLocaleDateString('vi-VN') : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain proof */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">🔗 Blockchain Proof</h2>
          <div className="bg-gray-50 border rounded-xl p-4 space-y-2 text-xs font-mono break-all">
            <div>
              <span className="font-semibold text-gray-600 not-italic font-sans text-xs">Batch Hash</span>
              <p className="text-gray-700 mt-0.5">{blockchain.batchHash}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600 not-italic font-sans text-xs">Transaction Hash</span>
              <p className="text-gray-700 mt-0.5">{blockchain.txHash}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600 not-italic font-sans text-xs">Chain</span>
              <p className="text-gray-700 mt-0.5">IBN — Chain ID: 1337</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Hash này được tính từ toàn bộ lịch sử sản xuất và không thể chỉnh sửa sau khi ghi lên blockchain.
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-5">
            📋 Lịch sử sản xuất
            <span className="ml-2 text-sm font-normal text-gray-400">({events.length} sự kiện)</span>
          </h2>
          <StageTimeline events={events} />
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 py-6 border-t bg-white">
        🍵 Dữ liệu được bảo toàn bởi blockchain IBN — Không thể chỉnh sửa hay làm giả
      </div>
    </div>
  )
}
