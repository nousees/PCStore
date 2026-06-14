import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { PageLoader } from '../components/Loader';
import { productsApi } from '../api';
import { CATEGORY_LABELS, MANUFACTURERS, type ProductCategory } from '../types';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const page = Number(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const manufacturer = searchParams.get('manufacturer') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  const filters = {
    page,
    limit: 12,
    ...(category && { category }),
    ...(manufacturer && { manufacturer }),
    ...(search && { search }),
    ...(sort && { sort }),
    ...(minPrice && { min_price: Number(minPrice) }),
    ...(maxPrice && { max_price: Number(maxPrice) }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.list(filters).then((r) => r.data),
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (localMin) params.set('min_price', localMin);
    else params.delete('min_price');
    if (localMax) params.set('max_price', localMax);
    else params.delete('max_price');
    params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setLocalMin('');
    setLocalMax('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Каталог</h1>
        {search && (
          <p className="mt-2 text-gray-500">
            Результаты поиска: «{search}» — найдено {data?.total ?? 0} товаров
          </p>
        )}
      </div>

      <div className="flex gap-8">
        <aside className={`${showFilters ? 'block' : 'hidden'} w-full shrink-0 md:block md:w-64`}>
          <div className="card sticky top-24 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Фильтры</h2>
              <button onClick={clearFilters} className="text-xs text-primary-600 hover:underline">
                Сбросить
              </button>
            </div>

            <div>
              <label className="label">Категория</label>
              <select
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
                className="input"
              >
                <option value="">Все категории</option>
                {(Object.entries(CATEGORY_LABELS) as [ProductCategory, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Производитель</label>
              <select
                value={manufacturer}
                onChange={(e) => updateParam('manufacturer', e.target.value)}
                className="input"
              >
                <option value="">Все производители</option>
                {MANUFACTURERS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Цена, ₽</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="От"
                  value={localMin}
                  onChange={(e) => setLocalMin(e.target.value)}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="До"
                  value={localMax}
                  onChange={(e) => setLocalMax(e.target.value)}
                  className="input"
                />
              </div>
              <button onClick={applyPriceFilter} className="btn-secondary mt-2 w-full text-xs">
                Применить
              </button>
            </div>

            <div>
              <label className="label">Сортировка</label>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input"
              >
                <option value="">По умолчанию</option>
                <option value="price_asc">Цена: по возрастанию</option>
                <option value="price_desc">Цена: по убыванию</option>
                <option value="name_asc">Название: А-Я</option>
                <option value="name_desc">Название: Я-А</option>
              </select>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary mb-4 md:hidden"
          >
            <Filter className="h-4 w-4" /> Фильтры
          </button>

          {isLoading ? (
            <PageLoader />
          ) : data?.items.length === 0 ? (
            <div className="card py-16 text-center text-gray-500">
              Товары не найдены. Попробуйте изменить фильтры.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data?.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {data && data.total_pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                    className="btn-secondary"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm">
                    Страница {page} из {data.total_pages}
                  </span>
                  <button
                    disabled={page >= data.total_pages}
                    onClick={() => updateParam('page', String(page + 1))}
                    className="btn-secondary"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
