import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, CircuitBoard, MemoryStick, Zap } from 'lucide-react';
import PromoSlider from '../components/PromoSlider';
import ProductCard from '../components/ProductCard';
import { PageLoader } from '../components/Loader';
import { productsApi } from '../api';

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => productsApi.list({ popular: true, limit: 8 }).then((r) => r.data),
  });

  const categories = [
    { icon: Cpu, label: 'Процессоры', category: 'cpu', color: 'bg-blue-500' },
    { icon: CircuitBoard, label: 'Видеокарты', category: 'gpu', color: 'bg-green-500' },
    { icon: MemoryStick, label: 'ОЗУ', category: 'ram', color: 'bg-purple-500' },
    { icon: Zap, label: 'Готовые ПК', category: 'pc', color: 'bg-orange-500' },
  ];

  return (
    <div className="animate-fade-in">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PromoSlider />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            Добро пожаловать в <span className="text-primary-600">PCShop</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
            Ваш надёжный партнёр в мире компьютерных технологий. Широкий ассортимент комплектующих
            и готовых сборок от ведущих производителей.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map(({ icon: Icon, label, category, color }) => (
            <Link
              key={category}
              to={`/catalog?category=${category}`}
              className="card group flex flex-col items-center gap-3 text-center transition-transform hover:-translate-y-1"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color} text-white transition-transform group-hover:scale-110`}>
                <Icon className="h-7 w-7" />
              </div>
              <span className="font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-100 py-12 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Популярные товары</h2>
            <Link to="/catalog" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
              Весь каталог <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { title: 'Быстрая доставка', desc: 'Доставка по Москве за 1-2 дня, по России — от 3 дней' },
            { title: 'Гарантия качества', desc: 'Официальная гарантия на все товары от производителей' },
            { title: 'Поддержка 24/7', desc: 'Консультации по подбору комплектующих и сборке ПК' },
          ].map((item) => (
            <div key={item.title} className="card text-center">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
