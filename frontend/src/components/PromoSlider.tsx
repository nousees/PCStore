import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  {
    title: 'Скидки до 20% на видеокарты NVIDIA',
    subtitle: 'Успейте купить RTX 4090 и RTX 4060 Ti по выгодным ценам',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200',
    link: '/catalog?category=gpu',
    cta: 'Смотреть видеокарты',
  },
  {
    title: 'Новые процессоры Intel 14-го поколения',
    subtitle: 'Максимальная производительность для игр и работы',
    image: '/store/hero-intel-cpu.svg',
    link: '/catalog?category=cpu&manufacturer=Intel',
    cta: 'Выбрать процессор',
  },
  {
    title: 'Готовые игровые ПК PCShop',
    subtitle: 'Собраны профессионалами — включил и играй',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=1200',
    link: '/catalog?category=pc',
    cta: 'Смотреть сборки',
  },
];

export default function PromoSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  const slide = slides[current];

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg">
      <div className="relative aspect-[21/9] min-h-[280px] md:min-h-[360px]">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>
        ))}
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
          <h2 className="max-w-xl text-2xl font-bold text-white md:text-4xl animate-fade-in">{slide.title}</h2>
          <p className="mt-3 max-w-lg text-sm text-gray-200 md:text-lg">{slide.subtitle}</p>
          <Link to={slide.link} className="btn-primary mt-6 w-fit">
            {slide.cta}
          </Link>
        </div>
      </div>
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
