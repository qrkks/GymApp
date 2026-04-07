package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

type Config struct {
	Environment string
	Port        string
	Database    DatabaseConfig
}

type DatabaseConfig struct {
	Type     string // "postgres" or "sqlite"
	URL      string // PostgreSQL connection URL
	Path     string // SQLite file path
	Host     string
	Port     int
	Name     string
	User     string
	Password string
}

func Load() (*Config, error) {
	viper.SetConfigType("env")
	viper.SetConfigName(".env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("../")
	viper.AddConfigPath("../../")

	// 设置默认值
	viper.SetDefault("ENV", "development")
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("DB_TYPE", "sqlite")
	viper.SetDefault("DB_PATH", "./gymapp.db")

	// 自动读取环境变量
	viper.AutomaticEnv()

	// 尝试读取 .env 文件（如果存在）
	if err := viper.ReadInConfig(); err != nil {
		// .env 文件不存在也没关系，使用环境变量
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	cfg := &Config{
		Environment: getEnv("ENV", "development"),
		Port:        getEnv("PORT", "8080"),
		Database: DatabaseConfig{
			Type:     getEnv("DB_TYPE", "sqlite"),
			URL:      getEnv("DATABASE_URL", ""),
			Path:     getEnv("DB_PATH", "./gymapp.db"),
			Host:     getEnv("POSTGRES_HOST", "localhost"),
			Port:     getEnvInt("POSTGRES_PORT", 5432),
			Name:     getEnv("POSTGRES_DB", "gymapp"),
			User:     getEnv("POSTGRES_USER", "postgres"),
			Password: getEnv("POSTGRES_PASSWORD", ""),
		},
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return viper.GetString(key)
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var result int
		if _, err := fmt.Sscanf(value, "%d", &result); err == nil {
			return result
		}
	}
	return viper.GetInt(key)
}
