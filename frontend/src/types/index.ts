export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export type ProductCategory =
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'motherboard'
  | 'psu'
  | 'case'
  | 'pc';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  image_url: string;
  category: ProductCategory;
  manufacturer: string;
  popular: boolean;
  created_at: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export type OrderStatus = 'new' | 'paid' | 'shipped';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_time: number;
  product_name?: string;
}

export interface Order {
  id: number;
  user_id?: number | null;
  guest_email: string;
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  items?: OrderItem[];
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  manufacturer?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort?: string;
  popular?: boolean;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  ram: 'ОЗУ',
  motherboard: 'Материнские платы',
  psu: 'Блоки питания',
  case: 'Корпуса',
  pc: 'Готовые ПК',
};

export const MANUFACTURERS = [
  'Intel',
  'AMD',
  'NVIDIA',
  'ASUS',
  'MSI',
  'Kingston',
  'G.Skill',
  'NZXT',
  'Fractal Design',
  'be quiet!',
  'Seasonic',
  'PCShop',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  paid: 'Оплачен',
  shipped: 'Отправлен',
};
