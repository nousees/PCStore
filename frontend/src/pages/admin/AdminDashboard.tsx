import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { adminApi } from '../../api';
import { PageLoader } from '../../components/Loader';
import { formatPrice } from '../../utils/format';

export default function AdminDashboard() {
  const { data: products, isLoading: lp } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => adminApi.products.list().then((r) => r.data),
  });

  const { data: orders, isLoading: lo } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminApi.orders.list().then((r) => r.data),
  });

  const { data: users, isLoading: lu } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users.list().then((r) => r.data),
  });

  if (lp || lo || lu) return <PageLoader />;

  const newOrders = orders?.filter((o) => o.status === 'new').length ?? 0;
  const totalRevenue = orders?.reduce((s, o) => s + o.total, 0) ?? 0;

  const stats = [
    { label: 'Товаров', value: products?.total ?? 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Заказов', value: orders?.length ?? 0, icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Новых заказов', value: newOrders, icon: TrendingUp, color: 'bg-orange-500' },
    { label: 'Пользователей', value: users?.length ?? 0, icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Дашборд</h1>
      <p className="mt-1 text-gray-500">Обзор магазина PCShop</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 text-3xl font-bold">{value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold">Общая выручка</h2>
        <p className="mt-2 text-3xl font-bold text-primary-600">{formatPrice(totalRevenue)}</p>
      </div>
    </div>
  );
}
