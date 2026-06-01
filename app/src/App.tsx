import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import Accounts from '@/pages/Accounts'
import Analytics from '@/pages/Analytics'
import Budgets from '@/pages/Budgets'
import Goals from '@/pages/Goals'
import Recurring from '@/pages/Recurring'
import Settings from '@/pages/Settings'
import Help from '@/pages/Help'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-8 h-8 border-3 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="goals" element={<Goals />} />
        <Route path="recurring" element={<Recurring />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
