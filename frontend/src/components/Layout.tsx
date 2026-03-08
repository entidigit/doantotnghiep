import { Link, useLocation } from 'react-router-dom'
import { Leaf, LogOut, Plus, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { agent, logout } = useAuth()
  const location = useLocation()

  const navItem = (to: string, label: string, icon: React.ReactNode) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition ${
        location.pathname === to ? 'bg-tea-600' : 'hover:bg-tea-700'
      }`}
    >
      {icon}
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-tea-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Leaf className="w-5 h-5 text-tea-200" />
            <span className="hidden sm:inline">Chè Sạch</span>
          </Link>

          <nav className="flex items-center gap-2">
            {navItem('/', 'Lô chè', <LayoutDashboard className="w-4 h-4" />)}
            {navItem('/batches/new', 'Tạo lô', <Plus className="w-4 h-4" />)}

            <div className="border-l border-tea-600 ml-2 pl-3 flex items-center gap-2">
              <span className="text-sm text-tea-200 hidden md:inline truncate max-w-[140px]">
                {agent?.farmName || agent?.username}
              </span>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="flex items-center gap-1 text-sm px-2 py-1.5 rounded-md hover:bg-tea-700 hover:text-red-300 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t bg-white">
        🍵 Hệ thống xác thực nguồn gốc chè &nbsp;—&nbsp; Dữ liệu lưu trên blockchain IBN
      </footer>
    </div>
  )
}
