import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../utils/format';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold">Корзина пуста</h1>
        <p className="mt-2 text-gray-500">Добавьте товары из каталога</p>
        <Link to="/catalog" className="btn-primary mt-6 inline-flex">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Корзина</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div key={item.productId} className="card flex gap-4">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
              />
              <div className="flex flex-1 flex-col">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-lg font-bold text-primary-600">{formatPrice(item.price)}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="rounded-lg border p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="rounded-lg border p-1 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit sticky top-24">
          <h2 className="text-lg font-semibold">Итого</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Товаров:</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold dark:border-gray-700">
              <span>Сумма:</span>
              <span className="text-primary-600">{formatPrice(totalPrice())}</span>
            </div>
          </div>
          <Link to="/checkout" className="btn-primary mt-6 w-full">
            Оформить заказ
          </Link>
          <Link to="/catalog" className="btn-secondary mt-3 w-full">
            Продолжить покупки
          </Link>
        </div>
      </div>
    </div>
  );
}
