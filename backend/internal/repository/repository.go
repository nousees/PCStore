package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"pcshop/internal/models"
)

type Repository struct {
	db *sql.DB
}

var ErrInsufficientStock = errors.New("insufficient stock")

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Ping(ctx context.Context) error {
	return r.db.PingContext(ctx)
}

func (r *Repository) CreateUser(ctx context.Context, email, passwordHash, name string, role models.UserRole) (*models.User, error) {
	var u models.User
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO users (email, password_hash, role, name)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, password_hash, role, name, phone, address, created_at
	`, email, passwordHash, role, name).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.Name, &u.Phone, &u.Address, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var u models.User
	err := r.db.QueryRowContext(ctx, `
		SELECT id, email, password_hash, role, name, phone, address, created_at
		FROM users WHERE email = $1
	`, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.Name, &u.Phone, &u.Address, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	var u models.User
	err := r.db.QueryRowContext(ctx, `
		SELECT id, email, password_hash, role, name, phone, address, created_at
		FROM users WHERE id = $1
	`, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.Name, &u.Phone, &u.Address, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) ListUsers(ctx context.Context) ([]models.User, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, email, password_hash, role, name, phone, address, created_at
		FROM users ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.Name, &u.Phone, &u.Address, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *Repository) UpdateUserPassword(ctx context.Context, id int64, hash string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE users SET password_hash = $1 WHERE id = $2`, hash, id)
	return err
}

func (r *Repository) UpdateUserProfile(ctx context.Context, id int64, name, phone, address string) (*models.User, error) {
	var u models.User
	err := r.db.QueryRowContext(ctx, `
		UPDATE users SET name = $1, phone = $2, address = $3
		WHERE id = $4
		RETURNING id, email, password_hash, role, name, phone, address, created_at
	`, name, phone, address, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.Name, &u.Phone, &u.Address, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) CountUsersByEmail(ctx context.Context, email string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users WHERE email = $1`, email).Scan(&count)
	return count, err
}

func (r *Repository) ListProducts(ctx context.Context, f models.ProductFilter) (*models.PaginatedProducts, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 12
	}

	var conditions []string
	var args []interface{}
	argIdx := 1

	if f.Category != "" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argIdx))
		args = append(args, f.Category)
		argIdx++
	}
	if f.Manufacturer != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(manufacturer) = LOWER($%d)", argIdx))
		args = append(args, f.Manufacturer)
		argIdx++
	}
	if f.MinPrice != nil {
		conditions = append(conditions, fmt.Sprintf("price >= $%d", argIdx))
		args = append(args, *f.MinPrice)
		argIdx++
	}
	if f.MaxPrice != nil {
		conditions = append(conditions, fmt.Sprintf("price <= $%d", argIdx))
		args = append(args, *f.MaxPrice)
		argIdx++
	}
	if f.Search != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(name) LIKE LOWER($%d)", argIdx))
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}
	if f.Popular != nil && *f.Popular {
		conditions = append(conditions, "popular = true")
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	orderBy := "created_at DESC"
	switch f.Sort {
	case "price_asc":
		orderBy = "price ASC"
	case "price_desc":
		orderBy = "price DESC"
	case "name_asc":
		orderBy = "name ASC"
	case "name_desc":
		orderBy = "name DESC"
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products %s", where)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	offset := (f.Page - 1) * f.Limit
	query := fmt.Sprintf(`
		SELECT id, name, price, stock, description, image_url, category, manufacturer, popular, created_at
		FROM products %s ORDER BY %s LIMIT $%d OFFSET $%d
	`, where, orderBy, argIdx, argIdx+1)
	args = append(args, f.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.Description, &p.ImageURL,
			&p.Category, &p.Manufacturer, &p.Popular, &p.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, p)
	}
	if items == nil {
		items = []models.Product{}
	}

	totalPages := total / f.Limit
	if total%f.Limit > 0 {
		totalPages++
	}

	return &models.PaginatedProducts{
		Items:      items,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: totalPages,
	}, rows.Err()
}

func (r *Repository) GetProductByID(ctx context.Context, id int64) (*models.Product, error) {
	var p models.Product
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, price, stock, description, image_url, category, manufacturer, popular, created_at
		FROM products WHERE id = $1
	`, id).Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.Description, &p.ImageURL,
		&p.Category, &p.Manufacturer, &p.Popular, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) CreateProduct(ctx context.Context, p *models.Product) (*models.Product, error) {
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO products (name, price, stock, description, image_url, category, manufacturer, popular)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`, p.Name, p.Price, p.Stock, p.Description, p.ImageURL, p.Category, p.Manufacturer, p.Popular,
	).Scan(&p.ID, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) UpdateProduct(ctx context.Context, p *models.Product) (*models.Product, error) {
	err := r.db.QueryRowContext(ctx, `
		UPDATE products SET name=$1, price=$2, stock=$3, description=$4, image_url=$5,
		category=$6, manufacturer=$7, popular=$8
		WHERE id=$9 RETURNING created_at
	`, p.Name, p.Price, p.Stock, p.Description, p.ImageURL, p.Category, p.Manufacturer, p.Popular, p.ID,
	).Scan(&p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) DeleteProduct(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM products WHERE id = $1`, id)
	return err
}

