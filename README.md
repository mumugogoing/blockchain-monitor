# 区块链监控系统 (Blockchain Monitor)

一个完整的区块链交易监控系统，支持 Stacks 和 Starknet 网络的实时交易监控。

## 功能特性

- ✅ **STX (Stacks) 监控**: 实时监控 Stacks 网络交易，专注于 DEX 交易和合约调用
- ✅ **Starknet 监控**: 实时监控 Starknet 网络交易
- ✅ **交易缓存**: 防止交易遗漏，确保完整性
- ✅ **自动刷新**: 可配置的自动刷新功能（10秒-5分钟可选）
- ✅ **地址监控**: 监控特定地址的交易活动，支持通知提醒
- ✅ **用户权限**: 基于角色的访问控制
  - `super`: 管理员，可访问所有监控
  - `stx`: 只能访问 STX 监控
  - `stark`: 只能访问 Starknet 监控
- ✅ **Docker 部署**: 一键 Docker 部署
- ✅ **响应式设计**: 支持各种屏幕尺寸

## 快速开始

### 方式一：Docker 部署（推荐）

1. **克隆项目**
```bash
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor
```

2. **启动服务**
```bash
docker compose up -d
```

3. **访问应用**
打开浏览器访问: http://localhost

### 方式二：本地开发

1. **安装依赖**
```bash
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

3. **访问应用**
打开浏览器访问: http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 登录凭证

系统提供三个测试账号：

| 用户名 | 密码 | 权限 |
|--------|------|------|
| super  | super123 | 管理员 - 可访问所有监控 |
| stx    | stx123   | STX用户 - 只能访问STX监控 |
| stark  | stark123 | Starknet用户 - 只能访问Starknet监控 |

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI 组件**: Ant Design 5
- **路由**: React Router 6
- **HTTP 客户端**: Axios
- **构建工具**: Vite
- **容器化**: Docker + Nginx

## 项目结构

```
blockchain-monitor/
├── src/
│   ├── api/              # API 接口
│   │   ├── stacks.ts     # Stacks API
│   │   └── starknet.ts   # Starknet API
│   ├── components/       # 组件
│   │   ├── Login.tsx     # 登录组件
│   │   ├── AppLayout.tsx # 布局组件
│   │   └── ProtectedRoute.tsx # 路由保护
│   ├── services/         # 服务
│   │   └── auth.ts       # 认证服务
│   ├── views/            # 页面视图
│   │   ├── stacks/       # STX 监控页面
│   │   └── StarknetMonitor.tsx # Starknet 监控页面
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # 入口文件
│   └── index.css         # 全局样式
├── Dockerfile            # Docker 配置
├── docker-compose.yml    # Docker Compose 配置
├── nginx.conf            # Nginx 配置
├── package.json          # 项目配置
└── vite.config.ts        # Vite 配置
```

## API 数据源

- **Stacks**: Hiro API (https://api.mainnet.hiro.so)
- **Starknet**: Voyager API (https://api.voyager.online/beta)

## 部署到服务器

### 阿里云服务器一键部署

如果您要部署到阿里云服务器，请使用自动部署脚本：

```bash
# 使用密码认证
./deploy-to-alicloud.sh

# 或使用SSH密钥
export SSH_KEY=~/.ssh/id_rsa
./deploy-to-alicloud.sh

# 自定义端口
PORT=8080 ./deploy-to-alicloud.sh
```

详细说明请参考 [阿里云部署指南](./ALICLOUD_DEPLOYMENT.md)

### 使用 Docker（通用方式）

1. **在服务器上安装 Docker 和 Docker Compose**

2. **上传项目到服务器**
```bash
scp -r blockchain-monitor user@your-server:/path/to/app
```

3. **在服务器上启动**
```bash
cd /path/to/app
docker compose up -d
```

4. **查看日志**
```bash
docker compose logs -f
```

5. **停止服务**
```bash
docker compose down
```

### 自定义端口

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8080:80"  # 改为你需要的端口
```

## 监控改进

系统实现了以下改进以防止交易遗漏：

1. **交易缓存机制**: 缓存最近的交易，防止重复和遗漏
2. **自动刷新**: 可配置的自动刷新（10秒、30秒、1分钟、2分钟、5分钟可选）
3. **地址监控**: 可以监控特定地址的交易活动
4. **交易过滤**: STX 监控已过滤代币转账交易，专注于 DEX 交易和合约调用
5. **错误重试**: API 调用失败时的重试机制
6. **本地存储**: 用户会话持久化

## STX 监控特性

- **合约覆盖**: 支持主流 DEX 平台（ALEX, Velar, Bitflow, Arkadiko, Stackswap 等）
- **交易信息**: 自动解析交易信息，显示格式如 "3000 STX ==> 1797 aeUSDC"
- **合约列**: 显示交易涉及的智能合约地址
- **过滤功能**: 按类型（合约调用、智能合约）和状态进行筛选
- **地址监控**: 输入地址进行实时监控（支持通知扩展）

## 开发指南

### 添加新的监控页面

1. 在 `src/views/` 创建新的监控组件
2. 在 `src/api/` 添加对应的 API 接口
3. 在 `src/App.tsx` 添加路由
4. 更新 `src/components/AppLayout.tsx` 菜单

### 自定义用户权限

编辑 `src/services/auth.ts` 修改用户数据库和权限逻辑。

## 常见问题

**Q: 如何修改刷新间隔？**
A: 在监控页面中，自动刷新间隔设置为30秒。可以在代码中修改 `setInterval` 的时间参数。

**Q: 如何添加更多用户？**
A: 编辑 `src/services/auth.ts` 中的 `users` 对象。

**Q: Docker 容器无法启动？**
A: 检查端口是否被占用，使用 `docker compose logs` 查看详细日志。

## 许可证

MIT License

## 作者

mumugogoing
