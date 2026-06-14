import { api } from './client';
import type { User, TokenPair, PaginatedProducts, ProductFilters, Product, Order } from '../types';

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post<{ user: User; tokens: TokenPair }>('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post<{ user: User; tokens: TokenPair }>('/auth/login', { email, password }),

  me: () => api.get<User>('/auth/me'),

  updateProfile: (data: { name: string; phone: string; address: string }) =>
    api.put<User>('/auth/profile', data),

  changePassword: (current_password: string, new_password: string) =>
    api.put('/auth/password', { current_password, new_password }),
};

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    api.get<PaginatedProducts>('/products', { params: filters }),

  get: (id: number) => api.get<Product>(`/products/${id}`),
};

export const ordersApi = {
  create: (data: {
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    items: { product_id: number; quantity: number }[];
  }) => api.post<Order>('/orders', data),

  myOrders: () => api.get<Order[]>('/orders'),
};

export const cartApi = {
  validate: (items: { product_id: number; quantity: number }[]) =>
    api.post('/cart/validate', { items }),
};

export const contactApi = {
  send: (data: { name: string; email: string; subject: string; message: string }) =>
    api.post('/contact', data),
};

export const adminApi = {
  products: {
    list: (filters: ProductFilters = {}) =>
      api.get<PaginatedProducts>('/admin/products', { params: { ...filters, limit: 100 } }),
    create: (product: Partial<Product>) => api.post<Product>('/admin/products', product),
    update: (id: number, product: Partial<Product>) =>
      api.put<Product>(`/admin/products/${id}`, product),
    delete: (id: number) => api.delete(`/admin/products/${id}`),
  },
  orders: {
    list: () => api.get<Order[]>('/admin/orders'),
    updateStatus: (id: number, status: string) =>
      api.put<Order>(`/admin/orders/${id}/status`, { status }),
  },
  users: {
    list: () => api.get<User[]>('/admin/users'),
  },
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ url: string; filename: string }>('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
