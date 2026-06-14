import { Link } from 'react-router-dom';
import { Monitor, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Monitor className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">PCShop</span>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Интернет-магазин компьютеров и комплектующих. Качество, надёжность и лучшие цены.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Навигация</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/" className="hover:text-primary-600">Главная</Link></li>
              <li><Link to="/catalog" className="hover:text-primary-600">Каталог</Link></li>
              <li><Link to="/about" className="hover:text-primary-600">О нас</Link></li>
              <li><Link to="/contacts" className="hover:text-primary-600">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Категории</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/catalog?category=cpu" className="hover:text-primary-600">Процессоры</Link></li>
              <li><Link to="/catalog?category=gpu" className="hover:text-primary-600">Видеокарты</Link></li>
              <li><Link to="/catalog?category=ram" className="hover:text-primary-600">ОЗУ</Link></li>
              <li><Link to="/catalog?category=pc" className="hover:text-primary-600">Готовые ПК</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Контакты</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                +7 (495) 123-45-67
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                info@pcshop.ru
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                г. Москва, ул. Тверская, д. 1
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          © {new Date().getFullYear()} PCShop. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
