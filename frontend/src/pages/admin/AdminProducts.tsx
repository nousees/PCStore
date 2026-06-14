import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ImageIcon, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { adminApi } from '../../api';
import { PageLoader } from '../../components/Loader';
import Modal from '../../components/Modal';
import { formatPrice } from '../../utils/format';
import { CATEGORY_LABELS, type Product, type ProductCategory } from '../../types';

const emptyProduct: Partial<Product> = {
  name: '',
  price: 0,
  stock: 0,
  description: '',
  image_url: '',
  category: 'cpu',
  manufacturer: '',
  popular: false,
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminApi.products.list().then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (product: Partial<Product>) =>
      product.id
        ? adminApi.products.update(product.id, product)
        : adminApi.products.create(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editing?.id ? 'Товар обновлён' : 'Товар создан');
      setModalOpen(false);
      setEditing(null);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Товар удалён');
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadImage(file),
    onSuccess: ({ data }) => {
      setEditing((current) => current ? { ...current, image_url: data.url } : current);
      toast.success('Изображение загружено');
    },
    onError: () => toast.error('Не удалось загрузить изображение'),
  });

  const openCreate = () => {
    setEditing({ ...emptyProduct });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing({ ...product });
    setModalOpen(true);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Товары</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Название</th>
              <th className="px-4 py-3 text-left">Категория</th>
              <th className="px-4 py-3 text-left">Цена</th>
              <th className="px-4 py-3 text-left">Склад</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-4 py-3">{product.id}</td>
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3">{CATEGORY_LABELS[product.category]}</td>
                <td className="px-4 py-3">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(product)} className="mr-2 text-primary-600 hover:text-primary-800">
                    <Pencil className="inline h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Удалить товар?')) deleteMutation.mutate(product.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="inline h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing?.id ? 'Редактировать товар' : 'Новый товар'}
        size="lg"
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate(editing);
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Название</label>
              <input
                required
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Цена</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={editing.price || 0}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Количество</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={editing.stock || 0}
                  onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                  className="input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Категория</label>
                <select
                  value={editing.category || 'cpu'}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value as ProductCategory })}
                  className="input"
                >
                  {(Object.entries(CATEGORY_LABELS) as [ProductCategory, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Производитель</label>
                <input
                  required
                  value={editing.manufacturer || ''}
                  onChange={(e) => setEditing({ ...editing, manufacturer: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">URL изображения или загрузка файла</label>
              <input
                value={editing.image_url || ''}
                onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                className="input"
                placeholder="https://... или /store/product.png"
              />
              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium transition hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700">
                  <Upload className="h-4 w-4" />
                  {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить картинку с устройства'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    disabled={uploadMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMutation.mutate(file);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                {editing.image_url ? (
                  <img
                    src={editing.image_url}
                    alt="Предпросмотр товара"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center gap-2 rounded-xl bg-gray-100 text-sm text-gray-500 dark:bg-gray-900">
                    <ImageIcon className="h-5 w-5" />
                    Изображение пока не выбрано
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="label">Описание</label>
              <textarea
                rows={3}
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="input"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.popular || false}
                onChange={(e) => setEditing({ ...editing, popular: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Популярный товар</span>
            </label>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary w-full">
              {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
