# 后端拆分到 Go 可行性评估报告

## 📋 执行摘要

**评估结论**：✅ **技术可行，但需要大量工作**

将当前 Next.js 全栈应用的后端部分拆分成独立的 Go 后端是**技术上完全可行**的，但需要**重新实现**大部分业务逻辑、数据访问层和认证系统。预计工作量：**3-6 个月**（取决于团队规模和并行开发能力）。

---

## 🏗️ 当前架构分析

### 技术栈
- **前端框架**：Next.js 14 (React 18)
- **后端框架**：Next.js API Routes
- **认证**：NextAuth.js 5.0
- **ORM**：Drizzle ORM
- **数据库**：PostgreSQL
- **架构模式**：DDD (领域驱动设计)
- **语言**：TypeScript
- **测试**：Jest (单元测试 + 集成测试)

### 领域结构
```
domain/
├── workout/        # 训练管理
├── exercise/       # 动作管理
├── body-part/      # 身体部位管理
├── user/           # 用户管理
└── shared/         # 共享类型和错误处理
```

### API 路由结构
- `/api/workout/*` - 训练相关
- `/api/exercise/*` - 动作相关
- `/api/body-part/*` - 身体部位相关
- `/api/user/*` - 用户相关
- `/api/auth/*` - 认证相关
- `/api/set/*` - 组相关

### 代码规模估算
- **Use Cases (应用服务)**：~5 个文件，约 2000+ 行
- **Repository (数据访问)**：~10 个文件，约 1500+ 行
- **Domain Models (领域模型)**：~10 个文件，约 1000+ 行
- **API Routes (路由层)**：~15 个文件，约 800+ 行
- **总计**：约 **5300+ 行业务逻辑代码**

---

## ✅ 可行性分析

### 1. 技术可行性：✅ **高度可行**

#### Go 生态系统支持
- ✅ **Web 框架**：Gin, Echo, Fiber, Chi 等成熟框架
- ✅ **ORM/查询构建器**：GORM, sqlx, Ent, sqlc 等
- ✅ **认证库**：JWT, OAuth2, 自定义 Session 管理
- ✅ **数据库驱动**：PostgreSQL 官方驱动 `pgx` 性能优秀
- ✅ **测试框架**：内置 `testing` 包，GoConvey, Testify 等
- ✅ **DDD 支持**：Go 支持面向对象和函数式编程，可以很好地实现 DDD

#### 架构兼容性
- ✅ **DDD 架构**：Go 可以很好地实现领域驱动设计
- ✅ **CQRS 分离**：Go 的接口和包结构支持命令查询分离
- ✅ **Repository 模式**：Go 的接口非常适合实现仓储模式
- ✅ **错误处理**：Go 的 `error` 接口可以很好地实现 Result 类型

### 2. 迁移工作量评估

#### 高工作量部分（需要重写）

| 模块 | 工作量 | 说明 |
|------|--------|------|
| **认证系统** | 🔴 高 (2-3 周) | NextAuth.js → JWT/Session 自定义实现 |
| **数据访问层** | 🔴 高 (3-4 周) | Drizzle ORM → GORM/sqlx，需要重写所有查询 |
| **领域模型** | 🟡 中 (2-3 周) | TypeScript 实体 → Go 结构体和方法 |
| **应用服务** | 🟡 中 (2-3 周) | TypeScript Use Cases → Go 服务函数 |
| **API 路由** | 🟢 低 (1-2 周) | Next.js Routes → Gin/Echo 路由 |
| **错误处理** | 🟢 低 (1 周) | Result 类型 → Go error 接口 |
| **测试** | 🔴 高 (3-4 周) | Jest → Go testing，需要重写所有测试 |

**总计**：约 **14-20 周**（3.5-5 个月）

#### 可复用部分

| 部分 | 复用程度 | 说明 |
|------|---------|------|
| **数据库 Schema** | ✅ 100% | PostgreSQL 表结构不变 |
| **业务规则** | ✅ 90% | 领域逻辑可以移植 |
| **API 接口设计** | ✅ 80% | RESTful 接口可以保持一致 |
| **前端代码** | ✅ 100% | 前端基本不需要改动（只需改 API 地址） |

### 3. 优势分析

#### 性能优势
- ✅ **并发性能**：Go 的 goroutine 模型在处理并发请求时性能优秀
- ✅ **内存效率**：Go 的内存占用通常比 Node.js 更低
- ✅ **启动速度**：Go 编译后的二进制文件启动速度快
- ✅ **数据库连接**：Go 的数据库连接池管理更高效

#### 部署优势
- ✅ **单二进制文件**：编译后是单个可执行文件，部署简单
- ✅ **容器镜像小**：使用 Alpine 基础镜像，镜像体积小（~20MB）
- ✅ **资源占用低**：运行时内存占用通常比 Node.js 低 30-50%
- ✅ **跨平台编译**：可以轻松编译到不同平台

#### 开发优势
- ✅ **类型安全**：Go 的静态类型系统提供编译时类型检查
- ✅ **工具链成熟**：`go fmt`, `go vet`, `golangci-lint` 等工具完善
- ✅ **标准库丰富**：Go 标准库功能强大，减少第三方依赖
- ✅ **团队协作**：Go 的代码风格统一，易于团队协作

#### 架构优势
- ✅ **前后端分离**：前后端可以独立开发、部署和扩展
- ✅ **技术栈解耦**：前端可以使用任何框架，不受后端限制
- ✅ **微服务准备**：如果未来需要拆分微服务，Go 后端更容易拆分

### 4. 劣势与挑战

#### 开发成本
- ❌ **重写成本高**：需要重写所有业务逻辑代码
- ❌ **学习曲线**：团队需要学习 Go 语言（如果还不熟悉）
- ❌ **测试重写**：所有测试用例需要重写
- ❌ **开发时间**：预计需要 3-6 个月完成迁移

#### 技术风险
- ⚠️ **ORM 差异**：Drizzle → GORM/sqlx 的迁移可能有细微差异
- ⚠️ **认证迁移**：NextAuth.js → 自定义认证系统需要仔细处理
- ⚠️ **类型系统差异**：TypeScript 的类型系统与 Go 不同，需要适配
- ⚠️ **错误处理差异**：TypeScript 的 Result 类型 → Go 的 error 接口

#### 维护成本
- ⚠️ **双语言维护**：前端 TypeScript，后端 Go，需要维护两套代码
- ⚠️ **团队技能**：需要团队同时掌握 TypeScript 和 Go
- ⚠️ **工具链差异**：前后端使用不同的构建和测试工具

---

## 🎯 迁移策略建议

### 方案 A：渐进式迁移（推荐）

**策略**：逐步将 API 路由迁移到 Go，保持双后端运行一段时间

#### 阶段 1：基础设施搭建（2-3 周）
1. 搭建 Go 后端项目结构
2. 配置数据库连接和 ORM
3. 实现基础认证系统
4. 配置 CI/CD 和部署流程

#### 阶段 2：非关键 API 迁移（4-6 周）
1. 先迁移简单的 API（如 `/api/body-part`）
2. 前端通过环境变量切换 API 地址
3. 并行运行，验证功能正确性

#### 阶段 3：核心 API 迁移（6-8 周）
1. 迁移核心业务 API（`/api/workout`, `/api/exercise`）
2. 逐步切换流量到 Go 后端
3. 保留 Next.js API 作为备份

#### 阶段 4：认证和用户 API（2-3 周）
1. 迁移认证系统
2. 迁移用户相关 API
3. 确保 Session/Token 兼容

#### 阶段 5：清理和优化（2-3 周）
1. 移除 Next.js API Routes
2. 性能优化和监控
3. 文档更新

**总时长**：16-23 周（4-6 个月）

### 方案 B：一次性迁移（高风险）

**策略**：停止新功能开发，集中精力完成迁移

**优点**：
- ✅ 迁移周期短（3-4 个月）
- ✅ 不需要维护双后端
- ✅ 团队专注度高

**缺点**：
- ❌ 新功能开发暂停
- ❌ 风险集中
- ❌ 回滚困难

**适用场景**：项目处于稳定期，没有紧急新功能需求

### 方案 C：混合架构（过渡方案）

**策略**：关键 API 用 Go，简单 API 保留在 Next.js

**优点**：
- ✅ 迁移工作量小
- ✅ 可以逐步迁移
- ✅ 风险分散

**缺点**：
- ❌ 架构复杂
- ❌ 维护成本高
- ❌ 不是最终目标

**适用场景**：作为渐进式迁移的中间状态

---

## 🛠️ 技术实现建议

### Go 技术栈推荐

#### Web 框架
- **推荐**：Gin（性能好，生态成熟）
- **备选**：Echo（轻量，API 友好）、Fiber（Express 风格）

#### ORM/数据库
- **推荐**：GORM（功能全，类似 Drizzle）+ sqlx（复杂查询）
- **备选**：Ent（类型安全，代码生成）、sqlc（SQL 优先）

#### 认证
- **推荐**：JWT (github.com/golang-jwt/jwt/v5) + 自定义 Session
- **备选**：OAuth2 (golang.org/x/oauth2)

#### 项目结构建议
```
backend/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── domain/          # 领域层
│   │   ├── workout/
│   │   │   ├── model/
│   │   │   ├── service/
│   │   │   └── repository/
│   │   ├── exercise/
│   │   └── user/
│   ├── application/     # 应用层
│   │   └── workout/
│   │       └── usecase.go
│   ├── infrastructure/   # 基础设施层
│   │   ├── database/
│   │   ├── auth/
│   │   └── http/
│   └── api/             # API 层
│       └── handlers/
│           └── workout.go
├── pkg/                 # 可复用包
│   └── errors/
└── tests/               # 测试
```

### 关键实现点

#### 1. 错误处理
```go
// 类似 TypeScript 的 Result 类型
type Result[T any] struct {
    Data  T
    Error *AppError
}

type AppError struct {
    Code    string
    Message string
    Details interface{}
}
```

#### 2. Repository 接口
```go
// 保持与 TypeScript 相同的接口设计
type WorkoutRepository interface {
    FindByDate(ctx context.Context, userID, date string) (*Workout, error)
    Create(ctx context.Context, workout *Workout) error
    // ...
}
```

#### 3. 认证中间件
```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // JWT 验证逻辑
        userID := extractUserID(c)
        c.Set("userID", userID)
        c.Next()
    }
}
```

---

## 📊 成本效益分析

### 开发成本

| 项目 | 成本 |
|------|------|
| **开发时间** | 3-6 个月（1-2 名开发者） |
| **学习成本** | 1-2 周（如果团队不熟悉 Go） |
| **测试重写** | 3-4 周 |
| **文档更新** | 1 周 |
| **总计** | **4-7 个月** |

### 预期收益

| 收益项 | 量化指标 |
|--------|---------|
| **性能提升** | 响应时间减少 20-40%，并发能力提升 2-3 倍 |
| **资源节省** | 内存占用减少 30-50%，CPU 使用率降低 20-30% |
| **部署简化** | 镜像体积减少 70-80%（~20MB vs ~200MB） |
| **扩展性** | 更容易水平扩展，支持微服务架构 |

### ROI 评估

**短期（6 个月内）**：
- ❌ **负 ROI**：开发成本高，收益不明显
- 适合场景：性能瓶颈严重，需要快速扩展

