package database

import (
	"fmt"
	"time"

	"gymapp-backend/internal/infrastructure/config"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database interface {
	DB() *gorm.DB
	Close() error
}

type database struct {
	db *gorm.DB
}

func NewDatabase(cfg config.DatabaseConfig) (Database, error) {
	var db *gorm.DB
	var err error

	switch cfg.Type {
	case "sqlite":
		db, err = gorm.Open(sqlite.Open(cfg.Path), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SQLite: %w", err)
		}

	case "postgres", "":
		// 默认使用 PostgreSQL
		dsn := cfg.URL
		if dsn == "" {
			dsn = fmt.Sprintf(
				"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
				cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name,
			)
		}

		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
		}

		// 配置连接池
		sqlDB, err := db.DB()
		if err != nil {
			return nil, fmt.Errorf("failed to get database instance: %w", err)
		}

		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(100)
		sqlDB.SetConnMaxLifetime(time.Hour)

	default:
		return nil, fmt.Errorf("unsupported database type: %s", cfg.Type)
	}

	return &database{db: db}, nil
}

func (d *database) DB() *gorm.DB {
	return d.db
}

func (d *database) Close() error {
	sqlDB, err := d.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
