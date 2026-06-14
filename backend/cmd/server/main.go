package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"pcshop/internal/handlers"
	"pcshop/internal/middleware"
	"pcshop/internal/repository"
	"pcshop/internal/services"
	jwtmanager "pcshop/pkg/jwt"
)

func main() {
	_ = godotenv.Load()

	cfg := loadConfig()

	db, err := sql.Open("postgres", cfg.databaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	for i := 0; i < 30; i++ {
		if err := db.PingContext(ctx); err == nil {
			break
		}
		log.Println("waiting for database...")
		time.Sleep(2 * time.Second)
		if i == 29 {
			log.Fatalf("database not available: %v", err)
		}
	}

	repo := repository.New(db)
	jwtMgr := jwtmanager.NewManager(cfg.jwtSecret, cfg.accessExpiryMin, cfg.refreshExpiryDays)

	authSvc := services.NewAuthService(repo, jwtMgr)
	productSvc := services.NewProductService(repo)
	orderSvc := services.NewOrderService(repo)
	contactSvc := services.NewContactService(repo)
	adminSvc := services.NewAdminService(repo)

	if err := adminSvc.Seed(context.Background(), cfg.adminEmail, cfg.adminPassword); err != nil {
		log.Fatalf("seed failed: %v", err)
	}
	log.Println("seed data applied")

	h := handlers.New(authSvc, productSvc, orderSvc, contactSvc, adminSvc, cfg.uploadDir)

	if cfg.ginMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg.corsOrigin))

	r.GET("/health", h.Health)
	r.GET("/api/health", h.Health)

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", h.Register)
			auth.POST("/login", h.Login)
			auth.POST("/refresh", h.Refresh)
			auth.GET("/me", middleware.Auth(jwtMgr), h.Me)
			auth.PUT("/profile", middleware.Auth(jwtMgr), h.UpdateProfile)
			auth.PUT("/password", middleware.Auth(jwtMgr), h.ChangePassword)
		}

		products := api.Group("/products")
		{
			products.GET("", h.ListProducts)
			products.GET("/:id", h.GetProduct)
		}

		cart := api.Group("/cart")
		{
			cart.POST("/validate", h.ValidateCart)
		}

		orders := api.Group("/orders")
		{
			orders.POST("", middleware.OptionalAuth(jwtMgr), h.CreateOrder)
			orders.GET("", middleware.Auth(jwtMgr), h.GetMyOrders)
		}

		api.POST("/contact", h.SendContact)

		admin := api.Group("/admin", middleware.Auth(jwtMgr), middleware.AdminRequired())
		{
			admin.GET("/products", h.ListProducts)
			admin.POST("/products", h.CreateProduct)
			admin.PUT("/products/:id", h.UpdateProduct)
			admin.DELETE("/products/:id", h.DeleteProduct)
			admin.POST("/upload", h.UploadImage)
			admin.GET("/orders", h.ListOrders)
			admin.PUT("/orders/:id/status", h.UpdateOrderStatus)
			admin.GET("/users", h.ListUsers)
		}
	}

	srv := &http.Server{
		Addr:         ":" + cfg.port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("server starting on port %s", cfg.port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("server shutdown error: %v", err)
	}
	log.Println("server stopped")
}

type config struct {
	port              string
	databaseURL       string
	jwtSecret         string
	accessExpiryMin   int
	refreshExpiryDays int
	corsOrigin        string
	ginMode           string
	adminEmail        string
	adminPassword     string
	uploadDir         string
}

func loadConfig() config {
	return config{
		port:              getEnv("PORT", "8080"),
		databaseURL:       getEnv("DATABASE_URL", "postgres://pcshop:pcshop123@localhost:5432/pcshop?sslmode=disable"),
		jwtSecret:         getEnv("JWT_SECRET", "super-secret-jwt-key-change-in-production"),
		accessExpiryMin:   getEnvInt("JWT_ACCESS_EXPIRY_MIN", 15),
		refreshExpiryDays: getEnvInt("JWT_REFRESH_EXPIRY_DAYS", 7),
		corsOrigin:        getEnv("CORS_ORIGIN", "http://localhost:3000"),
		ginMode:           getEnv("GIN_MODE", "debug"),
		adminEmail:        getEnv("ADMIN_EMAIL", "admin@shop.ru"),
		adminPassword:     getEnv("ADMIN_PASSWORD", "admin123"),
		uploadDir:         getEnv("UPLOAD_DIR", "../frontend/public/store"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		var i int
		if _, err := fmt.Sscanf(v, "%d", &i); err == nil {
			return i
		}
	}
	return fallback
}