**长期（1 年以上）**：
- ✅ **正 ROI**：性能提升带来的服务器成本节省
- 适合场景：用户量增长，需要更好的扩展性

---

## ⚠️ 风险评估

### 高风险项

1. **认证系统迁移** ⚠️ **关键风险**
   - **当前状态**：使用 **JWT 策略**（NextAuth.js）
     - JWT token 存储在 HTTP-only Cookie 中（`authjs.session-token`）
     - 使用 `AUTH_SECRET` 进行签名
     - Token 包含：`id`, `email`, `name`
   - **风险**：JWT 格式不兼容导致用户需要重新登录
   - **解决方案**：见下方"认证迁移详细方案"

2. **数据一致性**
   - **风险**：迁移过程中数据不一致
   - **缓解**：使用数据库事务，充分测试

3. **API 兼容性**
   - **风险**：API 接口变更导致前端报错
   - **缓解**：保持 API 接口完全一致，使用 API 版本控制

### 中风险项

1. **业务逻辑遗漏**
   - **风险**：迁移时遗漏某些业务规则
   - **缓解**：完整的测试覆盖，代码审查

2. **性能问题**
   - **风险**：Go 后端性能不如预期
   - **缓解**：性能测试，逐步优化

3. **团队技能**
   - **风险**：团队不熟悉 Go，开发效率低
   - **缓解**：培训，代码审查，使用成熟框架

---

## 🎯 决策建议

### 建议迁移的场景

✅ **适合迁移**：
1. 项目处于稳定期，没有紧急新功能
2. 性能瓶颈明显，需要更好的并发处理
3. 计划扩展为微服务架构
4. 团队有 Go 开发经验或愿意学习
5. 长期维护成本考虑（Go 后端维护成本可能更低）

### 不建议迁移的场景

❌ **不适合迁移**：
1. 项目处于快速迭代期，新功能需求多
2. 团队规模小，无法承担迁移成本
3. 当前性能满足需求，没有扩展压力
4. 团队对 Go 不熟悉，学习成本高
5. 项目即将结束或重构

---

## 📝 实施检查清单

### 准备阶段
- [ ] 团队 Go 技能评估和培训计划
- [ ] 技术栈选型确定（框架、ORM、认证方案）
- [ ] 项目结构设计
- [ ] 迁移策略确定（渐进式/一次性）

### 开发阶段
- [ ] 搭建 Go 后端项目骨架
- [ ] 实现数据库连接和迁移
- [ ] 实现认证系统
- [ ] 迁移领域模型
- [ ] 迁移 Repository 层
- [ ] 迁移 Use Case 层
- [ ] 实现 API 路由
- [ ] 编写测试用例

### 测试阶段
- [ ] 单元测试覆盖
- [ ] 集成测试
- [ ] API 兼容性测试
- [ ] 性能测试
- [ ] 安全测试

### 部署阶段
- [ ] CI/CD 配置
- [ ] 部署脚本
- [ ] 监控和日志
- [ ] 回滚方案

### 迁移阶段
- [ ] 灰度发布
- [ ] 流量切换
- [ ] 监控和优化
- [ ] 清理旧代码

---

## 🔗 相关资源

