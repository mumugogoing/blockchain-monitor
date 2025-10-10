# 阿里云服务器部署指南

本指南详细说明如何将区块链监控系统部署到阿里云服务器 **47.108.148.251** 的 Docker 环境中。

## 目录

- [前置要求](#前置要求)
- [快速部署](#快速部署)
- [手动部署步骤](#手动部署步骤)
- [配置说明](#配置说明)
- [常见问题](#常见问题)
- [维护操作](#维护操作)

## 前置要求

### 本地环境

1. **SSH 客户端** - 用于连接服务器
2. **rsync** - 用于文件传输
   ```bash
   # Ubuntu/Debian
   sudo apt-get install rsync
   
   # CentOS/RHEL
   sudo yum install rsync
   
   # macOS (通常已预装)
   brew install rsync
   ```

3. **sshpass**（如果使用密码认证）
   ```bash
   # Ubuntu/Debian
   sudo apt-get install sshpass
   
   # CentOS/RHEL
   sudo yum install sshpass
   
   # macOS
   brew install sshpass
   ```

### 服务器环境（将自动安装）

- Docker 20.10+
- Docker Compose V2
- 开放端口：80 或自定义端口

## 快速部署

### 方式一：使用自动部署脚本（推荐）

1. **克隆项目到本地**
   ```bash
   git clone https://github.com/mumugogoing/blockchain-monitor.git
   cd blockchain-monitor
   ```

2. **运行部署脚本**
   
   使用密码认证：
   ```bash
   ./deploy-to-alicloud.sh
   ```
   脚本会提示输入服务器用户名和密码。

   或者预先设置环境变量：
   ```bash
   export SERVER_USER=root
   export SSH_PASSWORD=your_password
   ./deploy-to-alicloud.sh
   ```

   使用SSH密钥认证：
   ```bash
   export SSH_KEY=~/.ssh/id_rsa
   ./deploy-to-alicloud.sh
   ```

3. **访问应用**
   
   部署成功后，在浏览器中访问：
   ```
   http://47.108.148.251
   ```

### 方式二：自定义端口部署

如果80端口已被占用，可以指定其他端口：

```bash
PORT=8080 ./deploy-to-alicloud.sh
```

然后访问：`http://47.108.148.251:8080`

## 手动部署步骤

如果自动脚本无法使用，可以手动部署：

### 1. 连接到服务器

```bash
ssh root@47.108.148.251
```

### 2. 安装 Docker（如果未安装）

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 3. 上传项目文件

在本地执行：

```bash
# 方式1: 使用 rsync
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  ./ root@47.108.148.251:/opt/blockchain-monitor/

# 方式2: 使用 scp
scp -r blockchain-monitor root@47.108.148.251:/opt/
```

### 4. 在服务器上构建和启动

连接到服务器后：

```bash
cd /opt/blockchain-monitor

# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f
```

## 配置说明

### 端口配置

如需修改端口，编辑 `docker-compose.yml`：

```yaml
services:
  blockchain-monitor:
    ports:
      - "8080:80"  # 改为你需要的端口
```

### 防火墙配置

确保服务器防火墙允许相应端口：

```bash
# 阿里云安全组规则
# 在阿里云控制台添加安全组规则：
# - 协议类型：TCP
# - 端口范围：80/TCP 或自定义端口
# - 授权对象：0.0.0.0/0

# 服务器本地防火墙（如果启用）
# CentOS/RHEL
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload

# Ubuntu（使用ufw）
ufw allow 80/tcp
ufw reload
```

### 环境变量

部署脚本支持以下环境变量：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SERVER_IP` | 服务器IP地址 | 47.108.148.251 |
| `SERVER_USER` | SSH用户名 | root |
| `SSH_PASSWORD` | SSH密码 | 无 |
| `SSH_KEY` | SSH私钥路径 | 无 |
| `PORT` | 应用端口 | 80 |

## 常见问题

### 1. 无法连接到服务器

**问题**: SSH连接失败

**解决方案**:
- 检查服务器IP是否正确：`ping 47.108.148.251`
- 检查SSH端口是否开放（默认22）
- 在阿里云控制台检查安全组规则是否允许SSH访问
- 确认用户名和密码是否正确

### 2. Docker安装失败

**问题**: 自动安装Docker失败

**解决方案**:
手动安装Docker:
```bash
# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 3. 端口被占用

**问题**: 80端口已被其他服务占用

**解决方案**:
```bash
# 查看端口占用
netstat -tlnp | grep :80

# 停止占用端口的服务（如Apache/Nginx）
systemctl stop nginx  # 或 apache2

# 或使用其他端口部署
PORT=8080 ./deploy-to-alicloud.sh
```

### 4. 容器启动失败

**问题**: Docker容器无法启动

**解决方案**:
```bash
# 查看详细日志
docker compose logs

# 检查磁盘空间
df -h

# 清理Docker资源
docker system prune -a

# 重新构建
docker compose build --no-cache
docker compose up -d
```

### 5. 内存不足

**问题**: 服务器内存不足导致构建失败

**解决方案**:
```bash
# 检查内存使用
free -h

# 临时增加swap空间
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 维护操作

### 查看应用状态

```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose ps'
```

### 查看日志

```bash
# 实时日志
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs -f'

# 最近100行日志
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs --tail=100'
```

### 重启服务

```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose restart'
```

### 停止服务

```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose down'
```

### 更新应用

```bash
# 在本地拉取最新代码
git pull origin main

# 重新部署
./deploy-to-alicloud.sh
```

### 备份配置

```bash
# 从服务器下载配置
scp root@47.108.148.251:/opt/blockchain-monitor/docker-compose.yml ./backup/

# 备份整个应用目录
rsync -avz root@47.108.148.251:/opt/blockchain-monitor/ ./backup/
```

### 清理资源

```bash
# 清理未使用的Docker镜像和容器
ssh root@47.108.148.251 'docker system prune -a -f'

# 清理构建缓存
ssh root@47.108.148.251 'docker builder prune -a -f'
```

## 安全建议

1. **修改默认密码**
   - 部署后立即修改 `src/services/auth.ts` 中的默认密码
   - 重新构建并部署

2. **启用HTTPS**
   ```bash
   # 安装Certbot
   sudo apt-get install certbot
   
   # 获取SSL证书
   sudo certbot certonly --standalone -d your-domain.com
   
   # 修改nginx.conf添加SSL配置
   ```

3. **限制SSH访问**
   - 修改SSH默认端口
   - 使用密钥认证替代密码
   - 配置fail2ban防止暴力破解

4. **配置防火墙**
   - 只开放必要的端口（80, 443, SSH）
   - 使用阿里云安全组精确控制访问

5. **定期更新**
   ```bash
   # 更新系统
   sudo apt-get update && sudo apt-get upgrade
   
   # 更新Docker镜像
   docker compose pull
   docker compose up -d
   ```

## 监控和告警

### 系统监控

```bash
# CPU和内存使用
ssh root@47.108.148.251 'top -b -n 1 | head -20'

# 磁盘使用
ssh root@47.108.148.251 'df -h'

# Docker容器资源使用
ssh root@47.108.148.251 'docker stats --no-stream'
```

### 访问日志分析

```bash
# 查看Nginx访问日志
ssh root@47.108.148.251 'docker compose exec blockchain-monitor cat /var/log/nginx/access.log'

# 错误日志
ssh root@47.108.148.251 'docker compose exec blockchain-monitor cat /var/log/nginx/error.log'
```

## 登录信息

部署成功后，使用以下凭证登录系统：

| 用户名 | 密码 | 权限说明 |
|--------|------|----------|
| super | super123 | 管理员 - 可访问所有监控 |
| stx | stx123 | STX用户 - 只能访问STX监控 |
| stark | stark123 | Starknet用户 - 只能访问Starknet监控 |

**⚠️ 生产环境请务必修改默认密码！**

## 技术支持

如遇到问题：

1. 查看本文档的[常见问题](#常见问题)部分
2. 检查服务器日志：`docker compose logs`
3. 查看项目 [GitHub Issues](https://github.com/mumugogoing/blockchain-monitor/issues)
4. 提交新的 Issue 描述问题

## 相关文档

- [README.md](./README.md) - 项目介绍和快速开始
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 通用部署指南
- [ARBITRAGE_MONITOR.md](./ARBITRAGE_MONITOR.md) - 套利监控文档
