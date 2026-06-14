# PCShop: запуск проекта

## Требования

- Docker
- Docker Compose v2+

## Быстрый запуск

```bash
git clone <repository-url>
cd PCShop
docker compose up --build
```

После запуска сервисы будут доступны по адресам:

| Сервис | URL |
| --- | --- |
| Магазин | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| Health check backend | http://localhost:8080/health |
| PostgreSQL | localhost:5432 |

## Данные администратора

| Поле | Значение |
| --- | --- |
| Email | `admin@shop.ru` |
| Пароль | `admin123` |
| Админ-панель | http://localhost:3000/admin |

Администратор создаётся автоматически при старте backend, если пользователя с таким email ещё нет.

## База данных

| Поле | Значение |
| --- | --- |
| Пользователь | `pcshop` |
| Пароль | `pcshop123` |
| База | `pcshop` |
| Порт | `5432` |

## pgAdmin

pgAdmin подключается опционально через профиль `tools`:

```bash
docker compose --profile tools up --build
```

После запуска pgAdmin доступен по адресу:

```text
http://localhost:5050
```

Данные pgAdmin по умолчанию:

| Поле | Значение |
| --- | --- |
| Email | `admin@pcshop.local` |
| Пароль | `admin123` |

## Переменные окружения

Основные значения лежат в `.env.example`. Для локальной настройки можно скопировать файл:

```bash
cp .env.example .env
```

Важные переменные:

| Переменная | Назначение |
| --- | --- |
| `POSTGRES_USER` | пользователь PostgreSQL |
| `POSTGRES_PASSWORD` | пароль PostgreSQL |
| `POSTGRES_DB` | имя базы |
| `BACKEND_PORT` | внешний порт backend |
| `FRONTEND_PORT` | внешний порт frontend |
| `JWT_SECRET` | секрет подписи JWT |
| `ADMIN_EMAIL` | email администратора |
| `ADMIN_PASSWORD` | пароль администратора |
| `UPLOAD_DIR` | папка для загруженных изображений товаров |
| `VITE_API_URL` | URL API для frontend-сборки |

## Загруженные картинки товаров

Админ может указать картинку товара как URL или загрузить файл с устройства.

Файлы сохраняются в:

```text
frontend/public/store
```

В приложении они доступны как:

```text
/store/<filename>
```

## Остановка

```bash
docker compose down
```

Остановка с удалением volume PostgreSQL:

```bash
docker compose down -v
```
