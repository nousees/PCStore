import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Product } from '../types';
import { formatPrice } from '../utils/format';
import { useCartStore } from '../store/cartStore';
import { CATEGORY_LABELS } from '../types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    if (product.stock <= 0) {
      toast.error('Товар отсутствует на складе');
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      stock: product.stock,
    });
    toast.success('Товар добавлен в корзину');
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-lg bg-primary-600/90 px-2 py-1 text-xs font-medium text-white">
          {CATEGORY_LABELS[product.category]}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">{product.manufacturer}</p>
        <Link
          to={`/products/${product.id}`}
          className="mt-1 line-clamp-2 flex-1 text-sm font-semibold leading-snug transition hover:text-primary-600"
        >
          {product.name}
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">{formatPrice(product.price)}</span>
          <span className="text-xs text-gray-500">
            {product.stock > 0 ? `В наличии: ${product.stock}` : 'Нет в наличии'}
          </span>
        </div>
        <button onClick={handleAdd} disabled={product.stock <= 0} className="btn-primary mt-3 w-full">
          <ShoppingCart className="h-4 w-4" />
          В корзину
        </button>
        <Link to={`/products/${product.id}`} className="mt-2 text-center text-sm font-medium text-primary-600 hover:underline">
          Подробнее
        </Link>
      </div>
    </article>
  );
}
