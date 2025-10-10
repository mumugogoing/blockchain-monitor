# 部署检查清单

使用本清单确保顺利部署到阿里云服务器 47.108.148.251

## 部署前检查 ✓

### 1. 本地环境准备

- [ ] 已安装 Git
- [ ] 已安装 SSH 客户端
- [ ] 已安装 rsync
- [ ] 已安装 sshpass（如使用密码认证）或配置好SSH密钥

### 2. 服务器信息确认

- [ ] 服务器IP: `47.108.148.251`
- [ ] SSH用户名: `______` (默认: root)
- [ ] SSH密码或密钥路径: `______`
- [ ] 目标端口: `______` (默认: 80)

### 3. 服务器访问测试

```bash
# 运行验证脚本
./verify-server.sh
```

- [ ] SSH连接成功
- [ ] 服务器有足够的磁盘空间 (>1GB)
- [ ] 服务器有足够的内存 (>512MB)

### 4. 阿里云安全组配置

- [ ] SSH端口(22)已开放
- [ ] HTTP端口(80)或自定义端口已开放
- [ ] 安全组规则授权对象设置正确

## 部署步骤 ✓

### 步骤1: 克隆项目

```bash
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor
```

- [ ] 项目已克隆到本地
- [ ] 已进入项目目录

### 步骤2: 环境变量设置（可选）

根据您的认证方式选择：

**使用SSH密钥（推荐）:**
```bash
export SSH_KEY=~/.ssh/id_rsa
```

**使用密码:**
```bash
export SSH_PASSWORD='your_password'
```

**自定义端口:**
```bash
export PORT=8080
```

- [ ] 环境变量已设置（如需要）

### 步骤3: 运行部署脚本

```bash
./deploy-to-alicloud.sh
```

- [ ] 脚本开始执行
- [ ] 本地环境检查通过
- [ ] 服务器连接成功
- [ ] Docker环境检查通过
- [ ] 文件上传完成
- [ ] Docker镜像构建成功
- [ ] 容器启动成功

### 步骤4: 验证部署

```bash
# 访问应用
浏览器打开: http://47.108.148.251
```

- [ ] 应用页面正常显示
- [ ] 可以访问登录页面
- [ ] 使用测试账号可以登录

## 部署后配置 ✓

### 1. 安全配置

- [ ] 修改默认密码 (文件: `src/services/auth.ts`)
- [ ] 配置HTTPS (如需要)
- [ ] 限制SSH访问IP (阿里云安全组)
- [ ] 禁用root远程登录 (推荐)

### 2. 监控配置

- [ ] 测试查看日志: `ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs -f'`
- [ ] 配置日志轮转 (如需要)
- [ ] 设置资源监控 (如需要)

### 3. 备份配置

- [ ] 备份配置文件
- [ ] 记录部署配置信息
- [ ] 保存SSH密钥副本

## 功能测试 ✓

### 1. 登录测试

测试以下账号能否正常登录：

- [ ] super / super123 (管理员)
- [ ] stx / stx123 (STX用户)
- [ ] stark / stark123 (Starknet用户)

### 2. 功能测试

- [ ] STX监控页面正常显示
- [ ] Starknet监控页面正常显示
- [ ] 交易数据能够刷新
- [ ] 自动刷新功能正常
- [ ] 地址监控功能正常

### 3. 性能测试

- [ ] 页面加载速度正常
- [ ] 数据刷新流畅
- [ ] 无明显错误或警告

## 常用管理命令 ✓

### 查看服务状态
```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose ps'
```

### 查看日志
```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs -f'
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
git pull origin main
./deploy-to-alicloud.sh
```

## 故障排除 ✓

如果遇到问题，按以下顺序检查：

1. [ ] 查看部署脚本输出的错误信息
2. [ ] 运行 `./verify-server.sh` 检查环境
3. [ ] 查看服务器日志: `docker compose logs`
4. [ ] 检查阿里云安全组配置
5. [ ] 参考 [ALICLOUD_DEPLOYMENT.md](./ALICLOUD_DEPLOYMENT.md#常见问题)
6. [ ] 查看 [部署示例](./DEPLOYMENT_EXAMPLES.md)

## 部署成功标准 ✓

以下所有项目都应该为真：

- [ ] ✅ 可以通过浏览器访问应用
- [ ] ✅ 所有测试账号可以正常登录
- [ ] ✅ STX和Starknet监控页面都能正常工作
- [ ] ✅ 数据能够正常刷新
- [ ] ✅ 无明显错误或性能问题
- [ ] ✅ Docker容器状态为 "Up"
- [ ] ✅ 已修改默认密码（生产环境）

## 文档参考

| 文档 | 用途 |
|------|------|
| [QUICKSTART_ALICLOUD.md](./QUICKSTART_ALICLOUD.md) | 快速开始指南 |
| [ALICLOUD_DEPLOYMENT.md](./ALICLOUD_DEPLOYMENT.md) | 完整部署文档 |
| [DEPLOYMENT_EXAMPLES.md](./DEPLOYMENT_EXAMPLES.md) | 使用示例 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 通用部署指南 |
| [README.md](./README.md) | 项目介绍 |

## 技术支持

- 📧 GitHub Issues: https://github.com/mumugogoing/blockchain-monitor/issues
- 📖 文档中心: 查看仓库中的各类文档
- 🔧 部署脚本: `deploy-to-alicloud.sh`
- 🔍 验证脚本: `verify-server.sh`

---

**祝您部署顺利！** 🎉

如有任何问题，请参考相关文档或提交Issue。
