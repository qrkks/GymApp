.PHONY: run build test clean dev

# 运行开发服务器
run:
	go run cmd/server/main.go

# 构建
build:
	go build -o bin/backend cmd/server/main.go

# 运行测试
test:
	go test ./...

# 清理构建文件
clean:
	rm -rf bin/
	rm -f *.db *.db-shm *.db-wal

# 开发模式（自动重载，需要安装 air）
dev:
	air

# 安装依赖
deps:
	go mod download
	go mod tidy

# 格式化代码
fmt:
	go fmt ./...

# 代码检查
lint:
	golangci-lint run
