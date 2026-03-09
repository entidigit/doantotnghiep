import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Plus, Trash2, CheckCircle, XCircle,
  Package, DollarSign, Phone, AlertCircle, Loader2, Edit2, Save, X
} from 'lucide-react'
import Layout from '../components/Layout'
import { listingApi, authApi, Listing } from '../api/client'
import Toast, { ToastType } from '../components/Toast'

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

function fmt(n: number) {
  return n.toLocaleString('vi-VN') + '₫'
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: 'Đang bán', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  sold: { label: 'Đã bán hết', className: 'bg-gray-100 text-gray-500 border border-gray-200' },
  closed: { label: 'Đã đóng', className: 'bg-red-50 text-red-500 border border-red-200' },
}

function EditRow({
  listing,
  onSaved,
  onCancel,
}: {
  listing: Listing
  onSaved: (updated: Listing) => void
  onCancel: () => void
}) {
  const [price, setPrice] = useState(String(listing.price))
  const [qty, setQty] = useState(String(listing.quantityAvailable))
  const [contact, setContact] = useState(listing.contact)
  const [desc, setDesc] = useState(listing.description)
  const [bankName, setBankName] = useState(listing.bankName || '')
  const [bankAccount, setBankAccount] = useState(listing.bankAccount || '')
  const [bankOwner, setBankOwner] = useState(listing.bankOwner || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // Load agent profile to get latest bank info if listing doesn't have it
  useEffect(() => {
    if (!listing.bankName) {
      authApi.me().then(r => {
        setBankName(r.data.bankName || '')
        setBankAccount(r.data.bankAccount || '')
        setBankOwner(r.data.bankOwner || '')
      })
    }
  }, [listing.bankName])

  async function save() {
    if (!price || Number(price) <= 0) { setErr('Giá không hợp lệ'); return }
    if (!qty || Number(qty) <= 0) { setErr('Số lượng không hợp lệ'); return }
    setSaving(true)
    try {
      const r = await listingApi.update(listing.id, {
        price: Number(price),
        quantityAvailable: Number(qty),
        contact,
        description: desc,
        bankName: bankName.trim() || undefined,
        bankAccount: bankAccount.trim() || undefined,
        bankOwner: bankOwner.trim() || undefined,
      })
      onSaved(r.data)
    } catch {
      setErr('Có lỗi, thử lại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Giá (₫/gói)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Số gói còn bán</label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-1 block">SĐT liên hệ</label>
        <input type="tel" value={contact} onChange={e => setContact(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-1 block">Mô tả</label>
        <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
      </div>
      
      {/* Bank info section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-blue-900">Thông tin ngân hàng (tuỳ chọn)</p>
          {!listing.bankName && (
            <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-semibold">
              Từ profile
            </span>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Tên ngân hàng</label>
          <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
            placeholder="VD: Vietcombank"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Số tài khoản</label>
          <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)}
            placeholder="VD: 1234567890"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-mono" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Chủ tài khoản</label>
          <input type="text" value={bankOwner} onChange={e => setBankOwner(e.target.value)}
            placeholder="VD: NGUYEN VAN A"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white uppercase" />
        </div>
      </div>
      
      {err && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{err}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          <X className="w-3.5 h-3.5" /> Huỷ
        </button>
        <button onClick={save} disabled={saving} className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Lưu
        </button>
      </div>
    </div>
  )
}

function ListingItem({
  listing,
  onUpdate,
  onDelete,
  onConfirm,
  onToast,
}: {
  listing: Listing
  onUpdate: (updated: Listing) => void
  onDelete: (id: string) => void
  onConfirm: (message: string, callback: () => void) => void
  onToast: (message: string, type: ToastType) => void
}) {
  const [editing, setEditing] = useState(false)
  const [closingId, setClosingId] = useState('')

  async function toggleStatus() {
    const newStatus = listing.status === 'active' ? 'closed' : 'active'
    setClosingId(listing.id)
    try {
      const r = await listingApi.update(listing.id, { status: newStatus as any })
      onUpdate(r.data)
      onToast(`Đã ${newStatus === 'closed' ? 'đóng' : 'mở'} tin đăng`, 'success')
    } catch {
      onToast('Có lỗi xảy ra', 'error')
    } finally {
      setClosingId('')
    }
  }

  async function del() {
    onConfirm('Xoá tin đăng này?', async () => {
      try {
        await listingApi.delete(listing.id)
        onDelete(listing.id)
        onToast('Đã xóa tin đăng', 'success')
      } catch {
        onToast('Có lỗi xảy ra', 'error')
      }
    })
  }

  const st = STATUS_LABEL[listing.status] ?? STATUS_LABEL.active

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-gray-900">{listing.teaType}</div>
          <div className="text-sm text-gray-500">{listing.farmName}</div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.className}`}>
          {st.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Giá / gói</div>
          <div className="text-sm font-bold text-emerald-600 mt-0.5">{fmt(listing.price)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Còn bán</div>
          <div className="text-sm font-bold text-gray-800 mt-0.5">{listing.quantityAvailable} gói</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">SĐT</div>
          <div className="text-sm font-bold text-gray-800 mt-0.5 truncate">{listing.contact || '—'}</div>
        </div>
      </div>

      {listing.description && (
        <p className="text-xs text-gray-500 leading-relaxed">{listing.description}</p>
      )}

      {/* Edit form */}
      {editing && (
        <EditRow
          listing={listing}
          onSaved={u => { onUpdate(u); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Sửa
          </button>
          <button
            onClick={toggleStatus}
            disabled={closingId === listing.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              listing.status === 'active'
                ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            {closingId === listing.id
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : listing.status === 'active'
                ? <><XCircle className="w-3.5 h-3.5" /> Tạm đóng</>
                : <><CheckCircle className="w-3.5 h-3.5" /> Mở lại</>
            }
          </button>
          <button
            onClick={del}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-200 hover:bg-red-50 rounded-lg transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xoá
          </button>
        </div>
      )}
    </div>
  )
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ 
    show: false, 
    message: '', 
    onConfirm: () => {} 
  })

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type })
  }

  useEffect(() => {
    listingApi.mine()
      .then(r => setListings(r.data))
      .finally(() => setLoading(false))
  }, [])

  function handleUpdate(updated: Listing) {
    setListings(prev => prev.map(l => l.id === updated.id ? updated : l))
  }

  function handleDelete(id: string) {
    setListings(prev => prev.filter(l => l.id !== id))
  }

  async function syncBankInfo() {
    setConfirmDialog({
      show: true,
      message: 'Đồng bộ thông tin ngân hàng từ profile cho tất cả sản phẩm?',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, show: false })
        setSyncing(true)
        try {
          const agent = await authApi.me()
          const { bankName, bankAccount, bankOwner } = agent.data
          
          const updates = listings.map(listing => 
            listingApi.update(listing.id, {
              bankName: bankName || undefined,
              bankAccount: bankAccount || undefined,
              bankOwner: bankOwner || undefined,
            })
          )
          
          const results = await Promise.all(updates)
          setListings(results.map(r => r.data))
          showToast('Đã đồng bộ thông tin ngân hàng cho tất cả sản phẩm!', 'success')
        } catch (err) {
          showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
        } finally {
          setSyncing(false)
        }
      }
    })
  }

  return (
    <Layout>
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
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-blue-600" />
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
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tin đăng bán của tôi</h1>
              <p className="text-sm text-gray-500">Quản lý sản phẩm đang rao bán</p>
            </div>
          </div>
          <Link
            to="/listings/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Đăng bán mới
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-500">Chưa có tin đăng nào</p>
            <p className="text-sm mt-1">Hãy đăng bán lô chè đầu tiên!</p>
            <Link
              to="/listings/new"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Đăng bán ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span><span className="font-semibold text-gray-800">{listings.length}</span> tin đăng</span>
                <span>·</span>
                <Phone className="w-3.5 h-3.5" />
                <span>{listings.filter(l => l.status === 'active').length} đang bán</span>
              </div>
              
              <button
                onClick={syncBankInfo}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all disabled:opacity-50"
                title="Cập nhật thông tin ngân hàng từ profile cho tất cả sản phẩm"
              >
                {syncing ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đồng bộ...</>
                ) : (
                  <>🔄 Đồng bộ thông tin NH</>
                )}
              </button>
            </div>
            {listings.map(l => (
              <ListingItem 
                key={l.id} 
                listing={l} 
                onUpdate={handleUpdate} 
                onDelete={handleDelete}
                onConfirm={(msg, cb) => setConfirmDialog({ show: true, message: msg, onConfirm: () => { setConfirmDialog({ ...confirmDialog, show: false }); cb() } })}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
