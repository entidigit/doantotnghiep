import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import DashboardPage from './pages/DashboardPage'
import BatchDetailPage from './pages/BatchDetailPage'
import CreateBatchPage from './pages/CreateBatchPage'
import VerifyPage from './pages/VerifyPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminBatchesPage from './pages/AdminBatchesPage'
import MarketplacePage from './pages/MarketplacePage'
import CreateListingPage from './pages/CreateListingPage'
import MyListingsPage from './pages/MyListingsPage'
import CartPage from './pages/CartPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/verify/:hash" element={<VerifyPage />} />
        {/* Public */}
        <Route path="/" element={<MarketplacePage />} />
        <Route path="/shop" element={<Navigate to="/" replace />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Agent routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/batches/new" element={<CreateBatchPage />} />
          <Route path="/batches/:id" element={<BatchDetailPage />} />
          <Route path="/listings/new" element={<CreateListingPage />} />
          <Route path="/listings/mine" element={<MyListingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/batches" element={<AdminBatchesPage />} />
        </Route>

        {/* Wildcard */}
        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
