import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ShoppingBag, Leaf, Package, Scale, ChevronRight, CheckCircle,
  AlertCircle, Phone, MessageSquare, DollarSign, Loader2, Building2, CreditCard, User
} from 'lucide-react'
import { batchApi, listingApi, authApi, TeaBatch } from '../api/client'
import Layout from '../components/Layout'

export default function CreateListingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preselectedBatch = params.get('batchId') ?? ''

  const [batches, setBatches] = useState<TeaBatch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatch)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankOwner, setBankOwner] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Load agent profile to get bank info
  useEffect(() => {
    authApi.me().then(r => {
      setBankName(r.data.bankName || '')
      setBankAccount(r.data.bankAccount || '')
      setBankOwner(r.data.bankOwner || '')
    })
  }, [])

  // Load packaged batches
  useEffect(() => {
    batchApi.list().then(r => {
      const packaged = r.data.filter(b => b.status === 'packaged')
      setBatches(packaged)
      if (preselectedBatch) {
        const found = packaged.find(b => b.batchId === preselectedBatch)
        if (found) setQuantity(String(found.quantity))
      }
    })
  }, [preselectedBatch])

  const selectedBatch = batches.find(b => b.batchId === selectedBatchId)

  function handleBatchChange(id: string) {
    setSelectedBatchId(id)
    const b = batches.find(x => x.batchId === id)
    if (b) setQuantity(String(b.quantity))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedBatchId) { setError('Vui lòng chọn lô chè'); return }
    if (!price || Number(price) <= 0) { setError('Giá phải lớn hơn 0'); return }
    if (!quantity || Number(quantity) <= 0) { setError('Số lượng phải lớn hơn 0'); return }
    if (!contact.trim()) { setError('Vui lòng nhập số điện thoại'); return }

    setSubmitting(true)
    try {
      await listingApi.create({
        batchId: selectedBatchId,
        price: Number(price),
        quantityAvailable: Number(quantity),
        description,
        contact,
        bankName: bankName.trim() || undefined,
        bankAccount: bankAccount.trim() || undefined,
        bankOwner: bankOwner.trim() || undefined,
      })
      setSuccess(true)
      setTimeout(() => navigate('/shop'), 1800)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Có lỗi xảy ra, thử lại sau')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-1">Đăng bán thành công!</h2>
            <p className="text-gray-500 text-sm">Đang chuyển đến chợ…</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Đăng bán sản phẩm</h1>
            <p className="text-sm text-gray-500">Đăng tin bán lô chè đã đóng gói</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Select batch */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Chọn lô chè <span className="text-red-500">*</span>
            </label>
            {batches.length === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Bạn chưa có lô chè nào đã đóng gói. Hãy finalize một lô trước.
              </div>
            ) : (
              <div className="space-y-2">
                {batches.map(b => (
                  <button
                    type="button"
                    key={b.batchId}
                    onClick={() => handleBatchChange(b.batchId)}
                    className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      selectedBatchId === b.batchId
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedBatchId === b.batchId ? 'bg-emerald-500' : 'bg-gray-100'
                    }`}>
                      <Leaf className={`w-4 h-4 ${selectedBatchId === b.batchId ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{b.teaType}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{b.farmName}</span>
                        <span>·</span>
                        <Scale className="w-3 h-3" />
                        <span>{b.weightGram}g</span>
                        <span>·</span>
                        <Package className="w-3 h-3" />
                        <span>{b.quantity} gói</span>
                      </div>
                    </div>
                    {selectedBatchId === b.batchId && (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Giá / gói (₫) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="VD: 50000"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              {price && (
                <p className="text-xs text-emerald-600 mt-1">
                  ≈ {Number(price).toLocaleString('vi-VN')}₫
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Số gói muốn bán <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  max={selectedBatch?.quantity}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="Số gói"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              {selectedBatch && (
                <p className="text-xs text-gray-400 mt-1">Tổng: {selectedBatch.quantity} gói</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Số điện thoại liên hệ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Mô tả thêm <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="VD: Chè búp non hái tháng 3, có thể giao tận nơi..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>
          </div>

          {/* Bank info section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Thông tin ngân hàng</h3>
                <p className="text-xs text-gray-600">Để khách hàng có thể chuyển khoản (tuỳ chọn)</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tên ngân hàng
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="VD: Vietcombank, Techcombank..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Số tài khoản
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    placeholder="VD: 1234567890"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Chủ tài khoản
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={bankOwner}
                    onChange={e => setBankOwner(e.target.value)}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white uppercase"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 mt-3">
                <AlertCircle className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  {bankName ? (
                    <>Thông tin này được lấy từ <span className="font-bold">profile</span> của bạn. Bạn có thể chỉnh sửa riêng cho sản phẩm này hoặc cập nhật trong profile để áp dụng cho tất cả sản phẩm.</>
                  ) : (
                    <>Bạn chưa cấu hình thông tin ngân hàng trong <span className="font-bold">profile</span>. Hãy điền ở đây hoặc cập nhật trong profile để tự động áp dụng cho các sản phẩm sau.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || batches.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang đăng…</>
            ) : (
              <><ShoppingBag className="w-4 h-4" /> Đăng bán ngay <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </Layout>
  )
}
