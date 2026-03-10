import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, MapPin, Phone, Leaf, Search, ArrowRight,
  CheckCircle2, Package, Scale, ChevronDown, Shield,
  Sprout, Star, X, SlidersHorizontal, LogIn, TrendingUp,
  Award, Clock, LayoutDashboard, ShoppingCart, CreditCard,
  Plus, Minus, Info, ExternalLink
} from 'lucide-react'
import { listingApi, orderApi, Listing, OrderResult } from '../api/client'
import Toast, { ToastType } from '../components/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('vi-VN') + '₫'
}

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000
  if (diff < 60) return 'Vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

// Tea type → gradient + accent
const TEA_THEME: Record<string, { grad: string; badge: string; dot: string; shadow: string }> = {
  green:  { 
    grad: 'from-emerald-400 via-green-500 to-teal-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    shadow: 'shadow-emerald-500/20'
  },
  oolong: { 
    grad: 'from-amber-400 via-yellow-500 to-orange-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    shadow: 'shadow-amber-500/20'
  },
  black:  { 
    grad: 'from-orange-500 via-red-500 to-rose-600',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    shadow: 'shadow-orange-500/20'
  },
  lotus:  { 
    grad: 'from-pink-400 via-rose-500 to-purple-500',
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    dot: 'bg-pink-500',
    shadow: 'shadow-pink-500/20'
  },
  default:{ 
    grad: 'from-emerald-400 via-teal-500 to-cyan-500',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    shadow: 'shadow-teal-500/20'
  },
}

function getTheme(type: string) {
  const t = type.toLowerCase()
  if (t.includes('xanh')) return TEA_THEME.green
  if (t.includes('ô long') || t.includes('oolong')) return TEA_THEME.oolong
  if (t.includes('đen') || t.includes('đỏ')) return TEA_THEME.black
  if (t.includes('sen') || t.includes('hoa')) return TEA_THEME.lotus
  return TEA_THEME.default
}

// ── Card ──────────────────────────────────────────────────────────────────────

