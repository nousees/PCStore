import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { productsApi } from '../api';
import { PageLoader } from '../components/Loader';
import { useCartStore } from '../store/cartStore';
import { CATEGORY_LABELS } from '../types';
import { formatPrice } from '../utils/format';

export default function ProductPage() {
  const { id } = useParams();
  const productId = Number(id);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId).then((r) => r.data),
    enabled: Number.isFinite(productId) && productId > 0,
  });

  if (!Number.isFinite(productId) || productId <= 0) return <Navigate to="/catalog" replace />;
  if (isLoading) return <PageLoader />;

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="card py-12">
          <h1 className="text-2xl font-bold">Товар не найден</h1>
          <p className="mt-2 text-gray-500">Возможно, он был удалён или ссылка устарела.</p>
          <Link to="/catalog" className="btn-primary mt-6">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  const maxQuantity = Math.max(1, product.stock);
  const canBuy = product.stock > 0;

  const handleAdd = () => {
    if (!canBuy) {
      toast.error('Товар отсутствует на складе');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      stock: product.stock,
      quantity,
    });
    toast.success('Товар добавлен в корзину');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/catalog"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-primary-600 dark:text-gray-400"
      >
        <ArrowLeft className="h-4 w-4" /> Назад в каталог
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="aspect-square bg-gray-100 dark:bg-gray-900">
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {CATEGORY_LABELS[product.category]}
            </span>
            <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
              {product.manufacturer}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight">{product.name}</h1>
          <p className="mt-4 text-3xl font-extrabold text-primary-600">{formatPrice(product.price)}</p>

          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-900">
            <p className={canBuy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {canBuy ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
            </p>
          </div>

          <div className="mt-6">
            <label className="label">Количество</label>
            <div className="flex w-40 items-center rounded-xl border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={!canBuy || quantity <= 1}
                className="p-3 text-gray-500 transition hover:text-primary-600 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                disabled={!canBuy}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setQuantity(Math.max(1, Math.min(Number.isFinite(next) ? next : 1, maxQuantity)));
                }}
                className="w-full bg-transparent text-center text-sm font-semibold outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                disabled={!canBuy || quantity >= maxQuantity}
                className="p-3 text-gray-500 transition hover:text-primary-600 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button onClick={handleAdd} disabled={!canBuy} className="btn-primary mt-6 w-full">
            <ShoppingCart className="h-5 w-5" /> В корзину
          </button>
        </aside>
      </div>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-bold">Описание</h2>
        <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">{product.description}</p>
      </section>
    </div>
  );
}
