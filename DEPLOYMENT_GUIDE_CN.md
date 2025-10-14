# 阿里云部署完整指南 (中文)

## 📋 目录

1. [部署概述](#部署概述)
2. [快速开始](#快速开始)
3. [详细步骤](#详细步骤)
4. [文档索引](#文档索引)
5. [常见问题](#常见问题)

---

## 部署概述

本项目提供了完整的自动化部署方案，可以一键将区块链监控系统部署到阿里云服务器 **47.108.148.251** 的 Docker 环境中。

### 🎯 目标服务器
- **IP地址**: 47.108.148.251
- **部署目录**: /opt/blockchain-monitor
- **访问端口**: 80 (可自定义)
- **访问地址**: http://47.108.148.251

### ✨ 主要特性
- ✅ 一键自动部署
- ✅ 自动安装Docker环境
- ✅ 支持密码和SSH密钥认证
- ✅ 支持自定义端口
- ✅ 完整的错误处理和提示
- ✅ 部署前环境检查

---

## 快速开始

### 三步部署法

**第1步**: 克隆项目
```bash
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor
```

**第2步**: 运行部署脚本
```bash
./deploy-to-alicloud.sh
```

**第3步**: 访问应用
```
http://47.108.148.251
```

就这么简单！🎉

### 登录系统

| 用户名 | 密码 | 权限 |
|--------|------|------|
| super  | super123 | 管理员 |
| stx    | stx123   | STX监控 |
| stark  | stark123 | Starknet监控 |

---

## 详细步骤

### 准备工作

#### 1. 本地环境要求
- Git (克隆项目)
- SSH 客户端 (连接服务器)
- rsync (同步文件)
- sshpass (密码认证，可选)

**Ubuntu/Debian 安装命令:**
```bash
sudo apt-get update
sudo apt-get install git ssh rsync sshpass
```

**CentOS/RHEL 安装命令:**
```bash
sudo yum install git openssh-clients rsync sshpass
```

**macOS 安装命令:**
```bash
brew install git rsync sshpass
```

#### 2. 服务器准备
- 阿里云ECS实例（已有：47.108.148.251）
- 开放SSH端口(22)和HTTP端口(80)
- 准备好SSH登录凭证

#### 3. 安全组配置
在阿里云控制台配置安全组规则：

| 协议 | 端口 | 授权对象 | 说明 |
|------|------|---------|------|
| TCP  | 22   | 你的IP或0.0.0.0/0 | SSH访问 |
| TCP  | 80   | 0.0.0.0/0 | HTTP访问 |
| TCP  | 8080 | 0.0.0.0/0 | 备用端口(可选) |

### 部署方式选择

#### 方式A: 使用密码认证（最简单）

```bash
# 克隆项目
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor

# 运行部署脚本
./deploy-to-alicloud.sh

# 按提示输入
# 用户名: root
# 密码: 你的密码
```

#### 方式B: 使用SSH密钥（推荐）

**步骤1**: 生成SSH密钥（如果还没有）
```bash
ssh-keygen -t rsa -b 4096
```

**步骤2**: 上传公钥到服务器
```bash
ssh-copy-id root@47.108.148.251
```

**步骤3**: 部署
```bash
export SSH_KEY=~/.ssh/id_rsa
./deploy-to-alicloud.sh
```

#### 方式C: 自定义端口部署

如果80端口已被占用：

```bash
PORT=8080 ./deploy-to-alicloud.sh
```

访问地址变为：`http://47.108.148.251:8080`

### 部署过程

脚本会自动执行以下步骤：

1. ✓ 检查本地环境（SSH、rsync等）
2. ✓ 测试服务器连接
3. ✓ 检查服务器Docker环境
4. ✓ 自动安装Docker（如未安装）
5. ✓ 创建远程目录
6. ✓ 上传项目文件
7. ✓ 构建Docker镜像
8. ✓ 启动容器
9. ✓ 验证部署状态

预计耗时：5-10分钟（取决于网络速度）

### 部署成功标志

看到以下输出表示部署成功：

```
======================================
  部署成功！
======================================

服务器信息:
  IP地址: 47.108.148.251
  访问地址: http://47.108.148.251:80

登录凭证:
  管理员: super / super123
  STX用户: stx / stx123
  Starknet用户: stark / stark123
```

---

## 文档索引

我们为您准备了5份详细文档，覆盖所有部署场景：

### 1. [QUICKSTART_ALICLOUD.md](./QUICKSTART_ALICLOUD.md)
**适用人群**: 想要快速部署的用户

**内容**:
- 最简单的3步部署
- 登录凭证
- 常用管理命令
- 基本故障排除

**推荐场景**: 首次部署、快速上手

---

### 2. [ALICLOUD_DEPLOYMENT.md](./ALICLOUD_DEPLOYMENT.md)
**适用人群**: 需要了解详细配置的用户

**内容**:
- 完整的部署步骤
- 系统要求说明
- 配置选项详解
- 故障排除大全
- 安全建议
- 监控和维护
- 性能优化

**推荐场景**: 生产环境部署、需要自定义配置

---

### 3. [DEPLOYMENT_EXAMPLES.md](./DEPLOYMENT_EXAMPLES.md)
**适用人群**: 寻找特定场景示例的用户

**内容**:
- 场景1: 首次部署（密码）
- 场景2: SSH密钥部署
- 场景3: 自定义端口
- 场景4: 更新应用
- 场景5: 环境检查
- 环境变量说明
- 故障排除示例

**推荐场景**: 特定部署需求、参考示例

---

### 4. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
**适用人群**: 需要确保步骤完整的用户

**内容**:
- 部署前检查清单
- 部署步骤清单
- 部署后配置清单
- 功能测试清单
- 常用命令清单

**推荐场景**: 重要环境部署、确保万无一失

---

### 5. [DEPLOYMENT.md](./DEPLOYMENT.md)
**适用人群**: 部署到其他平台的用户

**内容**:
- 通用Docker部署
- 手动部署步骤
- Nginx配置
- 环境变量
- 监控日志

**推荐场景**: 非阿里云环境、手动部署

---

## 常见问题

### Q1: 如何验证环境是否准备好？

**A**: 运行验证脚本
```bash
./verify-server.sh
```

脚本会检查：
- 本地工具是否安装
- 服务器是否可连接
- Docker环境是否就绪
- 系统资源是否充足

---

### Q2: 部署过程中遇到"连接超时"怎么办？

**A**: 检查以下几点：
1. 服务器IP是否正确
2. 阿里云安全组是否开放SSH端口(22)
3. 本地网络是否正常
4. 服务器是否在运行

测试连接：
```bash
ping 47.108.148.251
ssh root@47.108.148.251
```

---

### Q3: 80端口被占用怎么办？

**A**: 使用其他端口部署
```bash
# 使用8080端口
PORT=8080 ./deploy-to-alicloud.sh

# 或停止占用80端口的服务
ssh root@47.108.148.251 'systemctl stop nginx'
```

---

### Q4: 如何查看部署日志？

**A**: 多种方式查看日志
```bash
# 实时日志
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs -f'

# 最近100行
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs --tail=100'

# 导出日志
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs > /tmp/app.log'
```

---

### Q5: 如何更新应用？

**A**: 拉取最新代码并重新部署
```bash
# 在本地
cd blockchain-monitor
git pull origin main
./deploy-to-alicloud.sh
```

脚本会自动：
- 停止旧容器
- 上传新文件
- 重新构建
- 启动新容器

---

### Q6: 如何修改默认密码？

**A**: 编辑源代码并重新部署
```bash
# 1. 编辑文件
vim src/services/auth.ts

# 修改这部分：
const users: Record<string, { password: string; role: UserRole }> = {
  super: { password: 'your_new_password', role: 'super' },
  stx: { password: 'your_new_password', role: 'stx' },
  stark: { password: 'your_new_password', role: 'stark' },
};

# 2. 重新部署
./deploy-to-alicloud.sh
```

---

### Q7: 如何停止或删除服务？

**A**: 远程执行命令
```bash
# 停止服务（保留数据）
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose down'

# 完全删除
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose down && cd .. && rm -rf blockchain-monitor'
```

---

### Q8: 部署失败如何重试？

**A**: 直接重新运行脚本
```bash
./deploy-to-alicloud.sh
```

脚本会自动：
- 清理之前的部署
- 重新上传文件
- 重新构建和启动

---

### Q9: 如何配置HTTPS？

**A**: 使用Let's Encrypt证书

**步骤1**: 安装Certbot
```bash
ssh root@47.108.148.251 'apt-get install certbot'
```

**步骤2**: 获取证书
```bash
ssh root@47.108.148.251 'certbot certonly --standalone -d your-domain.com'
```

**步骤3**: 修改nginx.conf添加SSL配置
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... 其他配置
}
```

**步骤4**: 重新部署
```bash
./deploy-to-alicloud.sh
```

---

### Q10: 如何监控应用性能？

**A**: 查看资源使用情况
```bash
# CPU和内存
ssh root@47.108.148.251 'docker stats'

# 磁盘使用
ssh root@47.108.148.251 'df -h'

# 容器状态
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose ps'
```

---

## 管理命令速查表

### 日常操作

| 操作 | 命令 |
|------|------|
| 查看状态 | `ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose ps'` |
| 查看日志 | `ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs -f'` |
| 重启服务 | `ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose restart'` |
| 停止服务 | `ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose down'` |
| 启动服务 | `ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose up -d'` |

### 维护操作

| 操作 | 命令 |
|------|------|
| 更新应用 | `git pull && ./deploy-to-alicloud.sh` |
| 清理缓存 | `ssh root@47.108.148.251 'docker system prune -a'` |
| 备份配置 | `scp root@47.108.148.251:/opt/blockchain-monitor/docker-compose.yml ./backup/` |
| 进入容器 | `ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose exec blockchain-monitor sh'` |

---

## 工具脚本说明

### deploy-to-alicloud.sh
**用途**: 自动化部署主脚本

**功能**:
- 环境检查
- SSH连接测试
- Docker自动安装
- 文件上传
- 镜像构建
- 容器启动
- 状态验证

**使用方法**:
```bash
# 基本用法
./deploy-to-alicloud.sh

# 使用SSH密钥
export SSH_KEY=~/.ssh/id_rsa
./deploy-to-alicloud.sh

# 自定义端口
PORT=8080 ./deploy-to-alicloud.sh

# 完整配置
PORT=8080 SERVER_USER=root SSH_KEY=~/.ssh/id_rsa ./deploy-to-alicloud.sh
```

---

### verify-server.sh
**用途**: 部署前环境验证

**功能**:
- 检查本地工具
- 测试服务器连接
- 验证Docker环境
- 检查系统资源

**使用方法**:
```bash
./verify-server.sh
```

---

## 安全最佳实践

### 1. 认证安全
- ✅ 使用SSH密钥替代密码
- ✅ 修改默认密码
- ✅ 使用强密码
- ✅ 定期更换密码

### 2. 网络安全
- ✅ 配置阿里云安全组
- ✅ 限制SSH访问IP
- ✅ 使用HTTPS
- ✅ 启用防火墙

### 3. 应用安全
- ✅ 及时更新系统
- ✅ 及时更新应用
- ✅ 定期备份
- ✅ 监控异常

### 4. Docker安全
- ✅ 使用最小化镜像
- ✅ 定期更新镜像
- ✅ 不使用root运行
- ✅ 限制容器权限

---

## 性能优化建议

### 1. 服务器配置
- CPU: 2核心或更多
- 内存: 2GB或更多
- 磁盘: SSD存储

### 2. 网络优化
- 使用CDN加速静态资源
- 启用Gzip压缩（已配置）
- 使用HTTP/2

### 3. 应用优化
- 调整刷新频率
- 限制缓存大小
- 优化API调用

### 4. Docker优化
- 使用多阶段构建（已配置）
- 优化镜像大小
- 合理配置资源限制

---

## 故障排除流程

遇到问题时，按此流程排查：

1. **查看错误信息**
   - 脚本输出的错误
   - Docker日志
   - 系统日志

2. **运行验证脚本**
   ```bash
   ./verify-server.sh
   ```

3. **检查网络连接**
   ```bash
   ping 47.108.148.251
   ssh root@47.108.148.251
   ```

4. **查看Docker状态**
   ```bash
   ssh root@47.108.148.251 'docker compose ps'
   ssh root@47.108.148.251 'docker compose logs'
   ```

5. **查看系统资源**
   ```bash
   ssh root@47.108.148.251 'df -h && free -h'
   ```

6. **参考文档**
   - [常见问题](#常见问题)
   - [ALICLOUD_DEPLOYMENT.md](./ALICLOUD_DEPLOYMENT.md#常见问题)
   - [DEPLOYMENT_EXAMPLES.md](./DEPLOYMENT_EXAMPLES.md#故障排除示例)

7. **寻求帮助**
   - GitHub Issues
   - 技术支持

---

## 下一步

部署成功后，您可以：

1. ✅ 修改默认密码
2. ✅ 配置HTTPS证书
3. ✅ 设置自动备份
4. ✅ 配置监控告警
5. ✅ 优化性能设置
6. ✅ 阅读[用户手册](./README.md)

---

## 获取帮助

### 文档资源
- [快速开始](./QUICKSTART_ALICLOUD.md)
- [完整指南](./ALICLOUD_DEPLOYMENT.md)
- [部署示例](./DEPLOYMENT_EXAMPLES.md)
- [检查清单](./DEPLOYMENT_CHECKLIST.md)

### 在线支持
- 📧 GitHub Issues: https://github.com/mumugogoing/blockchain-monitor/issues
- 📖 项目Wiki: https://github.com/mumugogoing/blockchain-monitor/wiki
- 💬 Discussions: https://github.com/mumugogoing/blockchain-monitor/discussions

---

**准备好了吗？现在就开始部署吧！** 🚀

```bash
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor
./deploy-to-alicloud.sh
```

祝您部署顺利！
