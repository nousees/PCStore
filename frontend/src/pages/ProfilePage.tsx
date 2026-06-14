import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Package, Lock, LogOut } from 'lucide-react';
import { authApi, ordersApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { PageLoader } from '../components/Loader';
import { formatPrice, formatDate } from '../utils/format';
import { ORDER_STATUS_LABELS } from '../types';

type Tab = 'profile' | 'orders' | 'password';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.me().then((r) => r.data),
    enabled: !!user,
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.myOrders().then((r) => r.data),
    enabled: !!user && tab === 'orders',
  });

  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });

  useEffect(() => {
    if (profile) {
      setProfileForm({ name: profile.name, phone: profile.phone, address: profile.address });
    }
  }, [profile]);

  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <PageLoader />;

  const currentProfile = profile || user;

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await authApi.updateProfile(profileForm.name ? profileForm : {
        name: currentProfile.name,
        phone: currentProfile.phone,
        address: currentProfile.address,
      });
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Профиль обновлён');
    } catch {
      toast.error('Ошибка обновления профиля');
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error('Пароли не совпадают');
      return;
    }
    try {
      await authApi.changePassword(passwordForm.current, passwordForm.newPass);
      toast.success('Пароль изменён');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch {
      toast.error('Неверный текущий пароль');
    }
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
    toast.success('Вы вышли из аккаунта');
    navigate('/login', { replace: true });
  };

  const tabs = [
    { id: 'profile' as Tab, label: 'Профиль', icon: User },
    { id: 'orders' as Tab, label: 'Заказы', icon: Package },
    { id: 'password' as Tab, label: 'Пароль', icon: Lock },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Личный кабинет</h1>
        <button onClick={handleLogout} className="btn-secondary text-red-600">
          <LogOut className="h-4 w-4" /> Выйти
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              tab === id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form
          onSubmit={updateProfile}
          className="card space-y-4"
          onFocus={() => {
            if (!profileForm.name) {
              setProfileForm({
                name: currentProfile.name,
                phone: currentProfile.phone,
                address: currentProfile.address,
              });
            }
          }}
        >
          <div>
            <label className="label">Email</label>
            <input value={currentProfile.email} disabled className="input opacity-60" />
          </div>
          <div>
            <label className="label">Имя</label>
            <input
              defaultValue={currentProfile.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Телефон</label>
            <input
              defaultValue={currentProfile.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Адрес</label>
            <textarea
              defaultValue={currentProfile.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              className="input"
              rows={2}
            />
          </div>
          <button type="submit" className="btn-primary">Сохранить</button>
        </form>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          {!orders?.length ? (
            <div className="card py-12 text-center text-gray-500">Заказов пока нет</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">Заказ #{order.id}</span>
                  <span className="rounded-lg bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{formatDate(order.created_at)}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span>{formatPrice(item.price_at_time * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-bold text-primary-600">{formatPrice(order.total)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={changePassword} className="card max-w-md space-y-4">
          <div>
            <label className="label">Текущий пароль</label>
            <input
              required
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Новый пароль</label>
            <input
              required
              type="password"
              minLength={6}
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Подтверждение</label>
            <input
              required
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary">Изменить пароль</button>
        </form>
      )}
    </div>
  );
}
