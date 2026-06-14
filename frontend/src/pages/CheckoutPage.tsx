import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../api';
import { formatPrice } from '../utils/format';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    customer_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      ordersApi.create({
        ...form,
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      }),
    onSuccess: () => {
      clearCart();
      toast.success('Заказ успешно оформлен!');
      navigate(user ? '/profile' : '/');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Ошибка при оформлении заказа');
    },
  });

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Оформление заказа</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold">Контактные данные</h2>
          <div>
            <label className="label">ФИО *</label>
            <input
              required
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Телефон *</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="+7 (___) ___-__-__"
            />
          </div>
          <div>
            <label className="label">Адрес доставки *</label>
            <textarea
              required
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold">Ваш заказ</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold dark:border-gray-700">
            <span>Итого:</span>
            <span className="text-primary-600">{formatPrice(totalPrice())}</span>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? 'Оформление...' : 'Подтвердить заказ'}
        </button>
      </form>
    </div>
  );
}
