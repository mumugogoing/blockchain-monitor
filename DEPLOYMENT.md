# 部署指南 (Deployment Guide)

本文档提供了详细的部署说明，帮助您将区块链监控系统部署到生产环境。

## 目录

- [系统要求](#系统要求)
- [快速部署](#快速部署)
- [手动部署](#手动部署)
- [配置说明](#配置说明)
- [故障排除](#故障排除)

## 系统要求

### 硬件要求
- CPU: 1核心或以上
- 内存: 512MB 或以上
- 磁盘: 1GB 可用空间

### 软件要求
- Docker 20.10+ 
- Docker Compose V2 (2.0+)
- Git (用于克隆仓库)

## 快速部署

### 方式一：使用部署脚本（推荐）

1. **克隆项目**
```bash
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor
```

2. **运行部署脚本**
```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：
- 检查 Docker 环境
- 停止旧容器
- 构建新镜像
- 启动服务
- 验证部署状态

### 方式二：手动 Docker Compose

```bash
# 克隆项目
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

## 手动部署

如果您不想使用 Docker，可以手动部署：

### 1. 安装依赖

```bash
# 确保已安装 Node.js 18+
node --version

# 安装项目依赖
npm install
```

### 2. 构建项目

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 3. 配置 Web 服务器

#### 使用 Nginx

1. 复制构建产物到 Nginx 目录：
```bash
sudo cp -r dist/* /var/www/blockchain-monitor/
```

2. 创建 Nginx 配置文件：
```bash
sudo nano /etc/nginx/sites-available/blockchain-monitor
```

内容如下：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/blockchain-monitor;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. 启用站点并重启 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/blockchain-monitor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 配置说明

### 环境变量

目前系统使用硬编码的 API 端点，如需修改：

1. 编辑 `src/api/stacks.ts`：
```typescript
const STACKS_API_BASE = 'https://api.mainnet.hiro.so';
```

2. 编辑 `src/api/starknet.ts`：
```typescript
const STARKNET_API_BASE = 'https://api.voyager.online/beta';
```

### 用户管理

默认用户配置在 `src/services/auth.ts` 中：

```typescript
const users: Record<string, { password: string; role: UserRole }> = {
  super: { password: 'super123', role: 'super' },
  stx: { password: 'stx123', role: 'stx' },
  stark: { password: 'stark123', role: 'stark' },
};
```

**生产环境建议**：
- 修改默认密码
- 实现真实的后端认证系统
- 使用加密存储密码

### 端口配置

修改 `docker-compose.yml` 中的端口映射：

```yaml
services:
  blockchain-monitor:
    ports:
      - "8080:80"  # 改为您需要的端口
```

## 更新部署

### 使用 Docker

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose down
docker compose up -d --build
```

### 手动部署

```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖（如有需要）
npm install

# 重新构建
npm run build

# 复制到 Web 服务器目录
sudo cp -r dist/* /var/www/blockchain-monitor/
```

## 故障排除

### 容器无法启动

```bash
# 查看容器日志
docker compose logs

# 查看容器状态
docker compose ps

# 检查端口占用
sudo lsof -i :80
```

### 构建失败

```bash
# 清理缓存重新构建
docker compose build --no-cache
```

### API 请求失败

检查：
1. 网络连接是否正常
2. API 端点是否可访问
3. 浏览器控制台错误信息

### 登录失败

确认：
1. 用户名和密码正确
2. localStorage 未被禁用
3. 浏览器控制台无错误

## 安全建议

1. **修改默认密码**：生产环境必须修改默认用户密码
2. **使用 HTTPS**：配置 SSL 证书保护数据传输
3. **定期更新**：保持系统和依赖包的更新
4. **备份数据**：虽然本系统不存储数据，但建议备份配置
5. **访问控制**：使用防火墙限制访问来源

## 监控和日志

### Docker 环境

```bash
# 查看实时日志
docker compose logs -f

# 查看特定服务日志
docker compose logs blockchain-monitor

# 导出日志
docker compose logs > logs.txt
```

### 系统监控

建议使用以下工具监控：
- Prometheus + Grafana (系统指标)
- ELK Stack (日志分析)
- Uptime Kuma (服务可用性)

## 性能优化

1. **启用 Gzip 压缩**（已在 nginx.conf 中配置）
2. **使用 CDN** 加速静态资源
3. **调整刷新频率** 根据需求修改自动刷新间隔
4. **限制缓存大小** 在 API 文件中调整 `MAX_CACHE_SIZE`

## 支持

如遇问题，请：
1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 提交新的 Issue 描述问题

## 附录

### 完整的 Docker 命令参考

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f

# 进入容器
docker compose exec blockchain-monitor sh

# 重新构建
docker compose build

# 查看状态
docker compose ps
```

### NPM 脚本参考

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint
```