func (r *Repository) CreateOrder(ctx context.Context, order *models.Order, items []models.OrderItem) (*models.Order, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	err = tx.QueryRowContext(ctx, `
		INSERT INTO orders (user_id, guest_email, customer_name, phone, address, total, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`, order.UserID, order.GuestEmail, order.CustomerName, order.Phone, order.Address, order.Total, order.Status,
	).Scan(&order.ID, &order.CreatedAt)
	if err != nil {
		return nil, err
	}

	for i := range items {
		items[i].OrderID = order.ID
		err = tx.QueryRowContext(ctx, `
			INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
			VALUES ($1, $2, $3, $4) RETURNING id
		`, items[i].OrderID, items[i].ProductID, items[i].Quantity, items[i].PriceAtTime,
		).Scan(&items[i].ID)
		if err != nil {
			return nil, err
		}

		res, err := tx.ExecContext(ctx, `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1`,
			items[i].Quantity, items[i].ProductID)
		if err != nil {
			return nil, err
		}
		affected, err := res.RowsAffected()
		if err != nil {
			return nil, err
		}
		if affected == 0 {
			return nil, fmt.Errorf("%w for product %d", ErrInsufficientStock, items[i].ProductID)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	order.Items = items
	return order, nil
}

func (r *Repository) GetOrdersByUserID(ctx context.Context, userID int64) ([]models.Order, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, guest_email, customer_name, phone, address, total, status, created_at
		FROM orders WHERE user_id = $1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanOrdersWithItems(ctx, rows)
}

func (r *Repository) ListAllOrders(ctx context.Context) ([]models.Order, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, guest_email, customer_name, phone, address, total, status, created_at
		FROM orders ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanOrdersWithItems(ctx, rows)
}

func (r *Repository) scanOrdersWithItems(ctx context.Context, rows *sql.Rows) ([]models.Order, error) {
	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(&o.ID, &o.UserID, &o.GuestEmail, &o.CustomerName, &o.Phone, &o.Address, &o.Total, &o.Status, &o.CreatedAt); err != nil {
			return nil, err
		}
		items, err := r.getOrderItems(ctx, o.ID)
		if err != nil {
			return nil, err
		}
		o.Items = items
		orders = append(orders, o)
	}
	if orders == nil {
		orders = []models.Order{}
	}
	return orders, rows.Err()
}

func (r *Repository) getOrderItems(ctx context.Context, orderID int64) ([]models.OrderItem, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price_at_time, p.name
		FROM order_items oi
		JOIN products p ON p.id = oi.product_id
		WHERE oi.order_id = $1
	`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		if err := rows.Scan(&item.ID, &item.OrderID, &item.ProductID, &item.Quantity, &item.PriceAtTime, &item.ProductName); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []models.OrderItem{}
	}
	return items, rows.Err()
}

func (r *Repository) UpdateOrderStatus(ctx context.Context, id int64, status models.OrderStatus) (*models.Order, error) {
	var o models.Order
	err := r.db.QueryRowContext(ctx, `
		UPDATE orders SET status = $1 WHERE id = $2
		RETURNING id, user_id, guest_email, customer_name, phone, address, total, status, created_at
	`, status, id).Scan(&o.ID, &o.UserID, &o.GuestEmail, &o.CustomerName, &o.Phone, &o.Address, &o.Total, &o.Status, &o.CreatedAt)
	if err != nil {
		return nil, err
	}
	items, err := r.getOrderItems(ctx, o.ID)
	if err != nil {
		return nil, err
	}
	o.Items = items
	return &o, nil
}

func (r *Repository) CreateContactMessage(ctx context.Context, msg *models.ContactMessage) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO contact_messages (name, email, subject, message)
		VALUES ($1, $2, $3, $4) RETURNING id, created_at
	`, msg.Name, msg.Email, msg.Subject, msg.Message).Scan(&msg.ID, &msg.CreatedAt)
}

func (r *Repository) SeedAdmin(ctx context.Context, email, passwordHash string) error {
	count, err := r.CountUsersByEmail(ctx, email)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	_, err = r.CreateUser(ctx, email, passwordHash, "Administrator", models.RoleAdmin)
	return err
}

