import { useState, useEffect } from 'react'
import { 
  Package, CheckCircle2, XCircle, Clock, Eye, 
  User, Phone, MapPin, CreditCard, AlertCircle,
  Image as ImageIcon, X, Leaf, ExternalLink
} from 'lucide-react'
import { orderApi, type Order } from '../api/client'
import Toast, { ToastType } from '../components/Toast'

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

function fmt(n: number) {
  return n.toLocaleString('vi-VN') + '₫'
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [confirming, setConfirming] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await orderApi.listForAgent()
      setOrders(res.data)
    } catch (err) {
      console.error('Load orders error:', err)
      showToast('Không thể tải danh sách đơn hàng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type })
  }

  const handleConfirm = async (order: Order) => {
    setConfirming(true)
    try {
      await orderApi.confirm(order.id)
      
      showToast('Đã xác nhận thanh toán. Thông tin người mua đã được ghi lên blockchain.', 'success')
      setSelectedOrder(null)
      loadOrders()
    } catch (err: any) {
      console.error('Confirm error:', err)
      showToast(err.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error')
    } finally {
      setConfirming(false)
    }
  }

  const handleReject = async (order: Order) => {
    setRejecting(true)
    try {
      await orderApi.reject(order.id)
      
      showToast('Đã từ chối đơn hàng', 'info')
      setSelectedOrder(null)
      loadOrders()
    } catch (err: any) {
      console.error('Reject error:', err)
      showToast(err.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error')
    } finally {
      setRejecting(false)
    }
  }

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            <Clock className="w-3 h-3" />
            Chờ thanh toán
          </span>
        )
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            <AlertCircle className="w-3 h-3" />
            Chờ xác nhận
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Đã xác nhận
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            <XCircle className="w-3 h-3" />
            Đã từ chối
          </span>
        )
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'paid')
  const completedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'rejected')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Image modal */}
      {showImageModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedOrder.paymentImage}
              alt="Payment proof"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && !showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Chi tiết đơn hàng</h2>
                <p className="text-sm text-blue-100">#{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Trạng thái</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Buyer info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  Thông tin người mua
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Họ tên:</span>
                    <span className="font-bold text-gray-900">{selectedOrder.buyerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số điện thoại:</span>
                    <span className="font-bold text-gray-900">{selectedOrder.buyerPhone}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-gray-600">Địa chỉ:</span>
                    <span className="font-bold text-gray-900 text-right max-w-xs">{selectedOrder.buyerAddress}</span>
                  </div>
                </div>
              </div>

              {/* Order info */}
              <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số lượng:</span>
                    <span className="font-bold text-gray-900">{selectedOrder.quantity} gói</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="font-bold text-emerald-600 text-lg">{fmt(selectedOrder.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đặt:</span>
                    <span className="font-bold text-gray-900">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Payment image */}
              {selectedOrder.paymentImage && (
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Ảnh chứng từ thanh toán
                  </h3>
                  <div 
                    className="relative rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-all group"
                    onClick={() => setShowImageModal(true)}
                  >
                    <img
                      src={selectedOrder.paymentImage}
                      alt="Payment proof"
                      className="w-full"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                      <div className="w-12 h-12 bg-white/0 group-hover:bg-white/90 rounded-full flex items-center justify-center transition-all">
                        <Eye className="w-6 h-6 text-transparent group-hover:text-gray-900 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tea package info */}
              {selectedOrder.packageHash && (
                <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <Leaf className="w-4 h-4 text-teal-600" />
                    Gói chè tương ứng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Package Hash:</p>
                      <p className="text-xs font-mono text-teal-700 break-all bg-white rounded px-2 py-1">
                        {selectedOrder.packageHash}
                      </p>
                    </div>
                    <a
                      href={`/verify/${selectedOrder.packageHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Xem trang xác minh gói chè
                    </a>
                  </div>
                </div>
              )}

              {/* Blockchain info */}
              {selectedOrder.buyerTxHash && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <Leaf className="w-4 h-4 text-purple-600" />
                    Blockchain Transaction
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">TX Hash:</p>
                  <p className="text-xs font-mono text-purple-700 break-all bg-white rounded px-2 py-1">
                    {selectedOrder.buyerTxHash}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedOrder.status === 'paid' && (
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    onClick={() => handleReject(selectedOrder)}
                    disabled={rejecting || confirming}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {rejecting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Từ chối
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleConfirm(selectedOrder)}
                    disabled={confirming || rejecting}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50"
                  >
                    {confirming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang xác nhận...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Xác nhận đã nhận tiền
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Quản lý đơn hàng</h1>
              <p className="text-sm text-gray-500">
                {pendingOrders.length} đơn chờ xác nhận
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-400 mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-sm text-gray-400">Đơn hàng sẽ hiển thị ở đây khi có người mua</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending orders */}
            {pendingOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Chờ xác nhận ({pendingOrders.length})
                </h2>
                <div className="grid gap-4">
                  {pendingOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border-2 border-blue-200 p-5 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(order.status)}
                            <span className="text-xs text-gray-500">#{order.id}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg">{order.buyerName}</h3>
                          <p className="text-sm text-gray-600">{order.buyerPhone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Tổng tiền</p>
                          <p className="text-xl font-black text-emerald-600">{fmt(order.totalPrice)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {order.quantity} gói
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed orders */}
            {completedOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Đã xử lý ({completedOrders.length})
                </h2>
                <div className="grid gap-4">
                  {completedOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer opacity-75 hover:opacity-100"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(order.status)}
                            <span className="text-xs text-gray-500">#{order.id}</span>
                          </div>
                          <h3 className="font-bold text-gray-900">{order.buyerName}</h3>
                          <p className="text-sm text-gray-600">{order.buyerPhone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Tổng tiền</p>
                          <p className="text-lg font-black text-gray-700">{fmt(order.totalPrice)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {order.quantity} gói
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
