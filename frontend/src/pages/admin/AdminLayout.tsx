import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/admin', end: true, label: 'Дашборд', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Товары', icon: Package },
  { to: '/admin/orders', label: 'Заказы', icon: ShoppingCart },
  { to: '/admin/users', label: 'Пользователи', icon: Users },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout();
    queryClient.clear();
    toast.success('Вы вышли из аккаунта');
    navigate('/login', { replace: true });
  };

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-gray-900 text-white dark:border-gray-700">
        <div className="flex h-16 items-center gap-2 border-b border-gray-700 px-6">
          <LayoutDashboard className="h-6 w-6 text-primary-400" />
          <span className="text-lg font-bold">PCShop Admin</span>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {navItems.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 w-full space-y-1 px-3">
          <NavLink
            to="/"
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> На сайт
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-red-300 hover:bg-red-950/40 hover:text-red-100"
          >
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
