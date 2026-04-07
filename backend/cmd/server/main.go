package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gymapp-backend/internal/api/handlers"
	"gymapp-backend/internal/infrastructure/config"
	"gymapp-backend/internal/infrastructure/database"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 1. 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2. 初始化日志
	logger, err := initLogger(cfg.Environment)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	logger.Info("Starting GymApp Backend",
		zap.String("environment", cfg.Environment),
		zap.String("port", cfg.Port),
	)

	// 3. 初始化数据库
	db, err := database.NewDatabase(cfg.Database)
	if err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	defer db.Close()

	logger.Info("Database connected successfully")

	// 4. 初始化 Gin 路由
	router := setupRouter(cfg, logger)

	// 5. 启动服务器
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 6. 优雅关闭
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	logger.Info("Server started", zap.String("address", server.Addr))

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}

func initLogger(env string) (*zap.Logger, error) {
	if env == "production" {
		return zap.NewProduction()
	}
	return zap.NewDevelopment()
}

func setupRouter(cfg *config.Config, logger *zap.Logger) *gin.Engine {
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// 中间件
	router.Use(ginLogger(logger))
	router.Use(gin.Recovery())
	router.Use(corsMiddleware())

	// 健康检查
	healthHandler := handlers.NewHealthHandler()
	router.GET("/health", healthHandler.Check)

	// API 路由组
	api := router.Group("/api")
	{
		// 这里后续会添加业务路由
		api.GET("/health", healthHandler.Check)
	}

	return router
}

func ginLogger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		logger.Info("HTTP Request",
			zap.Int("status", c.Writer.Status()),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("ip", c.ClientIP()),
			zap.String("user-agent", c.Request.UserAgent()),
			zap.Duration("latency", latency),
		)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
