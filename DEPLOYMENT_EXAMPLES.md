# 部署脚本使用示例

本文档提供了部署到阿里云服务器的详细使用示例。

## 目录

- [场景1: 首次部署（使用密码）](#场景1-首次部署使用密码)
- [场景2: 使用SSH密钥部署](#场景2-使用ssh密钥部署)
- [场景3: 自定义端口部署](#场景3-自定义端口部署)
- [场景4: 更新已部署的应用](#场景4-更新已部署的应用)
- [场景5: 部署前环境检查](#场景5-部署前环境检查)

---

## 场景1: 首次部署（使用密码）

### 步骤 1: 克隆项目

```bash
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor
```

### 步骤 2: 运行部署脚本

```bash
./deploy-to-alicloud.sh
```

### 步骤 3: 按提示输入信息

```
请输入服务器用户名 (默认: root): root
请输入服务器密码: ********
```

### 步骤 4: 等待部署完成

脚本输出示例：

```
======================================
  区块链监控系统 - 阿里云部署脚本
======================================

目标服务器: 47.108.148.251

检查本地环境...
✓ 本地环境检查通过

测试SSH连接...
✓ 服务器连接成功

检查服务器Docker环境...
✓ Docker环境检查通过

准备远程目录...
✓ 远程目录已创建: /opt/blockchain-monitor

上传项目文件到服务器...
✓ 文件上传成功

在服务器上构建并启动应用...
✓ 应用启动成功

等待服务启动...

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

远程管理命令:
  查看日志: ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs -f'
  重启服务: ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose restart'
  停止服务: ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose down'
```

### 步骤 5: 访问应用

打开浏览器访问：`http://47.108.148.251`

---

## 场景2: 使用SSH密钥部署

### 前提条件

1. 已生成SSH密钥对
2. 公钥已添加到服务器的 `~/.ssh/authorized_keys`

### 生成SSH密钥（如果还没有）

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

### 上传公钥到服务器

```bash
ssh-copy-id root@47.108.148.251
```

或手动上传：

```bash
cat ~/.ssh/id_rsa.pub | ssh root@47.108.148.251 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 使用SSH密钥部署

```bash
# 设置SSH密钥路径
export SSH_KEY=~/.ssh/id_rsa

# 运行部署脚本
./deploy-to-alicloud.sh
```

无需输入密码，自动完成部署。

---

## 场景3: 自定义端口部署

### 场景说明

如果服务器的80端口已被占用（如已安装Nginx），可以使用其他端口。

### 使用8080端口部署

```bash
PORT=8080 ./deploy-to-alicloud.sh
```

### 一次性设置多个环境变量

```bash
PORT=8080 SERVER_USER=root SSH_KEY=~/.ssh/id_rsa ./deploy-to-alicloud.sh
```

### 访问应用

部署成功后访问：`http://47.108.148.251:8080`

### 注意事项

确保阿里云安全组已开放相应端口：

1. 登录阿里云控制台
2. 进入 ECS 实例管理
3. 安全组 -> 配置规则 -> 添加安全组规则
4. 配置：
   - 协议类型：TCP
   - 端口范围：8080/8080
   - 授权对象：0.0.0.0/0

---

## 场景4: 更新已部署的应用

### 拉取最新代码

```bash
cd blockchain-monitor
git pull origin main
```

### 重新部署

```bash
# 使用之前的配置重新部署
./deploy-to-alicloud.sh
```

脚本会：
1. 停止旧容器
2. 上传新文件
3. 重新构建镜像
4. 启动新容器

### 查看更新日志

```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs -f'
```

---

## 场景5: 部署前环境检查

### 使用验证脚本

在部署前，建议先运行验证脚本检查环境：

```bash
./verify-server.sh
```

### 验证脚本功能

脚本会检查：

1. **本地工具**
   - SSH客户端
   - rsync
   - sshpass（可选）

2. **服务器连接**
   - SSH连接测试
   - Docker环境检查
   - 系统资源检查

3. **服务器资源**
   - 可用磁盘空间
   - 可用内存

### 示例输出

```
======================================
  阿里云服务器环境检查
======================================

检查本地工具...

✓ ssh 已安装
✓ rsync 已安装

检查可选工具...
✓ sshpass 已安装

======================================

是否测试服务器连接? (y/n): y

服务器用户名 (默认: root): root

测试连接到 root@47.108.148.251...
✓ 服务器连接成功（使用SSH密钥）

推荐使用SSH密钥部署：
  export SSH_KEY=~/.ssh/id_rsa
  ./deploy-to-alicloud.sh

检查服务器Docker环境...
✓ Docker 已安装: Docker version 24.0.7
✓ Docker Compose 已安装: Docker Compose version v2.23.0

检查服务器资源...
可用磁盘空间: 35G
可用内存: 1.2G

======================================
  环境检查完成
======================================

可以开始部署：
  ./deploy-to-alicloud.sh
```

---

## 常见使用场景

### 开发环境部署

```bash
# 使用默认配置，80端口
./deploy-to-alicloud.sh
```

### 生产环境部署

```bash
# 使用SSH密钥，自定义端口
PORT=8080 SSH_KEY=~/.ssh/id_rsa_production ./deploy-to-alicloud.sh
```

### CI/CD 自动部署

在CI/CD管道中使用：

```bash
#!/bin/bash
# .github/workflows/deploy.yml 中的步骤

export SERVER_USER=deploy_user
export SSH_KEY=/path/to/deploy_key
export PORT=8080

./deploy-to-alicloud.sh
```

### 多服务器部署

部署到不同的服务器：

```bash
# 服务器1
SERVER_IP=47.108.148.251 PORT=80 ./deploy-to-alicloud.sh

# 服务器2
SERVER_IP=47.108.148.252 PORT=80 ./deploy-to-alicloud.sh
```

---

## 环境变量参考

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `SERVER_IP` | 服务器IP地址 | 47.108.148.251 | `export SERVER_IP=192.168.1.100` |
| `SERVER_USER` | SSH用户名 | root | `export SERVER_USER=ubuntu` |
| `SSH_PASSWORD` | SSH密码 | 无 | `export SSH_PASSWORD='mypass123'` |
| `SSH_KEY` | SSH私钥路径 | 无 | `export SSH_KEY=~/.ssh/id_rsa` |
| `PORT` | 应用端口 | 80 | `export PORT=8080` |

---

## 故障排除示例

### 问题1: 连接超时

**错误信息**:
```
错误: 无法连接到服务器 47.108.148.251
```

**解决方案**:

1. 检查网络连接
```bash
ping 47.108.148.251
```

2. 检查SSH端口
```bash
telnet 47.108.148.251 22
```

3. 检查阿里云安全组规则

### 问题2: 端口被占用

**错误信息**:
```
Error starting userland proxy: listen tcp4 0.0.0.0:80: bind: address already in use
```

**解决方案**:

使用其他端口：
```bash
PORT=8080 ./deploy-to-alicloud.sh
```

或停止占用80端口的服务：
```bash
ssh root@47.108.148.251 'systemctl stop nginx'
```

### 问题3: 权限不足

**错误信息**:
```
Permission denied (publickey,password)
```

**解决方案**:

1. 检查用户名是否正确
2. 使用正确的密码或SSH密钥
3. 确保SSH密钥文件权限正确：
```bash
chmod 600 ~/.ssh/id_rsa
```

---

## 进阶使用

### 自定义部署目录

修改脚本中的 `REMOTE_DIR` 变量：

```bash
# 编辑 deploy-to-alicloud.sh
REMOTE_DIR="/var/www/blockchain-monitor"
```

### 使用非标准SSH端口

如果SSH端口不是22：

```bash
# 修改脚本中的SSH命令
ssh -p 2222 -i "$SSH_KEY" ...
```

### 部署后自动测试

在脚本末尾添加：

```bash
# 测试应用是否响应
curl -I http://47.108.148.251 || echo "应用未响应"
```

---

## 相关文档

- [快速开始指南](./QUICKSTART_ALICLOUD.md)
- [完整部署文档](./ALICLOUD_DEPLOYMENT.md)
- [通用部署指南](./DEPLOYMENT.md)
- [项目README](./README.md)
