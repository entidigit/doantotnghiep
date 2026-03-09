import { Link, useLocation } from 'react-router-dom'
import { Leaf, LogOut, Plus, LayoutDashboard, User, ChevronRight, ShieldCheck, ShoppingBag, Store } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { agent, logout, isAdmin } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 glass border-b border-white/40 shadow-sm shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:shadow-emerald-600/50 transition-all">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-extrabold tracking-tight text-gradient">Chè Sạch</div>
              <div className="text-[10px] text-gray-400 leading-none -mt-0.5">Tùng Dương Tea</div>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/dashboard')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              to="/batches/new"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/batches/new')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo lô mới</span>
            </Link>
            <Link
              to="/shop"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/shop')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Chợ chè</span>
            </Link>
            <Link
              to="/listings/mine"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/listings/mine')
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng bán</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin/users"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-violet-600 hover:bg-violet-50 border border-violet-200/60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-2 shrink-0">
            <Link 
              to="/profile"
              className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-200 hover:bg-emerald-50 rounded-lg px-2 py-1 transition-all group"
              title="Xem thông tin cá nhân"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="leading-none">
                <div className="text-xs font-semibold text-gray-800 truncate max-w-[120px] group-hover:text-emerald-700 transition-colors">
                  {agent?.farmName || agent?.username}
                </div>
                <div className="text-[10px] text-gray-400">{isAdmin ? 'Admin' : 'Đại lý'}</div>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb (only for sub-pages) */}
      {location.pathname !== '/' && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Link to="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600">
              {location.pathname.includes('/batches/new')
                ? 'Tạo lô chè'
                : 'Chi tiết lô chè'}
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-white/60 bg-white/40 backdrop-blur-sm">
        <span className="inline-flex items-center gap-1.5">
          <Leaf className="w-3 h-3 text-emerald-500" />
          Tùng Dương Tea — Dữ liệu lưu trên blockchain IBN
        </span>
      </footer>
    </div>
  )
}
