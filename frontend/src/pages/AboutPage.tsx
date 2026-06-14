import { MapPin, Clock, Award, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">О магазине PCShop</h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
          Мы — команда энтузиастов, которые любят технологии и помогают клиентам собирать
          идеальные компьютеры с 2018 года.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        {[
          { icon: Award, title: '5+ лет', desc: 'На рынке компьютерной техники' },
          { icon: Users, title: '10 000+', desc: 'Довольных клиентов' },
          { icon: Clock, title: '24/7', desc: 'Техническая поддержка' },
          { icon: MapPin, title: '50+', desc: 'Городов доставки по России' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card text-center">
            <Icon className="mx-auto h-10 w-10 text-primary-600" />
            <h3 className="mt-4 text-2xl font-bold">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold">Наша миссия</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            PCShop стремится сделать покупку компьютерной техники простой и приятной.
            Мы тщательно отбираем каждый товар, работаем только с проверенными поставщиками
            и предлагаем конкурентные цены. Наши специалисты помогут подобрать оптимальную
            конфигурацию под ваши задачи — будь то игры, работа или творчество.
          </p>
          <h3 className="mt-6 font-semibold">Контакты</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>📍 г. Москва, ул. Тверская, д. 1</li>
            <li>📞 +7 (495) 123-45-67</li>
            <li>✉️ info@pcshop.ru</li>
            <li>🕐 Пн-Вс: 10:00 — 22:00</li>
          </ul>
        </div>

        <div className="card overflow-hidden p-0">
          <h2 className="p-6 pb-0 text-xl font-bold">Как нас найти</h2>
          <div className="mt-4 aspect-video w-full bg-gray-200 dark:bg-gray-700">
            <iframe
              title="Карта проезда"
              src="https://www.openstreetmap.org/export/embed.html?bbox=37.595%2C55.755%2C37.625%2C55.765&layer=mapnik&marker=55.76%2C37.61"
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
          <p className="p-4 text-sm text-gray-500">
            Метро: Охотный ряд, Театральная. 5 минут пешком от станции.
          </p>
        </div>
      </div>
    </div>
  );
}