function ListingCard({ l, onClick }: { l: Listing; onClick: () => void }) {
  const theme = getTheme(l.teaType)
  const isLowStock = l.quantityAvailable < 10
  
  return (
    <div 
      onClick={onClick}
      className={`group bg-white rounded-2xl overflow-hidden border border-gray-200/60 hover:border-gray-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col cursor-pointer ${theme.shadow}`}
    >

      {/* Illustration area */}
      <div className={`relative h-40 bg-gradient-to-br ${theme.grad} flex items-center justify-center overflow-hidden`}>
        {/* Animated background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/20 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute top-12 right-20 w-20 h-20 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-black/10 group-hover:scale-110 transition-transform duration-500" />
        </div>
        
        {/* Decorative leaf pattern */}
        <Leaf className="w-16 h-16 text-white/20 absolute -right-3 bottom-2 rotate-12 group-hover:rotate-[20deg] transition-transform duration-300" />
        <Leaf className="w-10 h-10 text-white/15 absolute left-4 top-4 -rotate-12 group-hover:-rotate-[20deg] transition-transform duration-300" />
        
        {/* Main icon */}
        <div className="relative z-10 flex flex-col items-center gap-2 group-hover:scale-110 transition-transform duration-300">
          <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/40 shadow-lg">
            <Sprout className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
        </div>
        
        {/* Price badge */}
        <div className="absolute top-3 right-3 bg-white/98 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg border border-white/50 group-hover:scale-105 transition-transform duration-200">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-gray-900">{fmt(l.price)}</span>
            <span className="text-[10px] text-gray-500 font-medium">/ gói</span>
          </div>
        </div>
        
        {/* Verified badge */}
        {l.verifyUrl && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-lg group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold text-white tracking-wide">XÁC THỰC</span>
          </div>
        )}
        
        {/* Low stock indicator */}
        {isLowStock && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-orange-500/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-lg animate-pulse">
            <TrendingUp className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold text-white">SẮP HẾT</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 gap-3.5">
        {/* Name + badge */}
        <div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${theme.badge} shadow-sm`}>
            <span className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse`} />
            {l.teaType}
          </span>
          <h3 className="mt-2 text-base font-extrabold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors">
            {l.farmName}
          </h3>
        </div>

        {/* Meta */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate font-medium">{l.location || '—'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Scale className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="font-semibold text-gray-700">{l.weightGram}g</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Package className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="font-semibold text-gray-700">{l.quantityAvailable} gói</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {l.description && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 bg-gray-50/50 rounded-lg px-3 py-2 border border-gray-100">
            {l.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3.5 border-t border-gray-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.grad} flex items-center justify-center shrink-0 shadow-md ${theme.shadow} group-hover:scale-110 transition-transform duration-200`}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate leading-tight">{l.agentName}</div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                <Clock className="w-3 h-3" />
                {timeAgo(l.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {l.verifyUrl && (
              <a
                href={l.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Xem nguồn gốc blockchain"
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 hover:scale-110"
              >
                <CheckCircle2 className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              className={`flex items-center gap-1.5 bg-gradient-to-r ${theme.grad} text-white text-xs font-bold px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 ${theme.shadow}`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chi tiết</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm animate-pulse">
      <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="p-5 space-y-3.5">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded-full" />
          <div className="h-5 w-3/4 bg-gray-200 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-100 rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 bg-gray-100 rounded-lg" />
            <div className="h-8 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div className="h-12 bg-gray-100 rounded-lg" />
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gray-200 rounded-full" />
            <div className="space-y-1">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-2 w-16 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-9 w-24 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ── Product Detail Modal ──────────────────────────────────────────────────────

interface CartItem {
  listing: Listing
  quantity: number
}

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

function ProductModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const theme = getTheme(listing.teaType)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  const totalPrice = listing.price * quantity

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type })
  }

  const addToCart = () => {
    const newCart = [...cart]
    const existingIndex = newCart.findIndex(item => item.listing.id === listing.id)
    
    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += quantity
    } else {
      newCart.push({ listing, quantity })
    }
    
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    
    // Dispatch custom event to update cart count
    window.dispatchEvent(new Event('cartUpdated'))
    
    // Show toast notification
    showToast(`Đã thêm ${quantity} gói ${listing.teaType} vào giỏ hàng!`, 'cart')
  }

  const buyNow = () => {
    addToCart()
    // Small delay to show toast before redirect
    setTimeout(() => {
      window.location.href = '/cart'
    }, 500)
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={`relative h-48 bg-gradient-to-br ${theme.grad} flex items-center justify-center overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/20" />
            <div className="absolute top-12 right-20 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-black/10" />
          </div>
          
          <Leaf className="w-20 h-20 text-white/20 absolute -right-3 bottom-2 rotate-12" />
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white/25 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/40 shadow-lg mx-auto mb-3">
              <Sprout className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h2 className="text-2xl font-black text-white drop-shadow-lg">{listing.farmName}</h2>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border bg-white/90 ${theme.badge} mt-2`}>
              <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
              {listing.teaType}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center text-white transition-all hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Verified badge */}
          {listing.verifyUrl && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-emerald-500/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white tracking-wide">XÁC THỰC</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Giá bán</p>
              <p className="text-3xl font-black text-emerald-600">{fmt(listing.price)}</p>
              <p className="text-xs text-gray-400">/ gói ({listing.weightGram}g)</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Còn lại</p>
              <p className="text-2xl font-bold text-gray-900">{listing.quantityAvailable}</p>
              <p className="text-xs text-gray-400">gói</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-semibold">Địa điểm</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{listing.location || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold">Đăng bán</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{timeAgo(listing.createdAt)}</p>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-500" />
                Mô tả sản phẩm
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Seller info */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
            <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Thông tin người bán
            </h3>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${theme.grad} flex items-center justify-center shadow-md ${theme.shadow}`}>
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{listing.agentName}</p>
                <p className="text-sm text-gray-600">{listing.farmName}</p>
              </div>
              <a
                href={`tel:${listing.contact}`}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-emerald-700 font-semibold px-4 py-2 rounded-xl border-2 border-emerald-200 transition-all hover:scale-105"
              >
                <Phone className="w-4 h-4" />
                Gọi ngay
              </a>
            </div>
          </div>

          {/* Blockchain verification */}
          {listing.verifyUrl && (
            <a
              href={listing.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Xác thực nguồn gốc</p>
                  <p className="text-xs text-blue-600">Xem lịch sử sản xuất trên blockchain</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </a>
          )}

          {/* Quantity selector */}
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
            <label className="text-sm font-bold text-gray-800 mb-3 block">Số lượng</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all font-bold text-lg disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={listing.quantityAvailable}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(listing.quantityAvailable, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center border-2 border-gray-300 rounded-xl py-2 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                />
                <button
                  onClick={() => setQuantity(Math.min(listing.quantityAvailable, quantity + 1))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all font-bold text-lg disabled:opacity-50"
                  disabled={quantity >= listing.quantityAvailable}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-500">Tổng tiền</p>
                <p className="text-2xl font-black text-emerald-600">{fmt(totalPrice)}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={addToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-emerald-700 font-bold px-6 py-4 rounded-xl border-2 border-emerald-500 transition-all hover:scale-105 shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Thêm vào giỏ
            </button>
            <button
              onClick={buyNow}
              className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r ${theme.grad} text-white font-bold px-6 py-4 rounded-xl transition-all hover:scale-105 shadow-lg ${theme.shadow} hover:shadow-xl`}
            >
              <CreditCard className="w-5 h-5" />
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Phone Lookup Modal ───────────────────────────────────────────────────────

function PhoneLookupModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<OrderResult[] | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = phone.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const res = await orderApi.searchByPhone(trimmed)
      setResults(res.data)
    } catch {
      setError('Không thể tra cứu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function fmt(n: number) {
    return n.toLocaleString('vi-VN') + '₫'
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-5 rounded-t-3xl flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-white">Tra cứu gói chè đã mua</h2>
            <p className="text-sm text-teal-100">Nhập số điện thoại để tìm đơn hàng đã xác nhận</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="VD: 0987654321"
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold px-5 py-3 rounded-xl transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Tìm
            </button>
          </div>
        </form>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {error && (
            <p className="text-sm text-red-500 text-center py-4">{error}</p>
          )}

          {results !== null && results.length === 0 && (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400">Không tìm thấy đơn hàng nào</p>
              <p className="text-xs text-gray-400 mt-1">Kiểm tra lại số điện thoại hoặc đơn hàng chưa được xác nhận</p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-semibold">{results.length} đơn hàng đã xác nhận</p>
              {results.map(order => (
                <div key={order.id} className="border-2 border-teal-100 rounded-2xl p-4 bg-teal-50/40 space-y-3">
                  {/* Tea info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shrink-0">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {order.teaType || 'Chè'}{order.farmName ? ` — ${order.farmName}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.quantity} gói{order.weightGram ? ` × ${order.weightGram}g` : ''}
                        {' · '}{fmt(order.totalPrice)}
                        {' · '}{fmtDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Package hash */}
                  {order.packageHash && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Package Hash:</p>
                      <p className="text-xs font-mono text-teal-700 break-all bg-white rounded-lg px-2 py-1 border border-teal-200">
                        {order.packageHash}
                      </p>
                    </div>
                  )}

                  {/* Verify link */}
                  {order.packageHash && (
                    <a
                      href={`/verify/${order.packageHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 px-4 py-2 rounded-xl transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Xem nguồn gốc & thông tin gói chè
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {results === null && !loading && !error && (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nhập số điện thoại để tra cứu gói chè bạn đã mua</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [showPhoneLookup, setShowPhoneLookup] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('token')

  useEffect(() => {
    listingApi.list()
      .then(r => setListings(r.data))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [])

  // Update cart count
  useEffect(() => {
    const updateCartCount = () => {
      const saved = localStorage.getItem('cart')
      if (saved) {
        const cart = JSON.parse(saved)
        const total = cart.reduce((sum: number, item: any) => sum + item.quantity, 0)
        setCartCount(total)
      } else {
        setCartCount(0)
      }
    }
    
    updateCartCount()
    
    // Listen for storage changes
    window.addEventListener('storage', updateCartCount)
    
    // Custom event for same-page updates
    const handleCartUpdate = () => updateCartCount()
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  // Unique tea types for filter pills
  const teaTypes = Array.from(new Set(listings.map(l => l.teaType))).slice(0, 6)

  const filtered = listings.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || (
      l.teaType.toLowerCase().includes(q) ||
      l.farmName.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q) ||
      l.agentName.toLowerCase().includes(q)
    )
    const matchFilter = activeFilter === 'all' || l.teaType === activeFilter
    return matchSearch && matchFilter
  })

  const shown = filtered.slice(0, visible)

  function resetFilters() {
    setSearch('')
    setActiveFilter('all')
    setVisible(PAGE_SIZE)
  }

  const isFiltered = search !== '' || activeFilter !== 'all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans">

      {/* Product Detail Modal */}
      {selectedListing && (
        <ProductModal 
          listing={selectedListing} 
          onClose={() => setSelectedListing(null)} 
        />
      )}

      {/* Phone Lookup Modal */}
      {showPhoneLookup && (
        <PhoneLookupModal onClose={() => setShowPhoneLookup(false)} />
      )}

      {/* ── Top navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all duration-300 group-hover:scale-105">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-base font-black text-gray-900 tracking-tight">Chè Sạch</div>
              <div className="text-[10px] text-gray-500 font-medium">Tùng Dương Tea</div>
            </div>
          </Link>

          {/* Search bar – center */}
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setVisible(PAGE_SIZE) }}
                placeholder="Tìm loại chè, trang trại, vùng miền..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-100/80 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:bg-white transition-all placeholder-gray-400"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowPhoneLookup(true)}
              title="Tra cứu gói chè đã mua theo SĐT"
              className="shrink-0 flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 hover:border-teal-300 font-semibold text-xs px-3 py-2.5 rounded-xl transition-all"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden lg:inline">Tra cứu SĐT</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Cart icon */}
            <Link
              to="/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50/50 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/listings/new"
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng bán</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50/50 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng bán</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-16 right-1/3 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
          {/* Animated particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-emerald-300/40 rounded-full animate-pulse" />
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-teal-300/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            {/* Label */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 mb-6 shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span className="text-xs font-bold text-emerald-50 tracking-wide">CHỢ CHÈ SẠCH TRỰC TUYẾN</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4 tracking-tight">
              Chè ngon từ trang trại<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200">
                đến tay bạn
              </span>
            </h1>
            <p className="text-emerald-50/95 text-base sm:text-lg leading-relaxed max-w-xl mb-8">
              Mua trực tiếp từ nông hộ — không qua trung gian. Mỗi sản phẩm đều có hồ sơ truy xuất nguồn gốc đầy đủ trên blockchain.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Shield className="w-4 h-4" />, text: 'Nguồn gốc blockchain', color: 'from-emerald-500 to-teal-600' },
                { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Xác thực từng gói', color: 'from-teal-500 to-cyan-600' },
                { icon: <Award className="w-4 h-4" />, text: '100% nông hộ thật', color: 'from-cyan-500 to-blue-600' },
              ].map(b => (
                <div key={b.text} className={`flex items-center gap-2 bg-gradient-to-r ${b.color} rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:scale-105 transition-transform duration-200`}>
                  {b.icon} {b.text}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 flex flex-wrap gap-4">
              <button 
                onClick={() => searchRef.current?.focus()}
                className="flex items-center gap-2 bg-white text-emerald-700 px-6 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                <Search className="w-5 h-5" />
                Khám phá ngay
              </button>
              <Link
                to="/listings/new"
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-6 py-3.5 rounded-xl font-bold text-base hover:bg-white/20 transition-all duration-200"
              >
                <ShoppingBag className="w-5 h-5" />
                Bán chè của bạn
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-600 hidden sm:inline">Lọc:</span>
          </div>
          <button
            onClick={() => { setActiveFilter('all'); setVisible(PAGE_SIZE) }}
            className={`shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
            }`}
          >
            Tất cả
          </button>
          {teaTypes.map(type => {
            const theme = getTheme(type)
            return (
              <button
                key={type}
                onClick={() => { setActiveFilter(type); setVisible(PAGE_SIZE) }}
                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap ${
                  activeFilter === type
                    ? `bg-gradient-to-r ${theme.grad} text-white shadow-lg ${theme.shadow} scale-105`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                {type}
              </button>
            )
          })}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg ml-auto transition-all"
            >
              <X className="w-4 h-4" /> Xoá bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {loading ? (
              <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-base font-bold text-gray-900">
                  {filtered.length === 0 ? 'Không tìm thấy sản phẩm' : (
                    <>
                      <span className="text-2xl text-emerald-600">{filtered.length}</span>
                      <span className="text-gray-600 ml-2">sản phẩm</span>
                    </>
                  )}
                </p>
                {filtered.length > 0 && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                    Đã xác thực
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Sprout className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-sm text-gray-400 mb-6">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
            {isFiltered && (
              <button 
                onClick={resetFilters} 
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
                Xoá bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shown.map(l => (
                <ListingCard 
                  key={l.id} 
                  l={l} 
                  onClick={() => setSelectedListing(l)} 
                />
              ))}
            </div>

            {filtered.length > visible && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setVisible(v => v + PAGE_SIZE)}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-400 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <ChevronDown className="w-5 h-5" />
                  Xem thêm {filtered.length - visible} sản phẩm
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="leading-tight">
                  <div className="text-base font-black text-gray-900">Chè Sạch</div>
                  <div className="text-xs text-gray-500 font-medium">Tùng Dương Tea</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nền tảng kết nối trực tiếp người trồng chè và người tiêu dùng, đảm bảo nguồn gốc rõ ràng qua công nghệ blockchain.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">Liên kết</h4>
              <div className="space-y-2">
                <Link to="/login" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                  Đăng nhập đại lý
                </Link>
                <Link to="/listings/new" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                  Đăng bán sản phẩm
                </Link>
                <a href="#" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                  Về chúng tôi
                </a>
                <a href="#" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                  Liên hệ
                </a>
              </div>
            </div>

            {/* Trust */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">Cam kết</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Nguồn gốc xác thực blockchain</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">100% từ nông hộ</span>
                </div>
                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Chất lượng đảm bảo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2026 Tùng Dương Tea. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-emerald-600 transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Bảo mật</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

