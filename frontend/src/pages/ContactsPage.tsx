import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { contactApi } from '../api';

export default function ContactsPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const mutation = useMutation({
    mutationFn: () => contactApi.send(form),
    onSuccess: () => {
      toast.success('Сообщение отправлено!');
      setForm({ name: '', email: '', subject: '', message: '' });
    },
    onError: () => toast.error('Не удалось отправить сообщение'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Контакты</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold">Свяжитесь с нами</h2>
            <ul className="mt-4 space-y-4">
              <li className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="font-medium">+7 (495) 123-45-67</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">info@pcshop.ru</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Адрес</p>
                  <p className="font-medium">г. Москва, ул. Тверская, д. 1</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card">
            <h2 className="font-semibold">Мы в соцсетях</h2>
            <div className="mt-4 flex gap-3">
              {['VK', 'Telegram', 'YouTube'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium transition hover:bg-primary-100 hover:text-primary-600 dark:bg-gray-700 dark:hover:bg-primary-900/30"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-semibold">Форма обратной связи</h2>
          <div>
            <label className="label">Имя *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            <label className="label">Тема</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Сообщение *</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="input"
            />
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
            <Send className="h-4 w-4" />
            {mutation.isPending ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
}
