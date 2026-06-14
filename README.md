# PCShop — Интернет-магазин компьютеров и комплектующих

Полнофункциональный интернет-магазин с React-фронтендом, Go-бэкендом (чистая архитектура) и PostgreSQL.

## Стек технологий

| Компонент | Технологии |
|-----------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand, React Router v6, Axios |
| Backend | Go 1.22, Gin, JWT, bcrypt, чистая архитектура |
| База данных | PostgreSQL 16 |
| Инфраструктура | Docker, Docker Compose, Nginx, golang-migrate |

## Быстрый старт

### Требования

- [Docker](https://docs.docker.com/get-docker/) и Docker Compose v2+

### Запуск

```bash
git clone <repository-url>
cd PCShop
docker-compose up --build
```

После сборки сервисы будут доступны:

| Сервис | URL |
|--------|-----|
| Frontend (магазин) | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| Health check | http://localhost:8080/health |
| PostgreSQL | localhost:5432 |

### pgAdmin (опционально)

```bash
docker-compose --profile tools up --build
```

pgAdmin: http://localhost:5050

## Учётные данные

### Администратор

- **Email:** `admin@shop.ru`
- **Пароль:** `admin123`

Админ-панель: http://localhost:3000/admin

### База данных

- **User:** `pcshop`
- **Password:** `pcshop123`
- **Database:** `pcshop`

## Функциональность

### Публичная часть

- **Главная** — слайдер акций, популярные товары, категории
- **Каталог** — фильтрация по цене, производителю, категории; пагинация и сортировка
- **Корзина** — добавление, изменение количества, удаление (localStorage + Zustand)
- **Оформление заказа** — для авторизованных и гостей
- **О нас** — информация о магазине, карта проезда
- **Контакты** — форма обратной связи, телефон, email, соцсети
- **Личный кабинет** — профиль, история заказов, смена пароля
- **Тёмная/светлая тема** — переключатель в шапке

### Админ-панель (`/admin`)

- CRUD товаров (название, цена, количество, описание, фото URL, категория, производитель)
- Просмотр и изменение статуса заказов (новый / оплачен / отправлен)
- Список пользователей

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/password

GET    /api/products?page=1&limit=12&category=cpu&sort=price_asc&manufacturer=Intel
GET    /api/products/:id

POST   /api/cart/validate

POST   /api/orders
GET    /api/orders

POST   /api/contact

GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
GET    /api/admin/orders
PUT    /api/admin/orders/:id/status
GET    /api/admin/users
```

## Структура проекта

```
PCShop/
├── docker-compose.yml
├── .env
├── README.md
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── handlers/
│   │   ├── services/
│   │   ├── repository/
│   │   ├── models/
│   │   └── middleware/
│   ├── pkg/jwt/
│   ├── migrations/
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── pages/
    │   ├── store/
    │   └── types/
    ├── Dockerfile
    └── nginx.conf
```

## Seed-данные

При первом запуске автоматически создаются:

- Администратор `admin@shop.ru`
- 16 товаров (процессоры, видеокарты, ОЗУ, материнские платы, БП, корпуса, готовые ПК)

## Переменные окружения

Скопируйте `.env.example` в `.env` и при необходимости измените значения:

```bash
cp .env.example .env
```

## Разработка без Docker

### Backend

```bash
cd backend
go mod download
# Запустите PostgreSQL локально и задайте DATABASE_URL
go run ./cmd/server
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Лицензия

MIT
