import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../api';
import { PageLoader } from '../../components/Loader';
import { formatPrice, formatDate } from '../../utils/format';
import { ORDER_STATUS_LABELS, type OrderStatus } from '../../types';

const statuses: OrderStatus[] = ['new', 'paid', 'shipped'];

export default function AdminOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminApi.orders.list().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.orders.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Статус обновлён');
    },
    onError: () => toast.error('Ошибка обновления статуса'),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Заказы</h1>

      <div className="mt-6 space-y-4">
        {!orders?.length ? (
          <div className="rounded-2xl border bg-white p-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800">
            Заказов пока нет
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">Заказ #{order.id}</h3>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  <p className="mt-2 text-sm">
                    <strong>{order.customer_name}</strong> — {order.guest_email}
                  </p>
                  <p className="text-sm text-gray-500">{order.phone}</p>
                  <p className="text-sm text-gray-500">{order.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary-600">{formatPrice(order.total)}</p>
                  <select
                    value={order.status}
                    onChange={(e) => mutation.mutate({ id: order.id, status: e.target.value })}
                    className="input mt-2 text-sm"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <ul className="mt-4 space-y-1 border-t pt-4 text-sm dark:border-gray-700">
                {order.items?.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>{formatPrice(item.price_at_time * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
