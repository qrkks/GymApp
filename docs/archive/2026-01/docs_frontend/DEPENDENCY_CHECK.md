# 依赖包使用情况检查

## ✅ 正在使用的依赖

### 核心框架
- `next` - Next.js 框架（必需）
- `react` - React 库（必需）
- `react-dom` - React DOM（必需）

### UI 组件库 (Radix UI)
- ✅ `@radix-ui/react-dialog` - 用于 Sheet 组件
- ✅ `@radix-ui/react-dropdown-menu` - 使用中
- ✅ `@radix-ui/react-icons` - 使用中
- ✅ `@radix-ui/react-label` - 使用中
- ✅ `@radix-ui/react-popover` - 使用中
- ✅ `@radix-ui/react-select` - 使用中
- ✅ `@radix-ui/react-slot` - 用于 Button 组件
- ⚠️ `@radix-ui/react-toast` - **使用了但未在 package.json 中！需要添加**

### 数据库和 ORM
- ✅ `better-sqlite3` - SQLite 数据库驱动
- ✅ `drizzle-orm` - ORM 库
- ✅ `drizzle-kit` - Drizzle 工具（devDependencies）

### 认证
- ✅ `next-auth` - NextAuth.js 认证库

### 数据验证
- ✅ `zod` - 数据验证库（所有 API routes 使用）

### 状态管理和数据获取
- ✅ `swr` - 数据获取库（前端多个组件使用）
- ✅ `mobx-react-lite` - 状态管理（authStore, AddExerciseButton 等）

### UI 工具
- ✅ `class-variance-authority` - 用于按钮、标签等组件样式
- ✅ `clsx` - className 工具
- ✅ `tailwind-merge` - Tailwind CSS 类名合并
- ✅ `tailwindcss-animate` - Tailwind 动画插件（在 tailwind.config.js 中使用）

### 图标
- ✅ `lucide-react` - 图标库（多个组件使用）

### 日期处理
- ✅ `react-day-picker` - 日期选择器（calendar 组件使用）

## ❌ 未使用的依赖

### 可能未使用
- ❌ `date-fns` - **未找到实际使用**，可以移除

## ⚠️ 缺失的依赖

- ⚠️ `@radix-ui/react-toast` - **代码中使用了但 package.json 中没有**

## 建议操作

### 1. 添加缺失的依赖
```bash
npm install @radix-ui/react-toast
```

### 2. 移除未使用的依赖
```bash
npm uninstall date-fns
```

### 3. 清理后的 package.json dependencies 应该是：

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-icons": "^1.3.2",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-toast": "^1.2.2",  // 需要添加
    "better-sqlite3": "^12.5.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.36.4",
    "lucide-react": "^0.451.0",
    "mobx-react-lite": "^4.1.1",
    "next": "14.2.15",
    "next-auth": "5.0.0-beta.30",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "swr": "^2.3.8",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.25.76"
  }
}
```

## 总结

- **需要添加**: 1 个包 (`@radix-ui/react-toast`)
- **可以移除**: 1 个包 (`date-fns`)
- **所有其他依赖都在使用中**

