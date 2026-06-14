package models

import "time"

type UserRole string

const (
	RoleUser  UserRole = "user"
	RoleAdmin UserRole = "admin"
)

type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         UserRole  `json:"role"`
	Name         string    `json:"name"`
	Phone        string    `json:"phone"`
	Address      string    `json:"address"`
	CreatedAt    time.Time `json:"created_at"`
}

type ProductCategory string

const (
	CategoryCPU    ProductCategory = "cpu"
	CategoryGPU    ProductCategory = "gpu"
	CategoryRAM    ProductCategory = "ram"
	CategoryMB     ProductCategory = "motherboard"
	CategoryPSU    ProductCategory = "psu"
	CategoryCase   ProductCategory = "case"
	CategoryPC     ProductCategory = "pc"
)

type Product struct {
	ID           int64           `json:"id"`
	Name         string          `json:"name"`
	Price        float64         `json:"price"`
	Stock        int             `json:"stock"`
	Description  string          `json:"description"`
	ImageURL     string          `json:"image_url"`
	Category     ProductCategory `json:"category"`
	Manufacturer string          `json:"manufacturer"`
	Popular      bool            `json:"popular"`
	CreatedAt    time.Time       `json:"created_at"`
}

type OrderStatus string

const (
	OrderStatusNew       OrderStatus = "new"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusShipped   OrderStatus = "shipped"
)

type Order struct {
	ID          int64       `json:"id"`
	UserID      *int64      `json:"user_id"`
	GuestEmail  string      `json:"guest_email"`
	CustomerName string     `json:"customer_name"`
	Phone       string      `json:"phone"`
	Address     string      `json:"address"`
	Total       float64     `json:"total"`
	Status      OrderStatus `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	Items       []OrderItem `json:"items,omitempty"`
}

type OrderItem struct {
	ID         int64   `json:"id"`
	OrderID    int64   `json:"order_id"`
	ProductID  int64   `json:"product_id"`
	Quantity   int     `json:"quantity"`
	PriceAtTime float64 `json:"price_at_time"`
	ProductName string  `json:"product_name,omitempty"`
}

type ContactMessage struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Subject   string    `json:"subject"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

type ProductFilter struct {
	Page         int
	Limit        int
	Category     string
	Manufacturer string
	MinPrice     *float64
	MaxPrice     *float64
	Search       string
	Sort         string
	Popular      *bool
}

type PaginatedProducts struct {
	Items      []Product `json:"items"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	Limit      int       `json:"limit"`
	TotalPages int       `json:"total_pages"`
}
