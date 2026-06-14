# PCShop: устройство приложения

## Стек

| Слой | Технологии |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router v6, React Query, Zustand, Axios, TailwindCSS |
| Backend | Go, Gin, PostgreSQL driver, bcrypt, JWT |
| Database | PostgreSQL |
| Infrastructure | Docker Compose, Nginx, golang-migrate |

## Архитектура backend

Backend находится в папке `backend`.

Структура:

| Папка | Назначение |
| --- | --- |
| `cmd/server` | точка входа приложения |
| `internal/handlers` | HTTP handlers Gin |
| `internal/services` | бизнес-логика |
| `internal/repository` | SQL-запросы и работа с PostgreSQL |
| `internal/models` | доменные модели и DTO |
| `internal/middleware` | CORS, logging, auth, admin guard |
| `pkg/jwt` | генерация и проверка JWT |
| `migrations` | SQL-миграции |

Поток запроса:

```text
Gin route -> middleware -> handler -> service -> repository -> PostgreSQL
```

## Аутентификация

Регистрация и вход работают по email и паролю.

Пароли хешируются через bcrypt. После входа backend выдаёт пару токенов:

| Токен | Назначение |
| --- | --- |
| Access token | доступ к защищённым API |
| Refresh token | обновление access token |

Frontend хранит пользователя и токены в Zustand persist store `pcshop-auth`.

Админ определяется по роли `admin` в JWT и в записи пользователя.

## Роли

| Роль | Возможности |
| --- | --- |
| Гость | каталог, карточки товаров, корзина, оформление заказа с email |
| Пользователь | всё гостевое, личный кабинет, история заказов, профиль, смена пароля |
| Админ | CRUD товаров, загрузка картинок, пользователи, заказы, изменение статусов |

## Frontend

Frontend находится в папке `frontend`.

Основные части:

| Папка | Назначение |
| --- | --- |
| `src/api` | axios client и методы API |
| `src/components` | общие компоненты интерфейса |
| `src/pages` | страницы приложения |
| `src/pages/admin` | админ-панель |
| `src/store` | Zustand stores |
| `src/types` | TypeScript-типы |
| `public/store` | локальные и загруженные картинки товаров |

Маршруты:

| Маршрут | Назначение |
| --- | --- |
| `/` | главная |
| `/catalog` | каталог с фильтрами |
| `/products/:id` | карточка товара |
| `/cart` | корзина |
| `/checkout` | оформление заказа |
| `/about` | о магазине |
| `/contacts` | контакты |
| `/login` | вход |
| `/register` | регистрация |
| `/profile` | личный кабинет |
| `/admin` | админ-панель |
| `/admin/products` | товары |
| `/admin/orders` | заказы |
| `/admin/users` | пользователи |

## Корзина

Корзина хранится на frontend в Zustand persist store `pcshop-cart`.

Гость может добавлять товары без регистрации. При оформлении заказа frontend отправляет список товаров и контактные данные на backend.

Если пользователь авторизован, заказ сохраняется с `user_id`. Если нет, заказ сохраняется как гостевой с `guest_email`.

## Изображения товаров

У товара есть поле `image_url`.

Админ может:

- вставить внешний URL;
- загрузить файл с устройства.

Загрузка выполняется через `POST /api/admin/upload`. Backend сохраняет файл в `UPLOAD_DIR` и возвращает публичный путь:

```json
{
  "url": "/store/<filename>",
  "filename": "<filename>"
}
```

В Docker backend и frontend используют общий bind mount:

```text
./frontend/public/store
```

Backend пишет файлы в `/app/store`, Nginx отдаёт их из `/usr/share/nginx/html/store`.

## Статусы заказов

| Статус | Значение |
| --- | --- |
| `new` | новый |
| `paid` | оплачен |
| `shipped` | отправлен |

Backend валидирует статус перед обновлением.

## API

### Auth

| Метод | Endpoint | Доступ | Описание |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | public | регистрация |
| `POST` | `/api/auth/login` | public | вход |
| `POST` | `/api/auth/refresh` | public | обновление токенов |
| `GET` | `/api/auth/me` | user | текущий пользователь |
| `PUT` | `/api/auth/profile` | user | обновление профиля |
| `PUT` | `/api/auth/password` | user | смена пароля |

### Products

| Метод | Endpoint | Доступ | Описание |
| --- | --- | --- | --- |
| `GET` | `/api/products` | public | список товаров |
| `GET` | `/api/products/:id` | public | товар по id |

Поддерживаемые query-параметры каталога:

| Параметр | Пример |
| --- | --- |
| `page` | `1` |
| `limit` | `12` |
| `category` | `cpu` |
| `manufacturer` | `Intel` |
| `min_price` | `10000` |
| `max_price` | `50000` |
| `search` | `Ryzen` |
| `sort` | `price_asc`, `price_desc`, `name_asc`, `name_desc` |
| `popular` | `true` |

### Cart

| Метод | Endpoint | Доступ | Описание |
| --- | --- | --- | --- |
| `POST` | `/api/cart/validate` | public | проверка корзины и остатков |

### Orders

| Метод | Endpoint | Доступ | Описание |
| --- | --- | --- | --- |
| `POST` | `/api/orders` | public или user | создание заказа |
| `GET` | `/api/orders` | user | заказы текущего пользователя |

### Contacts

| Метод | Endpoint | Доступ | Описание |
| --- | --- | --- | --- |
| `POST` | `/api/contact` | public | отправка формы обратной связи |

### Admin

| Метод | Endpoint | Доступ | Описание |
| --- | --- | --- | --- |
| `GET` | `/api/admin/products` | admin | список товаров |
| `POST` | `/api/admin/products` | admin | создание товара |
| `PUT` | `/api/admin/products/:id` | admin | обновление товара |
| `DELETE` | `/api/admin/products/:id` | admin | удаление товара |
| `POST` | `/api/admin/upload` | admin | загрузка картинки товара |
| `GET` | `/api/admin/orders` | admin | все заказы |
| `PUT` | `/api/admin/orders/:id/status` | admin | изменение статуса заказа |
| `GET` | `/api/admin/users` | admin | список пользователей |

## Миграции и seed

Миграции лежат в `backend/migrations` и применяются при старте backend-контейнера через `golang-migrate`.

После подключения к базе backend выполняет seed:

- создаёт администратора, если его ещё нет;
- создаёт стартовые товары, если таблица товаров пустая.

## Docker

Сервисы:

| Сервис | Назначение |
| --- | --- |
| `postgres` | база данных |
| `backend` | Go API |
| `frontend` | Nginx со статической сборкой React |
| `pgadmin` | опциональный UI для PostgreSQL |

Healthchecks:

- PostgreSQL проверяется через `pg_isready`;
- backend проверяется через `/health`;
- frontend проверяется через Nginx на `127.0.0.1:80`.