### Go 学习资源
- [Go 官方文档](https://go.dev/doc/)
- [Go by Example](https://gobyexample.com/)
- [Effective Go](https://go.dev/doc/effective_go)

### Go Web 开发
- [Gin 框架文档](https://gin-gonic.com/docs/)
- [GORM 文档](https://gorm.io/docs/)
- [Go 项目布局标准](https://github.com/golang-standards/project-layout)

### 迁移参考
- [从 Node.js 迁移到 Go 的最佳实践](https://github.com/golang/go/wiki/Projects)
- [DDD in Go](https://github.com/marcusolsson/goddd)

---

## 📅 时间线估算

### 保守估算（6 个月）

```
第 1 月：准备 + 基础设施搭建
第 2 月：领域模型 + Repository 迁移
第 3 月：Use Case + API 路由迁移
第 4 月：认证系统 + 测试
第 5 月：集成测试 + 性能优化
第 6 月：部署 + 灰度发布 + 清理
```

### 乐观估算（3 个月）

```
第 1 月：准备 + 核心功能迁移
第 2 月：剩余功能 + 测试
第 3 月：部署 + 优化
```

**注意**：乐观估算需要：
- 团队熟悉 Go
- 并行开发（2+ 开发者）
- 减少测试覆盖（不推荐）

---

## 💡 最终建议

### 如果决定迁移

1. **采用渐进式迁移策略**（方案 A）
2. **优先迁移非关键 API**，降低风险
3. **保持 API 接口完全兼容**，前端无需改动
4. **充分测试**，特别是认证和数据一致性
5. **准备回滚方案**，确保可以快速回退

### 如果暂不迁移

1. **优化现有 Next.js 后端**
   - 使用 Server Components 减少 API 调用
   - 优化数据库查询
   - 添加缓存层

2. **为未来迁移做准备**
   - 保持清晰的架构分层
   - 完善测试覆盖
   - 文档化 API 接口

3. **监控性能指标**
   - 建立性能基线
   - 定期评估是否需要迁移

---

## 🔐 认证迁移详细方案（重要）

### 当前认证实现分析

**认证方式**：✅ **NextAuth.js v5 + JWT 策略**（不是数据库 Session）

**关键发现**：
```typescript
// frontend/lib/auth-config.ts
session: {
  strategy: 'jwt' as const,  // 使用 JWT，不是数据库 Session
}
```

**JWT 存储方式**：
- 存储在 HTTP-only Cookie：`authjs.session-token`
- 使用 `AUTH_SECRET` 进行签名和验证
- Cookie 配置：
  - `httpOnly: true`（防止 XSS）
  - `secure: true`（生产环境，HTTPS）
  - `sameSite: 'none'`（生产环境，支持跨域）

**JWT Token 内容**：
```json
{
  "id": "user-id-string",
  "email": "user@example.com",
  "name": "username",
  "iat": 1234567890,  // 签发时间
  "exp": 1234571490   // 过期时间（默认 30 天）
}
```

### ✅ 迁移后用户登录状态保证

#### 答案：**可以保证现有用户继续登录**（如果采用正确方案）

### 迁移方案对比

#### 方案 A：完全兼容（强烈推荐）✅

**策略**：Go 后端解析 NextAuth.js 生成的 JWT，保持现有用户登录状态

**实现原理**：
1. NextAuth.js 和 Go 后端使用**相同的 `AUTH_SECRET`**
2. Go 后端使用相同的 JWT 算法（HS256）解析 token
3. Cookie 名称和格式保持一致

**优点**：
- ✅ **零停机迁移**：用户无需重新登录
- ✅ **无缝切换**：前端无需改动
- ✅ **风险最低**：保持现有认证状态
- ✅ **用户体验好**：用户无感知

**缺点**：
- ⚠️ 需要理解 NextAuth.js 的 JWT 格式
- ⚠️ 需要共享 `AUTH_SECRET`（这是正常的）

**Go 实现代码示例**：
```go
// middleware/auth.go
package middleware

import (
    "fmt"
    "os"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. 读取 NextAuth.js 的 Cookie
        cookie, err := c.Cookie("authjs.session-token")
        if err != nil {
            c.JSON(401, gin.H{"error": "Unauthorized"})
            c.Abort()
            return
        }

        // 2. 解析 JWT（使用相同的 AUTH_SECRET）
        token, err := jwt.Parse(cookie, func(token *jwt.Token) (interface{}, error) {
            // 验证签名算法
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
            }
            // 使用相同的 AUTH_SECRET
            return []byte(os.Getenv("AUTH_SECRET")), nil
        })

        if err != nil || !token.Valid {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }

        // 3. 提取用户信息（与 NextAuth.js 格式一致）
        claims := token.Claims.(jwt.MapClaims)
        userID := claims["id"].(string)
        email := claims["email"].(string)
        
        // 4. 设置到上下文，供后续使用
        c.Set("userID", userID)
        c.Set("userEmail", email)
        c.Next()
    }
}
```

**登录 API 实现**（生成兼容的 JWT）：
```go
// handlers/auth.go
func LoginHandler(c *gin.Context) {
    // 1. 验证用户名密码
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request"})
        return
    }

    // 验证用户（调用你的业务逻辑）
    user, err := userService.VerifyPassword(req.Identifier, req.Password)
    if err != nil {
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }

    // 2. 生成 JWT（格式与 NextAuth.js 完全兼容）
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "id":    user.ID,
        "email": user.Email,
        "name":  user.Username,
        "iat":   time.Now().Unix(),
        "exp":   time.Now().Add(30 * 24 * time.Hour).Unix(), // 30 天
    })

    tokenString, err := token.SignedString([]byte(os.Getenv("AUTH_SECRET")))
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to generate token"})
        return
    }

    // 3. 设置 Cookie（与 NextAuth.js 格式完全一致）
    c.SetCookie(
        "authjs.session-token",
        tokenString,
        30*24*3600, // 30 天
        "/",
        "", // 不设置 domain，让浏览器自动处理
        os.Getenv("NODE_ENV") == "production", // secure (HTTPS)
        true, // httpOnly
    )

    c.JSON(200, gin.H{"success": true})
}
```

#### 方案 B：双 Token 支持（过渡方案）

**策略**：同时支持 NextAuth.js JWT 和新的 Go JWT，逐步迁移

**实现**：
1. 优先尝试解析 NextAuth.js JWT
2. 如果失败，尝试解析新的 Go JWT
3. 新登录用户使用 Go JWT
4. 旧用户继续使用 NextAuth.js JWT 直到过期

**优点**：
- ✅ 平滑过渡
- ✅ 可以逐步迁移

**缺点**：
- ⚠️ 需要维护两套认证逻辑
- ⚠️ 代码复杂度增加

#### 方案 C：强制重新登录（不推荐）❌

**策略**：迁移时让所有用户重新登录

**缺点**：
- ❌ **用户体验差**：所有用户需要重新登录
- ❌ **可能丢失用户**：部分用户可能忘记密码
- ❌ **不适合生产环境**

### 推荐实施步骤（方案 A）

#### 阶段 1：准备（1 周）
- [ ] 确认 `AUTH_SECRET` 在环境变量中可用
- [ ] 在 Go 后端实现 NextAuth.js JWT 解析
- [ ] 编写单元测试验证 JWT 解析正确性
- [ ] 测试现有用户的 JWT token 能否正确解析

#### 阶段 2：实现（1 周）
- [ ] 实现认证中间件（解析 NextAuth.js JWT）
- [ ] 实现登录 API（生成兼容的 JWT）
- [ ] 实现登出 API（清除 Cookie）
- [ ] 确保 Cookie 设置与 NextAuth.js 完全一致

#### 阶段 3：测试（1 周）
- [ ] 测试现有用户 JWT 解析（使用真实 token）
- [ ] 测试新用户登录（生成新 JWT）
- [ ] 测试 Cookie 设置和读取
- [ ] 测试跨域 Cookie（如果前后端分离）
- [ ] 测试移动端浏览器 Cookie

#### 阶段 4：部署（1 周）
- [ ] 灰度发布（10% 流量）
- [ ] 监控认证错误率
- [ ] 验证用户登录状态保持
- [ ] 逐步增加流量到 100%

### 关键注意事项

#### 1. AUTH_SECRET 必须相同
```bash
# 环境变量必须一致
AUTH_SECRET=your-secret-key  # NextAuth.js 和 Go 后端使用相同的值
```

#### 2. Cookie 配置必须一致
```go
// Go 后端 Cookie 配置必须与 NextAuth.js 一致
c.SetCookie(
    "authjs.session-token",  // Cookie 名称必须相同
    tokenString,
    30*24*3600,              // 过期时间相同
    "/",                      // 路径相同
    "",                       // domain 相同（不设置）
    true,                     // secure 相同（生产环境）
    true,                     // httpOnly 相同
)
```

#### 3. JWT 算法必须相同
```go
// 必须使用 HS256 算法
token := jwt.NewWithClaims(jwt.SigningMethodHS256, ...)
```

#### 4. JWT Claims 格式必须相同
```go
// Claims 必须包含这些字段
jwt.MapClaims{
    "id":    user.ID,      // 必须
    "email": user.Email,   // 必须
    "name":  user.Username, // 必须
    "iat":   time.Now().Unix(),
    "exp":   time.Now().Add(30 * 24 * time.Hour).Unix(),
}
```

### 测试验证清单

迁移前必须验证：
- [ ] 现有用户 JWT 可以正确解析
- [ ] 现有用户无需重新登录
- [ ] 新用户登录生成正确的 JWT
- [ ] Cookie 设置正确（httpOnly, secure, sameSite）
- [ ] 跨域请求 Cookie 正常传递
- [ ] 移动端浏览器 Cookie 正常
- [ ] JWT 过期后正确要求重新登录
- [ ] 登出功能清除 Cookie

### 常见问题

**Q: 如果 JWT 过期了怎么办？**
A: 用户需要重新登录，这是正常行为。可以设置较长的过期时间（如 30 天）。

**Q: 跨域 Cookie 会有问题吗？**
A: 需要正确配置 CORS 和 Cookie 的 `sameSite` 属性。NextAuth.js 使用 `sameSite: 'none'` 支持跨域，Go 后端需要保持一致。

**Q: 移动端会有问题吗？**
A: 只要 Cookie 配置正确（特别是 `sameSite: 'none'` 和 `secure: true`），移动端应该没问题。

**Q: 如果 AUTH_SECRET 泄露了怎么办？**
A: 立即更换 `AUTH_SECRET`，所有用户需要重新登录。这是安全最佳实践。

---

## 🗄️ 数据库 Schema 和迁移管理方案

### 当前状态分析

**当前管理方式**：✅ **Drizzle Kit**（TypeScript/Node.js 工具）

**关键信息**：
- **Schema 定义**：`frontend/lib/db/schema.ts`（TypeScript）
- **迁移工具**：Drizzle Kit (`drizzle-kit`)
- **迁移文件**：`frontend/drizzle/*.sql`（SQL 文件）
- **配置**：`frontend/drizzle.config.ts`

**当前命令**：
```bash
pnpm db:generate  # 从 schema.ts 生成迁移 SQL 文件
pnpm db:migrate   # 执行迁移文件
pnpm db:push      # 直接同步 schema（开发环境）
```

**迁移历史**：
- 迁移文件存储在 `drizzle/` 目录
- 迁移记录存储在数据库的 `__drizzle_migrations` 表
- 当前有 1 个迁移文件：`0000_shiny_iron_lad.sql`

### 迁移到 Go 后端后的管理方案

#### 方案 A：继续使用 Drizzle Kit（推荐）✅

**策略**：保持 Drizzle Kit 作为独立的迁移工具，Go 后端只负责执行迁移

**架构**：
```
┌─────────────────────────────────────────┐
│  Schema 定义（TypeScript）               │
│  frontend/lib/db/schema.ts               │
└──────────────┬──────────────────────────┘
               │
               │ drizzle-kit generate
               ▼
┌─────────────────────────────────────────┐
│  迁移文件（SQL）                          │
│  migrations/0001_xxx.sql                 │
│  migrations/0002_xxx.sql                 │
└──────────────┬──────────────────────────┘
               │
               │ Go 后端执行
               ▼
┌─────────────────────────────────────────┐
│  PostgreSQL 数据库                        │
└─────────────────────────────────────────┘
```

**优点**：
- ✅ **Schema 定义统一**：继续使用 TypeScript 定义（类型安全）
- ✅ **迁移文件可复用**：SQL 文件可以在任何语言中使用
- ✅ **工具链不变**：前端团队继续使用熟悉的工具
- ✅ **版本控制友好**：迁移文件是纯 SQL，易于版本控制
- ✅ **Go 后端简单**：只需要执行 SQL 文件，不需要维护 Schema 定义

**缺点**：
- ⚠️ 需要维护 TypeScript schema（即使后端是 Go）
- ⚠️ 需要 Node.js 环境来生成迁移（但可以 Docker 化）

**实施步骤**：

1. **保持 Schema 定义在 TypeScript**
   ```typescript
   // frontend/lib/db/schema.ts（保持不变）
   export const users = pgTable('users', { ... });
   ```

2. **生成迁移文件**（前端）
   ```bash
   cd frontend
   pnpm db:generate  # 生成 SQL 迁移文件
   ```

3. **Go 后端执行迁移**
   ```go
   // Go 后端使用 migrate 库执行 SQL 文件
   import "github.com/golang-migrate/migrate/v4"
   
   m, err := migrate.New(
       "file://migrations",
       "postgres://user:pass@localhost/dbname?sslmode=disable",
   )
   m.Up() // 执行所有未应用的迁移
   ```

**Go 实现示例**：
```go
// internal/infrastructure/database/migrate.go
package database

import (
    "github.com/golang-migrate/migrate/v4"
    _ "github.com/golang-migrate/migrate/v4/database/postgres"
    _ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(databaseURL string, migrationsPath string) error {
    m, err := migrate.New(
        "file://"+migrationsPath,
        databaseURL,
    )
    if err != nil {
        return err
    }
    defer m.Close()

    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        return err
    }
    return nil
}
```

#### 方案 B：迁移到 Go 原生工具

**选项 B1：使用 golang-migrate/migrate**

**策略**：手动编写 SQL 迁移文件，使用 `golang-migrate/migrate` 执行

**优点**：
- ✅ Go 原生工具，性能好
- ✅ 支持多种数据库
- ✅ 迁移文件是纯 SQL，易于理解

**缺点**：
- ❌ 需要手动编写 SQL（失去 TypeScript 的类型安全）
- ❌ 需要从 Drizzle schema 手动转换
- ❌ 维护成本高

**选项 B2：使用 GORM AutoMigrate**

**策略**：在 Go 中定义 Schema，使用 GORM 的 AutoMigrate

**优点**：
- ✅ 代码即 Schema，类型安全
- ✅ 自动迁移，简单快速

**缺点**：
- ❌ **不适合生产环境**：无法控制迁移过程
- ❌ **无法回滚**：AutoMigrate 不支持回滚
- ❌ **数据丢失风险**：自动迁移可能丢失数据
- ❌ **无法版本控制**：没有迁移历史

**不推荐用于生产环境**

**选项 B3：使用 sqlc + 手动迁移**

**策略**：使用 sqlc 生成类型安全的查询代码，手动管理迁移

**优点**：
- ✅ SQL 优先，类型安全
- ✅ 性能好

**缺点**：
- ❌ 需要手动管理迁移文件
- ❌ 需要从 Drizzle schema 转换

#### 方案 C：混合方案（过渡期）

**策略**：迁移期间同时维护两套 Schema

**架构**：
```
TypeScript Schema (Drizzle)  ←→  Go Schema (GORM/sqlc)
         │                              │
         └────────── SQL 迁移文件 ───────┘
```

**优点**：
- ✅ 平滑过渡
- ✅ 可以逐步迁移

**缺点**：
- ❌ 维护成本高（需要同步两套 Schema）
- ❌ 容易出错

### 推荐方案：方案 A（继续使用 Drizzle Kit）

#### 实施架构

```
项目结构：
├── frontend/
│   ├── lib/db/
│   │   └── schema.ts          # Schema 定义（TypeScript）
│   └── drizzle.config.ts     # Drizzle 配置
│
├── backend/
│   ├── migrations/            # SQL 迁移文件（从 frontend 复制）
│   │   ├── 0001_xxx.sql
│   │   └── 0002_xxx.sql
│   └── internal/
│       └── infrastructure/
│           └── database/
│               └── migrate.go  # 迁移执行逻辑
│
└── scripts/
    └── sync-migrations.sh     # 同步迁移文件脚本
```

#### 工作流程

**1. 开发新迁移**（前端）：
```bash
# 1. 修改 schema.ts
vim frontend/lib/db/schema.ts

# 2. 生成迁移文件
cd frontend
pnpm db:generate

# 3. 迁移文件生成在 frontend/drizzle/ 目录
```

**2. 同步迁移文件到后端**：
```bash
# 脚本：scripts/sync-migrations.sh
#!/bin/bash
# 复制最新的迁移文件到后端
cp frontend/drizzle/*.sql backend/migrations/
```

**3. Go 后端执行迁移**：
```go
// 应用启动时自动执行迁移
func main() {
    // 连接数据库
    db := connectDB()
    
    // 执行迁移
    if err := database.RunMigrations(
        os.Getenv("DATABASE_URL"),
        "./migrations",
    ); err != nil {
        log.Fatal("Migration failed:", err)
    }
    
    // 启动服务器
    router := setupRouter()
    router.Run(":8080")
}
```

#### Go 依赖

```go
// go.mod
require (
    github.com/golang-migrate/migrate/v4 v4.17.0
    github.com/lib/pq v1.10.9
)
```

#### CI/CD 集成

**GitHub Actions 工作流**：
```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  push:
    paths:
      - 'frontend/lib/db/schema.ts'
      - 'frontend/drizzle/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate migrations
        run: |
          cd frontend
          pnpm install
          pnpm db:generate
      
      - name: Sync migrations to backend
        run: |
          cp frontend/drizzle/*.sql backend/migrations/
      
      - name: Commit migrations
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add backend/migrations/
          git commit -m "Sync database migrations" || exit 0
          git push
```

### 迁移检查清单

**准备阶段**：
- [ ] 选择迁移工具（推荐：golang-migrate/migrate）
- [ ] 设置迁移文件目录结构
- [ ] 实现迁移执行逻辑
- [ ] 编写迁移同步脚本

**迁移阶段**：
- [ ] 将现有迁移文件复制到 Go 后端
- [ ] 验证迁移可以正确执行
- [ ] 测试迁移回滚功能
- [ ] 设置迁移版本检查

**维护阶段**：
- [ ] 建立迁移文件同步流程
- [ ] 文档化迁移流程
- [ ] 设置迁移失败告警
- [ ] 定期备份数据库

### 关键注意事项

#### 1. 迁移文件格式

**Drizzle 生成的 SQL**：
```sql
CREATE TABLE "users" (
  "id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  ...
);
```

**golang-migrate 要求**：
- 文件名格式：`{version}_{description}.up.sql` 和 `{version}_{description}.down.sql`
- 需要提供回滚 SQL（`.down.sql`）

**解决方案**：
- 可以只使用 `.up.sql`（不提供回滚）
- 或者手动编写 `.down.sql`

#### 2. 迁移版本管理

**Drizzle**：使用哈希值（如 `0000_shiny_iron_lad`）  
**golang-migrate**：使用数字版本（如 `0001`, `0002`）

**解决方案**：
- 手动重命名迁移文件
- 或者编写脚本自动转换

#### 3. 迁移执行时机

**选项 1：应用启动时自动执行**（推荐）
```go
func main() {
    // 启动时执行迁移
    migrate.Up()
    // 然后启动服务器
}
```

**选项 2：手动执行**（生产环境推荐）
```bash
# 单独的命令执行迁移
./backend migrate up
```

**选项 3：CI/CD 中执行**
```yaml
# 部署前执行迁移
- name: Run migrations
  run: |
    ./backend migrate up
```

### 最佳实践建议

1. **Schema 定义保持在前端**（TypeScript）
   - 利用 TypeScript 的类型安全
   - 前端和后端共享相同的 Schema 定义

2. **迁移文件是纯 SQL**
   - 易于版本控制
   - 可以在任何语言中使用
   - 易于审查和调试

3. **迁移执行在 Go 后端**
   - 使用 `golang-migrate/migrate` 库
   - 支持版本控制和回滚
   - 适合生产环境

4. **自动化同步流程**
   - 使用脚本自动同步迁移文件
   - 在 CI/CD 中自动执行

5. **迁移前备份数据库**
   - 生产环境迁移前必须备份
   - 准备回滚方案

---

## 🎨 前端架构建议（配合 DDD 后端）

### 当前前端架构分析

**当前状态**：
- ✅ **框架**：Next.js 14 App Router
- ✅ **数据获取**：SWR（Server State）
- ✅ **状态管理**：Zustand（Client State）
- ✅ **领域层**：已有 `domain/` 目录（TypeScript）
- ✅ **API 客户端**：统一的 `api-client.ts`

**架构层次**：
```
视图层 (React Components)
    ↓
API 客户端层 (api-client.ts)
    ↓
数据获取层 (SWR Hooks)
    ↓
领域层 (domain/)
    ↓
后端 API (Go DDD)
```

### 推荐架构：Clean Architecture + Feature-Sliced Design

#### 核心原则

**1. 前后端架构对齐**
- 后端使用 DDD → 前端也应该有领域层
- 后端分层清晰 → 前端也应该分层清晰
- 后端关注业务逻辑 → 前端关注用户体验

**2. 职责分离**
- **领域层**：业务逻辑和领域模型（与后端 DDD 对齐）
- **应用层**：用例和状态管理
- **基础设施层**：API 调用、本地存储
- **视图层**：React 组件（纯展示）

#### 推荐架构：Clean Architecture + Feature-Sliced Design

```
frontend/
├── app/                      # Next.js App Router（路由层）
│   ├── (auth)/
│   ├── workouts/
│   └── exercise-library/
│
├── features/                 # 功能模块（Feature-Sliced Design）
│   ├── workout/
│   │   ├── ui/              # UI 组件
│   │   ├── model/           # 领域模型（与后端对齐）
│   │   ├── api/             # API 调用
│   │   └── hooks/           # 自定义 Hooks
│   ├── exercise/
│   └── auth/
│
├── entities/                 # 实体（跨功能共享）
│   ├── user/
│   └── body-part/
│
├── shared/                    # 共享层
│   ├── api/                  # API 客户端
│   ├── ui/                   # 共享 UI 组件
│   ├── lib/                  # 工具函数
│   └── config/               # 配置
│
└── domain/                    # 领域层（与后端 DDD 对齐）
    ├── workout/
    │   ├── model/            # 领域模型
    │   └── service/          # 领域服务
    ├── exercise/
    └── user/
```

### 详细架构说明

#### 1. Domain Layer（领域层）- 与后端 DDD 对齐 ✅

**职责**：
- 定义领域模型（TypeScript 类型）
- 领域服务（纯业务逻辑）
- 与后端 DDD 领域层对齐

**示例**：
```typescript
// domain/workout/model/workout.entity.ts
export interface Workout {
  id: number;
  userId: string;
  date: string;
  startTime: Date;
  endTime?: Date;
}

// domain/workout/service/workout.service.ts
export function calculateWorkoutDuration(workout: Workout): number {
  if (!workout.endTime) return 0;
  return workout.endTime.getTime() - workout.startTime.getTime();
}
```

**特点**：
- ✅ 纯 TypeScript，无 React 依赖
- ✅ 与后端领域模型对齐
- ✅ 可复用，可测试

#### 2. Features Layer（功能层）- Feature-Sliced Design

**职责**：
- 按功能组织代码
- 每个功能独立，可复用
- 包含 UI、API、Hooks

**结构**：
```
features/workout/
├── ui/                      # UI 组件
│   ├── WorkoutCard.tsx
│   └── WorkoutForm.tsx
├── model/                    # 功能特定的模型
│   └── workout.types.ts
├── api/                      # API 调用（调用 shared/api）
│   └── workout.api.ts
└── hooks/                    # 自定义 Hooks（使用 SWR）
    ├── useWorkout.ts
    └── useWorkoutList.ts
```

**示例**：
```typescript
// features/workout/api/workout.api.ts
import { apiClient } from '@/shared/api';

export const workoutApi = {
  getList: () => apiClient.get<Workout[]>('/workout'),
  getByDate: (date: string) => apiClient.get<Workout>(`/workout/${date}`),
  create: (data: CreateWorkoutData) => apiClient.post('/workout', data),
};

// features/workout/hooks/useWorkout.ts
import useSWR from 'swr';
import { workoutApi } from '../api/workout.api';

export function useWorkout(date: string) {
  return useSWR(
    date ? `/workout/${date}` : null,
    () => workoutApi.getByDate(date)
  );
}
```

#### 3. Shared Layer（共享层）

**职责**：
- API 客户端（统一 HTTP 请求）
- 共享 UI 组件
- 工具函数
- 配置

**结构**：
```
shared/
├── api/
│   ├── client.ts            # API 客户端（当前 api-client.ts）
│   └── types.ts              # API 响应类型
├── ui/
│   ├── Button.tsx
│   └── Input.tsx
├── lib/
│   └── utils.ts
└── config/
    └── constants.ts
```

#### 4. Entities Layer（实体层）- 可选

**职责**：
- 跨功能共享的实体
- 如 User、BodyPart 等

**示例**：
```
entities/user/
├── model/
│   └── user.entity.ts
├── api/
│   └── user.api.ts
└── hooks/
    └── useUser.ts
```

### 数据流架构

#### 推荐：SWR + Zustand 组合

**服务器状态（SWR）**：
- ✅ 数据获取和缓存
- ✅ 自动重新验证
- ✅ 乐观更新支持

**客户端状态（Zustand）**：
- ✅ UI 状态（如模态框开关）
- ✅ 表单状态（复杂表单）
- ✅ 全局状态（如主题）

**架构**：
```
React Component
    ↓
SWR Hook (服务器状态)
    ↓
API Client (shared/api)
    ↓
Go Backend (DDD)
```

### 与后端 DDD 的对应关系

| 后端（Go DDD） | 前端（TypeScript） | 说明 |
|--------------|-------------------|------|
| **Domain Model** | `domain/*/model/*.entity.ts` | 领域模型对齐 |
| **Domain Service** | `domain/*/service/*.service.ts` | 领域服务对齐 |
| **Use Case** | `features/*/hooks/use*.ts` | 用例对应 Hooks |
| **Repository** | `features/*/api/*.api.ts` | API 调用层 |
| **API Handler** | `shared/api/client.ts` | HTTP 客户端 |

### 实施建议

#### 阶段 1：保持现有架构（过渡期）

**当前架构已经很好**：
- ✅ 有 `domain/` 目录
- ✅ 有 API 客户端层
- ✅ 使用 SWR 进行数据获取
- ✅ 使用 Zustand 进行状态管理

**建议**：
- 保持现有架构
- 逐步优化，不要大重构

#### 阶段 2：优化领域层（推荐）

**目标**：与后端 DDD 更好地对齐

**步骤**：
1. **完善领域模型**
   ```typescript
   // domain/workout/model/workout.entity.ts
   // 与后端 Go 的 Workout 实体对齐
   ```

2. **添加领域服务**
   ```typescript
   // domain/workout/service/workout.service.ts
   // 纯业务逻辑，无副作用
   ```

3. **类型对齐**
   ```typescript
   // 确保前端类型与后端 API 响应类型一致
   ```

#### 阶段 3：引入 Feature-Sliced Design（可选）

**如果项目规模增长**，可以考虑：
- 按功能组织代码
- 提高代码可维护性
- 便于团队协作

### 技术栈推荐

#### 数据获取：SWR（当前使用）✅

**优点**：
- ✅ 轻量级，API 简单
- ✅ 自动缓存和重新验证
- ✅ 支持乐观更新
- ✅ 与 Next.js 集成良好

**继续使用**，无需更换

#### 状态管理：Zustand（当前使用）✅

**优点**：
- ✅ 轻量级，API 简单
- ✅ TypeScript 支持好
- ✅ 性能好

**继续使用**，无需更换

#### 表单管理：React Hook Form（推荐添加）

**如果表单复杂**，建议添加：
```bash
pnpm add react-hook-form @hookform/resolvers zod
```

**优点**：
- ✅ 性能好（非受控组件）
- ✅ 与 Zod 集成（验证）
- ✅ TypeScript 支持好

#### 状态同步：TanStack Query（可选）

**如果 SWR 不够用**，可以考虑：
- ✅ 功能更强大
- ✅ 缓存策略更灵活
- ⚠️ 学习曲线更陡

**当前 SWR 足够用，无需更换**

### 最佳实践建议

#### 1. 领域层与后端对齐

```typescript
// ✅ 好：与后端 DDD 对齐
// domain/workout/model/workout.entity.ts
export interface Workout {
  id: number;
  userId: string;
  date: string;
  // 与后端 Go 的 Workout 结构一致
}

// ❌ 不好：前端特有的类型混入领域层
export interface WorkoutWithUIState extends Workout {
  isEditing: boolean; // UI 状态不应该在领域层
}
```

#### 2. API 调用统一管理

```typescript
// ✅ 好：统一的 API 客户端
// shared/api/client.ts
export const apiClient = {
  get: <T>(url: string) => fetch(url).then(r => r.json() as T),
};

// features/workout/api/workout.api.ts
export const workoutApi = {
  getList: () => apiClient.get<Workout[]>('/workout'),
};

// ❌ 不好：组件中直接 fetch
function Component() {
  const data = await fetch('/api/workout'); // 不应该在组件中
}
```

#### 3. 状态管理分层

```typescript
// ✅ 好：服务器状态用 SWR，客户端状态用 Zustand
// 服务器状态
const { data } = useSWR('/api/workout', fetcher);

// 客户端状态（UI 状态）
const [isOpen, setIsOpen] = useStore(state => [state.isOpen, state.setIsOpen]);

// ❌ 不好：所有状态都用同一个工具
```

#### 4. 组件职责单一

```typescript
// ✅ 好：组件只负责展示
function WorkoutCard({ workout }: { workout: Workout }) {
  return <div>{workout.date}</div>;
}

// ❌ 不好：组件包含业务逻辑
function WorkoutCard({ workoutId }: { workoutId: number }) {
  const { data } = useSWR(`/api/workout/${workoutId}`); // 应该在 Hook 中
  return <div>{data?.date}</div>;
}
```

### 迁移路径（如果决定重构）

#### 渐进式迁移

**阶段 1**：完善领域层（1-2 周）
- 与后端 DDD 对齐
- 添加领域服务

**阶段 2**：优化 API 层（1 周）
- 统一 API 调用
- 添加类型定义

**阶段 3**：重构组件（2-4 周）
- 按功能组织
- 提取 Hooks

**总时长**：4-7 周（可选，不是必须）

### 总结

**推荐架构**：
1. ✅ **保持现有架构**（已经很好）
2. ✅ **优化领域层**（与后端 DDD 对齐）
3. ✅ **继续使用 SWR + Zustand**（无需更换）
4. ⚠️ **可选：引入 Feature-Sliced Design**（如果项目规模增长）

**核心原则**：
- 🎯 **领域层与后端 DDD 对齐**
- 🔄 **API 调用统一管理**
- 📦 **状态管理分层**（服务器状态 vs 客户端状态）
- 🧩 **组件职责单一**

**当前架构评分**：⭐⭐⭐⭐⭐（5/5）

你的前端架构已经很好了，只需要：
1. 保持现有架构
2. 逐步优化领域层
3. 确保类型与后端对齐

---

## ✅ 后端分离前必须确认的事项

### 📋 分离前检查清单

在开始后端拆分到 Go 之前，必须确认以下所有事项，确保迁移顺利进行。

---

## 1. 技术栈选型确认 🔧

### 1.1 Go 技术栈选型

**必须确认**：
- [ ] **Web 框架**：Gin / Echo / Fiber / Chi（推荐：Gin）
- [ ] **ORM/数据库**：GORM / sqlx / Ent / sqlc（推荐：GORM + sqlx）
- [ ] **认证库**：JWT 库（推荐：github.com/golang-jwt/jwt/v5）
- [ ] **迁移工具**：golang-migrate/migrate（推荐）
- [ ] **配置管理**：viper / envconfig（推荐：viper）
- [ ] **日志库**：logrus / zap（推荐：zap）
- [ ] **测试框架**：内置 testing + testify（推荐）

**确认方式**：
- 创建技术选型文档
- 团队评审通过
- 编写 POC（概念验证）验证选型

---

## 2. 团队技能评估 👥

### 2.1 Go 语言技能

**必须确认**：
- [ ] **团队 Go 经验**：
  - [ ] 有 Go 开发经验的成员数量
  - [ ] Go 开发经验年限（建议至少 1 年）
  - [ ] 是否熟悉 Go 并发模型（goroutine, channel）
  - [ ] 是否熟悉 Go 错误处理模式

**如果团队不熟悉 Go**：
- [ ] 制定学习计划（2-4 周）
- [ ] 安排 Go 培训或自学
- [ ] 编写 Go 编码规范文档
- [ ] 建立代码审查机制

### 2.2 DDD 架构理解

**必须确认**：
- [ ] **团队 DDD 理解**：
  - [ ] 理解领域驱动设计概念
  - [ ] 理解分层架构（Domain, Application, Infrastructure）
  - [ ] 理解 Repository 模式
  - [ ] 理解 Use Case 模式

**如果团队不熟悉 DDD**：
- [ ] 组织 DDD 培训
- [ ] 阅读 DDD 相关书籍
- [ ] 参考现有 TypeScript DDD 实现

---

## 3. 基础设施准备 🏗️

### 3.1 开发环境

**必须确认**：
- [ ] **Go 开发环境**：
  - [ ] Go 版本（推荐：1.21+）
  - [ ] Go 开发工具（VS Code + Go 插件 / GoLand）
  - [ ] Go 依赖管理（go.mod, go.sum）
  - [ ] 代码格式化工具（gofmt, golangci-lint）

- [ ] **数据库环境**：
  - [ ] PostgreSQL 版本（推荐：14+）
  - [ ] 数据库连接配置
  - [ ] 迁移工具配置

- [ ] **测试环境**：
  - [ ] 单元测试环境
  - [ ] 集成测试环境
  - [ ] 测试数据库

### 3.2 CI/CD 环境

**必须确认**：
- [ ] **构建流程**：
  - [ ] Go 项目构建配置
  - [ ] Docker 镜像构建（Go 后端）
  - [ ] 多阶段构建优化

- [ ] **部署流程**：
  - [ ] 部署脚本
  - [ ] 健康检查配置
  - [ ] 回滚机制

- [ ] **GitHub Actions**：
  - [ ] Go 项目工作流
  - [ ] 测试自动化
  - [ ] 部署自动化

---

## 4. API 兼容性确认 🔌

### 4.1 API 接口清单

**必须确认**：
- [ ] **完整 API 清单**：
  - [ ] 列出所有 API 端点
  - [ ] 记录每个 API 的请求/响应格式
  - [ ] 记录认证方式
  - [ ] 记录错误响应格式

**当前 API 端点**（需要全部确认）：
- [ ] `/api/auth/*` - 认证相关
- [ ] `/api/workout/*` - 训练相关
- [ ] `/api/exercise/*` - 动作相关
- [ ] `/api/body-part/*` - 身体部位相关
- [ ] `/api/set/*` - 组相关
- [ ] `/api/user/*` - 用户相关
- [ ] `/api/health` - 健康检查

### 4.2 API 响应格式

**必须确认**：
- [ ] **响应格式统一**：
  - [ ] 成功响应格式
  - [ ] 错误响应格式
  - [ ] HTTP 状态码映射

**示例**：
```typescript
// 成功响应
{ data: Workout }

// 错误响应
{ error: "错误消息" }
```

### 4.3 前端兼容性

**必须确认**：
- [ ] **前端无需改动**：
  - [ ] API 端点路径不变
  - [ ] 请求格式不变
  - [ ] 响应格式不变
  - [ ] 认证方式不变（JWT Cookie）

**测试方式**：
- [ ] 创建 API 兼容性测试
- [ ] 前端调用测试
- [ ] 端到端测试

---

## 5. 数据迁移确认 💾

### 5.1 数据库 Schema

**必须确认**：
- [ ] **Schema 迁移方案**：
  - [ ] 继续使用 Drizzle Kit 生成迁移（推荐）
  - [ ] 迁移文件同步机制
  - [ ] Go 后端执行迁移机制

- [ ] **迁移历史**：
  - [ ] 现有迁移文件清单
  - [ ] 迁移执行顺序
  - [ ] 迁移回滚方案

### 5.2 数据一致性

**必须确认**：
- [ ] **数据完整性**：
  - [ ] 现有数据是否需要迁移
  - [ ] 数据备份方案
  - [ ] 数据验证方案

- [ ] **迁移时机**：
  - [ ] 迁移执行时机（启动时/手动）
  - [ ] 迁移失败处理
  - [ ] 迁移回滚方案

---

## 6. 认证系统确认 🔐

### 6.1 JWT 兼容性

**必须确认**：
- [ ] **JWT 格式兼容**：
  - [ ] `AUTH_SECRET` 共享机制
  - [ ] JWT 算法（HS256）
  - [ ] JWT Claims 格式
  - [ ] Cookie 名称（`authjs.session-token`）
  - [ ] Cookie 配置（httpOnly, secure, sameSite）

**测试验证**：
- [ ] 现有用户 JWT 可以解析
- [ ] 新用户登录生成兼容 JWT
- [ ] Cookie 设置正确
- [ ] 跨域 Cookie 正常

### 6.2 认证流程

**必须确认**：
- [ ] **登录流程**：
  - [ ] 登录 API 实现
  - [ ] 密码验证逻辑
  - [ ] JWT 生成逻辑
  - [ ] Cookie 设置逻辑

- [ ] **登出流程**：
  - [ ] 登出 API 实现
  - [ ] Cookie 清除逻辑

- [ ] **认证中间件**：
  - [ ] 认证检查逻辑
  - [ ] 用户信息提取
  - [ ] 错误处理

---

## 7. 环境变量确认 🌍

### 7.1 环境变量清单

**必须确认**：
- [ ] **完整环境变量清单**：
  - [ ] `DATABASE_URL` - 数据库连接
  - [ ] `AUTH_SECRET` - JWT 签名密钥
  - [ ] `NEXTAUTH_URL` / `AUTH_URL` - 认证 URL
  - [ ] `NODE_ENV` / `ENV` - 环境标识
  - [ ] 其他业务相关环境变量

**当前环境变量**（需要全部确认）：
```bash
# 数据库
DATABASE_URL=postgres://...
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=gymapp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...

# 认证
AUTH_SECRET=...
NEXTAUTH_URL=...
AUTH_TRUST_HOST=true

# 应用
NODE_ENV=production
```

### 7.2 环境变量管理

**必须确认**：
- [ ] **环境变量管理方案**：
  - [ ] 开发环境配置
  - [ ] 生产环境配置
  - [ ] 敏感信息管理（Secrets）
  - [ ] 环境变量文档

---

## 8. 部署方案确认 🚀

### 8.1 部署架构

**必须确认**：
- [ ] **部署架构**：
  - [ ] 前后端分离部署
  - [ ] 前端部署位置（Next.js）
  - [ ] 后端部署位置（Go 服务）
  - [ ] 数据库部署位置（PostgreSQL）

- [ ] **网络配置**：
  - [ ] 前端访问后端 URL
  - [ ] CORS 配置
  - [ ] 反向代理配置（Nginx/Traefik）

### 8.2 容器化

**必须确认**：
- [ ] **Docker 配置**：
  - [ ] Go 后端 Dockerfile
  - [ ] 多阶段构建优化
  - [ ] 镜像大小优化
  - [ ] 健康检查配置

- [ ] **Docker Compose**：
  - [ ] 服务编排配置
  - [ ] 网络配置
  - [ ] 卷挂载配置
  - [ ] 环境变量配置

### 8.3 部署流程

**必须确认**：
- [ ] **CI/CD 流程**：
  - [ ] 构建流程
  - [ ] 测试流程
  - [ ] 部署流程
  - [ ] 回滚流程

- [ ] **部署策略**：
  - [ ] 蓝绿部署 / 滚动部署
  - [ ] 灰度发布策略
  - [ ] 流量切换方案

---

## 9. 监控和日志确认 📊

### 9.1 日志系统

**必须确认**：
- [ ] **日志方案**：
  - [ ] 日志库选型（zap / logrus）
  - [ ] 日志级别配置
  - [ ] 日志格式（JSON / 文本）
  - [ ] 日志输出位置（文件 / stdout）

- [ ] **日志内容**：
  - [ ] 请求日志
  - [ ] 错误日志
  - [ ] 业务日志
  - [ ] 性能日志

### 9.2 监控系统

**必须确认**：
- [ ] **监控指标**：
  - [ ] 应用性能监控（APM）
  - [ ] 错误率监控
  - [ ] 响应时间监控
  - [ ] 资源使用监控（CPU, 内存）

- [ ] **告警机制**：
  - [ ] 错误告警
  - [ ] 性能告警
  - [ ] 资源告警

### 9.3 健康检查

**必须确认**：
- [ ] **健康检查端点**：
  - [ ] `/health` - 基础健康检查
  - [ ] `/ready` - 就绪检查（数据库连接等）
  - [ ] `/live` - 存活检查

---

## 10. 测试策略确认 🧪

### 10.1 测试覆盖

**必须确认**：
- [ ] **测试类型**：
  - [ ] 单元测试（Domain, Service）
  - [ ] 集成测试（Repository, API）
  - [ ] 端到端测试（E2E）
  - [ ] 性能测试

- [ ] **测试工具**：
  - [ ] 单元测试框架（内置 testing）
  - [ ] Mock 框架（testify/mock）
  - [ ] 集成测试工具
  - [ ] E2E 测试工具

### 10.2 测试数据

**必须确认**：
- [ ] **测试数据管理**：
  - [ ] 测试数据库
  - [ ] 测试数据 Fixtures
  - [ ] 测试数据清理机制

### 10.3 测试自动化

**必须确认**：
- [ ] **CI 测试**：
  - [ ] 代码提交触发测试
  - [ ] 测试覆盖率要求
  - [ ] 测试失败处理

---

## 11. 性能基准确认 ⚡

### 11.1 性能指标

**必须确认**：
- [ ] **性能基准**：
  - [ ] 当前 Next.js 后端性能指标
    - [ ] 响应时间（P50, P95, P99）
    - [ ] 吞吐量（QPS）
    - [ ] 并发能力
    - [ ] 资源使用（CPU, 内存）

- [ ] **性能目标**：
  - [ ] Go 后端性能目标
  - [ ] 性能提升预期
  - [ ] 性能测试方案

### 11.2 性能测试

**必须确认**：
- [ ] **性能测试工具**：
  - [ ] 负载测试工具（k6, wrk, Apache Bench）
  - [ ] 压力测试方案
  - [ ] 性能监控工具

---

## 12. 安全考虑确认 🔒

### 12.1 安全措施

**必须确认**：
- [ ] **安全配置**：
  - [ ] HTTPS 配置
  - [ ] CORS 配置
  - [ ] 认证安全（JWT 过期时间）
  - [ ] 密码安全（哈希算法）

- [ ] **安全审计**：
  - [ ] 依赖安全扫描
  - [ ] 代码安全审查
  - [ ] 安全测试

### 12.2 数据安全

**必须确认**：
- [ ] **数据保护**：
  - [ ] 敏感数据加密
  - [ ] 数据库连接加密
  - [ ] 日志脱敏

---

## 13. 回滚方案确认 🔄

### 13.1 回滚策略

**必须确认**：
- [ ] **回滚方案**：
  - [ ] 快速回滚机制
  - [ ] 数据回滚方案
  - [ ] 配置回滚方案

- [ ] **回滚测试**：
  - [ ] 回滚流程测试
  - [ ] 回滚时间估算
  - [ ] 回滚影响评估

### 13.2 备份方案

**必须确认**：
- [ ] **备份策略**：
  - [ ] 数据库备份
  - [ ] 配置备份
  - [ ] 代码备份

---

## 14. 文档准备确认 📚

### 14.1 技术文档

**必须确认**：
- [ ] **开发文档**：
  - [ ] Go 后端架构文档
  - [ ] API 文档（OpenAPI/Swagger）
  - [ ] 数据库 Schema 文档
  - [ ] 部署文档

- [ ] **运维文档**：
  - [ ] 部署指南
  - [ ] 故障排除指南
  - [ ] 监控和日志指南

### 14.2 迁移文档

**必须确认**：
- [ ] **迁移文档**：
  - [ ] 迁移计划
  - [ ] 迁移步骤
  - [ ] 迁移检查清单
  - [ ] 迁移回滚文档

---

## 15. 成本评估确认 💰

### 15.1 开发成本

**必须确认**：
- [ ] **开发成本**：
  - [ ] 开发时间估算（3-6 个月）
  - [ ] 人力成本
  - [ ] 学习成本

### 15.2 运维成本

**必须确认**：
- [ ] **运维成本**：
  - [ ] 服务器资源成本
  - [ ] 监控工具成本
  - [ ] 维护成本

### 15.3 ROI 评估

**必须确认**：
- [ ] **收益评估**：
  - [ ] 性能提升带来的成本节省
  - [ ] 扩展性提升的价值
  - [ ] 长期维护成本对比

---

## 16. 时间计划确认 📅

### 16.1 迁移时间表

**必须确认**：
- [ ] **时间计划**：
  - [ ] 准备阶段（1-2 周）
  - [ ] 开发阶段（8-12 周）
  - [ ] 测试阶段（2-3 周）
  - [ ] 部署阶段（1-2 周）
  - [ ] 总计：3-6 个月

### 16.2 里程碑

**必须确认**：
- [ ] **关键里程碑**：
  - [ ] 技术选型完成
  - [ ] 基础设施搭建完成
  - [ ] 核心功能迁移完成
  - [ ] 测试完成
  - [ ] 生产部署完成

---

## 17. 风险评估确认 ⚠️

### 17.1 技术风险

**必须确认**：
- [ ] **技术风险**：
  - [ ] 团队技能风险
  - [ ] 技术选型风险
  - [ ] 性能风险
  - [ ] 兼容性风险

- [ ] **风险缓解**：
  - [ ] 风险缓解方案
  - [ ] 应急预案

### 17.2 业务风险

**必须确认**：
- [ ] **业务风险**：
  - [ ] 服务中断风险
  - [ ] 数据丢失风险
  - [ ] 用户体验风险

- [ ] **风险缓解**：
  - [ ] 灰度发布
  - [ ] 回滚方案
  - [ ] 监控告警

---

## 18. 决策确认 ✅

### 18.1 最终决策

**必须确认**：
- [ ] **决策确认**：
  - [ ] 是否决定迁移（是/否）
  - [ ] 迁移策略（渐进式/一次性）
  - [ ] 迁移时间表
  - [ ] 资源分配

- [ ] **审批流程**：
  - [ ] 技术评审通过
  - [ ] 管理层审批
  - [ ] 团队共识

---

## 📋 检查清单总结

### 必须完成（迁移前）

1. ✅ **技术栈选型** - 确定所有技术选型
2. ✅ **团队技能** - 评估并培训团队
3. ✅ **基础设施** - 准备开发和生产环境
4. ✅ **API 兼容性** - 确认所有 API 接口
5. ✅ **数据迁移** - 确认 Schema 迁移方案
6. ✅ **认证系统** - 确认 JWT 兼容性
7. ✅ **环境变量** - 确认所有环境变量
8. ✅ **部署方案** - 确认部署架构和流程
9. ✅ **监控日志** - 确认监控和日志方案
10. ✅ **测试策略** - 确认测试覆盖和工具
11. ✅ **性能基准** - 建立性能基准和目标
12. ✅ **安全措施** - 确认安全配置
13. ✅ **回滚方案** - 准备回滚机制
14. ✅ **文档准备** - 准备所有必要文档
15. ✅ **成本评估** - 评估开发 and 运维成本
16. ✅ **时间计划** - 制定详细时间表
17. ✅ **风险评估** - 识别并缓解风险
18. ✅ **最终决策** - 确认迁移决策

### 建议完成（迁移前）

- [ ] **POC 验证** - 创建概念验证项目
- [ ] **性能测试** - 进行初步性能测试
- [ ] **安全审计** - 进行安全审查
- [ ] **团队培训** - 组织 Go 和 DDD 培训

---

## 🎯 快速检查

**如果以下所有项都确认，可以开始迁移**：

- [ ] 技术栈已选型并验证
- [ ] 团队具备 Go 开发能力
- [ ] 基础设施已准备
- [ ] API 接口已全部确认
- [ ] 认证系统兼容性已验证
- [ ] 部署方案已确定
- [ ] 回滚方案已准备
- [ ] 时间计划已制定
- [ ] 风险已识别并缓解
- [ ] 决策已确认

**如果任何一项未确认，建议先完成确认再开始迁移。**

---

## 🗄️ ORM 选型：SQLite ↔ PostgreSQL 切换方案

### 需求分析

**核心需求**：
- ✅ 方便在 SQLite 和 PostgreSQL 之间切换
- ✅ 支持 DDD 架构（Repository 模式）
- ✅ 类型安全
- ✅ 性能良好

**使用场景**：
- 开发环境：SQLite（简单，无需安装数据库）
- 生产环境：PostgreSQL（性能，功能完整）

---

### Go ORM 对比分析

#### 1. GORM ⭐⭐⭐⭐⭐（推荐）

**多数据库支持**：✅ **优秀**

**支持的数据库**：
- ✅ PostgreSQL
- ✅ SQLite
- ✅ MySQL
- ✅ SQL Server
- ✅ 其他 10+ 数据库

**切换方式**：
```go
import (
    "gorm.io/driver/postgres"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// PostgreSQL
db, err := gorm.Open(postgres.Open("postgres://..."), &gorm.Config{})

// SQLite
db, err := gorm.Open(sqlite.Open("gymapp.db"), &gorm.Config{})
```

**优点**：
- ✅ **多数据库支持最好**：只需更换驱动，代码几乎不变
- ✅ **功能完整**：迁移、关联、事务等
- ✅ **生态成熟**：文档丰富，社区活跃
- ✅ **DDD 友好**：支持 Repository 模式
- ✅ **类型安全**：Go 结构体映射

**缺点**：
- ⚠️ 性能略低于原生 SQL（但通常足够）
- ⚠️ 学习曲线中等
- ⚠️ 复杂查询可能不够灵活

**适用场景**：✅ **强烈推荐**（最适合你的需求）

---

#### 2. sqlx ⭐⭐⭐⭐

**多数据库支持**：✅ **良好**

**支持的数据库**：
- ✅ PostgreSQL（`github.com/lib/pq`）
- ✅ SQLite（`github.com/mattn/go-sqlite3`）
- ✅ MySQL
- ✅ 其他标准 SQL 数据库

**切换方式**：
```go
import (
    _ "github.com/lib/pq"           // PostgreSQL
    _ "github.com/mattn/go-sqlite3" // SQLite
    "github.com/jmoiron/sqlx"
)

// PostgreSQL
db, err := sqlx.Connect("postgres", "postgres://...")

// SQLite
db, err := sqlx.Connect("sqlite3", "gymapp.db")
```

**优点**：
- ✅ **性能好**：接近原生 SQL
- ✅ **灵活**：手写 SQL，完全控制
- ✅ **轻量级**：依赖少
- ✅ **类型安全**：结构体扫描
- ✅ **多数据库支持**：标准 SQL 接口

**缺点**：
- ⚠️ 需要手写 SQL（工作量大）
- ⚠️ 没有迁移工具（需要配合其他工具）
- ⚠️ 没有自动关联（需要手动 JOIN）

**适用场景**：适合复杂查询和性能要求高的场景

---

#### 3. ent ⭐⭐⭐

**多数据库支持**：✅ **良好**

**支持的数据库**：
- ✅ PostgreSQL
- ✅ SQLite
- ✅ MySQL
- ✅ Gremlin（图数据库）

**切换方式**：
```go
// ent 通过代码生成，切换需要重新生成
// 但运行时可以通过配置切换

// PostgreSQL
client, err := ent.Open("postgres", "postgres://...")

// SQLite
client, err := ent.Open("sqlite", "file:gymapp.db?cache=shared&mode=rwc")
```

**优点**：
- ✅ **类型安全**：代码生成，编译时检查
- ✅ **GraphQL 支持**：内置 GraphQL 支持
- ✅ **迁移工具**：内置迁移
- ✅ **多数据库支持**：支持多种数据库

**缺点**：
- ❌ **学习曲线陡**：需要理解代码生成
- ❌ **切换不够灵活**：需要重新生成代码
- ❌ **生态相对小**：社区较小

**适用场景**：适合大型项目，需要强类型安全

---

#### 4. sqlc ⭐⭐⭐⭐

**多数据库支持**：✅ **良好**

**支持的数据库**：
- ✅ PostgreSQL
- ✅ SQLite
- ✅ MySQL

**切换方式**：
```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"  # 或 "sqlite"
    queries: "queries/"
    schema: "schema/"
```

**优点**：
- ✅ **SQL 优先**：手写 SQL，类型安全
- ✅ **性能好**：生成的代码性能优秀
- ✅ **类型安全**：从 SQL 生成类型
- ✅ **多数据库支持**：支持多种数据库

**缺点**：
- ⚠️ 需要维护 SQL 文件
- ⚠️ 切换需要修改配置并重新生成
- ⚠️ 没有 ORM 功能（需要手写 JOIN）

**适用场景**：适合 SQL 优先的项目

---

#### 5. Drizzle ORM（Go 版本）⭐⭐⭐

**多数据库支持**：✅ **良好**

**支持的数据库**：
- ✅ PostgreSQL
- ✅ SQLite
- ✅ MySQL

**切换方式**：
```go
import (
    "github.com/drizzle-team/drizzle-orm-go/driver/postgres"
    "github.com/drizzle-team/drizzle-orm-go/driver/sqlite"
)

// PostgreSQL
db := postgres.New("postgres://...")

// SQLite
db := sqlite.New("gymapp.db")
```

**优点**：
- ✅ **与前端一致**：你已经在用 Drizzle（TypeScript）
- ✅ **类型安全**：TypeScript 风格
- ✅ **轻量级**：性能好

**缺点**：
- ⚠️ **Go 版本不够成熟**：生态较小
- ⚠️ 文档和社区支持不如 GORM
- ⚠️ 可能不如 GORM 稳定

**适用场景**：如果希望前后端使用相同的 ORM 概念

---

### 推荐方案对比

| ORM | 多数据库切换 | 易用性 | 性能 | DDD 友好 | 推荐度 |
|-----|------------|--------|------|---------|--------|
| **GORM** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **⭐⭐⭐⭐⭐** |
| **sqlx** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **ent** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **sqlc** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Drizzle** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

### 🎯 最终推荐：GORM

#### 推荐理由

1. **多数据库切换最方便** ⭐⭐⭐⭐⭐
   - 只需更换驱动，代码几乎不变
   - 支持环境变量切换

2. **功能完整** ⭐⭐⭐⭐⭐
   - 迁移、关联、事务等一应俱全
   - 适合 DDD Repository 模式

3. **生态成熟** ⭐⭐⭐⭐⭐
   - 文档丰富，社区活跃
   - 问题容易解决

4. **开发效率高** ⭐⭐⭐⭐⭐
   - 代码简洁，学习曲线平缓
   - 快速开发

---

### GORM 实现方案

#### 1. 数据库抽象层

```go
// internal/infrastructure/database/database.go
package database

import (
    "gorm.io/driver/postgres"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "os"
)

type Database interface {
    DB() *gorm.DB
    Close() error
}

type database struct {
    db *gorm.DB
}

func NewDatabase() (Database, error) {
    dbType := os.Getenv("DB_TYPE") // "postgres" 或 "sqlite"
    
    var db *gorm.DB
    var err error
    
    switch dbType {
    case "sqlite":
        db, err = gorm.Open(sqlite.Open("gymapp.db"), &gorm.Config{})
    case "postgres", "":
        // 默认 PostgreSQL
        dsn := os.Getenv("DATABASE_URL")
        if dsn == "" {
            dsn = buildPostgresDSN()
        }
        db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    default:
        return nil, fmt.Errorf("unsupported database type: %s", dbType)
    }
    
    if err != nil {
        return nil, err
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
```

#### 2. 环境变量配置

```bash
# .env.development (SQLite)
DB_TYPE=sqlite
DATABASE_PATH=./gymapp.db

# .env.production (PostgreSQL)
DB_TYPE=postgres
DATABASE_URL=postgres://user:pass@localhost/gymapp
```

#### 3. Repository 实现（与数据库无关）

```go
// internal/domain/workout/repository/workout.repository.go
package repository

import (
    "gorm.io/gorm"
    "your-app/internal/domain/workout/model"
)

type WorkoutRepository struct {
    db *gorm.DB
}

func NewWorkoutRepository(db *gorm.DB) *WorkoutRepository {
    return &WorkoutRepository{db: db}
}

func (r *WorkoutRepository) FindByDate(userID, date string) (*model.Workout, error) {
    var workout model.Workout
    err := r.db.Where("user_id = ? AND date = ?", userID, date).First(&workout).Error
    if err != nil {
        return nil, err
    }
    return &workout, nil
}

// 这个 Repository 代码在 SQLite 和 PostgreSQL 之间完全通用！
```

#### 4. 模型定义（与数据库无关）

```go
// internal/domain/workout/model/workout.go
package model

import "gorm.io/gorm"

type Workout struct {
    ID        uint      `gorm:"primaryKey"`
    UserID    string    `gorm:"not null;index"`
    Date      string    `gorm:"not null;uniqueIndex:idx_user_date"`
    StartTime time.Time `gorm:"not null"`
    EndTime   *time.Time
    CreatedAt time.Time
    UpdatedAt time.Time
}

// GORM 标签在 SQLite 和 PostgreSQL 之间通用
```

---

### 混合方案：GORM + sqlx（推荐）

**策略**：简单查询用 GORM，复杂查询用 sqlx

**优点**：
- ✅ 简单查询：GORM 快速开发
- ✅ 复杂查询：sqlx 性能好，灵活
- ✅ 多数据库：两者都支持

**实现**：
```go
// Repository 可以同时使用 GORM 和 sqlx
type WorkoutRepository struct {
    gormDB *gorm.DB      // GORM 用于简单查询
    sqlxDB *sqlx.DB      // sqlx 用于复杂查询
}

// 简单查询用 GORM
func (r *WorkoutRepository) FindByID(id uint) (*Workout, error) {
    var workout Workout
    err := r.gormDB.First(&workout, id).Error
    return &workout, err
}

// 复杂查询用 sqlx
func (r *WorkoutRepository) FindComplexQuery() ([]Workout, error) {
    query := `
        SELECT w.*, COUNT(s.id) as set_count
        FROM workouts w
        LEFT JOIN sets s ON s.workout_id = w.id
        WHERE w.user_id = $1
        GROUP BY w.id
        HAVING COUNT(s.id) > 5
    `
    var workouts []Workout
    err := r.sqlxDB.Select(&workouts, query, userID)
    return workouts, err
}
```

---

### 数据库切换最佳实践

#### 1. 使用环境变量切换

```go
// 通过环境变量切换，无需修改代码
DB_TYPE=sqlite        // 开发环境
DB_TYPE=postgres     // 生产环境
```

#### 2. 统一接口抽象

```go
// 定义数据库接口，Repository 不依赖具体实现
type Database interface {
    Find(interface{}, ...interface{}) error
    Create(interface{}) error
    Update(interface{}) error
    Delete(interface{}) error
}
```

#### 3. 注意数据库差异

**SQLite vs PostgreSQL 差异**：
- **数据类型**：SQLite 类型较少，需要适配
- **并发**：PostgreSQL 并发更好
- **功能**：PostgreSQL 功能更完整

**GORM 处理**：
- GORM 会自动处理大部分差异
- 复杂功能需要条件编译或运行时判断

```go
// 处理数据库差异
func (r *WorkoutRepository) FindWithPagination(limit, offset int) ([]Workout, error) {
    var workouts []Workout
    
    // GORM 会自动适配不同数据库的 LIMIT/OFFSET 语法
    err := r.db.Limit(limit).Offset(offset).Find(&workouts).Error
    return workouts, err
}
```

---

### 实施建议

#### 阶段 1：选择 GORM（推荐）

**理由**：
- ✅ 多数据库切换最方便
- ✅ 功能完整，适合 DDD
- ✅ 生态成熟，文档丰富

**实施步骤**：
1. 安装 GORM 和驱动
   ```bash
   go get gorm.io/gorm
   go get gorm.io/driver/postgres
   go get gorm.io/driver/sqlite
   ```

2. 创建数据库抽象层
3. 实现 Repository（与数据库无关）
4. 通过环境变量切换数据库

#### 阶段 2：复杂查询使用 sqlx（可选）

**如果性能要求高或查询复杂**：
- 简单查询：GORM
- 复杂查询：sqlx

---

### 总结

**推荐方案**：**GORM** ⭐⭐⭐⭐⭐

**核心优势**：
1. ✅ **切换最方便**：只需更换驱动
2. ✅ **代码通用**：Repository 代码在 SQLite 和 PostgreSQL 之间完全通用
3. ✅ **功能完整**：适合 DDD 架构
4. ✅ **生态成熟**：文档和社区支持好

**实施方式**：
- 开发环境：SQLite（`DB_TYPE=sqlite`）
- 生产环境：PostgreSQL（`DB_TYPE=postgres`）
- 代码：完全通用，无需修改

**如果性能要求极高**：可以考虑 GORM + sqlx 混合方案

---

## 🚀 渐进式迁移计划（边迁移边解决）

### 迁移策略：渐进式 + 迭代优化

**核心原则**：
- ✅ **从简单到复杂**：先迁移最简单的领域
- ✅ **边迁移边验证**：每个阶段都验证功能
- ✅ **风险最小化**：保持现有系统运行
- ✅ **快速迭代**：小步快跑，快速反馈

---

## 📋 迁移顺序（推荐）

### 阶段 0：基础设施搭建（1-2 周）🏗️

**目标**：搭建 Go 后端基础架构

**任务清单**：
- [ ] **项目初始化**
  - [ ] 创建 Go 项目结构
  - [ ] 配置 `go.mod`
  - [ ] 设置项目布局（标准 Go 项目布局）

- [ ] **数据库连接**
  - [ ] 安装 GORM + 驱动（PostgreSQL + SQLite）
  - [ ] 实现数据库抽象层
  - [ ] 实现数据库连接池
  - [ ] 测试数据库连接（SQLite 和 PostgreSQL）

- [ ] **基础配置**
  - [ ] 环境变量管理（viper）
  - [ ] 日志系统（zap）
  - [ ] 错误处理框架
  - [ ] 健康检查端点

- [ ] **Web 框架**
  - [ ] 安装 Gin
  - [ ] 配置路由
  - [ ] 实现中间件（CORS, 日志）
  - [ ] 测试基础路由

**验证标准**：
- ✅ Go 项目可以启动
- ✅ 可以连接数据库（SQLite 和 PostgreSQL）
- ✅ 健康检查端点返回 200
- ✅ 日志正常输出

**产出**：
```
backend/
├── cmd/server/main.go
├── internal/
│   ├── infrastructure/
│   │   ├── database/
│   │   └── config/
│   └── api/
│       └── handlers/
│           └── health.go
└── go.mod
```

---

### 阶段 1：迁移 BodyPart（最简单，1 周）🎯

**为什么先迁移 BodyPart**：
- ✅ **最简单**：只有基本的 CRUD
- ✅ **无依赖**：不依赖其他领域
- ✅ **风险低**：即使失败也不影响核心功能
- ✅ **快速验证**：可以快速验证整个架构

**任务清单**：
- [ ] **领域模型迁移**
  - [ ] `BodyPart` 实体（Go struct）
  - [ ] `BodyPartName` 值对象
  - [ ] 业务规则验证

- [ ] **Repository 迁移**
  - [ ] `BodyPartRepository` 接口
  - [ ] GORM 实现
  - [ ] 查询方法（FindByID, FindByName, List）
  - [ ] 命令方法（Create, Update, Delete）

- [ ] **Use Case 迁移**
  - [ ] `GetBodyPartList`
  - [ ] `CreateBodyPart`
  - [ ] `UpdateBodyPart`
  - [ ] `DeleteBodyPart`

- [ ] **API 路由迁移**
  - [ ] `GET /api/body-part` - 获取列表
  - [ ] `POST /api/body-part` - 创建
  - [ ] `PUT /api/body-part/:id` - 更新
  - [ ] `DELETE /api/body-part/:id` - 删除

- [ ] **测试**
  - [ ] 单元测试（Repository, Use Case）
  - [ ] 集成测试（API）
  - [ ] 前端调用测试

**验证标准**：
- ✅ 所有 API 端点正常工作
- ✅ 前端可以正常调用
- ✅ 数据正确存储和读取
- ✅ 错误处理正确

**前端切换方式**：
```typescript
// 通过环境变量切换 API 地址
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

// 开发环境：使用 Go 后端
NEXT_PUBLIC_API_URL=http://localhost:8080/api

// 生产环境：逐步切换
```

---

### 阶段 2：迁移 Exercise（1-2 周）💪

**为什么第二个迁移**：
- ✅ **依赖 BodyPart**：需要 BodyPart 已迁移
- ✅ **相对简单**：比 Workout 简单
- ✅ **验证关联**：可以验证外键和关联查询

**任务清单**：
- [ ] **领域模型迁移**
  - [ ] `Exercise` 实体
  - [ ] `ExerciseName` 值对象
  - [ ] 与 BodyPart 的关联

- [ ] **Repository 迁移**
  - [ ] `ExerciseRepository` 接口
  - [ ] GORM 关联查询
  - [ ] 按 BodyPart 查询

- [ ] **Use Case 迁移**
  - [ ] `GetExerciseList`
  - [ ] `GetExercisesByBodyPart`
  - [ ] `CreateExercise`
  - [ ] `UpdateExercise`
  - [ ] `DeleteExercise`

- [ ] **API 路由迁移**
  - [ ] `GET /api/exercise`
  - [ ] `GET /api/exercise/body-part/:name`
  - [ ] `POST /api/exercise`
  - [ ] `PUT /api/exercise/:id`
  - [ ] `DELETE /api/exercise/:id`

- [ ] **测试**
  - [ ] 关联查询测试
  - [ ] 外键约束测试

**验证标准**：
- ✅ Exercise 与 BodyPart 关联正确
- ✅ 按 BodyPart 查询正常
- ✅ 删除 BodyPart 时级联删除正确

---

### 阶段 3：迁移 Workout（核心，2-3 周）🏋️

**为什么第三个迁移**：
- ⚠️ **最复杂**：包含 Workout, ExerciseBlock, Set
- ⚠️ **核心功能**：最重要的业务逻辑
- ⚠️ **依赖多**：依赖 Exercise 和 BodyPart

**任务清单**：
- [ ] **领域模型迁移**
  - [ ] `Workout` 实体
  - [ ] `ExerciseBlock` 实体
  - [ ] `Set` 实体
  - [ ] 复杂的业务规则

- [ ] **Repository 迁移**
  - [ ] `WorkoutRepository`
  - [ ] `ExerciseBlockRepository`
  - [ ] `SetRepository`
  - [ ] 复杂的关联查询

- [ ] **Use Case 迁移**
  - [ ] `GetWorkoutList`
  - [ ] `GetWorkoutByDate`
  - [ ] `CreateWorkout`
  - [ ] `CreateExerciseBlock`
  - [ ] `UpdateSet`
  - [ ] `DeleteSet`
  - [ ] 所有复杂的业务逻辑

- [ ] **API 路由迁移**
  - [ ] 所有 Workout 相关 API
  - [ ] 所有 ExerciseBlock 相关 API
  - [ ] 所有 Set 相关 API

- [ ] **测试**
  - [ ] 复杂业务逻辑测试
  - [ ] 事务测试
  - [ ] 性能测试

**验证标准**：
- ✅ 所有 Workout 功能正常
- ✅ 复杂的关联查询正确
- ✅ 事务处理正确
- ✅ 性能满足要求

---

### 阶段 4：迁移认证和用户（2 周）🔐

**为什么最后迁移**：
- ⚠️ **最关键**：影响所有功能
- ⚠️ **风险最高**：认证失败会导致所有功能不可用
- ⚠️ **需要兼容**：必须保证现有用户登录状态

**任务清单**：
- [ ] **JWT 兼容实现**
  - [ ] 解析 NextAuth.js JWT
  - [ ] 生成兼容的 JWT
  - [ ] Cookie 设置（与 NextAuth.js 一致）

- [ ] **用户 Repository**
  - [ ] `UserRepository`
  - [ ] 密码验证
  - [ ] 用户查询

- [ ] **认证 Use Case**
  - [ ] `Login`
  - [ ] `Logout`
  - [ ] `VerifyPassword`

- [ ] **认证中间件**
  - [ ] JWT 验证中间件
  - [ ] 用户信息提取

- [ ] **API 路由迁移**
  - [ ] `POST /api/auth/signin`
  - [ ] `POST /api/auth/signup`
  - [ ] `GET /api/user/me`
  - [ ] `PUT /api/user/profile`
  - [ ] `PUT /api/user/password`

- [ ] **测试**
  - [ ] 现有用户 JWT 解析测试
  - [ ] 新用户登录测试
  - [ ] Cookie 设置测试
  - [ ] 跨域 Cookie 测试

**验证标准**：
- ✅ 现有用户无需重新登录
- ✅ 新用户登录正常
- ✅ Cookie 设置正确
- ✅ 所有需要认证的 API 正常工作

---

## 🎯 每个阶段的验证清单

### 阶段完成标准

每个阶段完成后，必须验证：

- [ ] **功能验证**
  - [ ] 所有 API 端点正常工作
  - [ ] 前端可以正常调用
  - [ ] 数据正确存储和读取

- [ ] **错误处理**
  - [ ] 错误响应格式正确
  - [ ] HTTP 状态码正确
  - [ ] 错误消息清晰

- [ ] **测试覆盖**
  - [ ] 单元测试通过
  - [ ] 集成测试通过
  - [ ] 前端调用测试通过

- [ ] **性能验证**
  - [ ] 响应时间满足要求
  - [ ] 并发能力满足要求

- [ ] **文档更新**
  - [ ] API 文档更新
  - [ ] 部署文档更新

---

## 🔄 边迁移边解决的策略

### 1. 遇到问题时的处理流程

**问题分类**：
1. **阻塞性问题**（必须解决才能继续）
   - 数据库连接问题
   - 认证问题
   - 核心功能问题
   - **处理**：立即解决，暂停迁移

2. **非阻塞性问题**（可以延后解决）
   - 性能优化
   - 代码重构
   - 文档完善
   - **处理**：记录问题，延后解决

3. **设计问题**（需要讨论）
   - 架构调整
   - API 设计变更
   - **处理**：团队讨论，决定方案

### 2. 问题记录和跟踪

**使用工具**：
- GitHub Issues
- 问题清单文档
- 每日站会讨论

**问题记录格式**：
```markdown
## 问题：[问题描述]

**发现时间**：2025-01-26
**影响范围**：[阶段 X]
**优先级**：高/中/低
**状态**：待解决/进行中/已解决

**问题描述**：
[详细描述]

**解决方案**：
[解决方案或讨论]

**相关代码**：
[代码链接]
```

### 3. 快速迭代原则

**小步快跑**：
- ✅ 每个阶段 1-2 周
- ✅ 每天提交代码
- ✅ 及时验证功能
- ✅ 快速反馈

**不要过度设计**：
- ⚠️ 先实现功能，再优化
- ⚠️ 先跑通，再完善
- ⚠️ 先简单，再复杂

---

## 📊 迁移进度跟踪

### 进度看板

```
阶段 0：基础设施搭建     [████████████████████] 100%
阶段 1：BodyPart 迁移     [████████████████████] 100%
阶段 2：Exercise 迁移     [████████░░░░░░░░░░░░]  50%
阶段 3：Workout 迁移      [░░░░░░░░░░░░░░░░░░░░]   0%
阶段 4：认证和用户迁移    [░░░░░░░░░░░░░░░░░░░░]   0%
```

### 每周检查点

**每周五检查**：
- [ ] 本周完成的任务
- [ ] 遇到的问题
- [ ] 下周计划
- [ ] 风险和阻塞

---

## 🎯 立即开始：阶段 0 任务清单

### 第 1 天：项目初始化

```bash
# 1. 创建 Go 项目
mkdir backend
cd backend
go mod init gymapp-backend

# 2. 安装依赖
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get gorm.io/driver/sqlite
go get go.uber.org/zap
go get github.com/spf13/viper

# 3. 创建项目结构
mkdir -p cmd/server
mkdir -p internal/{domain,application,infrastructure/{database,config},api/handlers}
```

### 第 2-3 天：数据库连接

```go
// internal/infrastructure/database/database.go
// 实现数据库抽象层
```

### 第 4-5 天：Web 框架和基础路由

```go
// cmd/server/main.go
// 实现基础服务器和健康检查
```

### 第 6-7 天：测试和验证

- [ ] 测试数据库连接
- [ ] 测试健康检查端点
- [ ] 验证项目结构

---

## 💡 最佳实践建议

### 1. 保持现有系统运行

**策略**：
- ✅ Next.js API 继续运行
- ✅ 新功能在 Go 后端实现
- ✅ 通过环境变量切换
- ✅ 逐步迁移，不中断服务

### 2. 代码复用

**策略**：
- ✅ 复用业务逻辑（从 TypeScript 移植）
- ✅ 复用测试用例（转换为 Go 测试）
- ✅ 复用 API 设计（保持接口一致）

### 3. 持续集成

**策略**：
- ✅ 每个阶段都有 CI 测试
- ✅ 自动化部署测试环境
- ✅ 自动化 API 测试

### 4. 文档同步

**策略**：
- ✅ 迁移过程中更新文档
- ✅ API 文档实时更新
- ✅ 问题记录及时更新

---

## 🎉 总结

**迁移顺序**：
1. **阶段 0**：基础设施（1-2 周）
2. **阶段 1**：BodyPart（1 周）← **从这里开始**
3. **阶段 2**：Exercise（1-2 周）
4. **阶段 3**：Workout（2-3 周）
5. **阶段 4**：认证和用户（2 周）

**总时长**：7-10 周（约 2-2.5 个月）

**核心原则**：
- ✅ 从简单到复杂
- ✅ 边迁移边验证
- ✅ 小步快跑
- ✅ 快速反馈

**立即行动**：
1. 开始阶段 0：基础设施搭建
2. 同时准备阶段 1：BodyPart 迁移
3. 遇到问题及时记录和解决

---

**报告生成时间**：2025-01-26  
**评估人**：AI Assistant  
**版本**：v1.6（已添加渐进式迁移计划）
