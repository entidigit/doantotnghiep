import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard,
  Package, Leaf, MapPin, AlertCircle, CheckCircle2,
  ShoppingBag, X, Shield, User, MapPinned, MessageSquare,
  Wallet, Truck, Clock, Building2, Copy, Mail
} from 'lucide-react'
import { Listing, authApi, listingApi, orderApi, batchApi, Agent } from '../api/client'
import Toast, { ToastType } from '../components/Toast'

interface CartItem {
  listing: Listing
  quantity: number
}

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

interface ConfirmDialogState {
  show: boolean
  message: string
  onConfirm: () => void
}

function getTheme(type: string) {
  const t = type.toLowerCase()
  if (t.includes('xanh')) return 'from-emerald-400 via-green-500 to-teal-500'
  if (t.includes('ô long') || t.includes('oolong')) return 'from-amber-400 via-yellow-500 to-orange-500'
  if (t.includes('đen') || t.includes('đỏ')) return 'from-orange-500 via-red-500 to-rose-600'
  if (t.includes('sen') || t.includes('hoa')) return 'from-pink-400 via-rose-500 to-purple-500'
  return 'from-emerald-400 via-teal-500 to-cyan-500'
}

function fmt(n: number) {
  return n.toLocaleString('vi-VN') + '₫'
}