func (r *Repository) SeedProducts(ctx context.Context) error {
	var count int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM products`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	products := []models.Product{
		{Name: "Intel Core i9-14900K", Price: 58990, Stock: 25, Description: "24-ядерный процессор Intel 14-го поколения для энтузиастов.", ImageURL: "/store/cpu-intel-i9.svg", Category: models.CategoryCPU, Manufacturer: "Intel", Popular: true},
		{Name: "AMD Ryzen 9 7950X", Price: 54990, Stock: 20, Description: "16-ядерный процессор AMD Zen 4 с отличной многопоточностью.", ImageURL: "/store/cpu-amd-ryzen9.svg", Category: models.CategoryCPU, Manufacturer: "AMD", Popular: true},
		{Name: "NVIDIA GeForce RTX 4090", Price: 189990, Stock: 8, Description: "Флагманская видеокарта Ada Lovelace для 4K гейминга.", ImageURL: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400", Category: models.CategoryGPU, Manufacturer: "NVIDIA", Popular: true},
		{Name: "AMD Radeon RX 7900 XTX", Price: 89990, Stock: 12, Description: "Мощная видеокарта RDNA 3 с 24 ГБ памяти.", ImageURL: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400", Category: models.CategoryGPU, Manufacturer: "AMD", Popular: true},
		{Name: "Kingston Fury Beast 32GB DDR5", Price: 12990, Stock: 50, Description: "Комплект ОЗУ DDR5 5600 МГц, 2x16 ГБ.", ImageURL: "/store/ram-kingston-fury.svg", Category: models.CategoryRAM, Manufacturer: "Kingston", Popular: true},
		{Name: "G.Skill Trident Z5 64GB DDR5", Price: 24990, Stock: 15, Description: "Премиальная память DDR5 6400 МГц для рабочих станций.", ImageURL: "/store/ram-gskill-trident.svg", Category: models.CategoryRAM, Manufacturer: "G.Skill", Popular: false},
		{Name: "ASUS ROG Strix Z790-E", Price: 42990, Stock: 18, Description: "Материнская плата Intel Z790 с Wi-Fi 6E и PCIe 5.0.", ImageURL: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400", Category: models.CategoryMB, Manufacturer: "ASUS", Popular: true},
		{Name: "MSI MAG B650 TOMAHAWK", Price: 24990, Stock: 22, Description: "Надёжная плата AM5 для процессоров Ryzen 7000.", ImageURL: "/store/motherboard-msi-b650.svg", Category: models.CategoryMB, Manufacturer: "MSI", Popular: false},
		{Name: "be quiet! Straight Power 11 850W", Price: 14990, Stock: 30, Description: "80+ Platinum БП с модульными кабелями.", ImageURL: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400", Category: models.CategoryPSU, Manufacturer: "be quiet!", Popular: false},
		{Name: "Seasonic Focus GX-750", Price: 11990, Stock: 35, Description: "Компактный 750W Gold блок питания.", ImageURL: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", Category: models.CategoryPSU, Manufacturer: "Seasonic", Popular: false},
		{Name: "NZXT H7 Flow", Price: 13990, Stock: 28, Description: "Mid-tower корпус с отличной вентиляцией.", ImageURL: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400", Category: models.CategoryCase, Manufacturer: "NZXT", Popular: true},
		{Name: "Fractal Design Meshify 2", Price: 15990, Stock: 20, Description: "Корпус с mesh-передней панелью и поддержкой E-ATX.", ImageURL: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400", Category: models.CategoryCase, Manufacturer: "Fractal Design", Popular: false},
		{Name: "Игровой ПК Pro Gaming X", Price: 249990, Stock: 5, Description: "Готовая сборка: i7-14700K, RTX 4070 Ti, 32GB RAM, 1TB SSD.", ImageURL: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400", Category: models.CategoryPC, Manufacturer: "PCShop", Popular: true},
		{Name: "Рабочая станция WorkStation Pro", Price: 349990, Stock: 3, Description: "Ryzen 9 7950X, RTX 4080, 64GB RAM, 2TB NVMe.", ImageURL: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400", Category: models.CategoryPC, Manufacturer: "PCShop", Popular: true},
		{Name: "Intel Core i5-14600K", Price: 32990, Stock: 40, Description: "Оптимальный процессор для игр и работы.", ImageURL: "/store/cpu-intel-i5.svg", Category: models.CategoryCPU, Manufacturer: "Intel", Popular: false},
		{Name: "NVIDIA GeForce RTX 4060 Ti", Price: 49990, Stock: 25, Description: "Отличная видеокарта для Full HD и QHD.", ImageURL: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400", Category: models.CategoryGPU, Manufacturer: "NVIDIA", Popular: false},
	}

	for i := range products {
		p := products[i]
		p.CreatedAt = time.Now()
		if _, err := r.CreateProduct(ctx, &p); err != nil {
			return err
		}
	}
	return nil
}
