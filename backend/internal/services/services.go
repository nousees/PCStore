package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"pcshop/internal/models"
	"pcshop/internal/repository"
	jwtmanager "pcshop/pkg/jwt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailTaken         = errors.New("email already registered")
	ErrUserNotFound       = errors.New("user not found")
	ErrProductNotFound    = errors.New("product not found")
	ErrInsufficientStock  = errors.New("insufficient stock")
	ErrInvalidPassword    = errors.New("invalid current password")
	ErrInvalidQuantity    = errors.New("quantity must be greater than zero")
	ErrInvalidOrderStatus = errors.New("invalid order status")
)

type AuthService struct {
	repo *repository.Repository
	jwt  *jwtmanager.Manager
}

func NewAuthService(repo *repository.Repository, jwt *jwtmanager.Manager) *AuthService {
	return &AuthService{repo: repo, jwt: jwt}
}

func (s *AuthService) Register(ctx context.Context, email, password, name string) (*models.User, *jwtmanager.TokenPair, error) {
	count, err := s.repo.CountUsersByEmail(ctx, email)
	if err != nil {
		return nil, nil, err
	}
	if count > 0 {
		return nil, nil, ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, err
	}

	user, err := s.repo.CreateUser(ctx, email, string(hash), name, models.RoleUser)
	if err != nil {
		return nil, nil, err
	}

	tokens, err := s.jwt.GenerateTokenPair(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*models.User, *jwtmanager.TokenPair, error) {
	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	tokens, err := s.jwt.GenerateTokenPair(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*jwtmanager.TokenPair, error) {
	claims, err := s.jwt.ParseToken(refreshToken)
	if err != nil || claims.Type != "refresh" {
		return nil, ErrInvalidCredentials
	}

	user, err := s.repo.GetUserByID(ctx, claims.UserID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return s.jwt.GenerateTokenPair(user.ID, user.Email, string(user.Role))
}

func (s *AuthService) ChangePassword(ctx context.Context, userID int64, currentPassword, newPassword string) error {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return ErrUserNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return ErrInvalidPassword
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.UpdateUserPassword(ctx, userID, string(hash))
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID int64, name, phone, address string) (*models.User, error) {
	return s.repo.UpdateUserProfile(ctx, userID, name, phone, address)
}

func (s *AuthService) GetUser(ctx context.Context, userID int64) (*models.User, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

type ProductService struct {
	repo *repository.Repository
}

func NewProductService(repo *repository.Repository) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) List(ctx context.Context, f models.ProductFilter) (*models.PaginatedProducts, error) {
	return s.repo.ListProducts(ctx, f)
}

func (s *ProductService) GetByID(ctx context.Context, id int64) (*models.Product, error) {
	p, err := s.repo.GetProductByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return p, nil
}

func (s *ProductService) Create(ctx context.Context, p *models.Product) (*models.Product, error) {
	return s.repo.CreateProduct(ctx, p)
}

func (s *ProductService) Update(ctx context.Context, p *models.Product) (*models.Product, error) {
	if _, err := s.repo.GetProductByID(ctx, p.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return s.repo.UpdateProduct(ctx, p)
}

func (s *ProductService) Delete(ctx context.Context, id int64) error {
	if _, err := s.repo.GetProductByID(ctx, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrProductNotFound
		}
		return err
	}
	return s.repo.DeleteProduct(ctx, id)
}

type OrderService struct {
	repo *repository.Repository
}

func NewOrderService(repo *repository.Repository) *OrderService {
	return &OrderService{repo: repo}
}

type OrderItemInput struct {
	ProductID int64 `json:"product_id"`
	Quantity  int   `json:"quantity"`
}

type CreateOrderInput struct {
	CustomerName string           `json:"customer_name"`
	Email        string           `json:"email"`
	Phone        string           `json:"phone"`
	Address      string           `json:"address"`
	Items        []OrderItemInput `json:"items"`
}

func (s *OrderService) Create(ctx context.Context, userID *int64, input CreateOrderInput) (*models.Order, error) {
	if len(input.Items) == 0 {
		return nil, fmt.Errorf("order must contain at least one item")
	}

	var orderItems []models.OrderItem
	var total float64

	for _, item := range input.Items {
		if item.Quantity <= 0 {
			return nil, ErrInvalidQuantity
		}

		product, err := s.repo.GetProductByID(ctx, item.ProductID)
		if err != nil {
			return nil, ErrProductNotFound
		}
		if product.Stock < item.Quantity {
			return nil, fmt.Errorf("%w for product %s", ErrInsufficientStock, product.Name)
		}
		lineTotal := product.Price * float64(item.Quantity)
		total += lineTotal
		orderItems = append(orderItems, models.OrderItem{
			ProductID:   item.ProductID,
			Quantity:    item.Quantity,
			PriceAtTime: product.Price,
		})
	}

	order := &models.Order{
		UserID:       userID,
		GuestEmail:   input.Email,
		CustomerName: input.CustomerName,
		Phone:        input.Phone,
		Address:      input.Address,
		Total:        total,
		Status:       models.OrderStatusNew,
	}

	created, err := s.repo.CreateOrder(ctx, order, orderItems)
	if err != nil {
		if errors.Is(err, repository.ErrInsufficientStock) {
			return nil, ErrInsufficientStock
		}
		return nil, err
	}
	return created, nil
}

func (s *OrderService) GetUserOrders(ctx context.Context, userID int64) ([]models.Order, error) {
	return s.repo.GetOrdersByUserID(ctx, userID)
}

func (s *OrderService) ListAll(ctx context.Context) ([]models.Order, error) {
	return s.repo.ListAllOrders(ctx)
}

func (s *OrderService) UpdateStatus(ctx context.Context, id int64, status models.OrderStatus) (*models.Order, error) {
	switch status {
	case models.OrderStatusNew, models.OrderStatusPaid, models.OrderStatusShipped:
	default:
		return nil, ErrInvalidOrderStatus
	}

	return s.repo.UpdateOrderStatus(ctx, id, status)
}

type ContactService struct {
	repo *repository.Repository
}

func NewContactService(repo *repository.Repository) *ContactService {
	return &ContactService{repo: repo}
}

func (s *ContactService) Send(ctx context.Context, msg *models.ContactMessage) error {
	return s.repo.CreateContactMessage(ctx, msg)
}

type AdminService struct {
	repo *repository.Repository
}

func NewAdminService(repo *repository.Repository) *AdminService {
	return &AdminService{repo: repo}
}

func (s *AdminService) ListUsers(ctx context.Context) ([]models.User, error) {
	return s.repo.ListUsers(ctx)
}

func (s *AdminService) Seed(ctx context.Context, adminEmail, adminPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if err := s.repo.SeedAdmin(ctx, adminEmail, string(hash)); err != nil {
		return err
	}
	return s.repo.SeedProducts(ctx)
}