export default function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ 
    show: false, 
    message: '', 
    onConfirm: () => {} 
  })

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      setCart(JSON.parse(saved))
    }
  }, [])

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type })
  }

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const updateQuantity = (listingId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.listing.id === listingId) {
        const newQty = Math.max(1, Math.min(item.listing.quantityAvailable, item.quantity + delta))
        return { ...item, quantity: newQty }
      }
      return item
    })
    updateCart(newCart)
  }

  const removeItem = (listingId: string) => {
    const newCart = cart.filter(item => item.listing.id !== listingId)
    updateCart(newCart)
    showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info')
  }

  const clearCart = () => {
    setConfirmDialog({
      show: true,
      message: 'Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?',
      onConfirm: () => {
        updateCart([])
        showToast('Đã xóa tất cả sản phẩm', 'info')
        setConfirmDialog({ ...confirmDialog, show: false })
      }
    })
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0)

  if (showCheckout) {
    return <CheckoutPage cart={cart} onBack={() => setShowCheckout(false)} onSuccess={() => {
      updateCart([])
      navigate('/')
    }} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Xác nhận</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all duration-300 group-hover:scale-105">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-base font-black text-gray-900 tracking-tight">Chè Sạch</div>
              <div className="text-[10px] text-gray-500 font-medium">Tùng Dương Tea</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Tiếp tục mua
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Giỏ hàng</h1>
              <p className="text-sm text-gray-500">
                {cart.length === 0 ? 'Chưa có sản phẩm nào' : `${totalItems} sản phẩm`}
              </p>
            </div>
          </div>
        </div>

        {cart.length === 0 ? (
          /* Empty cart */
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-400 mb-2">Giỏ hàng trống</h2>
            <p className="text-sm text-gray-400 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
            >
              <ShoppingBag className="w-5 h-5" />
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Sản phẩm ({cart.length})</h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa tất cả
                </button>
              </div>

              {cart.map((item) => {
                const theme = getTheme(item.listing.teaType)
                const itemTotal = item.listing.price * item.quantity
                
                return (
                  <div key={item.listing.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all">
                    <div className="flex gap-4">
                      {/* Product image/icon */}
                      <div className={`w-24 h-24 rounded-xl bg-gradient-to-br ${theme} flex items-center justify-center shrink-0 shadow-md`}>
                        <Leaf className="w-10 h-10 text-white" />
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{item.listing.farmName}</h3>
                            <p className="text-sm text-gray-500">{item.listing.teaType}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.listing.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <Package className="w-3.5 h-3.5" />
                          <span>{item.listing.weightGram}g / gói</span>
                          <span>•</span>
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.listing.location}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity selector */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.listing.id, -1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-bold text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.listing.id, 1)}
                              disabled={item.quantity >= item.listing.quantityAvailable}
                              className="w-8 h-8 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{fmt(item.listing.price)} x {item.quantity}</p>
                            <p className="text-lg font-black text-emerald-600">{fmt(itemTotal)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính ({totalItems} sản phẩm)</span>
                    <span className="font-semibold text-gray-900">{fmt(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-semibold text-emerald-600">Miễn phí</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">Tổng cộng</span>
                      <span className="text-2xl font-black text-emerald-600">{fmt(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
                >
                  <CreditCard className="w-5 h-5" />
                  Tiến hành thanh toán
                </button>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Thanh toán an toàn & bảo mật</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Nguồn gốc xác thực blockchain</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Checkout Page ─────────────────────────────────────────────────────────────

function CheckoutPage({ 
  cart, 
  onBack, 
  onSuccess 
}: { 
  cart: CartItem[]
  onBack: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    note: '',
    paymentMethod: 'cod'
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [sellerAgent, setSellerAgent] = useState<Agent | null>(null)
  const [loadingAgent, setLoadingAgent] = useState(true)

  // Fetch seller's agent info to get real-time bank details
  useEffect(() => {
    if (cart.length > 0) {
      // Refresh listing data from server to get latest bank info
      const refreshListings = async () => {
        try {
          const listingIds = cart.map(item => item.listing.id)
          const updates = await Promise.all(
            listingIds.map(id => listingApi.get(id))
          )
          
          // Update cart with fresh listing data
          const refreshedCart = cart.map((item, index) => ({
            ...item,
            listing: updates[index].data
          }))
          
          // Update localStorage
          localStorage.setItem('cart', JSON.stringify(refreshedCart))
          window.dispatchEvent(new Event('cartUpdated'))
        } catch (err) {
          console.error('Failed to refresh listings:', err)
        } finally {
          setLoadingAgent(false)
        }
      }
      refreshListings()
    }
  }, [])

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast(`Đã sao chép ${label}`, 'success')
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0)

  // Get bank info from listing (which should have latest info from agent profile)
  const bankInfo = {
    bankName: cart[0]?.listing.bankName,
    bankAccount: cart[0]?.listing.bankAccount,
    bankOwner: cart[0]?.listing.bankOwner,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (form.paymentMethod === 'bank') {
      // Chuyển sang bước upload ảnh thanh toán
      setShowPaymentUpload(true)
      return
    }

    // COD flow
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => {
      onSuccess()
    }, 3000)
  }

  const [showPaymentUpload, setShowPaymentUpload] = useState(false)
  const [paymentImage, setPaymentImage] = useState<File | null>(null)
  const [paymentImagePreview, setPaymentImagePreview] = useState<string>('')
  const [uploadingPayment, setUploadingPayment] = useState(false)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Ảnh không được vượt quá 10MB', 'error')
        return
      }
      setPaymentImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePaymentUpload = async () => {
    if (!paymentImage) {
      showToast('Vui lòng chọn ảnh chứng từ thanh toán', 'error')
      return
    }

    setUploadingPayment(true)
    
    try {
      // Tạo order cho từng item trong giỏ hàng
      // Lưu ý: Hiện tại chỉ support 1 listing/order, nếu có nhiều item cần tạo nhiều order
      const firstItem = cart[0]
      
      // Lấy danh sách packages từ batch
      const packagesRes = await batchApi.listPackages(firstItem.listing.batchId)
      const allPackages = packagesRes.data
      
      if (!allPackages || allPackages.length === 0) {
        showToast('Không tìm thấy gói chè. Vui lòng liên hệ người bán.', 'error')
        setUploadingPayment(false)
        return
      }
      
      // Lấy danh sách packages đã bán
      let soldPackageHashes: string[] = []
      try {
        const soldRes = await orderApi.getSoldPackages(firstItem.listing.batchId)
        soldPackageHashes = soldRes.data
      } catch (err) {
        // Nếu API chưa có, bỏ qua và chọn package đầu tiên
        console.warn('getSoldPackages not available, using first package')
      }
      
      // Chọn package chưa được bán
      const availablePackage = allPackages.find(
        pkg => !soldPackageHashes.includes(pkg.packageHash)
      ) || allPackages[0] // Fallback to first package
      
      const orderData = {
        listingId: firstItem.listing.id,
        packageHash: availablePackage.packageHash,
        buyerName: form.name,
        buyerPhone: form.phone,
        buyerAddress: form.address,
        buyerEmail: form.email || '',
        quantity: firstItem.quantity
      }
      
      const orderRes = await orderApi.create(orderData)
      await orderApi.uploadPayment(orderRes.data.id, paymentImage)
      
      setSuccess(true)
      showToast('Đã gửi thông tin thanh toán. Vui lòng chờ đại lý xác nhận.', 'success')
      
      setTimeout(() => {
        onSuccess()
      }, 3000)
    } catch (err: any) {
      console.error('Payment upload error:', err)
      showToast(err.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error')
    } finally {
      setUploadingPayment(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {form.paymentMethod === 'bank' ? 'Đã gửi thông tin thanh toán!' : 'Đặt hàng thành công!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {form.paymentMethod === 'bank' 
              ? 'Đại lý sẽ xác nhận thanh toán và liên hệ với bạn sớm nhất.'
              : 'Cảm ơn bạn đã đặt hàng. Người bán sẽ liên hệ với bạn sớm nhất.'
            }
          </p>
          <div className="bg-white rounded-2xl border border-emerald-200 p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Mã đơn hàng</p>
            <p className="text-lg font-bold text-emerald-600">#{Date.now().toString(36).toUpperCase()}</p>
          </div>
          <p className="text-sm text-gray-400">Đang chuyển về trang chủ...</p>
        </div>
      </div>
    )
  }

  // Payment upload screen
  if (showPaymentUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30">
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-base font-black text-gray-900">Xác nhận thanh toán</div>
                <div className="text-[10px] text-gray-500 font-medium">Tùng Dương Tea</div>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentUpload(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-emerald-600">Giỏ hàng</span>
              </div>
              <div className="w-12 h-0.5 bg-emerald-500" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-emerald-600">Thanh toán</span>
              </div>
              <div className="w-12 h-0.5 bg-emerald-500" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span className="text-sm font-bold text-emerald-600">Xác nhận</span>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Gửi ảnh chứng từ thanh toán</h2>
                  <p className="text-sm text-blue-100 font-medium">Vui lòng chụp ảnh hoá đơn chuyển khoản</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-900 leading-relaxed">
                    <p className="font-bold mb-2">Hướng dẫn:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Chụp ảnh rõ nét hoá đơn chuyển khoản từ app ngân hàng</li>
                      <li>Đảm bảo thông tin số tiền, ngày giờ hiển thị đầy đủ</li>
                      <li>Ảnh định dạng JPG, PNG hoặc WEBP, tối đa 10MB</li>
                      <li>Đại lý sẽ xác nhận trong vòng 24h</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Ảnh chứng từ thanh toán <span className="text-red-500">*</span>
                </label>
                
                {!paymentImagePreview ? (
                  <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 mb-1">Nhấn để chọn ảnh</p>
                    <p className="text-xs text-gray-500">JPG, PNG hoặc WEBP (tối đa 10MB)</p>
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={paymentImagePreview}
                      alt="Payment proof"
                      className="w-full rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentImage(null)
                        setPaymentImagePreview('')
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-all shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Người nhận:</span>
                  <span className="font-bold text-gray-900">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số điện thoại:</span>
                  <span className="font-bold text-gray-900">{form.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-bold text-emerald-600 text-lg">{fmt(totalPrice)}</span>
                </div>
              </div>

              <button
                onClick={handlePaymentUpload}
                disabled={!paymentImage || uploadingPayment}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-6 py-4 rounded-xl transition-all shadow-lg hover:scale-105"
              >
                {uploadingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Xác nhận và gửi
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30">
      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-black text-gray-900">Thanh toán</div>
              <div className="text-[10px] text-gray-500 font-medium">Tùng Dương Tea</div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-emerald-600">Giỏ hàng</span>
            </div>
            <div className="w-12 h-0.5 bg-emerald-500" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="text-sm font-bold text-emerald-600">Thanh toán</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span className="text-sm font-medium text-gray-400">Hoàn tất</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer info */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Thông tin nhận hàng</h2>
                    <p className="text-xs text-emerald-100 font-medium">Vui lòng điền đầy đủ thông tin</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Nhập họ và tên"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="Nhập số điện thoại"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                    <MapPinned className="w-4 h-4 text-emerald-600" />
                    Địa chỉ nhận hàng <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                    placeholder="Nhập địa chỉ chi tiết"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email (tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="Nhập email để nhận thông báo"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={form.note}
                    onChange={e => setForm({...form, note: e.target.value})}
                    placeholder="Ghi chú thêm cho người bán..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Phương thức thanh toán</h2>
                    <p className="text-xs text-teal-100 font-medium">Chọn cách thanh toán phù hợp</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* COD Option */}
                <label className={`group flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer hover:shadow-md transition-all ${
                  form.paymentMethod === 'cod' 
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50' 
                    : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={form.paymentMethod === 'cod'}
                    onChange={e => setForm({...form, paymentMethod: e.target.value})}
                    className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        form.paymentMethod === 'cod' ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        <Truck className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-black text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Thanh toán bằng tiền mặt khi nhận hàng. Bạn có thể kiểm tra sản phẩm trước khi thanh toán.
                    </p>
                    {form.paymentMethod === 'cod' && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-emerald-700 bg-white/60 rounded-lg px-3 py-2 w-fit">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-semibold">Giao hàng trong 2-3 ngày</span>
                      </div>
                    )}
                  </div>
                </label>

                {/* Bank Transfer Option */}
                <label className={`group flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer hover:shadow-md transition-all ${
                  form.paymentMethod === 'bank' 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={form.paymentMethod === 'bank'}
                    onChange={e => setForm({...form, paymentMethod: e.target.value})}
                    className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        form.paymentMethod === 'bank' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-black text-gray-900">Chuyển khoản ngân hàng</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      Chuyển khoản trực tiếp qua ngân hàng. Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán.
                    </p>
                    
                    {form.paymentMethod === 'bank' && (
                      <div className="bg-white rounded-xl border-2 border-blue-200 p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5 text-white" />
                          </div>
                          <p className="font-bold text-gray-900 text-sm">Thông tin chuyển khoản</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Ngân hàng</p>
                              <p className="text-sm font-bold text-gray-900">
                                {bankInfo.bankName || 'Chưa cập nhật'}
                              </p>
                            </div>
                            {bankInfo.bankName && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(bankInfo.bankName!, 'tên ngân hàng')}
                                className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-100 rounded-lg transition-all"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Số tài khoản</p>
                              <p className="text-sm font-bold text-gray-900 font-mono">
                                {bankInfo.bankAccount || 'Chưa cập nhật'}
                              </p>
                            </div>
                            {bankInfo.bankAccount && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(bankInfo.bankAccount!, 'số tài khoản')}
                                className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-100 rounded-lg transition-all"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Chủ tài khoản</p>
                              <p className="text-sm font-bold text-gray-900">
                                {bankInfo.bankOwner || 'Chưa cập nhật'}
                              </p>
                            </div>
                            {bankInfo.bankOwner && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(bankInfo.bankOwner!, 'tên chủ tài khoản')}
                                className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-100 rounded-lg transition-all"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-3 py-2 border-2 border-blue-200">
                            <div>
                              <p className="text-xs text-blue-600 font-bold">Số tiền</p>
                              <p className="text-base font-black text-blue-700">{fmt(totalPrice)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(totalPrice.toString(), 'số tiền')}
                              className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-100 rounded-lg transition-all"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {!bankInfo.bankName && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                              <span className="font-bold">Lưu ý:</span> Người bán chưa cập nhật thông tin ngân hàng. Vui lòng liên hệ trực tiếp qua số điện thoại: <span className="font-bold">{cart[0]?.listing.contact}</span>
                            </p>
                          </div>
                        )}
                        
                        {bankInfo.bankName && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                              <span className="font-bold">Lưu ý:</span> Vui lòng ghi rõ nội dung chuyển khoản là <span className="font-bold">số điện thoại</span> của bạn để người bán xác nhận đơn hàng nhanh chóng.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg sticky top-24">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-black text-white">Đơn hàng</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-2">
                  {cart.map(item => {
                    const theme = getTheme(item.listing.teaType)
                    return (
                      <div key={item.listing.id} className="flex gap-3 text-sm bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${theme} flex items-center justify-center shrink-0 shadow-md`}>
                          <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate text-sm">{item.listing.farmName}</p>
                          <p className="text-xs text-gray-500 mb-1">{item.listing.teaType}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-semibold">SL: {item.quantity}</span>
                            <span className="font-black text-emerald-600 text-sm">{fmt(item.listing.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t-2 border-gray-200 pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Tạm tính</span>
                    <span className="font-bold text-gray-900">{fmt(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Phí vận chuyển</span>
                    <span className="font-bold text-emerald-600">Miễn phí</span>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-gray-900">Tổng cộng</span>
                      <span className="text-2xl font-black text-emerald-600">{fmt(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-6 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Đặt hàng ngay
                    </>
                  )}
                </button>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">Thanh toán an toàn & bảo mật</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">Nguồn gốc xác thực blockchain</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Truck className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">Miễn phí vận chuyển toàn quốc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
